import type { Response } from "express";
import mongoose from "mongoose";

import { readFallbackBookings, readFallbackLicenses, writeFallbackBookings, writeFallbackLicenses } from "../lib/fallbackStore.ts";
import { sendBookingConfirmationEmail } from "../lib/mailer.ts";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { BookingModel } from "../models/Booking.ts";
import { LicenseSubmissionModel } from "../models/LicenseSubmission.ts";

type BookingStatus = "pending" | "active" | "completed" | "cancelled";
type LicenseStatus = "pending" | "approved" | "rejected";
type PaymentMethod = "upi" | "card" | "netbanking" | "cash";
type PaymentStatus = "pending" | "paid";

type MemoryBooking = {
  _id: string;
  userId: string;
  userEmail: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  location: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  createdAt: Date;
};

type MemoryLicenseSubmission = {
  _id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  dob: string;
  licenseNumber: string;
  expiry: string;
  status: LicenseStatus;
  submittedAt: Date;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidLicenseNumber(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{2}-?\d{2}\d{4}\d{7}$/.test(value.trim().toUpperCase());
}

function isValidBookingStatus(value: unknown): value is BookingStatus {
  return value === "pending" || value === "active" || value === "completed" || value === "cancelled";
}

function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "upi" || value === "card" || value === "netbanking" || value === "cash";
}

function isValidLicenseStatus(value: unknown): value is LicenseStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function formatVehicleLabel(vehicleId: string) {
  return vehicleId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPublicBooking(booking: {
  _id: string | mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  location: string;
  status: BookingStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  totalPrice: number;
  createdAt: Date | string;
}) {
  return {
    id: booking._id.toString(),
    userId: booking.userId,
    userEmail: booking.userEmail,
    vehicleId: booking.vehicleId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    location: booking.location,
    status: booking.status,
    paymentMethod: booking.paymentMethod || "cash",
    paymentStatus: booking.paymentStatus || "pending",
    totalPrice: booking.totalPrice,
    createdAt: new Date(booking.createdAt).toISOString(),
  };
}

function toPublicLicenseSubmission(license: {
  _id: string | mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  fullName: string;
  dob?: string;
  licenseNumber: string;
  expiry: string;
  status: LicenseStatus;
  submittedAt: Date | string;
}) {
  return {
    id: license._id.toString(),
    userId: license.userId,
    userEmail: license.userEmail,
    fullName: license.fullName,
    dob: license.dob || "",
    licenseNumber: license.licenseNumber,
    expiry: license.expiry,
    status: license.status,
    submittedAt: new Date(license.submittedAt).toISOString(),
  };
}

async function createBookingRecord(data: Omit<MemoryBooking, "_id" | "createdAt">) {
  if (mongoose.connection.readyState === 1) {
    return BookingModel.create(data);
  }

  const booking: MemoryBooking = {
    _id: new mongoose.Types.ObjectId().toString(),
    createdAt: new Date(),
    ...data,
  };
  const nextBookings = readFallbackBookings();
  nextBookings.unshift(booking);
  writeFallbackBookings(nextBookings);
  return booking;
}

async function createLicenseSubmissionRecord(data: Omit<MemoryLicenseSubmission, "_id" | "submittedAt">) {
  if (mongoose.connection.readyState === 1) {
    return LicenseSubmissionModel.create(data);
  }

  const licenseSubmission: MemoryLicenseSubmission = {
    _id: new mongoose.Types.ObjectId().toString(),
    submittedAt: new Date(),
    ...data,
  };
  const nextLicenses = readFallbackLicenses();
  nextLicenses.unshift(licenseSubmission);
  writeFallbackLicenses(nextLicenses);
  return licenseSubmission;
}

async function getBookingsForUser(userId: string, userEmail: string) {
  if (mongoose.connection.readyState === 1) {
    return BookingModel.find({ $or: [{ userId }, { userEmail }] }).sort({ createdAt: -1 });
  }

  return readFallbackBookings()
    .filter((booking) => booking.userId === userId || booking.userEmail === userEmail)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

async function getAllBookings() {
  if (mongoose.connection.readyState === 1) {
    return BookingModel.find().sort({ createdAt: -1 });
  }

  return readFallbackBookings().sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

async function getAllLicenseSubmissions() {
  if (mongoose.connection.readyState === 1) {
    return LicenseSubmissionModel.find().sort({ submittedAt: -1 });
  }

  return readFallbackLicenses().sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());
}

async function updateBookingStatusRecord(bookingId: string, status: BookingStatus) {
  if (mongoose.connection.readyState === 1) {
    return BookingModel.findByIdAndUpdate(bookingId, { status }, { new: true });
  }

  const nextBookings = readFallbackBookings();
  const booking = nextBookings.find((item) => item._id === bookingId);
  if (!booking) {
    return null;
  }

  booking.status = status;
  writeFallbackBookings(nextBookings);
  return booking;
}

async function updateLicenseStatusRecord(licenseId: string, status: LicenseStatus) {
  if (mongoose.connection.readyState === 1) {
    return LicenseSubmissionModel.findByIdAndUpdate(licenseId, { status }, { new: true });
  }

  const nextLicenses = readFallbackLicenses();
  const licenseSubmission = nextLicenses.find((item) => item._id === licenseId);
  if (!licenseSubmission) {
    return null;
  }

  licenseSubmission.status = status;
  writeFallbackLicenses(nextLicenses);
  return licenseSubmission;
}

export const createRentalSubmission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.auth?.userId;
    const userEmail = req.auth?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    const { booking, license } = req.body ?? {};

    if (
      !booking ||
      !license ||
      !isNonEmptyString(booking.vehicleId) ||
      !isNonEmptyString(booking.startDate) ||
      !isNonEmptyString(booking.endDate) ||
      !isNonEmptyString(booking.location) ||
      !isValidPaymentMethod(booking.paymentMethod) ||
      typeof booking.totalPrice !== "number" ||
      booking.totalPrice < 0 ||
      !isNonEmptyString(license.fullName) ||
      !isNonEmptyString(license.dob) ||
      !isNonEmptyString(license.licenseNumber) ||
      !isNonEmptyString(license.expiry)
    ) {
      return res.status(400).json({ success: false, error: "Booking and license details are required" });
    }

    if (!isValidLicenseNumber(license.licenseNumber)) {
      return res.status(400).json({
        success: false,
        error: "License number must match AA00YYYY0000000 or AA-00YYYY0000000",
      });
    }

    const bookingRecord = await createBookingRecord({
      userId,
      userEmail,
      vehicleId: booking.vehicleId.trim(),
      startDate: booking.startDate.trim(),
      endDate: booking.endDate.trim(),
      location: booking.location.trim(),
      status: "pending",
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentMethod === "cash" ? "pending" : "paid",
      totalPrice: booking.totalPrice,
    });

    const licenseRecord = await createLicenseSubmissionRecord({
      userId,
      userEmail,
      fullName: license.fullName.trim(),
      dob: license.dob.trim(),
      licenseNumber: license.licenseNumber.trim().toUpperCase(),
      expiry: license.expiry.trim(),
      status: "pending",
    });

    let emailStatus: "sent" | "not_configured" | "failed" = "not_configured";

    try {
      emailStatus = await sendBookingConfirmationEmail({
        to: userEmail,
        bookingId: bookingRecord._id.toString(),
        customerName: license.fullName.trim(),
        vehicleLabel: formatVehicleLabel(booking.vehicleId.trim()),
        startDate: booking.startDate.trim(),
        endDate: booking.endDate.trim(),
        location: booking.location.trim(),
        paymentMethod: booking.paymentMethod,
        totalPrice: booking.totalPrice,
      });
    } catch (mailError: any) {
      emailStatus = "failed";
      console.error("Booking confirmation email error:", mailError?.message || mailError);
    }

    return res.status(201).json({
      success: true,
      booking: toPublicBooking(bookingRecord),
      license: toPublicLicenseSubmission(licenseRecord),
      emailSent: emailStatus === "sent",
      emailStatus,
    });
  } catch (error: any) {
    console.error("Create rental submission error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to submit booking" });
  }
};

export const getCurrentUserBookings = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.auth?.userId;
    const userEmail = req.auth?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ success: false, error: "Invalid session" });
    }

    const bookings = await getBookingsForUser(userId, userEmail);
    return res.json({ success: true, bookings: bookings.map(toPublicBooking) });
  } catch (error: any) {
    console.error("Get user bookings error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to load bookings" });
  }
};

export const getAdminRentalOverview = async (_req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const [bookings, licenses] = await Promise.all([getAllBookings(), getAllLicenseSubmissions()]);

    return res.json({
      success: true,
      bookings: bookings.map(toPublicBooking),
      licenses: licenses.map(toPublicLicenseSubmission),
    });
  } catch (error: any) {
    console.error("Get admin rental overview error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to load admin overview" });
  }
};

export const updateAdminBookingStatus = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!isNonEmptyString(id) || !isValidBookingStatus(status)) {
      return res.status(400).json({ success: false, error: "A valid booking status is required" });
    }

    const booking = await updateBookingStatusRecord(id, status);
    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    return res.json({ success: true, booking: toPublicBooking(booking) });
  } catch (error: any) {
    console.error("Update booking status error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to update booking status" });
  }
};

export const updateAdminLicenseStatus = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!isNonEmptyString(id) || !isValidLicenseStatus(status)) {
      return res.status(400).json({ success: false, error: "A valid license status is required" });
    }

    const licenseSubmission = await updateLicenseStatusRecord(id, status);
    if (!licenseSubmission) {
      return res.status(404).json({ success: false, error: "License submission not found" });
    }

    return res.json({ success: true, license: toPublicLicenseSubmission(licenseSubmission) });
  } catch (error: any) {
    console.error("Update license status error:", error?.message || error);
    return res.status(500).json({ success: false, error: "Failed to update license status" });
  }
};
