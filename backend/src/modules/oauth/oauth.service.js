import User from "../auth/auth.model.js";
import ApiError from "../../common/utils/api-error.js";
import { getOidcIssuer, signIdToken } from "../../common/utils/keys.utils.js";
import { hashToken, randomBase64Url, verifyPkce } from "../../common/utils/crypto.utils.js";
import * as clientService from "../oauth-client/oauth-client.service.js";
import Consent from "./consent.model.js";
import redis from "../../common/config/redis.js";

const ACCESS_TOKEN_SECONDS = 900;

const loginBase = () =>
  (process.env.OIDC_LOGIN_REDIRECT_BASE || process.env.FRONTEND_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

const consentBase = () =>
  (process.env.OIDC_CONSENT_REDIRECT_BASE || process.env.FRONTEND_URL || loginBase()).replace(
    /\/$/,
    "",
  );

const hasScope = (scopeStr, needle) => {
  const s = (scopeStr || "").split(/\s+/).filter(Boolean);
  return s.includes(needle);
};

const utcDateKey = (date = new Date()) => date.toISOString().slice(0, 10).replace(/-/g, "");

const validateAuthorizeQuery = (q) => {
  const {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod = "S256",
    nonce,
  } = q;

  if (responseType !== "code") {
    throw ApiError.badRequest("response_type must be code");
  }
  if (!clientId || !redirectUri || !state || !codeChallenge) {
    throw ApiError.badRequest(
      "Missing required parameters: client_id, redirect_uri, state, code_challenge",
    );
  }
  if (codeChallengeMethod !== "S256") {
    throw ApiError.badRequest("Only code_challenge_method S256 is supported");
  }
  if (!String(scope || "").split(/\s+/).includes("openid")) {
    throw ApiError.badRequest("scope must include openid");
  }
  return {
    clientId: String(clientId).trim(),
    redirectUri: String(redirectUri),
    scope: String(scope || "openid").trim() || "openid",
    state: String(state),
    codeChallenge: String(codeChallenge),
    codeChallengeMethod: "S256",
    nonce: nonce ? String(nonce) : undefined,
  };
};

const assertRedirect = (client, redirectUri) => {
  if (!client.redirectUris.includes(redirectUri)) {
    throw ApiError.badRequest("Invalid redirect_uri for this client");
  }
};

const logAuthCodeIssued = async (userId, clientId) => {
  const dayKey = utcDateKey();
  const redisKey = `admin:auth_code_issued:${dayKey}`;
  const nextCount = await redis.incr(redisKey);
  if (nextCount === 1) {
    // Keep a short history for dashboard reads.
    await redis.expire(redisKey, 60 * 60 * 24 * 3);
  }
};

export const getAuthorize = async (req) => {
  const params = validateAuthorizeQuery(req.query);
  const client = await clientService.findByClientId(params.clientId);
  if (!client) throw ApiError.badRequest("Unknown client_id");
  assertRedirect(client, params.redirectUri);

  if (client.suspended) {
    return {
      type: "error_redirect",
      redirectUri: params.redirectUri,
      state: params.state,
      error: "access_denied",
      desc: "This application has been suspended",
    };
  }

  if (!req.user) {
    // Use originalUrl so the mount prefix (/oauth) is preserved.
    const returnTo = `${getOidcIssuer()}${req.originalUrl}`;
    return {
      type: "redirect",
      status: 302,
      location: `${loginBase()}/login?return_to=${encodeURIComponent(returnTo)}`,
    };
  }

  const existing = await Consent.findOne({
    userId: req.user.id,
    clientId: params.clientId,
  });

  if (!existing) {
    const transactionId = `txn_${randomBase64Url(24).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const reqData = {
      transactionId,
      userId: req.user.id,
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      scope: params.scope,
      nonce: params.nonce,
    };
    await redis.set(`auth_req:${transactionId}:${req.user.id}`, JSON.stringify(reqData), "EX", 15 * 60);
    return { type: "consent_redirect", transactionId };
  }

  return { type: "code", params };
};

const issueAuthCode = async (userId, params) => {
  const raw = randomBase64Url(32);
  const codeHash = hashToken(raw);
  const codeData = {
    codeHash,
    userId,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
    scope: params.scope,
    nonce: params.nonce,
  };
  await redis.set(`auth_code:${codeHash}`, JSON.stringify(codeData), "EX", 5 * 60);
  await logAuthCodeIssued(userId, params.clientId);
  return raw;
};

const redirectWithCode = (res, params, code) => {
  const u = new URL(params.redirectUri);
  u.searchParams.set("code", code);
  u.searchParams.set("state", params.state);
  return res.redirect(302, u.toString());
};

const redirectError = (res, redirectUri, state, err, desc) => {
  const u = new URL(redirectUri);
  u.searchParams.set("error", err);
  u.searchParams.set("error_description", desc || err);
  if (state) u.searchParams.set("state", state);
  return res.redirect(302, u.toString());
};

const buildRedirectUrl = (redirectUri, searchParams) => {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  }
  return u.toString();
};

export const runAuthorize = async (req, res) => {
  const out = await getAuthorize(req);
  if (out.type === "redirect") {
    return res.redirect(out.status, out.location);
  }
  if (out.type === "error_redirect") {
    return redirectError(res, out.redirectUri, out.state, out.error, out.desc);
  }
  if (out.type === "consent_redirect") {
    const url = `${consentBase()}/consent?transaction_id=${encodeURIComponent(out.transactionId)}`;
    return res.redirect(302, url);
  }
  const code = await issueAuthCode(req.user.id, out.params);
  return redirectWithCode(res, out.params, code);
};

const parseBasicOrBody = (req) => {
  let clientId = req.body?.client_id;
  let clientSecret = req.body?.client_secret;
  const h = req.headers.authorization;
  if (h?.startsWith("Basic ")) {
    const decoded = Buffer.from(h.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    if (i >= 0) {
      clientId = decoded.slice(0, i);
      clientSecret = decoded.slice(i + 1);
    }
  }
  return { clientId, clientSecret };
};

export const exchangeToken = async (req, res) => {
  const grantType = req.body?.grant_type;
  if (grantType !== "authorization_code") {
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Only authorization_code is supported",
    });
  }

  const codeRaw = req.body?.code;
  const redirectUri = req.body?.redirect_uri;
  const codeVerifier = req.body?.code_verifier;
  if (!codeRaw || !redirectUri || !codeVerifier) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing code, redirect_uri, or code_verifier",
    });
  }

  const { clientId, clientSecret } = parseBasicOrBody(req);
  if (!clientId) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Client authentication required",
    });
  }

  const client = await clientService.findByClientId(clientId, { withSecret: true });
  if (!client) {
    return res.status(401).json({ error: "invalid_client", error_description: "Unknown client" });
  }

  if (client.suspended) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "This application has been suspended",
    });
  }

  const okSecret = clientSecret
    ? await clientService.verifyClientSecret(client, clientSecret)
    : false;
  if (!okSecret) {
    return res.status(401).json({ error: "invalid_client", error_description: "Invalid credentials" });
  }

  const codeHash = hashToken(String(codeRaw).trim());
  const recJson = await redis.get(`auth_code:${codeHash}`);
  if (!recJson) {
    return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
  }
  const rec = JSON.parse(recJson);
  if (rec.clientId !== client.clientId) {
    return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
  }
  if (rec.redirectUri !== redirectUri) {
    return res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
  }

  if (!verifyPkce(codeVerifier, rec.codeChallenge)) {
    return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
  }

  await redis.del(`auth_code:${codeHash}`);

  const user = await User.findById(rec.userId);
  if (!user) {
    return res.status(400).json({ error: "invalid_grant", error_description: "User no longer exists" });
  }

  const opaq = randomBase64Url(32);
  const tokenHash = hashToken(opaq);
  const tokenData = {
    tokenHash,
    userId: user._id.toString(),
    clientId: client.clientId,
    scope: rec.scope,
  };
  await redis.set(`access_token:${tokenHash}`, JSON.stringify(tokenData), "EX", ACCESS_TOKEN_SECONDS);

  const now = Math.floor(Date.now() / 1000);
  const idClaims = {
    iss: getOidcIssuer(),
    sub: user._id.toString(),
    aud: client.clientId,
    iat: now,
    exp: now + ACCESS_TOKEN_SECONDS,
  };
  if (rec.nonce) idClaims.nonce = rec.nonce;
  if (hasScope(rec.scope, "email") && user.email) idClaims.email = user.email;
  if (hasScope(rec.scope, "profile") && user.name) {
    idClaims.name = user.name;
  }
  if (hasScope(rec.scope, "email")) idClaims.email_verified = user.isVerified === true;

  const idToken = await signIdToken(idClaims);

  return res.json({
    access_token: opaq,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_SECONDS,
    scope: rec.scope,
  });
};

export const getUserinfo = async (req, res) => {
  const { userId, scope, clientId } = req.oauth;
  const client = await clientService.findByClientId(clientId);
  if (client?.suspended) {
    return res.status(401).json({
      error: "invalid_token",
      error_description: "This application has been suspended",
    });
  }
  const u = await User.findById(userId);
  if (!u) {
    return res.status(404).json({ error: "invalid_token", error_description: "User not found" });
  }
  const out = { sub: u._id.toString() };
  if (hasScope(scope, "email")) {
    out.email = u.email;
    out.email_verified = u.isVerified === true;
  }
  if (hasScope(scope, "profile")) {
    out.name = u.name;
  }
  return res.json(out);
};

export const loadConsentContext = async (userId, transactionId) => {
  if (!transactionId || typeof transactionId !== "string") {
    throw ApiError.badRequest("transaction_id is required");
  }
  const arJson = await redis.get(`auth_req:${String(transactionId).trim()}:${userId}`);
  if (!arJson) {
    throw ApiError.badRequest("Invalid or expired transaction");
  }
  const ar = JSON.parse(arJson);
  const client = await clientService.findByClientId(ar.clientId);
  if (!client) {
    throw ApiError.badRequest("Client not found");
  }
  return {
    transaction_id: ar.transactionId,
    client_id: client.clientId,
    client_name: client.clientName,
    description: client.description || "",
    logo_url: client.logoUrl || "",
    scope: ar.scope,
    client_suspended: !!client.suspended,
  };
};

export const completeConsent = async (userId, transactionId, decision) => {
  const tid = String(transactionId || "").trim();
  if (!tid) throw ApiError.badRequest("transaction_id is required");
  const d = String(decision || "").toLowerCase();
  if (d !== "allow" && d !== "deny") {
    throw ApiError.badRequest("decision must be allow or deny");
  }

  const arJson = await redis.get(`auth_req:${tid}:${userId}`);
  if (!arJson) {
    throw ApiError.badRequest("Invalid or expired transaction");
  }
  const ar = JSON.parse(arJson);

  const client = await clientService.findByClientId(ar.clientId);
  if (!client) {
    await redis.del(`auth_req:${tid}:${userId}`);
    throw ApiError.badRequest("Client not found");
  }
  if (client.suspended) {
    await redis.del(`auth_req:${tid}:${userId}`);
    const redirect_url = buildRedirectUrl(ar.redirectUri, {
      error: "access_denied",
      error_description: "This application has been suspended",
      state: ar.state,
    });
    return { message: "Application suspended", redirect_url };
  }

  const params = {
    clientId: ar.clientId,
    redirectUri: ar.redirectUri,
    scope: ar.scope,
    state: ar.state,
    codeChallenge: ar.codeChallenge,
    codeChallengeMethod: ar.codeChallengeMethod || "S256",
    nonce: ar.nonce,
  };

  await redis.del(`auth_req:${tid}:${userId}`);

  if (d === "deny") {
    const redirect_url = buildRedirectUrl(ar.redirectUri, {
      error: "access_denied",
      error_description: "User denied access",
      state: ar.state,
    });
    return { message: "Access denied", redirect_url };
  }

  await Consent.findOneAndUpdate(
    { userId, clientId: params.clientId },
    { userId, clientId: params.clientId, scope: params.scope },
    { upsert: true, new: true },
  );

  const code = await issueAuthCode(userId, params);
  const redirect_url = buildRedirectUrl(ar.redirectUri, { code, state: ar.state });
  return { message: "Authorized", redirect_url };
};
