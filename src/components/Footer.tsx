import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";
import { hoverLift, hoverNudge, revealSoft, revealUp, sectionStagger, viewportOnce } from "../lib/animations";
import { APP_INFO } from "../data";

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Explore", path: "/explore" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Profile", path: "/profile" },
  { name: "Admin", path: "/admin" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-slate-950 pb-10 pt-16 text-slate-300">
      <div className="motion-float absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="motion-float-delayed absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={sectionStagger}
          className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={revealUp} className="space-y-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter text-white">
                VRMS <span className="text-blue-400">Pro</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              A modern, card-based UI for vehicle rental management with role-based access and smooth motion.
            </p>
          </motion.div>

          <motion.div variants={revealSoft}>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="space-y-3 text-sm font-medium">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <motion.div whileHover={hoverNudge}>
                    <Link to={link.path} className="inline-flex text-slate-400 transition-colors hover:text-blue-400">
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={revealSoft}>
            <h3 className="mb-5 text-lg font-bold uppercase tracking-wider text-white">Support</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-400" />
                {APP_INFO.email}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-400" />
                {APP_INFO.phone}
              </li>
            </ul>
          </motion.div>

          <motion.div variants={revealUp} className="space-y-5">
            <h3 className="text-lg font-bold uppercase tracking-wider text-white">Updates</h3>
            <p className="text-sm text-slate-400">Get product updates and feature releases.</p>
            <form className="flex overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:bg-slate-900"
              />
              <motion.button
                type="submit"
                whileHover={hoverLift}
                whileTap={{ scale: 0.96 }}
                className="bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                Join
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={revealSoft}
          className="flex flex-col items-center justify-between gap-4 border-t border-slate-900/80 pt-8 text-center md:flex-row md:text-left"
        >
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} VRMS Pro. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="transition-colors hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
