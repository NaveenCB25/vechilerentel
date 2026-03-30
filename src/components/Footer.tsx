import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { CarFront } from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import { APP_INFO } from "../data";

export default function Footer() {
  const { user } = useContext(AuthContext);

  const platformLinks = useMemo(
    () => [
      { label: "Home", to: "/" },
      { label: "Explore", to: "/explore" },
      { label: user ? "Dashboard" : "Login", to: user ? "/dashboard" : "/login" },
      { label: user ? "Profile" : "Sign Up", to: user ? "/profile" : "/register" },
    ],
    [user],
  );

  return (
    <footer className="mt-24 border-t border-slate-200/80 bg-white/88 pb-10 pt-12 backdrop-blur dark:border-white/10 dark:bg-slate-950/88">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] sm:px-6 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 text-white shadow-[0_14px_30px_rgba(99,102,241,0.22)]">
              <CarFront className="h-7 w-7" />
            </div>
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400 bg-clip-text text-4xl font-black tracking-[-0.05em] text-transparent">
              {APP_INFO.name}
            </span>
          </Link>
          <p className="mt-5 max-w-md text-base leading-8 text-slate-500 dark:text-slate-300">
            Premium rentals, clean booking flows, and a customer experience designed to feel effortless from start to finish.
          </p>
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">Company</h3>
          <div className="mt-5 flex flex-col gap-3 text-base text-slate-500 dark:text-slate-300">
            {platformLinks.map((link) => (
              <Link key={link.label} to={link.to} className="transition-colors hover:text-indigo-500">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">Services</h3>
          <div className="mt-5 flex flex-col gap-3 text-base text-slate-500 dark:text-slate-300">
            <span>Luxury Car Rental</span>
            <span>Airport Pickup</span>
            <span>Corporate Booking</span>
            <span>Driver Verification</span>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">Legal</h3>
          <div className="mt-5 flex flex-col gap-3 text-base text-slate-500 dark:text-slate-300">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>{APP_INFO.email}</span>
            <span>{APP_INFO.phone}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
