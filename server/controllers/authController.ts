import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { readFallbackUsers, writeFallbackUsers } from "../lib/fallbackStore.ts";
import { getAdminCredentials, getJwtSecret } from "../lib/runtimeConfig.ts";
import { buildCaseInsensitiveEmailLookup, normalizeEmail } from "../lib/userEmail.ts";
import { User } from "../models/User.ts";

const JWT_SECRET = getJwtSecret();
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72;
const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface MiniUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

function normalizePhone(phone: unknown) {
  if (typeof phone !== "string") {
    return "";
  }

  return phone.trim();
}

function validatePassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

function toPublicUser(user: {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  role?: "user" | "admin";
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role || "user",
  };
}

function toMiniUser(user: any): MiniUser {
  return {
    _id: user._id?.toString?.() ?? new mongoose.Types.ObjectId().toString(),
    name: user.name,
    email: normalizeEmail(user.email),
    phone: user.phone || "",
    password: user.password,
    role: user.role || "user",
    createdAt: user.createdAt || new Date(),
  };
}

async function getPersistedUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (mongoose.connection.readyState === 1) {
    return User.findOne({ email: buildCaseInsensitiveEmailLookup(normalizedEmail) });
  }

  return readFallbackUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) ?? null;
}

async function getPersistedUserById(userId: string) {
  if (mongoose.connection.readyState === 1) {
    return User.findById(userId);
  }

  return readFallbackUsers().find((user) => user._id === userId) ?? null;
}

async function createPersistedUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}) {
  if (mongoose.connection.readyState === 1) {
    return User.create(data);
  }

  const newUser: MiniUser = toMiniUser({
    _id: new mongoose.Types.ObjectId().toString(),
    name: data.name,
    email: normalizeEmail(data.email),
    phone: data.phone,
    password: data.password,
    role: data.role === "admin" ? "admin" : "user",
    createdAt: new Date(),
  });

  const nextUsers = readFallbackUsers();
  nextUsers.push(newUser);
  writeFallbackUsers(nextUsers);
  return newUser;
}

async function updatePersistedUser(
  userId: string,
  updates: Partial<{ name: string; email: string; phone: string; password: string }>,
) {
  if (mongoose.connection.readyState === 1) {
    return User.findByIdAndUpdate(userId, updates, { new: true });
  }

  const nextUsers = readFallbackUsers();
  const userIndex = nextUsers.findIndex((user) => user._id === userId);
  if (userIndex === -1) {
    return null;
  }

  if (updates.name !== undefined) {
    nextUsers[userIndex].name = updates.name;
  }

  if (updates.email !== undefined) {
    nextUsers[userIndex].email = normalizeEmail(updates.email);
  }

  if (updates.phone !== undefined) {
    nextUsers[userIndex].phone = updates.phone;
  }

  if (updates.password !== undefined) {
    nextUsers[userIndex].password = updates.password;
  }

  writeFallbackUsers(nextUsers);
  return nextUsers[userIndex];
}

async function findUserByEmailAndPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (mongoose.connection.readyState === 1) {
    const candidates = await User.find({ email: buildCaseInsensitiveEmailLookup(normalizedEmail) }).sort({ createdAt: -1 });
    const exactMatchIndex = candidates.findIndex((candidate) => candidate.email === normalizedEmail);

    if (exactMatchIndex > 0) {
      const [exactMatch] = candidates.splice(exactMatchIndex, 1);
      candidates.unshift(exactMatch);
    }

    for (const candidate of candidates) {
      if (await bcrypt.compare(password, candidate.password)) {
        return candidate;
      }
    }

    return null;
  }

  const matchedUsers = readFallbackUsers()
    .filter((user) => normalizeEmail(user.email) === normalizedEmail)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  for (const candidate of matchedUsers) {
    if (await bcrypt.compare(password, candidate.password)) {
      return candidate;
    }
  }

  return null;
}

function issueUserToken(user: { _id: mongoose.Types.ObjectId | string; email: string }) {
  const userId = user._id?.toString?.() ?? String(user._id);

  return jwt.sign({ role: "user", userId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function issueAdminToken(username: string) {
  return jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "12h" });
}

export const registerUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, password } = req.body;

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (normalizedName.length < 2 || normalizedName.length > NAME_MAX_LENGTH) {
      return res.status(400).json({ success: false, error: "Name must be between 2 and 80 characters" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long`,
      });
    }

    if (normalizedPhone && normalizedPhone.length > PHONE_MAX_LENGTH) {
      return res.status(400).json({ success: false, error: "Phone number is too long" });
    }

    const existingUser = await getPersistedUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createPersistedUser({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: toPublicUser(user),
    });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, error: error.message || "Server error during registration" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const user = await findUserByEmailAndPassword(normalizedEmail, password);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    return res.json({
      success: true,
      token: issueUserToken(user),
      user: toPublicUser(user),
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, error: error.message || "Server error during login" });
  }
};

export const loginAdmin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    const adminCredentials = getAdminCredentials();

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (!adminCredentials) {
      return res.status(503).json({ success: false, error: "Admin login is not configured" });
    }

    if (username.trim() === adminCredentials.username && password === adminCredentials.password) {
      return res.json({
        success: true,
        token: issueAdminToken(adminCredentials.username),
      });
    }

    return res.status(401).json({ success: false, error: "Invalid credentials" });
  } catch {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    const user = await getPersistedUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      user: toPublicUser(user),
    });
  } catch (error: any) {
    console.error("Get profile error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to load profile" });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    const { name, email } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
      return res.status(400).json({ success: false, error: "Name and email are required" });
    }

    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    if (normalizedName.length < 2 || normalizedName.length > NAME_MAX_LENGTH) {
      return res.status(400).json({ success: false, error: "Name must be between 2 and 80 characters" });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address" });
    }

    const existingUser = await getPersistedUserByEmail(normalizedEmail);
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ success: false, error: "Email is already in use" });
    }

    const updatedUser = await updatePersistedUser(userId, { name: normalizedName, email: normalizedEmail });
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      user: toPublicUser(updatedUser),
    });
  } catch (error: any) {
    console.error("Update profile error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to update profile" });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return res.status(400).json({ success: false, error: "Please provide both passwords" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: `New password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long`,
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from the current password",
      });
    }

    const user = await getPersistedUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updatePersistedUser(userId, { password: hashedPassword });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to change password" });
  }
};
