import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "motion/react";

import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { RequireAdmin, RequireUser } from "./components/RouteGuards";
import { pageReveal, pageSlide } from "./lib/animations";

const Landing = lazy(() => import("./pages/Landing"));
const Explore = lazy(() => import("./pages/Explore"));
const VehicleDetails = lazy(() => import("./pages/VehicleDetails"));
const Booking = lazy(() => import("./pages/Booking"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Admin = lazy(() => import("./pages/Admin"));

function PageLoader({ fullHeight = false }: { fullHeight?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullHeight ? "h-full min-h-[40vh]" : "min-h-[50vh]"}`}>
      <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/70 bg-white/80 px-8 py-6 shadow-xl shadow-slate-200/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              animate={{ y: [0, -10, 0], opacity: [0.45, 1, 0.45], scale: [1, 1.08, 1] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: dot * 0.12,
              }}
              className="h-3 w-3 rounded-full bg-blue-600/80"
            />
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Loading</p>
      </div>
    </div>
  );
}

function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="relative flex-grow overflow-hidden pt-[80px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${location.pathname}${location.search}`} {...pageReveal} className="min-h-full">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${location.pathname}${location.search}`} {...pageSlide} className="min-h-screen">
          <Suspense fallback={<PageLoader fullHeight />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} aria-label="Notifications" />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/vehicle/:id" element={<VehicleDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />

            <Route element={<RequireUser />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:tab" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/booking/:id" element={<Booking />} />
            </Route>
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path=":tab" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

