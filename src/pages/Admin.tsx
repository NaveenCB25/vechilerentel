import { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Car,
  DollarSign,
  FileCheck2,
  Home,
  LogOut,
  Plus,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  addPenalty,
  createId,
  getBookings,
  getLicenses,
  getPenalties,
  getVehicles,
  setVehicles,
  updateLicenseStatus,
  updatePenaltyStatus,
  type PenaltyStatus,
  type Vehicle,
} from "../lib/vrms";

type AdminTab = "overview" | "vehicles" | "penalties" | "licenses";

function formatInr(value: number) {
  return value.toLocaleString("en-IN");
}

function badgeClasses(status: string) {
  if (status === "approved" || status === "paid") return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/25";
  if (status === "pending") return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/25";
  if (status === "rejected" || status === "waived") return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/25";
  return "bg-white/10 text-slate-200 ring-1 ring-white/15";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function Admin() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = (tab as AdminTab | undefined) || "overview";
  const [refreshKey, setRefreshKey] = useState(0);
  const { logoutAdmin } = useContext(AuthContext);

  const [vehicleDraft, setVehicleDraft] = useState<Omit<Vehicle, "id"> & { id?: string }>({
    name: "",
    type: "",
    image: "",
    pricePerDay: 0,
    specs: [],
  });
  const [vehicleSpecsText, setVehicleSpecsText] = useState("");
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const [penaltyDraft, setPenaltyDraft] = useState({
    userEmail: "",
    vehicleId: "",
    reason: "",
    amount: 0,
  });

  const vehicles = useMemo(() => getVehicles(), [refreshKey]);
  const bookings = useMemo(() => getBookings(), [refreshKey]);
  const licenses = useMemo(() => getLicenses(), [refreshKey]);
  const penalties = useMemo(() => getPenalties(), [refreshKey]);

  const pendingLicenses = licenses.filter((license) => license.status === "pending").length;
  const pendingPenalties = penalties.filter((penalty) => penalty.status === "pending").length;
  const revenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

  const tabs: Array<{ key: AdminTab; label: string; icon: any }> = [
    { key: "overview", label: "Overview", icon: Home },
    { key: "vehicles", label: "Vehicles", icon: Car },
    { key: "penalties", label: "Penalties", icon: DollarSign },
    { key: "licenses", label: "Licenses", icon: FileCheck2 },
  ];

  const openVehicleModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicleId(vehicle.id);
      setVehicleDraft({ ...vehicle });
      setVehicleSpecsText(vehicle.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n"));
    } else {
      setEditingVehicleId(null);
      setVehicleDraft({ name: "", type: "", image: "", pricePerDay: 0, specs: [] });
      setVehicleSpecsText("");
    }
    setIsVehicleModalOpen(true);
  };

  const saveVehicle = () => {
    const specs = vehicleSpecsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [labelPart, ...rest] = line.split(":");
        const label = (labelPart || "").trim();
        const value = rest.join(":").trim();
        return label && value ? { label, value } : null;
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;

    const nextVehicle: Vehicle = {
      id:
        editingVehicleId ||
        slugify(vehicleDraft.name) ||
        createId("vehicle"),
      name: vehicleDraft.name.trim() || "Untitled",
      type: vehicleDraft.type.trim() || "Vehicle",
      image: vehicleDraft.image.trim() || "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
      pricePerDay: Number(vehicleDraft.pricePerDay || 0),
      specs,
    };

    const list = getVehicles();
    const existingIndex = list.findIndex((vehicle) => vehicle.id === nextVehicle.id);
    if (existingIndex >= 0) {
      list[existingIndex] = nextVehicle;
    } else {
      list.unshift(nextVehicle);
    }

    setVehicles(list);
    setRefreshKey((value) => value + 1);
    setIsVehicleModalOpen(false);
    navigate("/admin/vehicles");
  };

  const deleteVehicle = (id: string) => {
    if (!window.confirm("Delete this vehicle?")) return;
    const list = getVehicles().filter((vehicle) => vehicle.id !== id);
    setVehicles(list);
    setRefreshKey((value) => value + 1);
    navigate("/admin/vehicles");
  };

  const addNewPenalty = () => {
    const normalizedEmail = penaltyDraft.userEmail.trim().toLowerCase();
    if (!normalizedEmail || !penaltyDraft.vehicleId || !penaltyDraft.reason.trim()) return;

    addPenalty({
      id: createId("penalty"),
      userEmail: normalizedEmail,
      vehicleId: penaltyDraft.vehicleId,
      reason: penaltyDraft.reason.trim(),
      amount: Number(penaltyDraft.amount || 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    setPenaltyDraft({ userEmail: "", vehicleId: "", reason: "", amount: 0 });
    setRefreshKey((value) => value + 1);
    navigate("/admin/penalties");
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pb-16 pt-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">Manage vehicles, penalties, and license verification.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15 backdrop-blur transition-transform hover:scale-[1.01]"
            >
              <Shield className="h-4 w-4" />
              Back to site
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                navigate("/login?mode=admin", { replace: true });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-5 py-3 text-sm font-bold text-rose-200 ring-1 ring-rose-500/25 transition-transform hover:scale-[1.01]"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-2 sm:grid-cols-4 sm:gap-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const selected = item.key === activeTab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(`/admin/${item.key}`)}
                className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-3 text-sm font-semibold transition-all ${
                  selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${selected ? "text-blue-600" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              { label: "Vehicles", value: vehicles.length, icon: Car, accent: "text-sky-200", ring: "ring-sky-500/25 bg-sky-500/10" },
              { label: "Bookings", value: bookings.length, icon: Users, accent: "text-blue-200", ring: "ring-blue-500/25 bg-blue-500/10" },
              { label: "Pending Licenses", value: pendingLicenses, icon: FileCheck2, accent: "text-amber-200", ring: "ring-amber-500/25 bg-amber-500/10" },
              { label: "Revenue", value: `₹${formatInr(revenue)}`, icon: DollarSign, accent: "text-emerald-200", ring: "ring-emerald-500/25 bg-emerald-500/10" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-300">{card.label}</p>
                    <div className={`rounded-2xl p-2 ring-1 ${card.ring}`}>
                      <Icon className={`h-4 w-4 ${card.accent}`} />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-black text-white">{card.value}</p>
                  {card.label === "Pending Licenses" && pendingPenalties > 0 && (
                    <p className="mt-2 text-sm text-slate-400">{pendingPenalties} penalties pending</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === "vehicles" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Vehicles</p>
                <h2 className="mt-2 text-2xl font-black">Manage</h2>
              </div>
              <button
                type="button"
                onClick={() => openVehicleModal()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]"
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </button>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Vehicle</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Price/Day</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-white/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                            <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{vehicle.name}</p>
                            <p className="text-xs text-slate-400">{vehicle.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-200">{vehicle.type}</td>
                      <td className="px-5 py-4 text-slate-200">₹{formatInr(vehicle.pricePerDay)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openVehicleModal(vehicle)}
                            className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-200 ring-1 ring-sky-500/25 hover:bg-sky-500/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteVehicle(vehicle.id)}
                            className="inline-flex items-center justify-center rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 ring-1 ring-rose-500/25 hover:bg-rose-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "penalties" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Penalties</p>
                <h2 className="mt-2 text-2xl font-black">Tracking</h2>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-5 py-4 font-semibold">User</th>
                      <th className="px-5 py-4 font-semibold">Vehicle</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {penalties.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                          No penalties yet.
                        </td>
                      </tr>
                    ) : (
                      penalties.map((penalty) => {
                        const vehicle = vehicles.find((v) => v.id === penalty.vehicleId);
                        return (
                          <tr key={penalty.id} className="hover:bg-white/5">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-white">{penalty.userEmail}</p>
                              <p className="text-xs text-slate-400">{new Date(penalty.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-5 py-4 text-slate-200">{vehicle?.name || penalty.vehicleId}</td>
                            <td className="px-5 py-4 text-slate-200">₹{formatInr(penalty.amount)}</td>
                            <td className="px-5 py-4">
                              <select
                                value={penalty.status}
                                onChange={(e) => {
                                  updatePenaltyStatus(penalty.id, e.target.value as PenaltyStatus);
                                  setRefreshKey((value) => value + 1);
                                }}
                                className={`w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold outline-none ${badgeClasses(penalty.status)}`}
                              >
                                <option value="pending">pending</option>
                                <option value="paid">paid</option>
                                <option value="waived">waived</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Add</p>
                <h2 className="mt-2 text-2xl font-black">Penalty</h2>
              </div>

              <div className="grid gap-3">
                <input
                  value={penaltyDraft.userEmail}
                  onChange={(e) => setPenaltyDraft((prev) => ({ ...prev, userEmail: e.target.value }))}
                  placeholder="User email"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                />
                <select
                  value={penaltyDraft.vehicleId}
                  onChange={(e) => setPenaltyDraft((prev) => ({ ...prev, vehicleId: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </option>
                  ))}
                </select>
                <input
                  value={penaltyDraft.reason}
                  onChange={(e) => setPenaltyDraft((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  value={penaltyDraft.amount || ""}
                  onChange={(e) => setPenaltyDraft((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  type="number"
                  min={0}
                  placeholder="Amount"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  onClick={addNewPenalty}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]"
                >
                  <Plus className="h-4 w-4" />
                  Add penalty
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "licenses" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Licenses</p>
              <h2 className="mt-2 text-2xl font-black">Verification</h2>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">License</th>
                    <th className="px-5 py-4 font-semibold">Expiry</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No license submissions yet.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((license) => (
                      <tr key={license.id} className="hover:bg-white/5">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{license.userEmail}</p>
                          <p className="text-xs text-slate-400">{new Date(license.submittedAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-white">{license.fullName}</p>
                          <p className="text-xs text-slate-400">{license.licenseNumber}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-200">{new Date(license.expiry).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClasses(license.status)}`}>
                            {license.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateLicenseStatus(license.id, "approved");
                                setRefreshKey((value) => value + 1);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateLicenseStatus(license.id, "rejected");
                                setRefreshKey((value) => value + 1);
                              }}
                              className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 ring-1 ring-rose-500/25 hover:bg-rose-500/20"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsVehicleModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  {editingVehicleId ? "Edit" : "Add"} Vehicle
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">{editingVehicleId ? "Update details" : "Create new"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="rounded-2xl bg-white/10 p-2 text-slate-200 ring-1 ring-white/15 hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                value={vehicleDraft.name}
                onChange={(e) => setVehicleDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
              <input
                value={vehicleDraft.type}
                onChange={(e) => setVehicleDraft((prev) => ({ ...prev, type: e.target.value }))}
                placeholder="Type (SUV, Electric...)"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
              <input
                value={vehicleDraft.image}
                onChange={(e) => setVehicleDraft((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="Image URL"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
              <input
                value={vehicleDraft.pricePerDay || ""}
                onChange={(e) => setVehicleDraft((prev) => ({ ...prev, pricePerDay: Number(e.target.value) }))}
                type="number"
                min={0}
                placeholder="Price per day"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
              <textarea
                value={vehicleSpecsText}
                onChange={(e) => setVehicleSpecsText(e.target.value)}
                rows={5}
                placeholder={"Specs (one per line)\nSeats: 5\nTransmission: Automatic"}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={saveVehicle}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]"
              >
                <Plus className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
