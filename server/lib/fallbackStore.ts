import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoredUser = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  createdAt: string;
};

type StoredBooking = {
  _id: string;
  userId: string;
  userEmail: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "pending" | "active" | "completed" | "cancelled";
  paymentMethod?: "upi" | "card" | "netbanking" | "cash";
  paymentStatus?: "pending" | "paid";
  totalPrice: number;
  createdAt: string;
};

type StoredLicense = {
  _id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  dob: string;
  licenseNumber: string;
  expiry: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

type StoredPenalty = {
  _id: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  vehicleId: string;
  reason: string;
  amount: number;
  status: "pending" | "paid" | "waived";
  createdAt: string;
};

type StoreShape = {
  users: StoredUser[];
  bookings: StoredBooking[];
  licenses: StoredLicense[];
  penalties: StoredPenalty[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storeDir = path.resolve(__dirname, "..", "..", ".data");
const storeFile = path.resolve(storeDir, "fallback-store.json");

function ensureStoreFile() {
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(
      storeFile,
      JSON.stringify({ users: [], bookings: [], licenses: [], penalties: [] } satisfies StoreShape, null, 2),
      "utf-8",
    );
  }
}

function loadStore(): StoreShape {
  ensureStoreFile();

  try {
    const raw = fs.readFileSync(storeFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      licenses: Array.isArray(parsed.licenses) ? parsed.licenses : [],
      penalties: Array.isArray(parsed.penalties) ? parsed.penalties : [],
    };
  } catch {
    return { users: [], bookings: [], licenses: [], penalties: [] };
  }
}

let store = loadStore();

function writeStore() {
  ensureStoreFile();
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), "utf-8");
}

export function readFallbackUsers() {
  return store.users.map((user) => ({
    ...user,
    createdAt: new Date(user.createdAt),
  }));
}

export function writeFallbackUsers(
  users: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "user" | "admin";
    createdAt: Date | string;
  }>,
) {
  store = {
    ...store,
    users: users.map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt).toISOString(),
    })),
  };
  writeStore();
}

export function readFallbackBookings() {
  return store.bookings.map((booking) => ({
    ...booking,
    createdAt: new Date(booking.createdAt),
  }));
}

export function writeFallbackBookings(
  bookings: Array<{
    _id: string;
    userId: string;
    userEmail: string;
    vehicleId: string;
    startDate: string;
    endDate: string;
    location: string;
    status: "pending" | "active" | "completed" | "cancelled";
    paymentMethod?: "upi" | "card" | "netbanking" | "cash";
    paymentStatus?: "pending" | "paid";
    totalPrice: number;
    createdAt: Date | string;
  }>,
) {
  store = {
    ...store,
    bookings: bookings.map((booking) => ({
      ...booking,
      createdAt: new Date(booking.createdAt).toISOString(),
    })),
  };
  writeStore();
}

export function readFallbackLicenses() {
  return store.licenses.map((license) => ({
    ...license,
    submittedAt: new Date(license.submittedAt),
  }));
}

export function writeFallbackLicenses(
  licenses: Array<{
    _id: string;
    userId: string;
    userEmail: string;
    fullName: string;
    dob: string;
    licenseNumber: string;
    expiry: string;
    status: "pending" | "approved" | "rejected";
    submittedAt: Date | string;
  }>,
) {
  store = {
    ...store,
    licenses: licenses.map((license) => ({
      ...license,
      submittedAt: new Date(license.submittedAt).toISOString(),
    })),
  };
  writeStore();
}

export function readFallbackPenalties() {
  return store.penalties.map((penalty) => ({
    ...penalty,
    createdAt: new Date(penalty.createdAt),
  }));
}

export function writeFallbackPenalties(
  penalties: Array<{
    _id: string;
    bookingId: string;
    userId: string;
    userEmail: string;
    vehicleId: string;
    reason: string;
    amount: number;
    status: "pending" | "paid" | "waived";
    createdAt: Date | string;
  }>,
) {
  store = {
    ...store,
    penalties: penalties.map((penalty) => ({
      ...penalty,
      createdAt: new Date(penalty.createdAt).toISOString(),
    })),
  };
  writeStore();
}
