/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { Zap, Car, Flame, Calendar, Plus, ChevronDown, Info, X, Home, Shirt } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Cell
} from "recharts";

/* ── Circular Eco Score ── */
function EcoScoreRing({ score }: { score: number }) {
  const max = 1000;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / max) * circumference;
  const scoreColor = score > 700 ? "var(--accent-green)" : score > 400 ? "#facc15" : "#f87171";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" style={{ stroke: "var(--border-strong)" }} strokeWidth="10" />
          <motion.circle cx="100" cy="100" r={radius} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="font-bold leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: "52px", color: scoreColor }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}>
            {score}
          </motion.span>
          <span className="text-sm tracking-widest uppercase mt-1"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Eco Score
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div 
          className="w-2.5 h-2.5 rounded-full" 
          style={{ background: scoreColor }} 
        />
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
          {score > 700 ? "Great day so far!" : score > 400 ? "Room to improve" : "High impact day"}
        </p>
      </div>
    </div>
  );
}

/* ── Category card ── */
function CategoryCard({ icon: Icon, label, color, logged, href }: {
  icon: React.ElementType; label: string; color: string; logged: boolean; href: string;
}) {
  return (
    <motion.a href={href} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer group"
      style={{ background: "var(--bg-card)", border: logged ? `1px solid ${color}40` : "1px solid var(--border-subtle)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: logged ? "var(--text-secondary)" : "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          {logged ? "✓ Logged today" : "Not logged yet"}
        </p>
      </div>
      {!logged && (
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{ border: "1px solid var(--accent-green-badge-border)" }}>
          <Plus size={16} className="transition-colors duration-300" style={{ color: "var(--text-muted)" }} strokeWidth={2.5} />
        </div>
      )}
    </motion.a>
  );
}

/* ── Eco Score chart ── */
function EcoScoreChart() {
  const [range, setRange] = useState("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setTimeout(() => { setIsDark(document.documentElement.getAttribute("data-theme") !== "light"); }, 0);
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute("data-theme") !== "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const datasets = {
    week: [{ name: "Mon", value: 18 }, { name: "Tue", value: 25 }, { name: "Wed", value: 20 }, { name: "Thu", value: 28 }, { name: "Fri", value: 22 }, { name: "Sat", value: 30 }, { name: "Sun", value: 24 }],
    month: [{ name: "Week 1", value: 120 }, { name: "Week 2", value: 98 }, { name: "Week 3", value: 135 }, { name: "Week 4", value: 110 }, { name: "Week 5", value: 126 }],
    year: [{ name: "Jan", value: 410 }, { name: "Feb", value: 380 }, { name: "Mar", value: 450 }, { name: "Apr", value: 420 }, { name: "May", value: 470 }, { name: "Jun", value: 430 }, { name: "Jul", value: 490 }, { name: "Aug", value: 460 }, { name: "Sep", value: 440 }, { name: "Oct", value: 500 }, { name: "Nov", value: 470 }, { name: "Dec", value: 520 }],
  };

  const data = datasets[range as keyof typeof datasets];
  const chartColor = isDark ? "#4ade80" : "#16a34a";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Eco Score – last 7 days
        </p>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}<ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}>
              {["week", "month", "year"].map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: range === opt ? "var(--accent-green)" : "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ecoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
            <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
              itemStyle={{ color: tooltipText }} formatter={(value: unknown) => [`${value}`, "Eco Score"]} />
            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={3} fillOpacity={1}
              fill="url(#ecoGradient)" activeDot={{ r: 6, fill: chartColor, stroke: tooltipBg, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type ChartPoint = { name: string; value: number };

/* ── Energy chart ── */
function EnergyChart({ userId }: { userId: string | null }) {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  // Info popover state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [engagingText, setEngagingText] = useState<string | null>(null);
  const [engagingLoading, setEngagingLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setTimeout(() => { setIsDark(document.documentElement.getAttribute("data-theme") !== "light"); }, 0);
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute("data-theme") !== "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.removeEventListener("resize", check); observer.disconnect(); };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setChartLoading(true);
      try {
        const res = await fetch("/api/historical-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const energy = data.energy_kwh;
        if (energy) {
          setWeeklyData((energy.weekly ?? []).map((row: { day: string; total: number }) => ({ name: row.day, value: Number(row.total.toFixed(2)) })));
          setMonthlyData((energy.monthly ?? []).map((row: { week: string; total: number }) => ({ name: row.week, value: Number(row.total.toFixed(2)) })));
          setYearlyData((energy.yearly ?? []).map((row: { month: string; total: number }) => ({ name: row.month, value: Number(row.total.toFixed(2)) })));
        }
      } catch (err) { console.error("Failed to load Energy chart data:", err); }
      finally { setChartLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    if (popoverOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleInfoClick = async () => {
    if (popoverOpen) { setPopoverOpen(false); return; }
    setPopoverOpen(true);
    if (engagingText || !userId) return;
    setEngagingLoading(true);
    try {
      const res = await fetch("/api/engaging", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, category: "electricity" }), 
      });
      
      const textResponse = await res.text();
      try {
        const data = JSON.parse(textResponse);
        if (res.ok && data.text) {
          setEngagingText(data.text);
        } else {
          setEngagingText(`Server Error: ${data.error || "Unknown error"}`);
        }
      } catch (e) {
        setEngagingText("Error: Backend crashed (returned HTML instead of JSON).");
        console.error("Backend Error HTML:", textResponse);
      }
    } catch { 
      setEngagingText("Network error fetching data."); 
    } finally { 
      setEngagingLoading(false); 
    }
  };

  const data = range === "week" ? weeklyData : range === "month" ? monthlyData : yearlyData;
  const chartColor = "#c084fc"; // purple-400
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative shadow-sm h-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Energy usage</p>
          <div className="relative" ref={popoverRef}>
            <button onClick={handleInfoClick} className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: popoverOpen ? "rgba(192,132,252,0.15)" : "var(--bg-card-deep)", border: `1px solid ${popoverOpen ? "rgba(192,132,252,0.3)" : "var(--border-strong)"}` }}>
              {popoverOpen ? <X size={11} style={{ color: chartColor }} /> : <Info size={11} style={{ color: "var(--text-muted)" }} />}
            </button>
            <AnimatePresence>
              {popoverOpen && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.18 }}
                  className="absolute -left-20 md:left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[85vw] sm:w-65 shadow-2xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid rgba(192,132,252,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">⚡</span>
                    <p className="text-xs font-medium tracking-wider uppercase" style={{ color: chartColor, fontFamily: "var(--font-body)" }}>Your impact this week</p>
                  </div>
                  {engagingLoading
                    ? <p className="text-xs animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Calculating your impact...</p>
                    : <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{engagingText}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}<ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}>
              {(["week", "month", "year"] as const).map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: range === opt ? chartColor : "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {chartLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 12 }} unit=" kWh" />
              <Tooltip cursor={{ fill: "transparent" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
                itemStyle={{ color: tooltipText }} formatter={(value: unknown) => [`${value} kWh`, "Energy"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
                onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
                onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
                {data.map((entry) => {
                  const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                  return <Cell key={`cell-${entry.name}`} fill={chartColor} fillOpacity={isActive ? 1 : 0.7} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── CO2 chart ── */
function CO2Chart({ userId }: { userId: string | null }) {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  // Info popover state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [engagingText, setEngagingText] = useState<string | null>(null);
  const [engagingLoading, setEngagingLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setTimeout(() => { setIsDark(document.documentElement.getAttribute("data-theme") !== "light"); }, 0);
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute("data-theme") !== "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.removeEventListener("resize", check); observer.disconnect(); };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setChartLoading(true);
      try {
        const res = await fetch("/api/historical-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const co2 = data.co2_kg;
        if (co2) {
          setWeeklyData((co2.weekly ?? []).map((row: { day: string; total: number }) => ({ name: row.day, value: Number(row.total.toFixed(2)) })));
          setMonthlyData((co2.monthly ?? []).map((row: { week: string; total: number }) => ({ name: row.week, value: Number(row.total.toFixed(2)) })));
          setYearlyData((co2.yearly ?? []).map((row: { month: string; total: number }) => ({ name: row.month, value: Number(row.total.toFixed(2)) })));
        }
      } catch (err) { console.error("Failed to load CO2 chart data:", err); }
      finally { setChartLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    if (popoverOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleInfoClick = async () => {
    if (popoverOpen) { setPopoverOpen(false); return; }
    setPopoverOpen(true);
    if (engagingText || !userId) return;
    setEngagingLoading(true);
    try {
      const res = await fetch("/api/engaging", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, category: "co2" }), 
      });
      
      const textResponse = await res.text();
      try {
        const data = JSON.parse(textResponse);
        if (res.ok && data.text) {
          setEngagingText(data.text);
        } else {
          setEngagingText(`Server Error: ${data.error || "Unknown error"}`);
        }
      } catch (e) {
        setEngagingText("Error: Backend crashed (returned HTML instead of JSON).");
        console.error("Backend Error HTML:", textResponse);
      }
    } catch { 
      setEngagingText("Network error fetching data."); 
    } finally { 
      setEngagingLoading(false); 
    }
  };

  const data = range === "week" ? weeklyData : range === "month" ? monthlyData : yearlyData;
  const chartColor = "#fb923c"; // orange-400
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>CO₂ usage</p>
          <div className="relative" ref={popoverRef}>
            <button onClick={handleInfoClick} className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: popoverOpen ? "rgba(251,146,60,0.15)" : "var(--bg-card-deep)", border: `1px solid ${popoverOpen ? "rgba(251,146,60,0.3)" : "var(--border-strong)"}` }}>
              {popoverOpen ? <X size={11} style={{ color: chartColor }} /> : <Info size={11} style={{ color: "var(--text-muted)" }} />}
            </button>
            <AnimatePresence>
              {popoverOpen && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.18 }}
                  className="absolute -left-20 md:left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[85vw] sm:w-65 shadow-2xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid rgba(251,146,60,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🌍</span>
                    <p className="text-xs font-medium tracking-wider uppercase" style={{ color: chartColor, fontFamily: "var(--font-body)" }}>Your impact this week</p>
                  </div>
                  {engagingLoading
                    ? <p className="text-xs animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Calculating your impact...</p>
                    : <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{engagingText}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}<ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}>
              {(["week", "month", "year"] as const).map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: range === opt ? chartColor : "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {chartLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 12 }} unit=" kg" />
              <Tooltip cursor={{ fill: "transparent" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
                itemStyle={{ color: tooltipText }} formatter={(value: unknown) => [`${value} kg`, "CO₂"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
                onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
                onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
                {data.map((entry) => {
                  const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                  return <Cell key={`cell-${entry.name}`} fill={chartColor} fillOpacity={isActive ? 1 : 0.7} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Water chart ── */
function WaterChart({ userId }: { userId: string | null }) {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  
  // Info popover state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [engagingText, setEngagingText] = useState<string | null>(null);
  const [engagingLoading, setEngagingLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    setTimeout(() => { setIsDark(document.documentElement.getAttribute("data-theme") !== "light"); }, 0);
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute("data-theme") !== "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.removeEventListener("resize", check); observer.disconnect(); };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setChartLoading(true);
      try {
        const res = await fetch("/api/historical-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const water = data.water_l;
        if (water) {
          setWeeklyData((water.weekly ?? []).map((row: { day: string; total: number }) => ({ name: row.day, value: Number(row.total.toFixed(1)) })));
          setMonthlyData((water.monthly ?? []).map((row: { week: string; total: number }) => ({ name: row.week, value: Number(row.total.toFixed(1)) })));
          setYearlyData((water.yearly ?? []).map((row: { month: string; total: number }) => ({ name: row.month, value: Number(row.total.toFixed(1)) })));
        }
      } catch (err) { console.error("Failed to load Water chart data:", err); }
      finally { setChartLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    if (popoverOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleInfoClick = async () => {
    if (popoverOpen) { setPopoverOpen(false); return; }
    setPopoverOpen(true);
    if (engagingText || !userId) return;
    setEngagingLoading(true);
    try {
      const res = await fetch("/api/engaging", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, category: "water" }), 
      });
      
      const textResponse = await res.text();
      try {
        const data = JSON.parse(textResponse);
        if (res.ok && data.text) {
          setEngagingText(data.text);
        } else {
          setEngagingText(`Server Error: ${data.error || "Unknown error"}`);
        }
      } catch (e) {
        setEngagingText("Error: Backend crashed (returned HTML instead of JSON).");
        console.error("Backend Error HTML:", textResponse);
      }
    } catch { 
      setEngagingText("Network error fetching data."); 
    } finally { 
      setEngagingLoading(false); 
    }
  };

  const data = range === "week" ? weeklyData : range === "month" ? monthlyData : yearlyData;
  const chartColor = "#22d3ee"; // cyan-400
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Water usage</p>
          <div className="relative" ref={popoverRef}>
            <button onClick={handleInfoClick} className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ background: popoverOpen ? "rgba(34,211,238,0.15)" : "var(--bg-card-deep)", border: `1px solid ${popoverOpen ? "rgba(34,211,238,0.3)" : "var(--border-strong)"}` }}>
              {popoverOpen ? <X size={11} style={{ color: chartColor }} /> : <Info size={11} style={{ color: "var(--text-muted)" }} />}
            </button>
            <AnimatePresence>
              {popoverOpen && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.18 }}
                  className="absolute -left-20 md:left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[85vw] sm:w-65 shadow-2xl"
                  style={{ background: "var(--bg-elevated)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">💧</span>
                    <p className="text-xs font-medium tracking-wider uppercase" style={{ color: chartColor, fontFamily: "var(--font-body)" }}>Your impact this week</p>
                  </div>
                  {engagingLoading
                    ? <p className="text-xs animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Calculating your impact...</p>
                    : <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{engagingText}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}<ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}>
              {(["week", "month", "year"] as const).map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: range === opt ? chartColor : "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {chartLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 12 }} unit=" L" />
              <Tooltip cursor={{ fill: "transparent" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
                itemStyle={{ color: tooltipText }} formatter={(value: unknown) => [`${value} L`, "Water"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
                onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
                onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
                {data.map((entry) => {
                  const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                  return <Cell key={`cell-${entry.name}`} fill={chartColor} fillOpacity={isActive ? 1 : 0.7} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Weekly Tips card (Flat list, dividers, no scroll) ── */
type MetricStatus = "ok" | "borderline" | "bad";
type MetricResult = {
  metric: "co2" | "water" | "energy";
  total: number;
  unit: string;
  status: MetricStatus;
  top_category: string | null;
  tip: string | null;
};

function WeeklyTipsCard() {
  const [tips, setTips] = useState<MetricResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTips() {
      try {
        const res = await fetch("/api/weekly-tip");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTips(data.tips ?? []);
      } catch (err) {
        console.error("Failed to load weekly tips:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTips();
  }, []);

  const metaMap: Record<string, { icon: string; label: string }> = {
    co2:    { icon: "🌿", label: "CO₂ Usage" },
    water:  { icon: "💧", label: "Water Usage" },
    energy: { icon: "⚡", label: "Energy Usage" },
  };

  return (
    <div className="rounded-2xl flex flex-col shadow-sm h-full"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center gap-2 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-card-nested)" }}>
        <span className="text-base">📊</span>
        <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Weekly insights
        </p>
      </div>

      {/* Content (No scroll) */}
      <div className="flex-1 flex flex-col justify-center p-4 lg:p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "var(--bg-card-nested)" }} />
            ))}
          </div>
        ) : tips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center h-full">
            <span className="text-3xl mb-3">🌱</span>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              No data yet
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              Log a few habits to get personalized weekly insights
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-500/40">
            {tips.map((tip) => {
              const meta = metaMap[tip.metric];
              const isOpen = expanded === tip.metric;

              return (
                <div key={tip.metric} className="py-3 first:pt-0 last:pb-0">
                  <motion.div
                    whileHover={!isOpen ? { scale: 1.02 } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : tip.metric)} // Alltid klickbar!
                      className="w-full flex items-center gap-4 text-left rounded-xl transition-all"
                      style={{ cursor: "pointer" }}
                    >
                      {/* Icon */}
                      <span className="text-2xl shrink-0">{meta.icon}</span>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                          {meta.label}
                        </p>
                      </div>

                      {/* Value + Chevron always visible on the far right */}
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                          {tip.total.toFixed(1)} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>{tip.unit}</span>
                        </p>
                        <ChevronDown
                          size={16}
                          className="transition-transform duration-300 shrink-0"
                          style={{
                            color: "var(--text-muted)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            opacity: 1 // Alltid synlig
                          }}
                        />
                      </div>
                    </button>

                    {/* Expanded tip (Seamless extension) */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 pl-10 pr-2 pb-1">
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                              {tip.tip || `Great job! Your ${meta.label.toLowerCase()} is on track this week.`}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Log banner ── */
function LogBanner({ loggedCount, href }: { loggedCount: number; href: string }) {
  if (loggedCount >= 1) return null;
  return (
    <AnimatePresence>
      <motion.a href={href} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl cursor-pointer mb-8 shadow-sm"
        style={{ background: "var(--accent-green-subtle)", border: "1px solid var(--accent-green-badge-border)" }}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent-green)" }} />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-50" style={{ background: "var(--accent-green)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
              You haven&apos;t logged any habits today
            </p>
            <p className="hidden md:block text-sm mt-0.5" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Log your habits to update your Eco Score
            </p>
          </div>
        </div>
        <div className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-colors hover:opacity-90" style={{ background: "var(--accent-green)" }}>
          Log now
        </div>
      </motion.a>
    </AnimatePresence>
  );
}

/* ── Main page ── */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("USER");
  const [userId, setUserId] = useState<string | null>(null);
  const [ecoScore, setEcoScore] = useState(1000);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(true); // Added for bfcache force re-render fix

  useEffect(() => {
    // Initial theme check and listener
    const checkTheme = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.firstName) setFirstName(data.firstName.toUpperCase());
        if (data.ecoScore !== undefined) setEcoScore(data.ecoScore);
        if (data.streak !== undefined) setStreak(data.streak);

        if (data.activities && data.activities.length > 0) {
          const uniqueCategories = Array.from(
            new Set(data.activities.map((a: { category: string }) => {
              const c = a.category.toLowerCase();
              if (c === "shower" || c === "dishwasher" || c === "washing_machine") return "household";
              return c;
            }))
          );
          setLoggedToday(uniqueCategories as string[]);
        }

        if (user) {
          const { data: history } = await supabase
            .from("eco_activities").select("day").eq("user_id", user.id).order("day", { ascending: false });

          if (history && history.length > 0) {
            const uniqueDates = Array.from(new Set(history.map((row) => {
              const d = new Date(row.day);
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              return d.toISOString().split("T")[0];
            })));
            const getOffsetDate = (offset: number) => {
              const d = new Date();
              d.setDate(d.getDate() - offset);
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              return d.toISOString().split("T")[0];
            };
            const today = getOffsetDate(0);
            const yesterday = getOffsetDate(1);
            let calculatedStreak = 0;
            if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
              let offset = uniqueDates.includes(today) ? 0 : 1;
              while (uniqueDates.includes(getOffsetDate(offset))) { calculatedStreak++; offset++; }
            }
            setStreak(calculatedStreak);
          } else { setStreak(0); }
        }
      } catch (error) { console.error("Error loading dashboard:", error); }
      finally { setLoading(false); }
    }
    fetchDashboardData();

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p className="font-mono animate-pulse" style={{ color: "var(--accent-green)" }}>Loading...</p>
      </div>
    );
  }

  return (
    // Key forces a re-render on theme change or bfcache restore, preventing black screen
    <div key={isDark ? "dark" : "light"} className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8">
            <div>
              <h1 className="leading-none mb-1 uppercase"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                GOOD MORNING, {firstName}
              </h1>
              <p className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                <Calendar size={13} />
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full shadow-sm"
              style={{ background: "var(--accent-green-badge)", border: "1px solid var(--accent-green-badge-border)" }}>
              <Flame size={14} style={{ color: "var(--accent-green)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--accent-green)", fontFamily: "var(--font-body)" }}>
                {streak} day<span className="hidden md:inline"> streak</span>
              </span>
            </div>
          </motion.div>

          <LogBanner loggedCount={loggedToday.length} href="/dashboard/log" />

          {/* Zon 1: Eco Score + Habits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-8 lg:gap-12 shadow-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex-1 flex flex-col items-center justify-center">
              <EcoScoreRing score={ecoScore} />
              <div className="flex gap-4 sm:gap-6 mt-6 pt-6 w-full max-w-sm" style={{ borderTop: "1px solid var(--border-faint)" }}>
                {[{ label: "Yesterday", val: "—" }, { label: "Weekly avg", val: "—" }, { label: "Best day", val: "—" }].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{s.val}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block w-px" style={{ background: "var(--border-faint)" }} />
            <div className="block lg:hidden h-px w-full" style={{ background: "var(--border-faint)" }} />
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Today&apos;s habits
                </p>
                <div className="px-3 py-1 rounded-full shadow-sm" style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                    {loggedToday.length} / 3 logged
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <CategoryCard icon={Car} label="Transport" color="var(--accent-green)" logged={loggedToday.includes("transport")} href="/dashboard/log?tab=transport" />
                <CategoryCard icon={Home} label="Household" color="var(--accent-green)" logged={loggedToday.includes("household")} href="/dashboard/log?tab=household" />
                <CategoryCard icon={Shirt} label="Clothing" color="var(--accent-green)" logged={loggedToday.includes("clothing")} href="/dashboard/log?tab=clothing" />
              </div>
            </div>
          </motion.div>

          {/* Zon 2: Eco Score graf */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-8 shadow-sm hover:scale-[1.005] transition-transform duration-300">
            <EcoScoreChart />
          </motion.div>

          {/* Zon 3: 2x2 grid – CO2, Water, Energy, Weekly Tips */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <CO2Chart userId={userId} />
            <WaterChart userId={userId} />
            <EnergyChart userId={userId} />
            <WeeklyTipsCard />
          </motion.div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}