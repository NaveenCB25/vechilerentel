import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Menu, Shield, UserRound, X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { easeOutExpo } from "../lib/animations";

const menuSpring = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
} as const;

export default function Navbar() {
  const { user, adminToken, logoutUser, logoutAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = useMemo(() => {
    const base = [
      { label: "Home", to: "/" },
      { label: "Vehicles", to: "/explore" },
    ];
    if (user) {
      base.push({ label: "Dashboard", to: "/dashboard" });
    }
    if (adminToken) {
      base.push({ label: "Admin", to: "/admin" });
    }
    return base;
  }, [adminToken, user]);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const handleLogout = () => {
    if (adminToken) {
      logoutAdmin();
    }
    if (user) {
      logoutUser();
    }
    navigate("/", { replace: true });
  };

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: easeOutExpo }}
      className={`fixed top-0 z-50 flex h-[80px] w-full items-center backdrop-blur-xl transition-all duration-500 ${
        isScrolled
          ? "border-b border-white/70 bg-white/85 shadow-xl shadow-slate-900/8"
          : "border-b border-white/50 bg-white/70 shadow-sm shadow-slate-900/5"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-50/70 via-white/30 to-sky-50/70" />

      <div className="container relative mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20">
              <Shield className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-black tracking-tight text-slate-900">
                VRMS <span className="text-blue-600">Pro</span>
              </p>
              <p className="text-xs font-semibold text-slate-500">Rental Management</p>
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-2 py-2 shadow-sm shadow-slate-900/5">
            {links.map((link) => {
              const active = isActive(link.to);
              return (
                <motion.div key={link.to} whileHover={{ y: -1 }}>
                  <Link
                    to={link.to}
                    className={`relative flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active ? "text-slate-900" : "text-slate-500 hover:text-blue-600"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="desktop-nav-pill"
                        transition={menuSpring}
                        className="absolute inset-0 rounded-full border border-blue-100 bg-blue-50 shadow-inner"
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.01]"
              >
                <UserRound className="h-4 w-4 text-blue-600" />
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/15 transition-transform hover:scale-[1.01]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.01]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.01]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -1 }}
          className={`rounded-2xl border px-3 py-2 text-slate-900 transition-colors md:hidden ${
            isOpen ? "border-blue-100 bg-blue-50 text-blue-600" : "border-slate-200 bg-white/85"
          }`}
          onClick={() => setIsOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[80px] z-40 bg-slate-950/10 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={menuSpring}
              className="absolute left-4 right-4 top-[92px] z-50 overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 md:hidden"
            >
              <div className="space-y-2">
                {links.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3.5 font-semibold transition-all ${
                        active ? "bg-blue-50 text-blue-600 shadow-inner" : "text-slate-800 hover:bg-slate-50 hover:text-blue-600"
                      }`}
                    >
                      {link.label}
                      <span className="text-xs font-bold text-slate-400">{active ? "●" : ""}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="my-4 h-px bg-slate-100" />

              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    <UserRound className="h-5 w-5 text-blue-600" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="rounded-2xl bg-slate-100 py-4 text-center font-bold text-slate-900 transition-colors hover:bg-slate-200"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-2xl bg-blue-600 py-4 text-center font-bold text-white shadow-xl shadow-blue-200 transition-colors hover:bg-blue-700"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
