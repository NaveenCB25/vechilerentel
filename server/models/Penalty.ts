import mongoose from "mongoose";

const penaltySchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, trim: true },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    vehicleId: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "Canceled"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const PenaltyModel = mongoose.models.Penalty || mongoose.model("Penalty", penaltySchema);
