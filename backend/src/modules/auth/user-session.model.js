import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userAgent: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSessionSchema.index({ userId: 1, revokedAt: 1, lastSeenAt: -1 });

export default mongoose.model("UserSession", userSessionSchema);
