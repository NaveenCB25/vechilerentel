import React, { useContext, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { Chrome, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const { loginUser, loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isAdminRoute = location.pathname === "/admin/login";
  const mode: "user" | "admin" = isAdminRoute ? "admin" : "user";
  const redirectTo = searchParams.get("redirect") || "";

  const postLoginTarget = useMemo(() => {
    if (redirectTo) {
      return redirectTo;
    }

    return mode === "admin" ? "/admin" : "/dashboard";
  }, [mode, redirectTo]);

  const sidePanel = useMemo(
    () => ({
      title: isAdminRoute ? "Admin control starts here" : "Start Your Journey",
      body: isAdminRoute
        ? "Access bookings, manage approvals, and keep rental operations organized in one secure workspace."
        : "Access your dashboard, manage bookings, and explore our premium fleet with a cleaner sign-in flow.",
    }),
    [isAdminRoute],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "admin") {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
          username: formData.email.trim(),
          password: formData.password,
        });

        if (data.success) {
          loginAdmin(data.token);
          toast.success("Login successful");
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
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
            className="w-full max-w-[440px] rounded-[1.55rem] border border-white/10 bg-white/6 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6"
          >
            <div className="mb-5">
              <h1 className="text-[2.1rem] font-black tracking-tight text-white sm:text-[2.35rem]">
                {isAdminRoute ? "Admin Access" : "Welcome Back"}
              </h1>
              <p className="mt-2 text-base text-slate-300">
                {isAdminRoute ? "Login to manage the platform" : "Login to access your account"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  {isAdminRoute ? "Username" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type={isAdminRoute ? "text" : "email"}
                    required
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder={isAdminRoute ? "Enter username" : "you@example.com"}
                    value={formData.email}
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
                    className="w-full rounded-[1.1rem] border border-white/10 bg-white/4 px-11 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {!isAdminRoute ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-3 text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe((value) => !value)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent accent-indigo-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info("Forgot password is not configured yet.")}
                    className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-5 py-3 text-lg font-bold text-white shadow-[0_18px_38px_rgba(99,102,241,0.26)] transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {!isAdminRoute ? (
              <>
                <div className="relative my-6 border-t border-white/10">
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1d2743] px-3 text-xs text-slate-400">
                    Continue with
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toast.info("Google login is not configured yet.")}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-[1.1rem] border border-indigo-400/60 px-5 py-3 text-base font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
                >
                  <Chrome className="h-4.5 w-4.5" />
                  Google
                </button>

                <div className="mt-6 text-center text-base text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    to={`/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                    className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[1.1rem] border border-white/10 bg-white/4 px-4 py-3 text-xs text-slate-300">
                Use the credentials configured in your server environment to access the admin workspace.
              </div>
            )}
          </motion.div>
        </div>

        <div className="relative hidden h-full overflow-hidden lg:block">
          <div className="absolute inset-0 bg-black/42" />
          <img
            src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1400&q=80"
            alt="Luxury car interior"
            className="h-full w-full object-cover"
          />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
            className="absolute bottom-8 left-8 max-w-[420px] rounded-[1.45rem] border border-white/10 bg-slate-900/72 px-5 py-5 shadow-2xl shadow-black/25 backdrop-blur-md"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 text-white">
              {isAdminRoute ? <ShieldCheck className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">{sidePanel.title}</h2>
            <p className="mt-3 text-lg leading-8 text-slate-300">{sidePanel.body}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
