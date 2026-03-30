import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, DollarSign, Heart, LayoutDashboard, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { fetchUserBookings } from "../lib/rentals";
import { getSavedVehicleIds, getVehicleById, getVehicles, type Booking } from "../lib/vrms";

type DashboardTab = "home" | "collections" | "bookings";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function getBadgeClasses(status: string) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-slate-200 text-slate-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default function Dashboard() {
  const { user, userToken, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const { tab } = useParams();

  const activeTab = (tab as DashboardTab | undefined) || "home";
  const vehicles = useMemo(() => getVehicles(), []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!userToken) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    let cancelled = false;

    const loadBookings = async () => {
      try {
        const nextBookings = await fetchUserBookings(userToken);

        if (!cancelled) {
          setBookings(nextBookings);
        }
      } catch (error: any) {
        if (!cancelled) {
          if (String(error?.message || "").toLowerCase().includes("session")) {
            logoutUser();
            navigate("/login", { replace: true });
            return;
          }

          setBookings([]);
        }
      } finally {
        if (!cancelled) {
          setBookingsLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      cancelled = true;
    };
  }, [logoutUser, navigate, userToken]);

  const savedIds = useMemo(() => {
    if (!user?.email) {
      return [];
    }

    return getSavedVehicleIds(user.email);
  }, [user?.email]);

  const stats = useMemo(() => {
    const totalTrips = bookings.length;
    const spent = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const savedVehicles = savedIds.length;

    return { totalTrips, spent, savedVehicles };
  }, [bookings, savedIds.length]);

  const recentActivity = useMemo(() => {
    const activity = bookings.slice(0, 5).map((booking) => {
      const vehicle = getVehicleById(booking.vehicleId);
      return {
        id: booking.id,
        title: vehicle ? `Booked ${vehicle.name}` : "New booking",
        meta: `${new Date(booking.createdAt).toLocaleDateString()} | ${booking.status}`,
      };
    });

    if (activity.length > 0) {
      return activity;
    }

    return [
      { id: "tip-1", title: "Save vehicles to Collections", meta: "Tap the heart on Explore." },
      { id: "tip-2", title: "Book your next ride", meta: "Pick dates and confirm." },
    ];
  }, [bookings]);

  const tabs: Array<{ key: DashboardTab; label: string; icon: any }> = [
    { key: "home", label: "Home", icon: LayoutDashboard },
    { key: "collections", label: "Collections", icon: Heart },
    { key: "bookings", label: "My Bookings", icon: CalendarDays },
  ];

  const content = (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <div className="sticky top-[92px] z-10 mb-8 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01]"
          >
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:gap-3 dark:border-white/10 dark:bg-slate-800">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === activeTab;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(`/dashboard/${item.key}`)}
                className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-all sm:px-5 sm:py-2.5 ${
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "home" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 p-7 text-white shadow-2xl shadow-blue-600/20 lg:col-span-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">Quick Start</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Find your next ride</h2>
            <p className="mt-2 max-w-xl text-sm text-blue-100/90">
              Browse premium vehicles, save your favorites, and book in a few clicks.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-blue-700 transition-transform hover:scale-[1.01]"
              >
                Explore vehicles
              </Link>
              <Link
                to="/dashboard/collections"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-transform hover:scale-[1.01]"
              >
                View collections
              </Link>
            </div>
          </motion.section>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Total Trips</p>
                <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">{stats.totalTrips}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Spent</p>
                <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">Rs. {formatInr(stats.spent)}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">Saved</p>
                <div className="rounded-2xl bg-rose-50 p-2 text-rose-600">
                  <Heart className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-slate-900">{stats.savedVehicles}</p>
            </div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm lg:col-span-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Activity</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">Recent</h3>
              </div>
              <Link to="/dashboard/bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>

            <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 bg-white px-5 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.meta}</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      )}

      {activeTab === "collections" && (
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Collections</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Saved vehicles</h2>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Browse more
            </Link>
          </div>

          {savedIds.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">No saved vehicles yet</p>
              <p className="mt-2 text-sm text-slate-500">Tap the heart on any vehicle to add it here.</p>
              <Link
                to="/explore"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01]"
              >
                Explore vehicles
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {savedIds
                .map((id) => vehicles.find((vehicle) => vehicle.id === id))
                .filter(Boolean)
                .map((vehicle) => (
                  <Link
                    key={vehicle!.id}
                    to={`/vehicle/${vehicle!.id}`}
                    className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/6"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={vehicle!.image}
                        alt={vehicle!.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-black text-slate-900">{vehicle!.name}</p>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {vehicle!.type}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-600">Rs. {formatInr(vehicle!.pricePerDay)}/day</p>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "bookings" && (
        <div>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Bookings</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">My bookings</h2>
          </div>

          {bookingsLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">No bookings yet</p>
              <p className="mt-2 text-sm text-slate-500">Explore vehicles and book your first trip.</p>
              <Link
                to="/explore"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01]"
              >
                Explore vehicles
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {bookings.map((booking) => {
                const vehicle = getVehicleById(booking.vehicleId);

                return (
                  <div
                    key={booking.id}
                    className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/6"
                  >
                    <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
                      <div className="aspect-[16/10] bg-slate-100 sm:aspect-auto">
                        {vehicle ? (
                          <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full" />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-slate-900">{vehicle?.name || "Vehicle"}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${getBadgeClasses(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-600">{booking.location}</p>
                          <p className="text-sm font-bold text-slate-900">Rs. {formatInr(booking.totalPrice)}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">
                            {booking.paymentMethod.replace("netbanking", "net banking")}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 ${
                              booking.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </div>
                        {vehicle && (
                          <Link
                            to={`/vehicle/${vehicle.id}`}
                            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
                          >
                            View vehicle
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return <div className="min-h-[calc(100vh-92px)]">{content}</div>;
}
