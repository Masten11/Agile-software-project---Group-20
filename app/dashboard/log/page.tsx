/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Car, Bus, Train, Bike, Plane, Trash2, Home, Shirt, Footprints, Droplets, Utensils } from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import { useTheme } from "@/lib/theme-context";

/* ─── Custom Icons ─── */
const WashingMachineIcon = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <circle cx="12" cy="14" r="4" />
  </svg>
);

/* ─── Types ─── */
type BackendCategory = "transport" | "shower" | "dishwasher" | "energy" | "washing_machine";
type UiTab = "transport" | "household" | "clothing";
type DateOffset = 0 | 1;

type Log = {
  id: string;
  category: BackendCategory | string;
  details: string | Record<string, unknown>;
  co2_kg: number;
  water_l?: number;
  energy_kwh?: number;
  day: string;
  created_at: string;
};

const DATE_OPTIONS: { label: string; offset: DateOffset }[] = [
  { label: "Today", offset: 0 },
  { label: "Yesterday", offset: 1 },
];

const TIPS: Record<UiTab, string> = {
  transport: "Taking the train instead of driving saves ~5× more CO₂ per trip.",
  household: "Shorter showers can save 30–60 liters of water every time.",
  clothing: "Washing clothes at 30°C instead of 60°C uses up to 50% less energy.",
};

/* ─── Submit button ─── */
function SubmitBtn({ disabled, loading }: { disabled: boolean; loading?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      whileHover={disabled ? {} : { scale: 1.015 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className="w-full rounded-2xl font-semibold py-3.5 text-sm transition-all duration-200"
      style={{
        background: disabled || loading ? "var(--bg-card-deep)" : "var(--accent-green)",
        border: disabled || loading ? "1px solid var(--border-subtle)" : "1px solid transparent",
        color: disabled || loading ? "var(--text-faint)" : (isDark ? "#000000" : "#ffffff"),
        fontFamily: "var(--font-body)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Logging..." : "Log habit"}
    </motion.button>
  );
}

/* ─── Category icon ─── */
function CategoryIcon({ category, details }: { category: string; details?: string | Record<string, unknown> }) {
  const iconColor = "var(--accent-green)";

  if (category === "transport") {
    let mode = "car";
    if (typeof details === "object" && details !== null) {
      mode = (details as { transportMode?: string }).transportMode?.toLowerCase() || "car";
    } else if (typeof details === "string") {
      const l = details.toLowerCase();
      if (l.includes("electric bus")) mode = "bus";
      else if (l.includes("bus")) mode = "bus";
      else if (l.includes("train")) mode = "train";
      else if (l.includes("bike")) mode = "bike";
      else if (l.includes("walking")) mode = "walking";
      else if (l.includes("plane")) mode = "plane";
      else if (l.includes("electric car")) mode = "car";
      else if (l.includes("car")) mode = "car";
    }
    
    switch (mode) {
      case "bus": return <Bus size={14} style={{ color: iconColor }} />;
      case "train": return <Train size={14} style={{ color: iconColor }} />;
      case "bike": return <Bike size={14} style={{ color: iconColor }} />;
      case "walking": return <Footprints size={14} style={{ color: iconColor }} />;
      case "plane": return <Plane size={14} style={{ color: iconColor }} />;
      case "car":
      default: return <Car size={14} style={{ color: iconColor }} />;
    }
  }

  if (category === "shower") return <Droplets size={14} style={{ color: iconColor }} />;
  if (category === "dishwasher") return <Utensils size={14} style={{ color: iconColor }} />;
  if (category === "washing_machine") return <WashingMachineIcon size={14} style={{ color: iconColor }} />;
  if (category === "clothing") return <Shirt size={14} style={{ color: iconColor }} />;
  if (category === "household") return <Home size={14} style={{ color: iconColor }} />;

  return <span className="text-xs" style={{ color: iconColor }}>E</span>;
}

/* ─── Transport form ─── */
function TransportForm({ dayOffset, onSuccess }: { dayOffset: DateOffset; onSuccess: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("");
  const [modeOpen, setModeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modes = [
    { label: "Walking", icon: Footprints },
    { label: "Bike", icon: Bike },
    { label: "Car", icon: Car },
    { label: "Electric car", icon: Car },
    { label: "Bus", icon: Bus },
    { label: "Electric bus", icon: Bus },
    { label: "Train", icon: Train },
    { label: "Plane", icon: Plane },
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!from || !to || !mode) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/log-habit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "transport",
          dayOffset,
          body: { start: from, destination: to, transportMode: mode.toLowerCase() },
        }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Something went wrong"); return; }
      setFrom(""); setTo(""); setMode("");
      onSuccess();
    } catch { setError("Failed to log habit. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PlaceAutocompleteInput label="From" value={from} placeholder="Search start location, e.g. Borås"
        onChange={(v) => { setFrom(v); setError(null); }}
        onPlaceSelected={(p) => { setFrom(p.address); setError(null); }} />
      <PlaceAutocompleteInput label="To" value={to} placeholder="Search destination"
        onChange={(v) => { setTo(v); setError(null); }}
        onPlaceSelected={(p) => { setTo(p.address); setError(null); }} />
      <div>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Mode of transport
        </p>
        <div className="relative">
          <button type="button" onClick={() => setModeOpen(!modeOpen)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: mode ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            {mode || "Select transport"}
            <span className={`transition-transform duration-200 ${modeOpen ? "rotate-180" : ""}`}>↓</span>
          </button>
          <AnimatePresence>
            {modeOpen && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 shadow-xl custom-scroll"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", maxHeight: "250px", overflowY: "auto" }}>
                {modes.map((m) => (
                  <button key={m.label} type="button" onClick={() => { setMode(m.label); setModeOpen(false); setError(null); }}
                    className="w-full px-5 py-3 text-left text-sm transition-all duration-150 cursor-pointer"
                    style={{ color: mode === m.label ? "var(--accent-green)" : "var(--text-secondary)", background: mode === m.label ? "var(--accent-green-subtle)" : "transparent", fontFamily: "var(--font-body)" }}>
                    <div className="flex items-center gap-2"><m.icon size={15} /><span>{m.label}</span></div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>{error}</motion.p>
        )}
      </AnimatePresence>
      <SubmitBtn disabled={!from || !to || !mode} loading={submitting} />
    </form>
  );
}

/* ─── Household form ─── */
function HouseholdForm({ dayOffset, onSuccess }: { dayOffset: DateOffset; onSuccess: () => void }) {
  const [type, setType] = useState<"shower" | "dishwasher" | "">("");
  const [minutes, setMinutes] = useState("");
  const [usesEcoMode, setUsesEcoMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!type) return;
    if (type === "shower" && (!minutes || Number(minutes) <= 0)) {
      setError("Please enter a valid shower length.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payloadBody = type === "shower" ? { minutes: Number(minutes) } : { ecoMode: usesEcoMode };
      const response = await fetch("/api/log-habit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: type, dayOffset, body: payloadBody }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Something went wrong"); return; }
      setType(""); setMinutes(""); setUsesEcoMode(false);
      onSuccess();
    } catch { setError("Failed to log household usage. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Household activity
        </p>
        {/* 3-column grid with washing machine as coming soon */}
        <div className="grid grid-cols-3 gap-3">
          {/* Shower */}
          <button type="button" onClick={() => { setType("shower"); setError(null); }}
            className="px-3 py-4 rounded-2xl text-sm transition-all flex flex-col items-center gap-2"
            style={{
              background: type === "shower" ? "var(--accent-green-dim)" : "var(--bg-card)",
              border: type === "shower" ? "1px solid var(--accent-green-border)" : "1px solid var(--border-subtle)",
              color: type === "shower" ? "var(--accent-green)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}>
            <Droplets size={20} />
            <span className="text-xs">Shower</span>
          </button>

          {/* Dishwasher */}
          <button type="button" onClick={() => { setType("dishwasher"); setError(null); }}
            className="px-3 py-4 rounded-2xl text-sm transition-all flex flex-col items-center gap-2"
            style={{
              background: type === "dishwasher" ? "var(--accent-green-dim)" : "var(--bg-card)",
              border: type === "dishwasher" ? "1px solid var(--accent-green-border)" : "1px solid var(--border-subtle)",
              color: type === "dishwasher" ? "var(--accent-green)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}>
            <Utensils size={20} />
            <span className="text-xs">Dishwasher</span>
          </button>

          {/* Washing Machine – coming soon */}
          <div className="px-3 py-4 rounded-2xl text-sm flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
            style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-faint)", color: "var(--text-faint)", fontFamily: "var(--font-body)" }}>
            <WashingMachineIcon size={20} />
            <span className="text-xs text-center leading-tight">Washer<br />(soon)</span>
          </div>
        </div>
      </div>

      {/* Shower length input */}
      {type === "shower" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="text-xs tracking-widest uppercase mb-3 block" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Shower length
          </label>
          <input type="number" min="1" value={minutes}
            onChange={(e) => { setMinutes(e.target.value); setError(null); }}
            placeholder="Minutes, e.g. 8"
            className="w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-active)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")} />
        </motion.div>
      )}

      {/* Dishwasher eco toggle */}
      {type === "dishwasher" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer"
          onClick={() => setUsesEcoMode((p) => !p)}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>Eco mode</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Uses less water and energy</p>
          </div>
          <button type="button" className="w-12 h-7 rounded-full transition-all relative shrink-0"
            style={{ background: usesEcoMode ? "var(--accent-green)" : "var(--border-strong)" }}>
            <span className="absolute top-1 w-5 h-5 rounded-full transition-all shadow-sm"
              style={{ background: "#ffffff", left: usesEcoMode ? "22px" : "4px" }} />
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>{error}</motion.p>
        )}
      </AnimatePresence>

      <SubmitBtn disabled={!type || (type === "shower" && !minutes)} loading={submitting} />
    </form>
  );
}

/* ─── Coming soon ─── */
function ComingSoon({ category }: { category: string }) {
  const Icon = category === "clothing" ? Shirt : Home;
  const label = category === "clothing" ? "Clothing" : "Energy";
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <Icon size={24} style={{ color: "var(--text-secondary)" }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
        {label} logging coming soon
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        We&apos;re working on it — check back next sprint
      </p>
    </div>
  );
}

/* ─── Main page ─── */
export default function LogPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeCategory, setActiveCategory] = useState<UiTab>("transport");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState<DateOffset>(0);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Read URL param on mount – support both old ("water") and new ("household") names
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "transport") { setTimeout(() => setActiveCategory("transport"), 0); }
      else if (tabParam === "water" || tabParam === "household") { setTimeout(() => setActiveCategory("household"), 0); }
      else if (tabParam === "energy" || tabParam === "clothing") { setTimeout(() => setActiveCategory("clothing"), 0); }
    }
  }, []);

  const tabs: { id: UiTab; label: string; available: boolean }[] = [
    { id: "transport", label: "Transport", available: true },
    { id: "household", label: "Household", available: true },
    { id: "clothing", label: "Clothing", available: false },
  ];

  const loggedUiTabs = [...new Set(logs.map((l) => {
    if (l.category === "shower" || l.category === "dishwasher" || l.category === "washing_machine") return "household";
    if (l.category === "transport") return "transport";
    return l.category;
  }))];

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/logged-habits?dayOffset=${dateOffset}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("Failed to load logs:", (body as { error?: string }).error ?? res.statusText);
          setLogs([]);
          return;
        }
        const grouped = (await res.json()) as Record<string, any[]>;
        const rows = Object.values(grouped).flat();
        const mapped: Log[] = rows.map((row: any) => ({
          id: row.id,
          category: row.category,
          details: row.details,
          co2_kg: row.co2_kg,
          water_l: row.water_l,
          energy_kwh: row.energy_kwh,
          day: row.day,
          created_at: row.created_at,
        }));
        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLogs(mapped);
      } catch (err) { console.error("Failed to load logs:", err); }
      finally { setLoading(false); }
    };
    loadLogs();
  }, [dateOffset, refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch("/api/unlog-habit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete");
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
    } catch (err) { console.error("Delete failed:", err); }
    finally { setDeleting(null); }
  };

  // Scrollbar CSS injected once. Döljer även webbläsarens pilar för <input type="number">
  const scrollbarStyle = isDark
    ? `
      .custom-scroll::-webkit-scrollbar { width: 5px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }
      
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `
    : `
      .custom-scroll::-webkit-scrollbar { width: 5px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
      
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <style>{scrollbarStyle}</style>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-start justify-between mb-8">
            <div>
              <h1 className="leading-none mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                LOG HABITS
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Track your daily environmental impact
              </p>
            </div>
            <div className="relative">
              <button onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {DATE_OPTIONS[dateOffset].label}
                <span className={`transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`}>↓</span>
              </button>
              <AnimatePresence>
                {dateDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", minWidth: "140px" }}>
                    {DATE_OPTIONS.map((opt) => (
                      <button key={opt.label} onClick={() => { setLoading(true); setDateOffset(opt.offset); setDateDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-sm text-left transition-colors duration-150"
                        style={{ color: dateOffset === opt.offset ? "var(--accent-green)" : "var(--text-secondary)", background: dateOffset === opt.offset ? "var(--accent-green-subtle)" : "transparent", fontFamily: "var(--font-body)" }}>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Progress banner */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-8"
            style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex gap-4 flex-1">
              {tabs.map((tab) => {
                const done = loggedUiTabs.includes(tab.id);
                return (
                  <div key={tab.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full transition-colors duration-300"
                      style={{ background: done ? "var(--accent-green)" : tab.available ? "var(--border-strong)" : "transparent", border: !done && !tab.available ? "1px solid var(--border-faint)" : "none" }} />
                    <span className="text-xs whitespace-nowrap" style={{ color: done ? "var(--accent-green)" : tab.available ? "var(--text-secondary)" : "var(--text-faint)", fontFamily: "var(--font-body)" }}>
                      {tab.label}{!tab.available && " (soon)"}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              {loggedUiTabs.length} / 3 logged
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* LEFT: Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="lg:col-span-3">
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

                {/* Category tabs */}
                <div className="flex gap-2 mb-8 p-1 rounded-xl" style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-faint)" }}>
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => { if (tab.available) setActiveCategory(tab.id); }}
                      className="flex-1 py-2 px-1 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap"
                      style={{
                        background: activeCategory === tab.id ? "var(--accent-green-dim)" : "transparent",
                        border: activeCategory === tab.id ? "1px solid var(--accent-green-border)" : "1px solid transparent",
                        color: activeCategory === tab.id ? "var(--accent-green)" : tab.available ? "var(--text-muted)" : "var(--text-faint)",
                        fontFamily: "var(--font-body)",
                        cursor: tab.available ? "pointer" : "default",
                      }}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={activeCategory} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    {activeCategory === "transport" && <TransportForm dayOffset={dateOffset} onSuccess={() => setRefreshTrigger((p) => p + 1)} />}
                    {activeCategory === "household" && <HouseholdForm dayOffset={dateOffset} onSuccess={() => setRefreshTrigger((p) => p + 1)} />}
                    {activeCategory === "clothing" && <ComingSoon category="clothing" />}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-faint)" }}>
                  <span className="text-base shrink-0">💡</span>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    {TIPS[activeCategory]}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Logs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--border-subtle)", maxHeight: "600px" }}>

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between shrink-0"
                  style={{ background: "var(--bg-card-nested)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                    {DATE_OPTIONS[dateOffset].label}&apos;s logs
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: "var(--text-muted)", background: "var(--bg-card-deep)", fontFamily: "var(--font-body)" }}>
                    {logs.length}
                  </span>
                </div>

                {/* Scrollable list */}
                <div className="custom-scroll overflow-y-auto flex-1" style={{ background: "var(--bg-card)" }}>
                  {loading ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading...</p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}>
                        <span className="text-lg" style={{ color: "var(--text-muted)" }}>+</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>No habits logged</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Use the form to add your first log</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {logs.map((log) => {
                        // Build details string
                        let detailsStr = "Unknown activity";
                        let modeInfo = ""; // Används för att injicera mode om relevant

                        const formatLoc = (loc: string) => {
                          if (!loc) return "";
                          
                          // Om det bara är ett ord (ex "Sweden"), returnera det.
                          const parts = loc.split(",");
                          if (parts.length === 1) return loc.trim();
                          
                          // Annars, ta näst sista delen (oftast staden) och plocka bort eventuella siffror
                          const cityPart = parts[parts.length - 2].trim();
                          return cityPart.replace(/\d+/g, "").trim() || loc.trim(); // Fallback ifall regexen rensar för mycket
                        };

                        if (log.category === "transport") {
                          let startLoc = "";
                          let destLoc = "";

                          // 1. Extrahera Mode
                          if (typeof log.details === "object" && log.details !== null) {
                            modeInfo = (log.details as { transportMode?: string }).transportMode || "";
                            startLoc = (log.details as { start?: string }).start ?? "";
                            destLoc = (log.details as { destination?: string }).destination ?? "";
                          } else if (typeof log.details === "string") {
                             // Fallback parsning för gamla formatet om det skulle behövas
                             const lowerStr = log.details.toLowerCase();
                             if (lowerStr.includes("electric bus")) modeInfo = "electric bus";
                             else if (lowerStr.includes("bus")) modeInfo = "bus";
                             else if (lowerStr.includes("train")) modeInfo = "train";
                             else if (lowerStr.includes("bike")) modeInfo = "bike";
                             else if (lowerStr.includes("walking")) modeInfo = "walking";
                             else if (lowerStr.includes("plane")) modeInfo = "plane";
                             else if (lowerStr.includes("electric car")) modeInfo = "electric car";
                             else if (lowerStr.includes("car")) modeInfo = "car";

                             const rawStr = log.details.includes(" · ") ? log.details.split(" · ")[1] : log.details;
                             if (rawStr.includes(" → ")) {
                               const [s, d] = rawStr.split(" → ");
                               startLoc = s;
                               destLoc = d;
                             }
                          }

                          // 2. Bygg ihop detaljsträngen med formaterad location
                          const route = `${formatLoc(startLoc)} → ${formatLoc(destLoc)}`;
                          
                          // Om vi har ett mode, inkludera det i strängen snyggt.
                          if (modeInfo) {
                             // Gör första bokstaven stor i mode (e.g., "Electric car")
                             const formattedMode = modeInfo.charAt(0).toUpperCase() + modeInfo.slice(1);
                             detailsStr = `${formattedMode} · ${route}`;
                          } else {
                             detailsStr = route; // Fallback om mode saknas
                          }

                        }
                        if (log.category === "shower") {
                          const mins = typeof log.details === "object" ? (log.details as any).minutes : null;
                          detailsStr = `Shower · ${mins ?? 0} min`;
                        }
                        if (log.category === "dishwasher") {
                          const eco = typeof log.details === "object" ? (log.details as any).ecoMode : false;
                          detailsStr = eco ? "Dishwasher · Eco mode" : "Dishwasher";
                        }
                        if (log.category === "energy") detailsStr = "Energy activity";

                        // Display category label
                        const catLabel = (log.category === "shower" || log.category === "dishwasher" || log.category === "washing_machine")
                          ? "household"
                          : log.category;

                        // Metrics
                        const co2 = log.co2_kg ?? 0;
                        const water = log.water_l ?? 0;
                        const energy = log.energy_kwh ?? 0;

                        return (
                          <motion.div key={log.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }}
                            className="px-4 py-4 border-b last:border-b-0"
                            style={{ background: "var(--bg-card-deep)", borderColor: "var(--border-faint)" }}>

                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: "var(--bg-card-nested)" }}>
                                <CategoryIcon category={log.category} details={log.details} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Category + detail */}
                                <p className="text-xs capitalize mb-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                                  {catLabel}
                                </p>
                                <p className="text-sm truncate mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                                  {detailsStr}
                                </p>

                                {/* All three metrics */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  {/* CO₂ */}
                                  <span className="text-xs" style={{ color: co2 > 0 ? "#fb923c" : "var(--text-faint)", fontFamily: "var(--font-body)" }}>
                                    {co2 > 0 ? `${co2.toFixed(1)} kg` : "—"}
                                  </span>
                                  <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>·</span>
                                  {/* Water */}
                                  <span className="text-xs" style={{ color: water > 0 ? "#22d3ee" : "var(--text-faint)", fontFamily: "var(--font-body)" }}>
                                    {water > 0 ? `${Number(water).toFixed(0)} L` : "—"}
                                  </span>
                                  <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>·</span>
                                  {/* Energy */}
                                  <span className="text-xs" style={{ color: energy > 0 ? "#c084fc" : "var(--text-faint)", fontFamily: "var(--font-body)" }}>
                                    {energy > 0 ? `${Number(energy).toFixed(2)} kWh` : "—"}
                                  </span>
                                </div>
                              </div>

                              {/* Delete */}
                              <div className="shrink-0 flex items-center self-start mt-0.5">
                                {deleteConfirm === log.id ? (
                                  <div className="flex gap-1">
                                    <button onClick={() => handleDelete(log.id)} disabled={deleting === log.id}
                                      className="text-xs px-2 py-1 rounded-lg text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                                      style={{ fontFamily: "var(--font-body)" }}>
                                      {deleting === log.id ? "..." : "Delete"}
                                    </button>
                                    <button onClick={() => setDeleteConfirm(null)}
                                      className="text-xs px-2 py-1 rounded-lg transition-colors"
                                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(log.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors group/del hover:bg-red-500/10">
                                    <Trash2 size={13} className="transition-colors group-hover/del:text-red-500" style={{ color: "var(--text-muted)" }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}