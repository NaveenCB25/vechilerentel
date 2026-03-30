import { useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CarFront, LogOut, Menu, Moon, Sun, UserRound, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { APP_INFO } from "../data";
import { easeOutExpo } from "../lib/animations";

const mobileMenuSpring = {
  type: "spring",
  stiffness: 250,
  damping: 26,
  mass: 0.9,
} as const;

export default function Navbar() {
  const { user, adminToken, logoutUser, logoutAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
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

  const links = useMemo(
    () => [
      { label: "Home", to: "/" },
      { label: "Explore", to: "/explore" },
      { label: "Dashboard", to: "/dashboard" },
      ...(adminToken ? [{ label: "Admin", to: "/admin" }] : []),
    ],
    [adminToken],
  );

  const isActive = (to: string) => {
    if (to === "/") {
      return location.pathname === "/";
    }

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
      transition={{ duration: 0.55, ease: easeOutExpo }}
      className={`fixed top-0 z-50 flex h-[92px] w-full items-center transition-all duration-500 ${
        isScrolled
          ? "border-b border-slate-200/80 bg-white/92 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 dark:shadow-black/35"
          : "border-b border-white/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.86))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.9))]" />

      <div className="container relative mx-auto flex h-full max-w-[80rem] items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[1.65rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 text-white shadow-[0_15px_35px_rgba(99,102,241,0.28)]">
            <CarFront className="h-7 w-7" />
          </div>
          <div>
            <p className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-[2.55rem] font-black tracking-[-0.055em] text-transparent">
              {APP_INFO.name}
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-12 lg:flex">
          <div className="flex items-center gap-9">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative py-2 text-[1.3rem] font-semibold transition-colors ${
                  isActive(link.to) ? "text-slate-900 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-opacity ${
                    isActive(link.to) ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition-transform hover:scale-[1.02] dark:bg-slate-800 dark:text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-[1.2rem] font-semibold text-indigo-500 transition-colors hover:text-indigo-600 dark:text-indigo-300"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-7 py-3 text-[1.05rem] font-bold text-white shadow-[0_16px_32px_rgba(99,102,241,0.22)]"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[1.2rem] font-semibold text-indigo-500 transition-colors hover:text-indigo-600 dark:text-indigo-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-7 py-3 text-[1.05rem] font-bold text-white shadow-[0_16px_32px_rgba(99,102,241,0.22)]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[92px] bg-slate-950/10 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={mobileMenuSpring}
              className="absolute left-4 right-4 top-[106px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/96 p-4 shadow-2xl shadow-slate-900/12 dark:border-white/10 dark:bg-slate-950/96"
            >
              <div className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold transition-colors ${
                      isActive(link.to)
                        ? "bg-gradient-to-r from-indigo-500/12 to-sky-400/12 text-indigo-600 dark:text-indigo-300"
                        : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                    {isActive(link.to) ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : null}
                  </Link>
                ))}
              </div>

              <div className="my-4 h-px bg-slate-100 dark:bg-white/10" />

              <button
                type="button"
                onClick={toggleTheme}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3.5 text-lg font-semibold text-slate-900 dark:bg-slate-800 dark:text-white"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              {user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3.5 text-lg font-semibold text-slate-900 dark:border-white/10 dark:text-white"
                  >
                    <UserRound className="h-5 w-5" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-4 py-3.5 text-lg font-bold text-white"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="rounded-2xl border border-slate-200 px-4 py-3.5 text-center text-lg font-semibold text-indigo-500 dark:border-white/10 dark:text-indigo-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 px-4 py-3.5 text-center text-lg font-bold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.nav>
  );
}
