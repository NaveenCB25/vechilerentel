export type Vehicle = {
  id: string;
  name: string;
  type: string;
  image: string;
  pricePerDay: number;
  specs: Array<{ label: string; value: string }>;
};

export type BookingStatus = "pending" | "active" | "completed" | "cancelled";
export type PaymentMethod = "upi" | "card" | "netbanking" | "cash";
export type PaymentStatus = "pending" | "paid";

export type Booking = {
  id: string;
  userEmail: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  location: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  createdAt: string;
};

export type LicenseStatus = "pending" | "approved" | "rejected";

export type DrivingLicense = {
  id: string;
  userEmail: string;
  fullName: string;
  dob: string;
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
      "https://bmw.scene7.com/is/image/BMW/DI23_000189521:16to7?fmt=webp&wid=2560&hei=1120",
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
      "https://prs.porsche.com/iod/image/IN/9921B2/1/N4Igxg9gdgZglgcxALlAQynAtmgLnaAZxQG0BdAGnDSwFMAnNFUOAExRFoA9cBaAGwgB3XjHrQ+-WjFwgqEAA74izEADc09OBlnIQrWoQDWuRSAC+5qrShq44qHSi6W7PQFV6AIwwBZNGAYciCKylDEqJZU-IgAFvhQSKggbBwAcgCSAOIAEgAqwaEE4cxRIArirACuYC4pbiAAnI0ATACMAEIthUrFEaCQsIikIAAMGQDMwaNpHdMACqPTeQDC0+5zVJ05wW1ZABy7ADIAyrtpU1tpAIK7i3cAort5lyBtABrdVC0ALI0TbQA+gApYHBForACs4IAaj9wQB1JbfABaayoEw6rwmADEnhicrcMcD4RiAIoFDEnZEgH7XV4-HFfWlZebBH5HABs7PcOOCkP2735AGkzlRIb4iSBIe90SBOR0pZyHvj5TiaZycVlgpzgQARHXCxo6tJgqicgBKcs57xhwQA7NdhQ6cs6qPbha97b5je73Nr3TCafbPsF9r6QPsMpTI2l7WG8m0wzCA01IVLGtcDVRGsCM-NXo0YW6mgiY40Uaq9fsLcEHqMpQ9fMycb4aTiUTSsm0+VQsnloX2YUmqBkYRGMkjgsL9nLhddmcKySOQEd+0dNiB5jsqGT08EyTkV2Tgdzd2TmWSYa93Blme55hH3O8zyAYergjCjjSYRalpRwAgKpnHoABPDgMjSYIsAgAx+AATVoTQUBaUYWk5SwrBAQhaFwBIEH6EAYAgegcF0EAACsFFoJAqFwRhwgUTQbF0GA0H4HDLCAA?clientId=modelpage",
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
      "https://uploads.audi-mediacenter.com/system/production/media/122633/images/d6f275329fe669a9f1f59eb9686cddae331c6379/A240555_web_640.jpg?1733133179",
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
      "https://media.oneweb.mercedes-benz.com/images/dynamic/europe/IN/465250/X24/iris.png?q=COSY-EU-100-1713d0VXqbWFqtyO67PobzIr3eWsrrCsdRRzwQZgk4ZbMw3SGtlaWtsd2H%25cUfgUfXGEzymJ0lcIhOB2PBqbApeIoI5usKDQC3UnpkzNL6Sm%25kbFDZEttsdB%25ycJtj9GXOcAyjJ0lCWtOB2vM%25bApLHXI5uazxQC3lQFkzN2Iwm7jyXZhKVUp4%25vq7IayLRltRYax2vWrH1pVtn8wrzboiZYMEM4FgTwTg93ve6PDNcoSeWcKWtsdYYQcUfFh6XGHRvW6INpqJRMiK81gEyJlfDADSjSiNsG8u4NLwa2ITvU%25&BKGND=9&IMGT=P27&cp=U7lLKRUtPa6KAFr8s_ubHw&uni=m&POV=BE040,PZM",
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
      "https://www.royalenfield.com/content/dam/royal-enfield/motorcycles/continental-gt/banner/new/gallery/gallery-7.jpg",
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
