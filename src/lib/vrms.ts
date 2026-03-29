export type Vehicle = {
  id: string;
  name: string;
  type: string;
  image: string;
  pricePerDay: number;
  specs: Array<{ label: string; value: string }>;
};

export type BookingStatus = "pending" | "active" | "completed" | "cancelled";

export type Booking = {
  id: string;
  userEmail: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  location: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
};

export type LicenseStatus = "pending" | "approved" | "rejected";

export type DrivingLicense = {
  id: string;
  userEmail: string;
  fullName: string;
  licenseNumber: string;
  expiry: string;
  status: LicenseStatus;
  submittedAt: string;
};

export type PenaltyStatus = "pending" | "paid" | "waived";

export type Penalty = {
  id: string;
  userEmail: string;
  vehicleId: string;
  reason: string;
  amount: number;
  status: PenaltyStatus;
  createdAt: string;
};

const STORAGE_KEYS = {
  vehicles: "vrms_vehicles",
  saved: "vrms_saved_vehicles_by_user",
  bookings: "vrms_bookings",
  licenses: "vrms_licenses",
  penalties: "vrms_penalties",
  userMeta: "vrms_user_meta",
} as const;

type UserMeta = {
  memberSince?: string;
  verificationStatus?: "verified" | "unverified";
  accountStatus?: "active" | "disabled";
};

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: "tesla-model-s",
    name: "Tesla Model S",
    type: "Electric",
    image:
      "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 11999,
    specs: [
      { label: "Seats", value: "5" },
      { label: "Transmission", value: "Automatic" },
      { label: "Range", value: "600 km" },
      { label: "0-100", value: "3.2s" },
    ],
  },
  {
    id: "bmw-m4",
    name: "BMW M4 Competition",
    type: "Sports",
    image:
      "https://images.unsplash.com/photo-1617814076367-b759c7a7fb80?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 14999,
    specs: [
      { label: "Seats", value: "4" },
      { label: "Transmission", value: "Automatic" },
      { label: "Fuel", value: "Petrol" },
      { label: "Top Speed", value: "290 km/h" },
    ],
  },
  {
    id: "porsche-911",
    name: "Porsche 911 Carrera",
    type: "Supercar",
    image:
      "https://images.unsplash.com/photo-1614200186441-1d5e4f62a2ff?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 21999,
    specs: [
      { label: "Seats", value: "2+2" },
      { label: "Transmission", value: "Automatic" },
      { label: "Fuel", value: "Petrol" },
      { label: "0-100", value: "3.7s" },
    ],
  },
  {
    id: "audi-q7",
    name: "Audi Q7",
    type: "SUV",
    image:
      "https://images.unsplash.com/photo-1517949908119-720f2d0a4a2d?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 9999,
    specs: [
      { label: "Seats", value: "7" },
      { label: "Transmission", value: "Automatic" },
      { label: "Fuel", value: "Diesel" },
      { label: "Boot", value: "Spacious" },
    ],
  },
  {
    id: "mercedes-g-class",
    name: "Mercedes G-Class",
    type: "Luxury SUV",
    image:
      "https://images.unsplash.com/photo-1518066000714-58c45d58a984?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 18999,
    specs: [
      { label: "Seats", value: "5" },
      { label: "Transmission", value: "Automatic" },
      { label: "Fuel", value: "Petrol" },
      { label: "Drive", value: "4MATIC" },
    ],
  },
  {
    id: "royal-enfield-continental-gt",
    name: "Royal Enfield Continental GT",
    type: "Bike",
    image:
      "https://images.unsplash.com/photo-1524594164458-900b0f5d4b6a?auto=format&fit=crop&w=1400&q=80",
    pricePerDay: 2499,
    specs: [
      { label: "Seats", value: "2" },
      { label: "Transmission", value: "Manual" },
      { label: "Fuel", value: "Petrol" },
      { label: "Engine", value: "650cc" },
    ],
  },
];

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseBrowserStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createId(prefix: string) {
  const candidate = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `${prefix}_${candidate}`;
}

export function getVehicles(): Vehicle[] {
  return readJson<Vehicle[]>(STORAGE_KEYS.vehicles, DEFAULT_VEHICLES);
}

export function setVehicles(vehicles: Vehicle[]): void {
  writeJson(STORAGE_KEYS.vehicles, vehicles);
}

export function getVehicleById(vehicleId: string): Vehicle | null {
  return getVehicles().find((vehicle) => vehicle.id === vehicleId) || null;
}

export function getSavedVehicleIds(userEmail: string): string[] {
  const mapping = readJson<Record<string, string[]>>(STORAGE_KEYS.saved, {});
  return mapping[userEmail] || [];
}

export function toggleSavedVehicle(userEmail: string, vehicleId: string): string[] {
  const mapping = readJson<Record<string, string[]>>(STORAGE_KEYS.saved, {});
  const current = new Set(mapping[userEmail] || []);

  if (current.has(vehicleId)) {
    current.delete(vehicleId);
  } else {
    current.add(vehicleId);
  }

  mapping[userEmail] = Array.from(current);
  writeJson(STORAGE_KEYS.saved, mapping);
  return mapping[userEmail];
}

export function getBookings(): Booking[] {
  return readJson<Booking[]>(STORAGE_KEYS.bookings, []);
}

export function getBookingsForUser(userEmail: string): Booking[] {
  return getBookings().filter((booking) => booking.userEmail === userEmail);
}

export function addBooking(booking: Booking): Booking[] {
  const bookings = getBookings();
  bookings.unshift(booking);
  writeJson(STORAGE_KEYS.bookings, bookings);
  return bookings;
}

export function getLicenses(): DrivingLicense[] {
  return readJson<DrivingLicense[]>(STORAGE_KEYS.licenses, []);
}

export function addLicenseSubmission(license: DrivingLicense): DrivingLicense[] {
  const licenses = getLicenses();
  licenses.unshift(license);
  writeJson(STORAGE_KEYS.licenses, licenses);
  return licenses;
}

export function updateLicenseStatus(id: string, status: LicenseStatus): DrivingLicense[] {
  const licenses = getLicenses().map((license) => (license.id === id ? { ...license, status } : license));
  writeJson(STORAGE_KEYS.licenses, licenses);
  return licenses;
}

export function getPenalties(): Penalty[] {
  return readJson<Penalty[]>(STORAGE_KEYS.penalties, []);
}

export function addPenalty(penalty: Penalty): Penalty[] {
  const penalties = getPenalties();
  penalties.unshift(penalty);
  writeJson(STORAGE_KEYS.penalties, penalties);
  return penalties;
}

export function updatePenaltyStatus(id: string, status: PenaltyStatus): Penalty[] {
  const penalties = getPenalties().map((penalty) => (penalty.id === id ? { ...penalty, status } : penalty));
  writeJson(STORAGE_KEYS.penalties, penalties);
  return penalties;
}

export function getUserMeta(userEmail: string): UserMeta {
  const mapping = readJson<Record<string, UserMeta>>(STORAGE_KEYS.userMeta, {});
  return mapping[userEmail] || {};
}

export function setUserMeta(userEmail: string, meta: UserMeta): UserMeta {
  const mapping = readJson<Record<string, UserMeta>>(STORAGE_KEYS.userMeta, {});
  mapping[userEmail] = { ...(mapping[userEmail] || {}), ...meta };
  writeJson(STORAGE_KEYS.userMeta, mapping);
  return mapping[userEmail];
}
