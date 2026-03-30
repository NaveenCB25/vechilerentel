import { useContext, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CarFront,
  FileCheck2,
  IndianRupee,
  LoaderCircle,
  LogOut,
  PencilLine,
  PlusCircle,
  RefreshCw,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { AuthContext } from "../context/AuthContext";
import {
  createAdminPenalty,
  fetchAdminRentalOverview,
  updateAdminBookingStatus,
  updateAdminLicenseStatus,
  updateAdminPenaltyStatus,
} from "../lib/rentals";
import {
  createId,
  getVehicleById,
  getVehicles,
  removeVehicle,
  setVehicles,
  updateVehicle,
  type Booking,
  type DrivingLicense,
  type LicenseStatus,
  type Penalty,
  type PenaltyStatus,
  type Vehicle,
  type VehicleDraft,
} from "../lib/vrms";

type AdminTab = "overview" | "bookings" | "licenses" | "penalties" | "vehicles";

const VALID_TABS: AdminTab[] = ["overview", "bookings", "licenses", "penalties", "vehicles"];

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function badgeClasses(status: string) {
  if (status === "approved" || status === "active" || status === "completed" || status === "paid") {
    return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25";
  }

  if (status === "pending") {
    return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/25";
  }

  if (status === "waived") {
    return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25";
  }

  return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/25";
}

function buildVehicleId(name: string, vehicles: Vehicle[]) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const baseId = slug || createId("vehicle").replace(/_/g, "-").toLowerCase();
  let candidate = baseId;
  let index = 2;

  while (vehicles.some((vehicle) => vehicle.id === candidate)) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }

  return candidate;
}

export default function Admin() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { adminToken, logoutAdmin } = useContext(AuthContext);
  const activeTab = VALID_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "overview";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [licenses, setLicenses] = useState<DrivingLicense[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [vehicles, setVehiclesState] = useState<Vehicle[]>(() => getVehicles());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [updatingLicenseId, setUpdatingLicenseId] = useState<string | null>(null);
  const [updatingPenaltyId, setUpdatingPenaltyId] = useState<string | null>(null);
  const [isCreatingPenalty, setIsCreatingPenalty] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isRemovingVehicle, setIsRemovingVehicle] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    bookingId: "",
    reason: "",
    amount: "",
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleForm, setVehicleForm] = useState<VehicleDraft>({
    name: "",
    type: "",
    image: "",
    gallery: ["", "", ""],
    pricePerDay: 0,
    specs: [],
  });

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
      setPenalties(data.penalties);
      setVehiclesState(getVehicles());
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

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    if (!selectedVehicle) {
      return;
    }

    setVehicleForm({
      name: selectedVehicle.name,
      type: selectedVehicle.type,
      image: selectedVehicle.image,
      gallery: [...selectedVehicle.gallery],
      pricePerDay: selectedVehicle.pricePerDay,
      specs: selectedVehicle.specs.map((spec) => ({ ...spec })),
    });
  }, [selectedVehicleId, vehicles]);

  const revenue = useMemo(() => bookings.reduce((sum, booking) => sum + booking.totalPrice, 0), [bookings]);
  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === "pending").length, [bookings]);
  const pendingLicenses = useMemo(() => licenses.filter((license) => license.status === "pending").length, [licenses]);
  const pendingPenalties = useMemo(() => penalties.filter((penalty) => penalty.status === "pending").length, [penalties]);
  const totalPenaltyAmount = useMemo(() => penalties.reduce((sum, penalty) => sum + penalty.amount, 0), [penalties]);

  const tabs: Array<{ key: AdminTab; label: string; icon: typeof Users }> = [
    { key: "overview", label: "Overview", icon: Users },
    { key: "bookings", label: "Bookings", icon: CalendarDays },
    { key: "licenses", label: "Licenses", icon: FileCheck2 },
    { key: "penalties", label: "Penalties", icon: AlertTriangle },
    { key: "vehicles", label: "Vehicles", icon: CarFront },
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

  const handlePenaltyStatus = async (penaltyId: string, status: PenaltyStatus) => {
    if (!adminToken) {
      return;
    }

    setUpdatingPenaltyId(penaltyId);
    setError("");

    try {
      const { penalty } = await updateAdminPenaltyStatus(adminToken, penaltyId, status);
      setPenalties((current) => current.map((item) => (item.id === penaltyId ? penalty : item)));
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to update penalty status");
    } finally {
      setUpdatingPenaltyId(null);
    }
  };

  const handleCreatePenalty = async (event: FormEvent) => {
    event.preventDefault();

    if (!adminToken) {
      return;
    }

    setIsCreatingPenalty(true);
    setError("");

    try {
      const amount = Number(penaltyForm.amount);
      const { penalty } = await createAdminPenalty(adminToken, {
        bookingId: penaltyForm.bookingId,
        reason: penaltyForm.reason.trim(),
        amount,
      });

      setPenalties((current) => [penalty, ...current]);
      setPenaltyForm({ bookingId: "", reason: "", amount: "" });
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to create penalty");
    } finally {
      setIsCreatingPenalty(false);
    }
  };

  const handleVehicleSpecChange = (index: number, value: string) => {
    setVehicleForm((current) => ({
      ...current,
      specs: current.specs.map((spec, specIndex) => (specIndex === index ? { ...spec, value } : spec)),
    }));
  };

  const handleVehicleGalleryChange = (index: number, value: string) => {
    setVehicleForm((current) => ({
      ...current,
      gallery: current.gallery.map((image, imageIndex) => (imageIndex === index ? value : image)),
    }));
  };

  const handleAddVehicle = () => {
    const draftVehicle: Vehicle = {
      id: buildVehicleId("new-vehicle", vehicles),
      name: "New Vehicle",
      type: "Premium",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
      ],
      pricePerDay: 9999,
      specs: [
        { label: "Seats", value: "4" },
        { label: "Transmission", value: "Automatic" },
        { label: "Fuel", value: "Petrol" },
        { label: "Drive", value: "RWD" },
      ],
    };

    const nextVehicles = [draftVehicle, ...vehicles];
    setVehicles(nextVehicles);
    setVehiclesState(nextVehicles);
    setSelectedVehicleId(draftVehicle.id);
    setVehicleForm({
      name: draftVehicle.name,
      type: draftVehicle.type,
      image: draftVehicle.image,
      gallery: [...draftVehicle.gallery],
      pricePerDay: draftVehicle.pricePerDay,
      specs: draftVehicle.specs.map((spec) => ({ ...spec })),
    });
    toast.success("New vehicle added.");
  };

  const handleSaveVehicle = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedVehicleId) {
      return;
    }

    setIsSavingVehicle(true);
    setError("");

    try {
      const trimmedName = vehicleForm.name.trim() || "New Vehicle";
      const nextVehicles = updateVehicle(selectedVehicleId, {
        ...vehicleForm,
        name: trimmedName,
        type: vehicleForm.type.trim(),
        image: vehicleForm.image.trim(),
        gallery: vehicleForm.gallery.map((image) => image.trim()),
        pricePerDay: Number(vehicleForm.pricePerDay) || 0,
        specs: vehicleForm.specs.map((spec) => ({
          ...spec,
          value: spec.value.trim(),
        })),
      });

      setVehiclesState(nextVehicles);
      toast.success("Vehicle details saved.");
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to save vehicle");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleRemoveVehicle = () => {
    if (!selectedVehicleId) {
      return;
    }

    setIsRemovingVehicle(true);
    setError("");

    try {
      const nextVehicles = removeVehicle(selectedVehicleId);
      setVehiclesState(nextVehicles);
      toast.success("Vehicle removed from fleet.");

      const nextSelectedVehicle = nextVehicles[0] || null;
      setSelectedVehicleId(nextSelectedVehicle?.id || "");

      if (nextSelectedVehicle) {
        setVehicleForm({
          name: nextSelectedVehicle.name,
          type: nextSelectedVehicle.type,
          image: nextSelectedVehicle.image,
          gallery: [...nextSelectedVehicle.gallery],
          pricePerDay: nextSelectedVehicle.pricePerDay,
          specs: nextSelectedVehicle.specs.map((spec) => ({ ...spec })),
        });
      } else {
        setVehicleForm({
          name: "",
          type: "",
          image: "",
          gallery: ["", "", ""],
          pricePerDay: 0,
          specs: [],
        });
      }
    } catch (nextError: any) {
      setError(nextError?.message || "Failed to remove vehicle");
    } finally {
      setIsRemovingVehicle(false);
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
            <p className="mt-1 text-sm text-slate-400">Manage bookings, license approvals, and user penalties.</p>
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

        <div className="mb-10 grid grid-cols-1 gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-2 sm:grid-cols-5 sm:gap-4">
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
            <div className="grid gap-5 lg:grid-cols-5">
              {[
                { label: "Total Bookings", value: bookings.length, icon: Users },
                { label: "Pending Bookings", value: pendingBookings, icon: CalendarDays },
                { label: "Pending Licenses", value: pendingLicenses, icon: FileCheck2 },
                { label: "Pending Penalties", value: pendingPenalties, icon: AlertTriangle },
                { label: "Revenue", value: `Rs. ${formatInr(revenue)}`, icon: IndianRupee },
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

            <div className="grid gap-6 xl:grid-cols-3">
              <OverviewList
                title="Bookings"
                onViewAll={() => navigate("/admin/bookings")}
                items={bookings.slice(0, 5).map((booking) => {
                  const vehicle = getVehicleById(booking.vehicleId);
                  return {
                    id: booking.id,
                    title: vehicle?.name || booking.vehicleId,
                    subtitle: booking.userEmail,
                    status: booking.status,
                  };
                })}
                emptyLabel="No bookings yet."
              />

              <OverviewList
                title="License Checks"
                onViewAll={() => navigate("/admin/licenses")}
                items={licenses.slice(0, 5).map((license) => ({
                  id: license.id,
                  title: license.fullName,
                  subtitle: license.userEmail,
                  status: license.status,
                }))}
                emptyLabel="No license submissions yet."
              />

              <OverviewList
                title="Penalties"
                onViewAll={() => navigate("/admin/penalties")}
                items={penalties.slice(0, 5).map((penalty) => {
                  const vehicle = getVehicleById(penalty.vehicleId);
                  return {
                    id: penalty.id,
                    title: penalty.reason,
                    subtitle: `${penalty.userEmail} | ${vehicle?.name || penalty.vehicleId}`,
                    status: penalty.status,
                  };
                })}
                emptyLabel="No penalties issued yet."
              />
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

        {activeTab === "penalties" ? (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Issue Penalty</p>
                <h2 className="mt-2 text-2xl font-black">Create a penalty</h2>
                <p className="mt-2 text-sm text-slate-400">Select a booking, add a reason, and assign the amount.</p>
              </div>

              <form className="space-y-4" onSubmit={handleCreatePenalty}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Booking</label>
                  <select
                    value={penaltyForm.bookingId}
                    onChange={(event) => setPenaltyForm((current) => ({ ...current, bookingId: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    required
                  >
                    <option value="">Select a booking</option>
                    {bookings.map((booking) => {
                      const vehicle = getVehicleById(booking.vehicleId);
                      return (
                        <option key={booking.id} value={booking.id}>
                          {booking.userEmail} - {vehicle?.name || booking.vehicleId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Reason</label>
                  <textarea
                    value={penaltyForm.reason}
                    onChange={(event) => setPenaltyForm((current) => ({ ...current, reason: event.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    placeholder="Late return, damage, cleanup, traffic fine..."
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Amount</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={penaltyForm.amount}
                    onChange={(event) => setPenaltyForm((current) => ({ ...current, amount: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    placeholder="2500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingPenalty}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500/15 px-5 py-3 text-sm font-bold text-amber-200 ring-1 ring-amber-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusCircle className="h-4 w-4" />
                  {isCreatingPenalty ? "Creating..." : "Create penalty"}
                </button>
              </form>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Summary</p>
                <p className="mt-3 text-2xl font-black text-white">Rs. {formatInr(totalPenaltyAmount)}</p>
                <p className="mt-1 text-sm text-slate-400">Total penalties issued</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Penalties</p>
                <h2 className="mt-2 text-2xl font-black">Manage user penalties</h2>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-5 py-4 font-semibold">User</th>
                      <th className="px-5 py-4 font-semibold">Vehicle</th>
                      <th className="px-5 py-4 font-semibold">Reason</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {penalties.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                          No penalties issued yet.
                        </td>
                      </tr>
                    ) : (
                      penalties.map((penalty) => {
                        const vehicle = getVehicleById(penalty.vehicleId);
                        return (
                          <tr key={penalty.id} className="hover:bg-white/5">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-white">{penalty.userEmail}</p>
                              <p className="text-xs text-slate-400">{new Date(penalty.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-200">{vehicle?.name || penalty.vehicleId}</td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-white">{penalty.reason}</p>
                              <p className="text-xs text-slate-400">Booking: {penalty.bookingId}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-200">Rs. {formatInr(penalty.amount)}</td>
                            <td className="px-5 py-4">
                              <select
                                value={penalty.status}
                                disabled={updatingPenaltyId === penalty.id}
                                onChange={(event) => {
                                  void handlePenaltyStatus(penalty.id, event.target.value as PenaltyStatus);
                                }}
                                className={`w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60 ${badgeClasses(penalty.status)}`}
                              >
                                <option value="pending">pending</option>
                                <option value="paid">paid</option>
                                <option value="waived">waived</option>
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
          </div>
        ) : null}

        {activeTab === "vehicles" ? (
          <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Fleet</p>
                  <h2 className="mt-2 text-2xl font-black">Edit vehicles</h2>
                </div>
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500/15 px-4 py-3 text-sm font-bold text-sky-100 ring-1 ring-sky-500/25 transition-transform hover:scale-[1.01]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                      selectedVehicleId === vehicle.id
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-slate-950/50 hover:bg-white/5"
                    }`}
                  >
                    <p className="font-bold text-white">{vehicle.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{vehicle.type}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                  <PencilLine className="h-4 w-4 text-sky-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vehicle Details</p>
                  <h2 className="mt-1 text-2xl font-black">Edit option</h2>
                </div>
              </div>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveVehicle}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Name</label>
                  <input
                    value={vehicleForm.name}
                    onChange={(event) => setVehicleForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Type</label>
                  <input
                    value={vehicleForm.type}
                    onChange={(event) => setVehicleForm((current) => ({ ...current, type: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Image URL</label>
                  <input
                    value={vehicleForm.image}
                    onChange={(event) => setVehicleForm((current) => ({ ...current, image: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Preview gallery links</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {vehicleForm.gallery.map((image, index) => (
                      <input
                        key={`gallery-${index}`}
                        value={image}
                        onChange={(event) => handleVehicleGalleryChange(index, event.target.value)}
                        placeholder={`Preview image ${index + 1} URL`}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Price per day</label>
                  <input
                    type="number"
                    min="0"
                    value={vehicleForm.pricePerDay}
                    onChange={(event) =>
                      setVehicleForm((current) => ({ ...current, pricePerDay: Number(event.target.value) }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Specs</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {vehicleForm.specs.map((spec, index) => (
                      <div key={spec.label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/60 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{spec.label}</p>
                        <input
                          value={spec.value}
                          onChange={(event) => handleVehicleSpecChange(index, event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSavingVehicle}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500/15 px-5 py-3 text-sm font-bold text-sky-100 ring-1 ring-sky-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingVehicle ? "Saving..." : "Save vehicle details"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVehicle}
                    disabled={isRemovingVehicle || !selectedVehicleId}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-5 py-3 text-sm font-bold text-rose-200 ring-1 ring-rose-500/25 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    {isRemovingVehicle ? "Removing..." : "Remove vehicle"}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Preview</p>
                  <h3 className="mt-2 text-xl font-black text-white">Photo layout</h3>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
                  <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60">
                    <img
                      src={
                        vehicleForm.gallery[0] ||
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80"
                      }
                      alt={vehicleForm.name || "Vehicle preview"}
                      className="h-full min-h-[260px] w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-4">
                    {vehicleForm.gallery.slice(1).map((image, index) => (
                      <div key={`preview-${index}`} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60">
                        <img
                          src={
                            image ||
                            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80"
                          }
                          alt={`Vehicle preview ${index + 2}`}
                          className="h-full min-h-[122px] w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OverviewList({
  title,
  items,
  emptyLabel,
  onViewAll,
}: {
  title: string;
  items: Array<{ id: string; title: string; subtitle: string; status: string }>;
  emptyLabel: string;
  onViewAll: () => void;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Latest</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm font-semibold text-slate-400">
            {emptyLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
