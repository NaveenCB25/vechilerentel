import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, BadgeCheck, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";
import { createAuthHeaders } from "../lib/auth";
import { getUserMeta, setUserMeta } from "../lib/vrms";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function dicebearAvatar(email: string) {
  return `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(email)}`;
}

export default function Profile() {
  const { user, userToken, logoutUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userToken) {
      navigate("/login?redirect=%2Fprofile", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: createAuthHeaders(userToken),
        });
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          logoutUser();
          navigate("/login", { replace: true });
          return;
        }

        if (response.ok && data?.success && data.user && !cancelled) {
          updateUser({ ...data.user, role: "user" });
        }
      } catch {
        // Keep whatever is already stored.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [logoutUser, navigate, updateUser, userToken]);

  const email = user?.email || "";
  const name = user?.name || "User";

  const meta = useMemo(() => {
    if (!email) {
      return {};
    }

    const current = getUserMeta(email);
    if (!current.memberSince) {
      return setUserMeta(email, {
        memberSince: new Date().toISOString(),
        accountStatus: "active",
        verificationStatus: "verified",
      });
    }

    return current;
  }, [email]);

  if (!userToken || !user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-92px)] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/6"
        >
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-8 pb-10 pt-10 text-white">
            <div className="absolute inset-0 opacity-25">
              <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            </div>

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 overflow-hidden rounded-3xl bg-white/15 ring-1 ring-white/25">
                  <img src={dicebearAvatar(email)} alt={name} className="h-full w-full" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">Profile</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">{name}</h1>
                  <p className="mt-1 text-sm text-blue-100/90">{email}</p>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-transform hover:scale-[1.01]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-6 p-8 md:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Account</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Information</h2>

              <div className="mt-6 grid gap-4">
                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <UserRound className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Role</span>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">User</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold">Account Status</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {meta.accountStatus || "active"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold">Verification</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {meta.verificationStatus || "verified"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Member Since</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {meta.memberSince ? formatDate(meta.memberSince) : "--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Actions</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Quick</h2>

              <div className="mt-6 grid gap-3">
                <Link
                  to="/dashboard/bookings"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  View my bookings
                </Link>

                <Link
                  to="/explore"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  Explore vehicles
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    navigate("/", { replace: true });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-red-600/20 transition-transform hover:scale-[1.01]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>

                {loading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
                    Syncing profile...
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
