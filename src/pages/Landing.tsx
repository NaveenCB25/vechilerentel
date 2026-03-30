import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import { APP_INFO } from "../data";
import { getVehicles, subscribeToVehicleCatalog, type Vehicle } from "../lib/vrms";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

const ratings = [4.9, 4.8, 5.0, 4.7];

export default function Landing() {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles().slice(0, 4));
  useEffect(() => {
    return subscribeToVehicleCatalog(() => {
      setVehicles(getVehicles().slice(0, 4));
    });
  }, []);
  const leadVehicle = vehicles[0];

  return (
    <div className="overflow-hidden px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-[4.5rem]">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/80 bg-white/88 px-6 py-8 shadow-[0_35px_90px_rgba(99,102,241,0.12)] backdrop-blur sm:px-8 lg:px-12 lg:py-14 dark:border-white/10 dark:bg-slate-900/88 dark:shadow-[0_35px_90px_rgba(15,23,42,0.55)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.17),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.90),rgba(243,247,255,0.90))] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_26%),linear-gradient(180deg,rgba(20,29,56,0.96),rgba(15,23,42,0.98))]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/96 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-indigo-100/60 dark:border-white/10 dark:bg-slate-800/90 dark:text-slate-200 dark:shadow-black/20">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Premium Car Rental Platform
              </div>

              <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[5.4rem] dark:text-white">
                Drive Your
                <span className="block bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-transparent">
                  Dream Car
                </span>
                <span className="block">Today</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-9 text-slate-500 dark:text-slate-300">
                Experience luxury and freedom with our premium fleet of vehicles. Book instantly, drive confidently,
                and create unforgettable memories with {APP_INFO.name}.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center gap-3 rounded-[1.6rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(99,102,241,0.28)] transition-transform hover:scale-[1.01]"
                >
                  <ArrowRight className="h-5 w-5" />
                  Explore Vehicles
                </Link>
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center rounded-[1.6rem] border-2 border-indigo-400/70 bg-white px-7 py-4 text-base font-bold text-indigo-500 shadow-sm transition-transform hover:scale-[1.01] dark:border-indigo-400/40 dark:bg-slate-800 dark:text-indigo-300"
                >
                  {user ? "Open Dashboard" : "Get Started Free"}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
              className="relative"
            >
              {leadVehicle ? (
                <>
                  <div className="motion-hero-car overflow-hidden rounded-[2.5rem] border border-white/80 bg-white p-3 shadow-[0_28px_70px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900">
                    <div className="overflow-hidden rounded-[2rem]">
                      <img
                        src={leadVehicle.image}
                        alt={leadVehicle.name}
                        className="aspect-[16/11] w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="motion-hero-card absolute -bottom-6 left-0 rounded-[1.7rem] border border-white/80 bg-white/95 px-5 py-4 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-400 text-white">
                        <Star className="h-6 w-6 fill-current" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">4.9 Rating</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Based on 10k+ reviews</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        </section>

        <section className="grid gap-8 border-y border-slate-200/80 py-8 sm:grid-cols-3 dark:border-white/10">
          {[
            { value: "500+", label: "Premium Vehicles" },
            { value: "10K+", label: "Happy Customers" },
            { value: "4.9", label: "Average Rating" },
          ].map((item) => (
            <div key={item.label}>
              <p className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                {item.value}
              </p>
              <p className="mt-2 text-xl font-medium text-slate-500 dark:text-slate-300">{item.label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Featured Fleet</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
              Featured{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-transparent">
                Vehicles
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">
              Discover our handpicked selection of premium cars.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {vehicles.map((vehicle, index) => (
              <Link
                key={vehicle.id}
                to={`/vehicle/${vehicle.id}`}
                className="group overflow-hidden rounded-[2rem] border border-white/80 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900"
              >
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="aspect-[5/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-900/90 dark:text-white">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {ratings[index] ?? 4.9}
                  </div>
                </div>

                <div className="px-2 pb-2 pt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{vehicle.type}</p>
                  <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{vehicle.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
                    Premium comfort, polished design, and smooth booking from pickup to return.
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-3xl font-black tracking-tight text-indigo-500">
                      Rs. {formatInr(vehicle.pricePerDay)}
                      <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">/day</span>
                    </p>
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/20">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center rounded-[1.6rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-10 py-4 text-xl font-bold text-white shadow-[0_18px_40px_rgba(99,102,241,0.24)]"
            >
              View All Vehicles
            </Link>
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">Why Choose Us</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-transparent">
                {APP_INFO.name}
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">
              Experience the difference with our premium services.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Trusted Experience",
                body: "Verified licenses, structured approvals, and professional support from booking to delivery.",
              },
              {
                icon: Zap,
                title: "Instant Booking Flow",
                body: "Fast date selection, live location suggestions, and a booking process that feels premium.",
              },
              {
                icon: Clock3,
                title: "Always Available",
                body: "Flexible scheduling and dependable fleet visibility whenever customers are ready to book.",
              },
              {
                icon: CircleDollarSign,
                title: "Clear Pricing",
                body: "Transparent daily rates, payment choices, and better confidence before checkout.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-white/80 bg-white p-7 text-center shadow-[0_18px_50px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-slate-900"
                >
                  <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 text-white shadow-lg shadow-indigo-500/20">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-300">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.75rem] border border-white/80 bg-[linear-gradient(135deg,rgba(238,242,255,0.96),rgba(224,242,254,0.92))] px-8 py-14 text-center shadow-[0_24px_70px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(49,46,129,0.38),rgba(12,74,110,0.34))]">
          <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
            Ready to Hit the Road?
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-slate-500 dark:text-slate-200">
            Join thousands of satisfied customers and experience the freedom of premium car rentals.
          </p>
          <div className="mt-10">
            <Link
              to={user ? "/explore" : "/register"}
              className="inline-flex items-center justify-center gap-3 rounded-[1.6rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-10 py-5 text-2xl font-bold text-white shadow-[0_18px_45px_rgba(99,102,241,0.25)]"
            >
              <ArrowRight className="h-6 w-6" />
              {user ? "Book Your Ride" : "Start Your Journey"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
