import mongoose from "mongoose";

const oauthClientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientSecretHash: {
      type: String,
      required: true,
      select: false,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    redirectUris: {
      type: [String],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length > 0, "At least one redirect URI"],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    logoUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },
    suspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedReason: { type: String, maxlength: 500 },
    suspendedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("OAuthClient", oauthClientSchema);
