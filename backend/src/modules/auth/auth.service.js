import crypto from "crypto";
import User from "./auth.model.js";
import UserSession from "./user-session.model.js";
import OAuthClient from "../oauth-client/oauth-client.model.js";
import Consent from "../oauth/consent.model.js";
import ApiError from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from "../../common/utils/jwt.utils.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../../common/config/email.js";
import redis from "../../common/config/redis.js";

// Hash refresh token before storing — same approach as reset tokens
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const PRIVILEGED_ROLES = ["admin", "superadmin"];
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const generateSessionKey = () => crypto.randomBytes(16).toString("hex");

const extractClientMetadata = (meta = {}) => ({
  userAgent: String(meta.userAgent || "").slice(0, 500),
  ipAddress: String(meta.ipAddress || "").slice(0, 100),
});

const register = async ({ name, email, password, role, termsAccepted, country }) => {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("Email already registered");

  if (!termsAccepted) {
    throw ApiError.badRequest("You must accept the terms to register");
  }

  if (
    process.env.NODE_ENV === "production" &&
    PRIVILEGED_ROLES.includes(String(role || "").toLowerCase())
  ) {
    throw ApiError.badRequest(
      "Self-registration cannot use admin or support roles. Use an operator script to grant those roles.",
    );
  }

  const { rawToken, hashedToken } = generateResetToken();

  const user = await User.create({
    name,
    email,
    password,
    role,
    termsAcceptedAt: new Date(),
    country: country ? String(country).toUpperCase().slice(0, 2) : "",
    verificationToken: hashedToken,
  });

  // Don't let email failure crash registration — user is already created
  try {
    await sendVerificationEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
  }

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.verificationToken;

  return userObj;
};

const login = async ({ email, password }, sessionMeta = {}) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  if (!user.isVerified) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }

  const sessionKey = generateSessionKey();
  const accessToken = generateAccessToken({ id: user._id, role: user.role, sid: sessionKey });
  const refreshToken = generateRefreshToken({ id: user._id, sid: sessionKey });

  const session = await UserSession.create({
    userId: user._id,
    sessionKey,
    refreshTokenHash: hashToken(refreshToken),
    ...extractClientMetadata(sessionMeta),
  });
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  await redis.set(`session:${user._id}:${sessionKey}`, "1", "EX", USER_SESSION_TTL_SECONDS);
  await redis.set(`session:${user._id}`, "1", "EX", USER_SESSION_TTL_SECONDS);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return {
    user: userObj,
    accessToken,
    refreshToken,
    session: {
      id: session._id.toString(),
      sessionKey: session.sessionKey,
    },
  };
};

// Issues a new access token using a valid refresh token
const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  if (!decoded.sid) {
    const userWithToken = await User.findById(decoded.id).select("+refreshToken");
    if (!userWithToken || userWithToken.refreshToken !== hashToken(token)) {
      throw ApiError.unauthorized("Invalid refresh token — please log in again");
    }
    await redis.set(`session:${user._id}`, "1", "EX", USER_SESSION_TTL_SECONDS);
    const legacyAccessToken = generateAccessToken({ id: user._id, role: user.role });
    return { accessToken: legacyAccessToken };
  }

  const session = await UserSession.findOne({
    userId: user._id,
    sessionKey: decoded.sid,
    revokedAt: null,
  }).select("+refreshTokenHash");
  if (!session) {
    throw ApiError.unauthorized("Session expired or revoked");
  }

  if (session.refreshTokenHash !== hashToken(token)) {
    throw ApiError.unauthorized("Invalid refresh token — please log in again");
  }

  session.lastSeenAt = new Date();
  await session.save({ validateBeforeSave: false });
  await redis.set(`session:${user._id}:${decoded.sid}`, "1", "EX", USER_SESSION_TTL_SECONDS);

  const accessToken = generateAccessToken({ id: user._id, role: user.role, sid: decoded.sid });

  return { accessToken };
};

const logout = async (userId, sessionId) => {
  if (sessionId) {
    const session = await UserSession.findOneAndUpdate(
      { userId, sessionKey: sessionId, revokedAt: null },
      { revokedAt: new Date() },
      { new: true },
    );
    await redis.del(`session:${userId}:${sessionId}`);
    if (session) return;
  }

  await UserSession.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  const keys = await redis.keys(`session:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.del(`session:${userId}`);
};

const verifyEmail = async (token) => {
  const trimmed = String(token).trim();
  if (!trimmed) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  // DB stores SHA256(raw). Links / email use the raw token — we hash for lookup.
  // If you paste the hash from MongoDB into Postman, hashing again would not match;
  // so we also try a direct match on the stored value.
  const hashedInput = hashToken(trimmed);
  let user = await User.findOne({ verificationToken: hashedInput }).select(
    "+verificationToken",
  );
  if (!user) {
    user = await User.findOne({ verificationToken: trimmed }).select(
      "+verificationToken",
    );
  }
  if (!user) throw ApiError.badRequest("Invalid or expired verification token");

  await User.findByIdAndUpdate(user._id, {
    $set: { isVerified: true },
    $unset: { verificationToken: 1 },
  });

  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound("No account with that email");

  const { rawToken, hashedToken } = generateResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendResetPasswordEmail(email, rawToken);
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
  }
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

const updateProfile = async (userId, data) => {
  const allowedFields = ["name", "profilePictureUrl", "bio", "jobTitle", "company", "country"];
  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) throw ApiError.notFound("User not found");

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  return userObj;
};

const listSessions = async (userId, currentSessionId) => {
  const sessions = await UserSession.find({ userId, revokedAt: null }).sort({
    lastSeenAt: -1,
    createdAt: -1,
  });
  return sessions.map((session) => ({
    id: session._id.toString(),
    sessionKey: session.sessionKey,
    userAgent: session.userAgent || "Unknown device",
    ipAddress: session.ipAddress || "",
    lastSeenAt: session.lastSeenAt,
    createdAt: session.createdAt,
    isCurrent: Boolean(currentSessionId && currentSessionId === session.sessionKey),
  }));
};

const revokeSession = async (userId, sessionId) => {
  const session = await UserSession.findOneAndUpdate(
    { _id: sessionId, userId, revokedAt: null },
    { revokedAt: new Date() },
    { new: true },
  );
  if (!session) {
    throw ApiError.notFound("Session not found");
  }
  await redis.del(`session:${userId}:${session.sessionKey}`);
  return { id: session._id.toString() };
};

const listAuthorizedApps = async (userId) => {
  const user = await User.findById(userId).select("_id email");
  if (!user) throw ApiError.notFound("User not found");

  const consents = await Consent.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
  const items = [];

  for (const consent of consents) {
    const client = await OAuthClient.findOne({ clientId: consent.clientId })
      .select("clientId clientName logoUrl suspended")
      .lean();
    items.push({
      clientId: consent.clientId,
      scope: consent.scope || "openid",
      grantedAt: consent.createdAt,
      clientName: client?.clientName || consent.clientId,
      logoUrl: client?.logoUrl || "",
      clientSuspended: Boolean(client?.suspended),
    });
  }

  return items;
};

const revokeAuthorizedApp = async (userId, clientId) => {
  const cid = String(clientId || "").trim();
  if (!cid) throw ApiError.badRequest("clientId required");
  const user = await User.findById(userId).select("_id");
  if (!user) throw ApiError.notFound("User not found");

  await Consent.deleteOne({ userId: user._id, clientId: cid });
  return { revoked: true, clientId: cid };
};

const getImagekitUploadAuth = async (userId) => {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !endpoint) {
    throw ApiError.badRequest(
      "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.",
    );
  }

  const token = crypto.randomBytes(16).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 60 * 10;
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(`${token}${expire}`)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint: endpoint.replace(/\/$/, ""),
    folder: `/users/${userId}`,
  };
};

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  listSessions,
  revokeSession,
  listAuthorizedApps,
  revokeAuthorizedApp,
  getImagekitUploadAuth,
};
