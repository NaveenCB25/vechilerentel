import React, { useContext, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[calc(100vh-92px)] overflow-hidden bg-[linear-gradient(135deg,#171f3b_0%,#10172b_46%,#0d1325_100%)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_26%)]" />

      <div className="relative grid h-full overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-start justify-center overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full max-w-[450px] rounded-[1.55rem] border border-white/10 bg-white/6 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6"
          >
            <div className="mb-5">
              <h1 className="text-[2.1rem] font-black tracking-tight text-white sm:text-[2.35rem]">Create Account</h1>
              <p className="mt-2 text-base text-slate-300">Sign up to manage bookings and access premium rentals</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Full Name</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Phone Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">Minimum 6 characters.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-5 py-3 text-lg font-bold text-white shadow-[0_18px_38px_rgba(99,102,241,0.26)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-base text-slate-400">
              Already have an account?{" "}
              <Link
                to={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="relative hidden h-full overflow-hidden lg:block">
          <div className="absolute inset-0 bg-black/42" />
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80"
            alt="Premium car dashboard"
            className="h-full w-full object-cover"
          />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
            className="absolute bottom-8 left-8 max-w-[420px] rounded-[1.45rem] border border-white/10 bg-slate-900/72 px-5 py-5 shadow-2xl shadow-black/25 backdrop-blur-md"
          >
            <h2 className="text-3xl font-black tracking-tight text-white">Join DreamCar</h2>
            <p className="mt-3 text-lg leading-8 text-slate-300">
              Create your account, save favorite vehicles, manage bookings, and unlock a smoother premium rental experience.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
