import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 320,
      default: "",
    },
    /** Auto-created migration placeholder per owner */
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    agreedPoliciesAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("Project", projectSchema);
