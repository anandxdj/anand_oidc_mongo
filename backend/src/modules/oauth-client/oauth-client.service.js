import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import ApiError from "../../common/utils/api-error.js";
import { randomBase64Url } from "../../common/utils/crypto.utils.js";
import * as projectService from "../project/project.service.js";
import OAuthClient from "./oauth-client.model.js";

const makeClientId = () => {
  return `cl_${randomBase64Url(18).replace(/[^a-zA-Z0-9_-]/g, "")}`.slice(0, 40);
};

const makeClientSecret = () => randomBase64Url(48);

const resolveProjectId = async (ownerId, projectIdInput) => {
  if (!projectIdInput) {
    const dp = await projectService.getOrCreateDefaultProject(ownerId);
    return dp._id;
  }
  await projectService.assertProjectOwner(projectIdInput, ownerId);
  return new mongoose.Types.ObjectId(projectIdInput);
};

/**
 * Legacy/global create (optional body.projectId); defaults to owner's default project.
 */
const create = async (
  ownerId,
  { clientName, redirectUris, description = "", logoUrl = "", projectId: projectIdInput },
) => {
  const projectId = await resolveProjectId(ownerId, projectIdInput);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;

  const clientId = makeClientId();
  const rawSecret = makeClientSecret();
  const clientSecretHash = await bcrypt.hash(rawSecret, 12);

  await OAuthClient.create({
    clientId,
    clientSecretHash,
    clientName: clientName.trim(),
    redirectUris,
    description: String(description || "").trim().slice(0, 2000),
    logoUrl: String(logoUrl || "").trim().slice(0, 2048),
    ownerId: oid,
    projectId,
  });

  return {
    clientId,
    clientSecret: rawSecret,
    clientName: clientName.trim(),
    redirectUris,
    description: String(description || "").trim(),
    logoUrl: String(logoUrl || "").trim(),
    projectId: String(projectId),
  };
};

const createForProject = async (ownerId, projectId, body) => {
  return create(ownerId, { ...body, projectId });
};

const listByOwner = async (ownerId) => {
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  return OAuthClient.find({ ownerId: oid })
    .select(
      "clientId clientName redirectUris description logoUrl suspended projectId createdAt",
    )
    .lean();
};

const listByProject = async (ownerId, projectId) => {
  await projectService.assertProjectOwner(projectId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const pid =
    typeof projectId === "string" ? new mongoose.Types.ObjectId(projectId) : projectId;
  return OAuthClient.find({ ownerId: oid, projectId: pid })
    .select("clientId clientName redirectUris description logoUrl suspended createdAt")
    .lean();
};

const findByClientId = async (clientId, { withSecret = false } = {}) => {
  const q = OAuthClient.findOne({ clientId });
  if (withSecret) q.select("+clientSecretHash");
  return q.lean();
};

const verifyClientSecret = async (client, plainSecret) => {
  if (!client?.clientSecretHash) return false;
  return bcrypt.compare(plainSecret, client.clientSecretHash);
};

const assertOwner = async (clientId, userId) => {
  const oid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const c = await OAuthClient.findOne({ clientId, ownerId: oid });
  if (!c) throw ApiError.forbidden("Not allowed to access this client");
  return c;
};

const getByOwner = async (ownerId, clientId) => {
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const doc = await OAuthClient.findOne({ clientId, ownerId: oid })
    .select(
      "clientId clientName redirectUris description logoUrl suspended projectId createdAt updatedAt",
    )
    .lean();
  if (!doc) throw ApiError.notFound("Client not found");
  return doc;
};

const getByProject = async (ownerId, projectId, clientId) => {
  await projectService.assertProjectOwner(projectId, ownerId);
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const pid =
    typeof projectId === "string" ? new mongoose.Types.ObjectId(projectId) : projectId;
  const doc = await OAuthClient.findOne({
    clientId,
    ownerId: oid,
    projectId: pid,
  })
    .select(
      "clientId clientName redirectUris description logoUrl suspended createdAt updatedAt",
    )
    .lean();
  if (!doc) throw ApiError.notFound("Client not found");
  return doc;
};

const updateByOwner = async (ownerId, clientId, body) => {
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const patch = {};
  if (body.clientName !== undefined) patch.clientName = String(body.clientName).trim();
  if (body.redirectUris !== undefined) patch.redirectUris = body.redirectUris;
  if (body.description !== undefined)
    patch.description = String(body.description).trim().slice(0, 2000);
  if (body.logoUrl !== undefined) patch.logoUrl = String(body.logoUrl).trim().slice(0, 2048);
  await OAuthClient.updateOne({ clientId, ownerId: oid }, { $set: patch });
  return getByOwner(ownerId, clientId);
};

const updateByProject = async (ownerId, projectId, clientId, body) => {
  await projectService.assertProjectOwner(projectId, ownerId);
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const pid =
    typeof projectId === "string" ? new mongoose.Types.ObjectId(projectId) : projectId;
  const patch = {};
  if (body.clientName !== undefined) patch.clientName = String(body.clientName).trim();
  if (body.redirectUris !== undefined) patch.redirectUris = body.redirectUris;
  if (body.description !== undefined)
    patch.description = String(body.description).trim().slice(0, 2000);
  if (body.logoUrl !== undefined) patch.logoUrl = String(body.logoUrl).trim().slice(0, 2048);
  await OAuthClient.updateOne(
    { clientId, ownerId: oid, projectId: pid },
    { $set: patch },
  );
  return getByProject(ownerId, projectId, clientId);
};

const rollSecretByOwner = async (ownerId, clientId) => {
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const rawSecret = makeClientSecret();
  const clientSecretHash = await bcrypt.hash(rawSecret, 12);
  await OAuthClient.updateOne({ clientId, ownerId: oid }, { $set: { clientSecretHash } });
  return { clientId, clientSecret: rawSecret };
};

const rollSecretByProject = async (ownerId, projectId, clientId) => {
  await projectService.assertProjectOwner(projectId, ownerId);
  await assertOwner(clientId, ownerId);
  const oid =
    typeof ownerId === "string" ? new mongoose.Types.ObjectId(ownerId) : ownerId;
  const pid =
    typeof projectId === "string" ? new mongoose.Types.ObjectId(projectId) : projectId;
  const rawSecret = makeClientSecret();
  const clientSecretHash = await bcrypt.hash(rawSecret, 12);
  await OAuthClient.updateOne(
    { clientId, ownerId: oid, projectId: pid },
    { $set: { clientSecretHash } },
  );
  return { clientId, clientSecret: rawSecret };
};

export {
  create,
  createForProject,
  listByOwner,
  listByProject,
  findByClientId,
  verifyClientSecret,
  assertOwner,
  getByOwner,
  getByProject,
  updateByOwner,
  updateByProject,
  rollSecretByOwner,
  rollSecretByProject,
};
