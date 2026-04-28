"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import {
  Car, Bus, Train, Bike, Plane,
  Leaf, Zap, Trash2, Plus, ChevronDown,
} from "lucide-react";

/* ─── Types ─── */
type Category = "transport" | "food" | "energy";
type Log = {
  id: string;
  category: Category;
  summary: string;
  created_at: string;
  co2_emissions_kg?: number; // <-- Lade till denna för CO2!
};

/* ─── Date options ─── */
const DATE_OPTIONS = [
  { label: "Today", offset: 0 },
  { label: "Yesterday", offset: 1 },
  { label: "2 days ago", offset: 2 },
];

function getDateWithOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

/* ─── Category tip ─── */
const TIPS: Record<Category, string> = {
  transport: "Taking the train instead of driving saves ~5× more CO₂ per trip.",
  food: "A vegan meal produces up to 50× less CO₂ than a beef meal.",
  energy: "Reducing your shower by 5 minutes saves ~0.3 kg CO₂ per day.",
};

/* ─── Floating label input ─── */
function FloatingInput({
  label, value, onChange, type = "text",
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value !== "";
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        className="w-full rounded-2xl px-6 pt-7 pb-3 text-sm text-white outline-none placeholder-transparent"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: focused ? "0 0 24px rgba(74,222,128,0.08), inset 0 0 12px rgba(74,222,128,0.02)" : "none",
          transition: "border-color 0.25s, box-shadow 0.25s",
          fontFamily: "var(--font-body)",
        }}
      />
      <label style={{
        position: "absolute", left: "24px",
        top: active ? "10px" : "50%",
        transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? "10px" : "14px",
        color: active ? (focused ? "#4ade80" : "#52525b") : "#52525b",
        letterSpacing: active ? "0.1em" : "0",
        textTransform: active ? "uppercase" : "none",
        pointerEvents: "none",
        transition: "all 0.2s ease",
        fontFamily: "var(--font-body)",
      }}>
        {label}
      </label>
    </div>
  );
}

/* ─── Submit button ─── */
function SubmitBtn({ disabled, loading }: { disabled: boolean; loading?: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      whileHover={disabled ? {} : { scale: 1.015 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className="w-full rounded-2xl font-semibold py-3.5 text-sm transition-all duration-200"
      style={{
        background: disabled || loading ? "rgba(255,255,255,0.05)" : "#4ade80",
        color: disabled || loading ? "#52525b" : "#000",
        fontFamily: "var(--font-body)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "Logging..." : "Log habit"}
    </motion.button>
  );
}

/* ─── Category icon ─── */
function CategoryIcon({ category }: { category: Category }) {
  if (category === "transport") return <Car size={14} className="text-cyan-400" />;
  if (category === "food") return <Leaf size={14} className="text-green-400" />;
  return <Zap size={14} className="text-yellow-400" />;
}

/* ─── Transport form ─── */
function TransportForm({ onSuccess }: { onSuccess: () => void }) {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      onSuccess(); // Triggar refreshTrigger i LogPage = Data hämtas på nytt!
    } catch {
      setError("Failed to log habit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FloatingInput label="From" value={from} onChange={(v) => { setFrom(v); setError(null); }} />
      <FloatingInput label="To" value={to} onChange={(v) => { setTo(v); setError(null); }} />

      <div>
        <p className="text-xs text-zinc-500 tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-body)" }}>
          Mode of transport
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeOpen(!modeOpen)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: mode ? "#ffffff" : "#71717a",
              fontFamily: "var(--font-body)",
            }}
          >
            {mode || "Select transport"}
            <ChevronDown size={16} className={`transition-transform duration-200 ${modeOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {modeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "#1e2128",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {modes.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => { setMode(m.label); setModeOpen(false); }}
                    className="w-full px-5 py-3 text-left text-sm transition-all duration-150 cursor-pointer"
                    style={{
                      color: mode === m.label ? "#4ade80" : "#a1a1aa",
                      background: mode === m.label ? "rgba(74,222,128,0.06)" : "transparent",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={e => { if (mode !== m.label) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#ffffff"; }}}
                    onMouseLeave={e => { if (mode !== m.label) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}}
                  >
                    {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <SubmitBtn disabled={!from || !to || !mode} loading={submitting} />
    </form>
  );
}

/* ─── Coming soon placeholder ─── */
function ComingSoon({ category }: { category: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-xl">{category === "food" ? "🥗" : "⚡"}</span>
      </div>
      <p className="text-zinc-400 text-sm font-medium mb-1" style={{ fontFamily: "var(--font-body)" }}>
        {category === "food" ? "Food" : "Energy"} logging coming soon
      </p>
      <p className="text-zinc-600 text-xs" style={{ fontFamily: "var(--font-body)" }}>
        We&apos;re working on it — check back next sprint
      </p>
    </div>
  );
}

/* ─── Main page ─── */
export default function LogPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("transport");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const categories: { id: Category; label: string; available: boolean }[] = [
    { id: "transport", label: "Transport", available: true },
    { id: "food", label: "Food", available: false },
    { id: "energy", label: "Energy", available: false },
  ];

  const selectedDate = getDateWithOffset(dateOffset);
  const loggedCategories = [...new Set(logs.map((l) => l.category))];

  useEffect(() => {
    const loadLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("eco_activities")
        // <-- VIKTIGT: Här ber vi databasen även om co2_emissions_kg!
        .select("id, category, summary, created_at, co2_emissions_kg") 
        .eq("user_id", user.id)
        .eq("activity_date", selectedDate)
        .order("created_at", { ascending: false });
        
      if (data) setLogs(data as Log[]);
      setLoading(false); 
    };

    loadLogs();
  }, [selectedDate, refreshTrigger]); 

  const handleDelete = async (id: string) => {
    await supabase.from("eco_activities").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setDeleteConfirm(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen bg-[#111318] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <h1 className="text-white leading-none mb-1"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                LOG HABITS
              </h1>
              <p className="text-zinc-400 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                Track your daily environmental impact
              </p>
            </div>

            {/* Date picker */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#a1a1aa",
                  fontFamily: "var(--font-body)",
                }}
              >
                {DATE_OPTIONS[dateOffset].label}
                <ChevronDown size={14} className={`transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {dateDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
                    style={{
                      background: "#1e2128",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      minWidth: "140px",
                    }}
                  >
                    {DATE_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.label}
                        onClick={() => { 
                          setLoading(true);
                          setDateOffset(i); 
                          setDateDropdownOpen(false); 
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left transition-colors duration-150"
                        style={{
                          color: dateOffset === i ? "#4ade80" : "#a1a1aa",
                          background: dateOffset === i ? "rgba(74,222,128,0.06)" : "transparent",
                          fontFamily: "var(--font-body)",
                        }}
                        onMouseEnter={e => { if (dateOffset !== i) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={e => { if (dateOffset !== i) e.currentTarget.style.background = "transparent"; }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Progress banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex gap-4 flex-1">
              {categories.map((cat) => {
                const done = loggedCategories.includes(cat.id);
                return (
                  <div key={cat.id} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full transition-colors duration-300"
                      style={{ background: done ? "#4ade80" : cat.available ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)" }} />
                    <span className="text-xs" style={{
                      color: done ? "#4ade80" : cat.available ? "#52525b" : "#3f3f46",
                      fontFamily: "var(--font-body)",
                    }}>
                      {cat.label}{!cat.available && " (soon)"}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-zinc-500 shrink-0" style={{ fontFamily: "var(--font-body)" }}>
              {loggedCategories.length} / 3 logged
            </span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── LEFT: Form ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-3"
            >
              <div className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>

                {/* Category tabs */}
                <div className="flex gap-2 mb-8 p-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        background: activeCategory === cat.id ? "rgba(74,222,128,0.1)" : "transparent",
                        border: activeCategory === cat.id ? "1px solid rgba(74,222,128,0.25)" : "1px solid transparent",
                        color: activeCategory === cat.id ? "#4ade80" : cat.available ? "#71717a" : "#3f3f46",
                        fontFamily: "var(--font-body)",
                        cursor: cat.available ? "pointer" : "default",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22 }}
                  >
                    {activeCategory === "transport" && (
                      <TransportForm onSuccess={triggerRefresh} /> 
                    )}
                    {activeCategory === "food" && <ComingSoon category="food" />}
                    {activeCategory === "energy" && <ComingSoon category="energy" />}
                  </motion.div>
                </AnimatePresence>

                {/* Category tip */}
                {activeCategory === "transport" && (
                  <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-base shrink-0">💡</span>
                    <p className="text-zinc-500 text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                      {TIPS[activeCategory]}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── RIGHT: Logs ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}>

                <div className="px-5 py-4 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-sm text-zinc-300 font-medium" style={{ fontFamily: "var(--font-body)" }}>
                    {DATE_OPTIONS[dateOffset].label}&apos;s logs
                  </p>
                  <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)" }}>
                    {logs.length}
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {loading ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-zinc-600 text-sm animate-pulse" style={{ fontFamily: "var(--font-body)" }}>
                        Loading...
                      </p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Plus size={18} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-500 text-sm" style={{ fontFamily: "var(--font-body)" }}>No habits logged</p>
                      <p className="text-zinc-600 text-xs mt-1" style={{ fontFamily: "var(--font-body)" }}>Use the form to add your first log</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {logs.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.2 }}
                          className="px-5 py-4"
                          style={{ background: "rgba(255,255,255,0.02)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: "rgba(255,255,255,0.05)" }}>
                              <CategoryIcon category={log.category} />
                            </div>
                            
                            {/* Flex-1 tvingar texten och CO2-infon att dela utrymmet snyggt */}
                            <div className="flex-1 min-w-0 flex items-center justify-between pr-2">
                              <div>
                                <p className="text-xs text-zinc-500 capitalize mb-0.5" style={{ fontFamily: "var(--font-body)" }}>
                                  {log.category}
                                </p>
                                <p className="text-sm text-white truncate" style={{ fontFamily: "var(--font-body)" }}>
                                  {log.summary || "Unknown activity"}
                                </p>
                              </div>
                              
                              {/* <-- Här visas din CO2 data snyggt! --> */}
                              <div className="text-right">
                                <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "var(--font-body)" }}>
                                  {log.co2_emissions_kg ? log.co2_emissions_kg.toFixed(1) : "0"} <span className="text-xs text-zinc-500">kg CO₂</span>
                                </p>
                              </div>
                            </div>

                            {deleteConfirm === log.id ? (
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => handleDelete(log.id)}
                                  className="text-xs px-2 py-1 rounded-lg text-red-400 transition-colors hover:bg-red-500/10"
                                  style={{ fontFamily: "var(--font-body)" }}>
                                  Delete
                                </button>
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="text-xs px-2 py-1 rounded-lg text-zinc-500 transition-colors hover:text-zinc-300"
                                  style={{ fontFamily: "var(--font-body)" }}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(log.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors group/del shrink-0"
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <Trash2 size={13} className="text-zinc-600 group-hover/del:text-red-400 transition-colors" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
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