import mongoose from "mongoose";
import ApiError from "../../common/utils/api-error.js";
import User from "../auth/auth.model.js";
import OAuthClient from "../oauth-client/oauth-client.model.js";
import Consent from "../oauth/consent.model.js";
import OAuthAccessToken from "../oauth/oauth-access-token.model.js";
import OAuthAudit from "../oauth/oauth-audit.model.js";

const startOfUtcDay = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const assertObjectId = (id, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const getStats = async () => {
  const since = startOfUtcDay();
  const [totalUsers, totalClients, authCodesIssuedToday, activeAccessTokens] = await Promise.all([
    User.countDocuments(),
    OAuthClient.countDocuments(),
    OAuthAudit.countDocuments({ event: "auth_code_issued", createdAt: { $gte: since } }),
    OAuthAccessToken.countDocuments({ expiresAt: { $gt: new Date() } }),
  ]);
  return {
    totalUsers,
    totalOAuthClients: totalClients,
    authCodesIssuedToday,
    activeAccessTokensApprox: activeAccessTokens,
  };
};

const listAllClients = async () => {
  return OAuthClient.find()
    .select("-clientSecretHash")
    .populate("ownerId", "email name")
    .populate("projectId", "name isDefault")
    .sort({ createdAt: -1 })
    .lean();
};

const getClientByIdAdmin = async (clientId) => {
  const c = await OAuthClient.findOne({ clientId })
    .select("-clientSecretHash")
    .populate("ownerId", "email name")
    .populate("projectId", "name isDefault")
    .lean();
  if (!c) throw ApiError.notFound("Client not found");
  return c;
};

const setClientSuspended = async (clientId, { suspended, suspendedReason }) => {
  const c = await OAuthClient.findOne({ clientId });
  if (!c) throw ApiError.notFound("Client not found");
  c.suspended = !!suspended;
  c.suspendedReason = suspended ? String(suspendedReason || "").slice(0, 500) : undefined;
  c.suspendedAt = suspended ? new Date() : undefined;
  await c.save();
  return OAuthClient.findOne({ clientId })
    .select("-clientSecretHash")
    .populate("ownerId", "email name")
    .lean();
};

const listUsers = async (page = 1, limit = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * l;
  const [items, total] = await Promise.all([
    User.find()
      .select("-password -verificationToken -refreshToken -resetPasswordToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    User.countDocuments(),
  ]);
  return { items, total, page: p, limit: l };
};

const listUserAuthorizedApps = async (userId) => {
  assertObjectId(userId, "userId");
  const user = await User.findById(userId).select("_id email");
  if (!user) throw ApiError.notFound("User not found");
  const uid = new mongoose.Types.ObjectId(userId);
  const consents = await Consent.find({ userId: uid }).lean();
  const out = [];
  for (const row of consents) {
    const client = await OAuthClient.findOne({ clientId: row.clientId })
      .select("clientId clientName suspended")
      .lean();
    out.push({
      clientId: row.clientId,
      scope: row.scope,
      grantedAt: row.createdAt,
      clientName: client?.clientName || null,
      clientSuspended: client?.suspended || false,
    });
  }
  return { userId, email: user.email, apps: out };
};

const revokeUserConsent = async (userId, clientId) => {
  assertObjectId(userId, "userId");
  if (!clientId) throw ApiError.badRequest("clientId required");
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  const uid = new mongoose.Types.ObjectId(userId);
  const cid = String(clientId);
  await Consent.deleteOne({ userId: uid, clientId: cid });
  await OAuthAccessToken.deleteMany({ userId: uid, clientId: cid });
  return { revoked: true, userId, clientId: cid };
};

export {
  getStats,
  listAllClients,
  getClientByIdAdmin,
  setClientSuspended,
  listUsers,
  listUserAuthorizedApps,
  revokeUserConsent,
};
