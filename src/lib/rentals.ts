import { API_BASE_URL } from "./api";
import { createAuthHeaders } from "./auth";
import type { Booking, DrivingLicense, LicenseStatus, PaymentMethod } from "./vrms";

export type RentalSubmissionPayload = {
  booking: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    location: string;
    paymentMethod: PaymentMethod;
    totalPrice: number;
  };
  license: {
    fullName: string;
    dob: string;
    licenseNumber: string;
    expiry: string;
  };
};

type ApiSuccessResponse<T> = T & { success: true };
type AdminRentalOverview = ApiSuccessResponse<{ bookings: Booking[]; licenses: DrivingLicense[] }>;

async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}

export async function submitRental(token: string, payload: RentalSubmissionPayload) {
  const response = await fetch(`${API_BASE_URL}/api/rentals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseApiResponse<
    ApiSuccessResponse<{
      booking: Booking;
      license: DrivingLicense;
      emailSent?: boolean;
      emailStatus?: "sent" | "not_configured" | "failed";
    }>
  >(response);
}

export async function fetchUserBookings(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/rentals/mine`, {
    headers: createAuthHeaders(token),
  });

  const data = await parseApiResponse<ApiSuccessResponse<{ bookings: Booking[] }>>(response);
  return data.bookings;
}

export async function fetchAdminRentalOverview(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/rentals/admin/overview`, {
    headers: createAuthHeaders(token),
  });

  return parseApiResponse<AdminRentalOverview>(response);
}

export async function updateAdminBookingStatus(token: string, bookingId: string, status: Booking["status"]) {
  const response = await fetch(`${API_BASE_URL}/api/rentals/admin/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeaders(token),
    },
    body: JSON.stringify({ status }),
  });

  return parseApiResponse<ApiSuccessResponse<{ booking: Booking }>>(response);
}

export async function updateAdminLicenseStatus(token: string, licenseId: string, status: LicenseStatus) {
  const response = await fetch(`${API_BASE_URL}/api/rentals/admin/licenses/${licenseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...createAuthHeaders(token),
    },
    body: JSON.stringify({ status }),
  });

  return parseApiResponse<ApiSuccessResponse<{ license: DrivingLicense }>>(response);
}
