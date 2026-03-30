import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import {
  fetchAdminRentalOverview,
  updateAdminBookingStatus,
  updateAdminLicenseStatus,
} from "../lib/rentals";
import { getVehicleById, type Booking, type DrivingLicense, type LicenseStatus } from "../lib/vrms";

type AdminTab = "overview" | "bookings" | "licenses";

const VALID_TABS: AdminTab[] = ["overview", "bookings", "licenses"];

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function badgeClasses(status: string) {
  if (status === "approved" || status === "active" || status === "completed") {
    return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25";
  }

  if (status === "pending") {
    return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/25";
  }

  return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/25";
}

export default function Admin() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { adminToken, logoutAdmin } = useContext(AuthContext);
  const activeTab = VALID_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "overview";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [licenses, setLicenses] = useState<DrivingLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [updatingLicenseId, setUpdatingLicenseId] = useState<string | null>(null);

  const loadOverview = async (token: string, showSpinner: boolean) => {
    if (showSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const data = await fetchAdminRentalOverview(token);
      setBookings(data.bookings);
      setLicenses(data.licenses);
    } catch (nextError: any) {
      const message = nextError?.message || "Failed to load admin dashboard";
      setError(message);

      if (/session|access|auth/i.test(message)) {
        logoutAdmin();
        navigate("/admin/login", { replace: true });
      }
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!VALID_TABS.includes((tab || "") as AdminTab)) {
      navigate("/admin/overview", { replace: true });
    }
  }, [navigate, tab]);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    void loadOverview(adminToken, true);
  }, [adminToken]);

  const revenue = useMemo(() => bookings.reduce((sum, booking) => sum + booking.totalPrice, 0), [bookings]);
  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === "pending").length, [bookings]);
  const pendingLicenses = useMemo(() => licenses.filter((license) => license.status === "pending").length, [licenses]);

  const tabs: Array<{ key: AdminTab; label: string; icon: typeof Users }> = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "bookings", label: "Bookings", icon: CalendarDays },
    { key: "licenses", label: "Licenses", icon: FileCheck2 },
  ];

  const handleBookingStatus = async (bookingId: string, status: Booking["status"]) => {
    if (!adminToken) {
      return;
    }

    setUpdatingBookingId(bookingId);
    setError("");

    try {
      const { booking } = await updateAdminBookingStatus(adminToken, bookingId, status);
      setBookings((current) => current.map((item) => (item.id === bookingId ? booking : item)));
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to update booking status");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleLicenseStatus = async (licenseId: string, status: LicenseStatus) => {
    if (!adminToken) {
      return;
    }

    setUpdatingLicenseId(licenseId);
    setError("");

    try {
      const { license } = await updateAdminLicenseStatus(adminToken, licenseId, status);
      setLicenses((current) => current.map((item) => (item.id === licenseId ? license : item)));
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to update license status");
    } finally {
      setUpdatingLicenseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-4">
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-400" />
          <p className="text-sm font-semibold text-slate-200">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-16 pt-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Manage bookings and license approvals.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                if (adminToken) {
                  void loadOverview(adminToken, false);
                }
              }}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500/15 px-5 py-3 text-sm font-bold text-sky-100 ring-1 ring-sky-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                navigate("/admin/login", { replace: true });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-5 py-3 text-sm font-bold text-rose-200 ring-1 ring-rose-500/25 transition-transform hover:scale-[1.01]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-[1.5rem] border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mb-10 grid grid-cols-1 gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-2 sm:grid-cols-3 sm:gap-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const selected = item.key === activeTab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-3 text-sm font-semibold transition-all ${
                  selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" ? (
          <div className="grid gap-6">
            <div className="grid gap-5 lg:grid-cols-4">
              {[
                { label: "Total Bookings", value: bookings.length, icon: Users },
                { label: "Pending Bookings", value: pendingBookings, icon: CalendarDays },
                { label: "Pending Licenses", value: pendingLicenses, icon: FileCheck2 },
                { label: "Revenue", value: `Rs. ${formatInr(revenue)}`, icon: BadgeCheck },
              ].map((card) => {
                const Icon = card.icon;

                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-300">{card.label}</p>
                      <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                        <Icon className="h-4 w-4 text-sky-300" />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-black text-white">{card.value}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Latest</p>
                    <h2 className="mt-2 text-2xl font-black">Bookings</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/bookings")}
                    className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => {
                    const vehicle = getVehicleById(booking.vehicleId);
                    return (
                      <div key={booking.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-white">{vehicle?.name || booking.vehicleId}</p>
                            <p className="mt-1 text-xs text-slate-400">{booking.userEmail}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {bookings.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm font-semibold text-slate-400">
                      No bookings yet.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Latest</p>
                    <h2 className="mt-2 text-2xl font-black">License Checks</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/licenses")}
                    className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  {licenses.slice(0, 5).map((license) => (
                    <div key={license.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{license.fullName}</p>
                          <p className="mt-1 text-xs text-slate-400">{license.userEmail}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(license.status)}`}>
                          {license.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {licenses.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm font-semibold text-slate-400">
                      No license submissions yet.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "bookings" ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Bookings</p>
              <h2 className="mt-2 text-2xl font-black">All user bookings</h2>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Vehicle</th>
                    <th className="px-5 py-4 font-semibold">Trip</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No bookings yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => {
                      const vehicle = getVehicleById(booking.vehicleId);
                      return (
                        <tr key={booking.id} className="hover:bg-white/5">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{booking.userEmail}</p>
                            <p className="text-xs text-slate-400">{new Date(booking.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-200">{vehicle?.name || booking.vehicleId}</td>
                          <td className="px-5 py-4">
                            <p className="text-slate-200">
                              {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-400">{booking.location}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-200">Rs. {formatInr(booking.totalPrice)}</td>
                          <td className="px-5 py-4">
                            <select
                              value={booking.status}
                              disabled={updatingBookingId === booking.id}
                              onChange={(event) => {
                                void handleBookingStatus(booking.id, event.target.value as Booking["status"]);
                              }}
                              className={`w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60 ${badgeClasses(booking.status)}`}
                            >
                              <option value="pending">pending</option>
                              <option value="active">active</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "licenses" ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Licenses</p>
              <h2 className="mt-2 text-2xl font-black">All license submissions</h2>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">License</th>
                    <th className="px-5 py-4 font-semibold">Expiry</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No license submissions yet.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((license) => (
                      <tr key={license.id} className="hover:bg-white/5">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{license.userEmail}</p>
                          <p className="text-xs text-slate-400">{new Date(license.submittedAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-white">{license.fullName}</p>
                          <p className="text-xs text-slate-400">
                            DOB: {license.dob ? new Date(license.dob).toLocaleDateString() : "--"}
                          </p>
                          <p className="text-xs text-slate-400">{license.licenseNumber}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-200">{new Date(license.expiry).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(license.status)}`}>
                            {license.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={updatingLicenseId === license.id || license.status === "approved"}
                              onClick={() => {
                                void handleLicenseStatus(license.id, "approved");
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={updatingLicenseId === license.id || license.status === "rejected"}
                              onClick={() => {
                                void handleLicenseStatus(license.id, "rejected");
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 ring-1 ring-rose-500/25 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
