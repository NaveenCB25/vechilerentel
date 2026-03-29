import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Heart, Info, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { getSavedVehicleIds, getVehicleById, toggleSavedVehicle } from "../lib/vrms";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const vehicle = useMemo(() => (id ? getVehicleById(id) : null), [id]);
  const [savedIds, setSavedIds] = useState(() => (user?.email ? getSavedVehicleIds(user.email) : []));

  useEffect(() => {
    setSavedIds(user?.email ? getSavedVehicleIds(user.email) : []);
  }, [user?.email]);

  if (!vehicle) {
    return (
      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-900">Vehicle not found</p>
          <p className="mt-2 text-sm text-slate-500">The vehicle you are looking for does not exist.</p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const isSaved = savedIds.includes(vehicle.id);

  const handleToggleSave = () => {
    if (!user?.email) {
      toast.info("Sign in to save vehicles.");
      navigate(`/login?redirect=${encodeURIComponent(`/vehicle/${vehicle.id}`)}`);
      return;
    }

    const next = toggleSavedVehicle(user.email, vehicle.id);
    setSavedIds(next);
  };

  return (
    <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold shadow-sm transition-transform hover:scale-[1.01] ${
                isSaved ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>
            <Link
              to={`/booking/${vehicle.id}`}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01]"
            >
              Book Now
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="aspect-[16/10] overflow-hidden bg-slate-100">
              <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vehicle</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{vehicle.name}</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{vehicle.type}</span>
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Price</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">₹{formatInr(vehicle.pricePerDay)}</p>
                  <p className="text-sm font-semibold text-slate-600">per day</p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {vehicle.specs.map((spec) => (
                  <div key={spec.label} className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{spec.label}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
            className="grid gap-6"
          >
            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Booking details</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Select dates, location, and provide license information to confirm.
                  </p>
                </div>
              </div>
              <Link
                to={`/booking/${vehicle.id}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
              >
                Continue to booking
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">License verification</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Admins verify submissions to keep rentals safe and compliant.
                  </p>
                </div>
              </div>
              <Link
                to="/admin"
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
              >
                Admin panel
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
