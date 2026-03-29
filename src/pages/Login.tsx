import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { loginUser, loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "";
  const modeFromQuery = (searchParams.get("mode") || "user").toLowerCase();
  const [mode, setMode] = useState<"user" | "admin">(modeFromQuery === "admin" ? "admin" : "user");

  useEffect(() => {
    setMode(modeFromQuery === "admin" ? "admin" : "user");
  }, [modeFromQuery]);

  const postLoginTarget = useMemo(() => {
    if (redirectTo) {
      return redirectTo;
    }

    return mode === "admin" ? "/admin" : "/dashboard";
  }, [mode, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "admin") {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
          username: formData.email.trim(),
          password: formData.password,
        });

        if (data.success) {
          loginAdmin(data.token);
          toast.success("Admin login successful");
          navigate(postLoginTarget);
        }
      } else {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        if (data.success) {
          loginUser(data.token, data.user);
          toast.success("Login successful");
          navigate(postLoginTarget);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-[2rem] border border-slate-200/70 bg-white/90 p-8 shadow-2xl shadow-slate-900/8 backdrop-blur"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vehicle Rental</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "admin" ? "Admin access only." : "Welcome back — manage bookings and favorites."}
            </p>
          </div>
          <div
            className={`mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
              mode === "admin" ? "bg-slate-950 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {mode === "admin" ? <ShieldCheck className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("user")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
              mode === "user" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
              mode === "admin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Admin
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {mode === "admin" ? "Admin username" : "Email"}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="email"
                type={mode === "admin" ? "text" : "email"}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder={mode === "admin" ? "admin" : "user@example.com"}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ email: "user@example.com", password: "password123" })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Use demo user
            </button>
            <button
              type="button"
              onClick={() => setFormData({ email: "admin", password: "admin123" })}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Use demo admin
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Signing in..." : mode === "admin" ? "Sign in as Admin" : "Sign in"}
          </button>
        </form>

        {mode === "user" && (
          <p className="mt-6 text-center text-sm text-slate-600">
            New here?{" "}
            <Link
              to={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="font-semibold text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
