import { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { differenceInCalendarDays } from "date-fns";
import { motion } from "motion/react";
import { ArrowLeft, CalendarDays, CreditCard, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { addBooking, addLicenseSubmission, createId, getVehicleById } from "../lib/vrms";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function clampDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = differenceInCalendarDays(end, start);
  return diff >= 0 ? diff + 1 : 0;
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const vehicle = useMemo(() => (id ? getVehicleById(id) : null), [id]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [licenseFullName, setLicenseFullName] = useState(user?.name || "");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  if (!vehicle) {
    return (
      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-900">Vehicle not found</p>
          <p className="mt-2 text-sm text-slate-500">Pick a vehicle from Explore first.</p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
          >
            Explore vehicles
          </Link>
        </div>
      </div>
    );
  }

  const days = clampDays(startDate, endDate);
  const total = days * vehicle.pricePerDay;
  const canSubmit = Boolean(days > 0 && location.trim() && licenseFullName.trim() && licenseNumber.trim() && licenseExpiry);

  const handleSubmit = () => {
    if (!user?.email) {
      navigate(`/login?redirect=${encodeURIComponent(`/booking/${vehicle.id}`)}`);
      return;
    }

    if (!canSubmit) {
      toast.error("Please fill all fields and select a valid date range.");
      return;
    }

    addBooking({
      id: createId("booking"),
      userEmail: user.email,
      vehicleId: vehicle.id,
      startDate,
      endDate,
      location: location.trim(),
      status: "pending",
      totalPrice: total,
      createdAt: new Date().toISOString(),
    });

    addLicenseSubmission({
      id: createId("license"),
      userEmail: user.email,
      fullName: licenseFullName.trim(),
      licenseNumber: licenseNumber.trim(),
      expiry: licenseExpiry,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });

    toast.success("Booking submitted. License sent for verification.");
    navigate("/dashboard/bookings");
  };

  return (
    <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/vehicle/${vehicle.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Link>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            {vehicle.name}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Booking</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">Select dates & location</h1>
              <p className="mt-1 text-sm text-slate-600">Provide license information to submit for admin verification.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pickup location"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-lg font-black text-slate-900">License information</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                  <input
                    value={licenseFullName}
                    onChange={(e) => setLicenseFullName(e.target.value)}
                    placeholder="Name on license"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">License number</label>
                  <input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL-XXXX-XXXX"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Expiry</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              Submit booking
            </button>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
            className="grid gap-6"
          >
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[16/10] bg-slate-100">
                <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <p className="text-lg font-black text-slate-900">{vehicle.name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  ₹{formatInr(vehicle.pricePerDay)}/day • {vehicle.type}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Summary</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Payment</h2>

              <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Days</span>
                  <span>{days || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Rate</span>
                  <span>₹{formatInr(vehicle.pricePerDay)}/day</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between text-base font-black text-slate-900">
                  <span>Total</span>
                  <span>₹{formatInr(total)}</span>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Submitting creates a pending booking and sends your license for admin review.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

