import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Heart, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { AuthContext } from "../context/AuthContext";
import { getSavedVehicleIds, getVehicles, toggleSavedVehicle } from "../lib/vrms";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

export default function Explore() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const vehicles = useMemo(() => getVehicles(), []);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [savedIds, setSavedIds] = useState(() => (user?.email ? getSavedVehicleIds(user.email) : []));

  useEffect(() => {
    setSavedIds(user?.email ? getSavedVehicleIds(user.email) : []);
  }, [user?.email]);

  const types = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((vehicle) => vehicle.type))) as string[];
    unique.sort((left, right) => left.localeCompare(right));
    return ["all", ...unique];
  }, [vehicles]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesQuery = normalizedQuery
        ? vehicle.name.toLowerCase().includes(normalizedQuery) || vehicle.type.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesType = typeFilter === "all" ? true : vehicle.type === typeFilter;

      return matchesQuery && matchesType;
    });
  }, [query, typeFilter, vehicles]);

  const handleToggleSave = (vehicleId: string) => {
    if (!user?.email) {
      toast.info("Sign in to save vehicles.");
      navigate(`/login?redirect=${encodeURIComponent("/explore")}`);
      return;
    }

    const nextSavedIds = toggleSavedVehicle(user.email, vehicleId);
    setSavedIds(nextSavedIds);
  };

  return (
    <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Explore</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Vehicles</h1>
            <p className="mt-1 text-sm text-slate-600">Search, filter, save, and book.</p>
          </div>
          <Link
            to="/dashboard/collections"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.01]"
          >
            <Heart className="h-4 w-4 text-rose-600" />
            Collections
          </Link>
        </div>

        <div className="mb-8 grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vehicles..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All types" : type}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">No vehicles found</p>
            <p className="mt-2 text-sm text-slate-500">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vehicle) => {
              const isSaved = savedIds.includes(vehicle.id);

              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/6"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleSave(vehicle.id)}
                      className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur transition-colors ${
                        isSaved
                          ? "border-rose-200 bg-rose-50 text-rose-600"
                          : "border-white/60 bg-white/80 text-slate-700 hover:bg-white"
                      }`}
                      aria-label={isSaved ? "Remove from saved" : "Save vehicle"}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Link to={`/vehicle/${vehicle.id}`} className="text-lg font-black text-slate-900 hover:text-blue-600">
                        {vehicle.name}
                      </Link>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {vehicle.type}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-600">₹{formatInr(vehicle.pricePerDay)}/day</p>
                      <Link
                        to={`/booking/${vehicle.id}`}
                        className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
