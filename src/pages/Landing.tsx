import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Car, ShieldCheck, Sparkles } from "lucide-react";
import { getVehicles } from "../lib/vrms";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

export default function Landing() {
  const vehicles = getVehicles().slice(0, 3);

  return (
    <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Professional Vehicle Rental Management
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Rent premium vehicles with a modern, clean experience
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              Browse curated collections, book in minutes, and manage everything from a professional dashboard.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01]"
              >
                Explore vehicles
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.01]"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Verified", body: "License verification workflow.", icon: BadgeCheck, tint: "text-emerald-600 bg-emerald-50" },
                { title: "Secure", body: "Role-based admin access.", icon: ShieldCheck, tint: "text-blue-600 bg-blue-50" },
                { title: "Premium", body: "Curated vehicle collection.", icon: Car, tint: "text-slate-900 bg-slate-100" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-4 font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm sm:col-span-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-sky-500/10" />
              <div className="relative p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Browse</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Featured vehicles</h2>
                <p className="mt-1 text-sm text-slate-600">Fast booking, transparent pricing, and clean UI.</p>
              </div>
            </div>

            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicle/${vehicle.id}`}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/6"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-900">{vehicle.name}</p>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {vehicle.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">₹{formatInr(vehicle.pricePerDay)}/day</p>
                </div>
              </Link>
            ))}
          </motion.section>
        </div>
      </div>
    </div>
  );
}

