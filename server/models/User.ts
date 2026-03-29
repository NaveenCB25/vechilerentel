import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
