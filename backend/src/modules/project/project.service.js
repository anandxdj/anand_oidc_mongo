import mongoose from "mongoose";
import ApiError from "../../common/utils/api-error.js";
import Project from "./project.model.js";
import OAuthClient from "../oauth-client/oauth-client.model.js";

const assertObjectId = (id, label = "projectId") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(id);
};

const assertProjectOwner = async (projectId, userId) => {
  const pid = assertObjectId(projectId);
  const uid = assertObjectId(userId, "userId");
  const p = await Project.findOne({ _id: pid, ownerId: uid });
  if (!p) throw ApiError.forbidden("Not allowed to access this project");
  return p;
};

const getOrCreateDefaultProject = async (ownerId) => {
  const uid = assertObjectId(ownerId, "userId");
  let project = await Project.findOne({ ownerId: uid, isDefault: true });
  if (!project) {
    project = await Project.create({
      ownerId: uid,
      name: "Default project",
      description: "Default project for OAuth clients.",
      isDefault: true,
    });
  }
  return project;
};

const listMine = async (ownerId) => {
  return Project.find({ ownerId })
    .select("_id name description companyName supportEmail isDefault createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
};

const create = async (ownerId, body) => {
  const agreedPoliciesAt = body.agreedPolicies === true ? new Date() : undefined;
  const doc = await Project.create({
    ownerId,
    name: String(body.name).trim(),
    description: String(body.description || "").trim().slice(0, 2000),
    companyName: String(body.companyName || "").trim().slice(0, 200),
    supportEmail: String(body.supportEmail || "").trim().toLowerCase().slice(0, 320),
    agreedPoliciesAt,
    isDefault: false,
  });
  return Project.findById(doc._id)
    .select("_id name description companyName supportEmail isDefault createdAt updatedAt")
    .lean();
};

const getMine = async (ownerId, projectId) => {
  await assertProjectOwner(projectId, ownerId);
  return Project.findById(assertObjectId(projectId))
    .select("_id name description companyName supportEmail isDefault createdAt updatedAt")
    .lean();
};

/**
 * Ensures every OAuth client has a projectId: one Default project per distinct owner.
 */
const backfillDefaultProjects = async () => {
  const orphans = await OAuthClient.find({
    $or: [{ projectId: { $exists: false } }, { projectId: null }],
  })
    .select("ownerId")
    .lean();

  if (!orphans.length) return { created: 0, updated: 0 };

  const ownerSet = new Set(orphans.map((o) => String(o.ownerId)));
  let created = 0;
  let updated = 0;

  for (const oid of ownerSet) {
    const ownerObjectId = new mongoose.Types.ObjectId(oid);
    let project = await Project.findOne({ ownerId: ownerObjectId, isDefault: true });
    if (!project) {
      project = await Project.create({
        ownerId: ownerObjectId,
        name: "Default project",
        description: "Migrated default project for existing OAuth clients.",
        isDefault: true,
      });
      created += 1;
    }
    const res = await OAuthClient.updateMany(
      {
        ownerId: ownerObjectId,
        $or: [{ projectId: { $exists: false } }, { projectId: null }],
      },
      { $set: { projectId: project._id } },
    );
    updated += res.modifiedCount || 0;
  }

  return { created, updated };
};

export {
  assertProjectOwner,
  getOrCreateDefaultProject,
  listMine,
  create,
  getMine,
  backfillDefaultProjects,
};
