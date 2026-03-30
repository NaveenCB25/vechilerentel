import mongoose from "mongoose";

const licenseSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    licenseNumber: { type: String, required: true, trim: true },
    expiry: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const LicenseSubmissionModel =
  mongoose.models.LicenseSubmission || mongoose.model("LicenseSubmission", licenseSubmissionSchema);
