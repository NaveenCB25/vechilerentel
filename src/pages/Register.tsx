import React, { useContext, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
import { LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, payload);

      if (data.success) {
        const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: payload.email,
          password: payload.password,
        });

        if (loginRes.data.success) {
          loginUser(loginRes.data.token, loginRes.data.user);
          toast.success("Account created");
          navigate(redirectTo || "/dashboard");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed");
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
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vehicle Rental</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">Sign up to save vehicles and manage bookings.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="phone"
                type="tel"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder="+91 98765 43210"
                value={formData.phone}
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
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Minimum 6 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

