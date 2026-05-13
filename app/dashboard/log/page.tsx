/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Car, Bus, Train, Bike, Plane, Trash2 } from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import { useTheme } from "@/lib/theme-context";

/* ─── Types ─── */
// Backend förväntar sig dessa kategorier:
type BackendCategory = "transport" | "shower" | "dishwasher" | "energy";

// UI:t visar dessa flikar:
type UiTab = "transport" | "water" | "energy";
type DateOffset = 0 | 1;

type Log = {
  id: string;
  category: BackendCategory | string; // Tillåter string för bakåtkompatibilitet
  details: string | Record<string, unknown>;
  co2_kg: number;
  water_l?: number;
  energy_kwh?: number;
  day: string;
  created_at: string;
};

/* ─── Date options ─── */
const DATE_OPTIONS: { label: string; offset: DateOffset }[] = [
  { label: "Today", offset: 0 },
  { label: "Yesterday", offset: 1 },
];

const TIPS: Record<UiTab, string> = {
  transport: "Taking the train instead of driving saves ~5× more CO₂ per trip.",
  water: "Shorter showers can save 30–60 liters of water every time.",
  energy: "Running appliances on eco mode can reduce energy and water usage.",
};

/* ─── Submit button ─── */
function SubmitBtn({
  disabled,
  loading,
}: {
  disabled: boolean;
  loading?: boolean;
}) {
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
function CategoryIcon({
  category,
  details,
}: {
  category: string;
  details?: string | Record<string, unknown>;
}) {
  if (category === "transport") {
    let mode = "car";

    if (typeof details === "object" && details !== null) {
      mode = (details as { transportMode?: string }).transportMode?.toLowerCase() || "car";
    } else if (typeof details === "string") {
      const lowerDetails = details.toLowerCase();
      if (lowerDetails.includes("bus")) mode = "bus";
      else if (lowerDetails.includes("train")) mode = "train";
      else if (lowerDetails.includes("bike")) mode = "bike";
      else if (lowerDetails.includes("plane")) mode = "plane";
    }

    switch (mode) {
      case "bus": return <Bus size={14} className="text-cyan-400" />;
      case "train": return <Train size={14} className="text-cyan-400" />;
      case "bike": return <Bike size={14} className="text-cyan-400" />;
      case "plane": return <Plane size={14} className="text-cyan-400" />;
      case "car":
      default:
        return <Car size={14} className="text-cyan-400" />;
    }
  }

  if (category === "shower" || category === "dishwasher" || category === "water") {
    return <span className="text-sm">💧</span>;
  }

  return <span className="text-xs" style={{ color: "var(--text-muted)" }}>E</span>;
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
    { label: "Car", icon: Car },
    { label: "Bus", icon: Bus },
    { label: "Train", icon: Train },
    { label: "Bike", icon: Bike },
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
          body: {
            start: from,
            destination: to,
            transportMode: mode.toLowerCase(),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      setFrom("");
      setTo("");
      setMode("");
      onSuccess();
    } catch {
        setError("Failed to log habit. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PlaceAutocompleteInput
        label="From"
        value={from}
        placeholder="Search start location, e.g. Borås"
        onChange={(value) => { setFrom(value); setError(null); }}
        onPlaceSelected={(place) => { setFrom(place.address); setError(null); }}
      />

      <PlaceAutocompleteInput
        label="To"
        value={to}
        placeholder="Search destination"
        onChange={(value) => { setTo(value); setError(null); }}
        onPlaceSelected={(place) => { setTo(place.address); setError(null); }}
      />

      <div>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Mode of transport
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() => setModeOpen(!modeOpen)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: mode ? "var(--text-primary)" : "var(--text-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            {mode || "Select transport"}
            <span className={`transition-transform duration-200 ${modeOpen ? "rotate-180" : ""}`}>↓</span>
          </button>

          <AnimatePresence>
            {modeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 shadow-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                {modes.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => { setMode(m.label); setModeOpen(false); setError(null); }}
                    className="w-full px-5 py-3 text-left text-sm transition-all duration-150 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      color: mode === m.label ? "var(--accent-green)" : "var(--text-secondary)",
                      background: mode === m.label ? "var(--accent-green-subtle)" : "transparent",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <m.icon size={15} />
                      <span>{m.label}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <SubmitBtn disabled={!from || !to || !mode} loading={submitting} />
    </form>
  );
}

/* ─── Water form ─── */
function WaterForm({ dayOffset, onSuccess }: { dayOffset: DateOffset; onSuccess: () => void }) {
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
      const payloadBody = type === "shower" 
        ? { minutes: Number(minutes) }
        : { ecoMode: usesEcoMode };

      const response = await fetch("/api/log-habit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: type,
          dayOffset,
          body: payloadBody,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      setType("");
      setMinutes("");
      setUsesEcoMode(false);
      onSuccess();
    } catch {
      setError("Failed to log water usage. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Water activity
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setType("shower"); setError(null); }}
            className="px-4 py-4 rounded-2xl text-sm transition-all"
            style={{
              background: type === "shower" ? "var(--accent-green-dim)" : "var(--bg-card)",
              border: type === "shower" ? "1px solid var(--accent-green-border)" : "1px solid var(--border-subtle)",
              color: type === "shower" ? "var(--accent-green)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            🚿 Shower
          </button>

          <button
            type="button"
            onClick={() => { setType("dishwasher"); setError(null); }}
            className="px-4 py-4 rounded-2xl text-sm transition-all"
            style={{
              background: type === "dishwasher" ? "var(--accent-green-dim)" : "var(--bg-card)",
              border: type === "dishwasher" ? "1px solid var(--accent-green-border)" : "1px solid var(--border-subtle)",
              color: type === "dishwasher" ? "var(--accent-green)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            🍽️ Dishwasher
          </button>
        </div>
      </div>

      {type === "shower" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <label className="text-xs tracking-widest uppercase mb-3 block" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Shower length
          </label>

          <input
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => { setMinutes(e.target.value); setError(null); }}
            placeholder="Minutes, e.g. 8"
            className="w-full px-5 py-4 rounded-2xl text-sm outline-none transition-all focus:border-var(--border-active)"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--border-active)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </motion.div>
      )}

      {type === "dishwasher" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer"
          onClick={() => setUsesEcoMode((prev) => !prev)}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>Eco mode</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Uses less water and energy</p>
          </div>

          <button
            type="button"
            className="w-12 h-7 rounded-full transition-all relative shrink-0"
            style={{ background: usesEcoMode ? "var(--accent-green)" : "var(--border-strong)" }}
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full transition-all shadow-sm"
              style={{ background: "#ffffff", left: usesEcoMode ? "22px" : "4px" }}
            />
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <SubmitBtn disabled={!type || (type === "shower" && !minutes)} loading={submitting} />
    </form>
  );
}

/* ─── Coming soon ─── */
function ComingSoon({ category }: { category: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <span className="text-xl">{category === "food" ? "🥗" : "⚡"}</span>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
        {category === "food" ? "Food" : "Energy"} logging coming soon
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        We&apos;re working on it — check back next sprint
      </p>
    </div>
  );
}

/* ─── Main page ─── */
export default function LogPage() {
  const [activeCategory, setActiveCategory] = useState<UiTab>("transport");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState<DateOffset>(0);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- LÄS IN URL PARAMETER PÅ MOUNT ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "transport" || tabParam === "water" || tabParam === "energy") {
        setTimeout(() => {
          setActiveCategory(tabParam as UiTab);
        }, 0);
      }
    }
  }, []);

  // Förenklad UI-tab struktur
  const tabs: { id: UiTab; label: string; available: boolean }[] = [
    { id: "transport", label: "Transport", available: true },
    { id: "water", label: "Water", available: true },
    { id: "energy", label: "Energy", available: true },
  ];

  // Mappa loggarnas backend-kategori till UI-kategori för indikatorerna
  const loggedUiTabs = [...new Set(logs.map((l) => {
    if (l.category === "shower" || l.category === "dishwasher") return "water";
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
        mapped.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setLogs(mapped);
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [dateOffset, refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch("/api/unlog-habit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete");
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-10">
          
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start justify-between mb-8">
            <div>
              <h1 className="leading-none mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                LOG HABITS
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Track your daily environmental impact
              </p>
            </div>
            <div className="relative">
              <button onClick={() => setDateDropdownOpen(!dateDropdownOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {DATE_OPTIONS[dateOffset].label}
                <span className={`transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`}>↓</span>
              </button>
              <AnimatePresence>
                {dateDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 shadow-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", minWidth: "140px" }}>
                    {DATE_OPTIONS.map((opt) => (
                      <button key={opt.label} onClick={() => { setLoading(true); setDateOffset(opt.offset); setDateDropdownOpen(false); }} className="w-full px-4 py-2.5 text-sm text-left transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5" style={{ color: dateOffset === opt.offset ? "var(--accent-green)" : "var(--text-secondary)", background: dateOffset === opt.offset ? "var(--accent-green-subtle)" : "transparent", fontFamily: "var(--font-body)" }}>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-8" style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex gap-4 flex-1">
              {tabs.map((tab) => {
                const done = loggedUiTabs.includes(tab.id);
                return (
                  <div key={tab.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full transition-colors duration-300" style={{ background: done ? "var(--accent-green)" : tab.available ? "var(--border-strong)" : "transparent", border: !done && !tab.available ? "1px solid var(--border-faint)" : "none" }} />
                    <span className="text-xs whitespace-nowrap" style={{ color: done ? "var(--accent-green)" : tab.available ? "var(--text-secondary)" : "var(--text-faint)", fontFamily: "var(--font-body)" }}>
                      {tab.label} {!tab.available && " (soon)"}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="lg:col-span-3">
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex gap-2 mb-8 p-1 rounded-xl" style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-faint)" }}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { if (tab.available) setActiveCategory(tab.id); }}
                      className="flex-1 py-2 px-1 sm:px-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap"
                      style={{
                        background: activeCategory === tab.id ? "var(--accent-green-dim)" : "transparent",
                        border: activeCategory === tab.id ? "1px solid var(--accent-green-border)" : "1px solid transparent",
                        color: activeCategory === tab.id ? "var(--accent-green)" : tab.available ? "var(--text-muted)" : "var(--text-faint)",
                        fontFamily: "var(--font-body)",
                        cursor: tab.available ? "pointer" : "default",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={activeCategory} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                    {activeCategory === "transport" && <TransportForm dayOffset={dateOffset} onSuccess={() => setRefreshTrigger((p) => p + 1)} />}
                    {activeCategory === "water" && <WaterForm dayOffset={dateOffset} onSuccess={() => setRefreshTrigger((p) => p + 1)} />}
                    {activeCategory === "energy" && <ComingSoon category="energy" />}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-faint)" }}>
                  <span className="text-base shrink-0">💡</span>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                    {TIPS[activeCategory]}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden flex flex-col max-h-150" style={{ border: "1px solid var(--border-subtle)" }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: "var(--bg-card-nested)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                    {DATE_OPTIONS[dateOffset].label}&apos;s logs
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--text-muted)", background: "var(--bg-card-deep)", fontFamily: "var(--font-body)" }}>
                    {logs.length}
                  </span>
                </div>

                <div className="overflow-y-auto" style={{ background: "var(--bg-card)" }}>
                  {loading ? (
                    <div className="px-5 py-8 text-center"><p className="text-sm animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading...</p></div>
                  ) : logs.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}>
                        <span className="text-lg" style={{ color: "var(--text-muted)" }}>+</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>No habits logged</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Use the form to add your first log</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                      <AnimatePresence initial={false}>
                        {logs.map((log) => {
                          let detailsStr = "Unknown activity";

                          const formatLoc = (loc: string) => {
                            if (!loc) return "";
                            const parts = loc.split(",");
                            return parts.length > 1 ? parts.slice(0, -1).join(",").trim() : loc.trim();
                          };

                          if (log.category === "transport") {
                            if (typeof log.details === "object" && log.details !== null) {
                              const start = (log.details as { start?: string }).start ?? "";
                              const dest = (log.details as { destination?: string }).destination ?? "";
                              detailsStr = `${formatLoc(start)} → ${formatLoc(dest)}`;
                            } else if (typeof log.details === "string") {
                              const rawStr = log.details.includes(" · ") ? log.details.split(" · ")[1] : log.details;
                              if (rawStr.includes(" → ")) {
                                const [s, d] = rawStr.split(" → ");
                                detailsStr = `${formatLoc(s)} → ${formatLoc(d)}`;
                              } else {
                                detailsStr = rawStr;
                              }
                            }
                          }

                          if (log.category === "shower") {
                             if (typeof log.details === "object" && log.details !== null) {
                               const mins = (log.details as any).minutes;
                               detailsStr = `Shower · ${mins ?? 0} min`;
                             } else {
                               detailsStr = "Shower activity";
                             }
                          }

                          if (log.category === "dishwasher") {
                            if (typeof log.details === "object" && log.details !== null) {
                              const eco = (log.details as any).ecoMode;
                              detailsStr = eco ? "Dishwasher · Eco mode" : "Dishwasher";
                            } else {
                              detailsStr = "Dishwasher activity";
                            }
                          }

                          if (log.category === "energy") {
                            detailsStr = "Energy activity";
                          }

                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 24 }}
                              transition={{ duration: 0.2 }}
                              className="px-5 py-4"
                              style={{ background: "var(--bg-card-deep)" }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-card-nested)" }}>
                                  <CategoryIcon category={log.category} details={log.details} />
                                </div>

                                <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                                  <div className="min-w-0">
                                    <p className="text-xs capitalize mb-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                                      {log.category === "shower" || log.category === "dishwasher" ? "water" : log.category}
                                    </p>
                                    <p className="text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                                      {detailsStr}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0 ml-2">
                                    {log.category === "shower" || log.category === "dishwasher" ? (
                                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                                        {Number(log.water_l ?? 0).toFixed(0)}
                                        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>L</span>
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                                        {log.co2_kg ? log.co2_kg.toFixed(1) : "0"}
                                        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>kg CO₂</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {deleteConfirm === log.id ? (
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => handleDelete(log.id)} disabled={deleting === log.id} className="text-xs px-2 py-1 rounded-lg text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50" style={{ fontFamily: "var(--font-body)" }}>
                                      {deleting === log.id ? "..." : "Delete"}
                                    </button>
                                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(log.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors group/del shrink-0 hover:bg-red-500/10"
                                  >
                                    <Trash2 size={13} className="transition-colors group-hover/del:text-red-500" style={{ color: "var(--text-muted)" }} />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
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