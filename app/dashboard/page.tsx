/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { Zap, Car, TrendingUp, Flame, Calendar, Plus, ChevronDown, Info, X, Droplet } from "lucide-react";
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
  const color = score > 700 ? "#4ade80" : score > 400 ? "#facc15" : "#f87171";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: "52px", color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-sm text-zinc-400 tracking-widest uppercase mt-1"
            style={{ fontFamily: "var(--font-body)" }}>
            Eco Score
          </span>
        </div>
      </div>
      <p className="text-zinc-400 text-sm mt-3" style={{ fontFamily: "var(--font-body)" }}>
        {score > 700 ? "🌿 Great day so far!" : score > 400 ? "⚡ Room to improve" : "🔴 High impact day"}
      </p>
    </div>
  );
}

/* ── Category card ── */
function CategoryCard({ icon: Icon, label, color, logged, href }: {
  icon: React.ElementType; label: string; color: string; logged: boolean; href: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 p-5 rounded-2xl cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: logged ? `1px solid ${color}33` : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: logged ? "#a1a1aa" : "#71717a", fontFamily: "var(--font-body)" }}>
          {logged ? "✓ Logged today" : "Not logged yet"}
        </p>
      </div>
      {!logged && (
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10"
          style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          <Plus size={16} className="text-zinc-500 group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
        </div>
      )}
    </motion.a>
  );
}

/* ── Eco Score chart (Area Chart med Gradient) ── */
function EcoScoreChart() {
  const [range, setRange] = useState("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const datasets = {
    week: [
      { name: "Mon", value: 18 }, { name: "Tue", value: 25 }, { name: "Wed", value: 20 },
      { name: "Thu", value: 28 }, { name: "Fri", value: 22 }, { name: "Sat", value: 30 }, { name: "Sun", value: 24 },
    ],
    month: [
      { name: "Week 1", value: 120 }, { name: "Week 2", value: 98 },
      { name: "Week 3", value: 135 }, { name: "Week 4", value: 110 }, { name: "Week 5", value: 126 },
    ],
    year: [
      { name: "Jan", value: 410 }, { name: "Feb", value: 380 }, { name: "Mar", value: 450 },
      { name: "Apr", value: 420 }, { name: "May", value: 470 }, { name: "Jun", value: 430 },
      { name: "Jul", value: 490 }, { name: "Aug", value: 460 }, { name: "Sep", value: 440 },
      { name: "Oct", value: 500 }, { name: "Nov", value: 470 }, { name: "Dec", value: 520 },
    ],
  };

  const data = datasets[range as keyof typeof datasets];

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-zinc-400 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
          Eco Score – last 7 days
        </p>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#a1a1aa" }}>
            {range}
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{ background: "#1e2128", border: "1px solid rgba(255,255,255,0.09)" }}>
              {["week", "month", "year"].map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5"
                  style={{ color: range === opt ? "#4ade80" : "#a1a1aa", fontFamily: "var(--font-body)" }}>
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
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 12 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
            <Tooltip 
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: unknown) => [`${value}`, "Eco Score"]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#4ade80" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#ecoGradient)" 
              activeDot={{ r: 6, fill: "#4ade80", stroke: "#18181b", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── ENERGY chart (hardcoded placeholder) ── */
function EnergyChart() {
  const [range, setRange] = useState("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const datasets = {
    week: [
      { name: "Mon", value: 12.4 }, { name: "Tue", value: 14.1 }, { name: "Wed", value: 11.2 },
      { name: "Thu", value: 15.6 }, { name: "Fri", value: 13.8 }, { name: "Sat", value: 18.2 }, { name: "Sun", value: 17.5 },
    ],
    month: [
      { name: "Week 1", value: 85 }, { name: "Week 2", value: 92 },
      { name: "Week 3", value: 78 }, { name: "Week 4", value: 88 }, { name: "Week 5", value: 95 },
    ],
    year: [
      { name: "Jan", value: 420 }, { name: "Feb", value: 390 }, { name: "Mar", value: 350 },
      { name: "Apr", value: 280 }, { name: "May", value: 250 }, { name: "Jun", value: 220 },
      { name: "Jul", value: 240 }, { name: "Aug", value: 260 }, { name: "Sep", value: 290 },
      { name: "Oct", value: 340 }, { name: "Nov", value: 380 }, { name: "Dec", value: 430 },
    ],
  };

  const data = datasets[range as keyof typeof datasets];

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-zinc-400 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
          Energy usage
        </p>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#a1a1aa" }}>
            {range}
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{ background: "#1e2128", border: "1px solid rgba(255,255,255,0.09)" }}>
              {["week", "month", "year"].map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5"
                  style={{ color: range === opt ? "#c084fc" : "#a1a1aa", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 12 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 12 }} unit=" kWh" />
            <Tooltip cursor={{ fill: "transparent" }}
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: unknown) => [`${value} kWh`, "Energy"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}
              onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
              onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
              onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
              {data.map((entry) => {
                const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                return (
                  <Cell key={`cell-${entry.name}`}
                    fill="#c084fc"
                    fillOpacity={isActive ? 1 : 0.7}
                    className="transition-all duration-300" />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── CO2 chart with real data + engaging popover ── */
type ChartPoint = { name: string; value: number };

function CO2Chart({ userId }: { userId: string | null }) {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);

  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [engagingText, setEngagingText] = useState<string | null>(null);
  const [engagingLoading, setEngagingLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setChartLoading(true);
      try {
        const res = await fetch("/api/historical-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (data.weekly_stats) {
          setWeeklyData(data.weekly_stats.map((row: { day: string; total: number }) => ({
            name: row.day, value: Number(row.total.toFixed(2)),
          })));
        }
        if (data.monthly_stats) {
          setMonthlyData(data.monthly_stats.map((row: { week: string; total: number }) => ({
            name: row.week, value: Number(row.total.toFixed(2)),
          })));
        }
        if (data.yearly_stats) {
          setYearlyData(data.yearly_stats.map((row: { month: string; total: number }) => ({
            name: row.month, value: Number(row.total.toFixed(2)),
          })));
        }
      } catch (err) {
        console.error("Failed to load CO2 chart data:", err);
      } finally {
        setChartLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  const handleInfoClick = async () => {
    if (popoverOpen) {
      setPopoverOpen(false);
      return;
    }
    setPopoverOpen(true);
    if (engagingText) return;
    if (!userId) return;

    setEngagingLoading(true);
    try {
      const res = await fetch("/api/engaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, category: "co2" }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setEngagingText(data.text);
      } else {
        setEngagingText("Not enough data yet — keep logging your habits!");
      }
    } catch {
      setEngagingText("Could not load impact data.");
    } finally {
      setEngagingLoading(false);
    }
  };

  const data = range === "week" ? weeklyData : range === "month" ? monthlyData : yearlyData;

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-zinc-400 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
            CO₂ usage
          </p>

          <div className="relative" ref={popoverRef}>
            <button
              onClick={handleInfoClick}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: popoverOpen ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${popoverOpen ? "rgba(251,146,60,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {popoverOpen ? <X size={11} className="text-orange-400" /> : <Info size={11} className="text-zinc-500" />}
            </button>

            <AnimatePresence>
              {popoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute -left-20 md:left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[85vw] sm:w-65"
                  style={{
                    background: "#1e2128", border: "1px solid rgba(251,146,60,0.15)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxWidth: "280px"
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🌍</span>
                    <p className="text-xs text-orange-400 font-medium tracking-wider uppercase"
                      style={{ fontFamily: "var(--font-body)" }}>
                      Your impact this week
                    </p>
                  </div>
                  {engagingLoading ? (
                    <p className="text-zinc-500 text-xs animate-pulse" style={{ fontFamily: "var(--font-body)" }}>Calculating your impact...</p>
                  ) : (
                    <p className="text-zinc-300 text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{engagingText}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#a1a1aa" }}>
            {range} <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{ background: "#1e2128", border: "1px solid rgba(255,255,255,0.09)" }}>
              {(["week", "month", "year"] as const).map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5"
                  style={{ color: range === opt ? "#fb923c" : "#a1a1aa", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chartLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-600 text-sm animate-pulse" style={{ fontFamily: "var(--font-body)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 12 }} unit=" kg" />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", color: "#ffffff" }}
                itemStyle={{ color: "#ffffff" }}
                formatter={(value: unknown) => [`${value} kg`, "CO₂"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
                onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
                onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
                {data.map((entry) => {
                  const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                  return (
                    <Cell key={`cell-${entry.name}`}
                      fill="#fb923c"
                      fillOpacity={isActive ? 1 : 0.7}
                      className="transition-all duration-300" />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── WATER chart with real data ── */
function WaterChart() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBarName, setActiveBarName] = useState<string | null>(null);
  const [hoveredBarName, setHoveredBarName] = useState<string | null>(null);

  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setChartLoading(true);
      try {
        const res = await fetch("/api/historical-data");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (data.water_weekly_stats) {
          setWeeklyData(data.water_weekly_stats.map((row: { day: string; total: number }) => ({
            name: row.day, value: Number(row.total.toFixed(1)),
          })));
        }
        if (data.water_monthly_stats) {
          setMonthlyData(data.water_monthly_stats.map((row: { week: string; total: number }) => ({
            name: row.week, value: Number(row.total.toFixed(1)),
          })));
        }
        if (data.water_yearly_stats) {
          setYearlyData(data.water_yearly_stats.map((row: { month: string; total: number }) => ({
            name: row.month, value: Number(row.total.toFixed(1)),
          })));
        }
      } catch (err) {
        console.error("Failed to load Water chart data:", err);
      } finally {
        setChartLoading(false);
      }
    }
    fetchData();
  }, []);

  const data = range === "week" ? weeklyData : range === "month" ? monthlyData : yearlyData;

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-zinc-400 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
            Water usage
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#a1a1aa" }}>
            {range} <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{ background: "#1e2128", border: "1px solid rgba(255,255,255,0.09)" }}>
              {(["week", "month", "year"] as const).map((opt) => (
                <div key={opt} onClick={() => { setRange(opt); setDropdownOpen(false); setActiveBarName(null); setHoveredBarName(null); }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-white/5"
                  style={{ color: range === opt ? "#22d3ee" : "#a1a1aa", fontFamily: "var(--font-body)" }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chartLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-600 text-sm animate-pulse" style={{ fontFamily: "var(--font-body)" }}>Loading data...</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 12 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 12 }} unit=" L" />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", color: "#ffffff" }}
                itemStyle={{ color: "#ffffff" }}
                formatter={(value: unknown) => [`${value} L`, "Water"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}
                onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
                onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
                onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
                {data.map((entry) => {
                  const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                  return (
                    <Cell key={`cell-${entry.name}`}
                      fill="#22d3ee"
                      fillOpacity={isActive ? 1 : 0.7}
                      className="transition-all duration-300" />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Log banner ── */
function LogBanner({ loggedCount, href }: { loggedCount: number; href: string }) {
  if (loggedCount >= 3) return null;
  return (
    <AnimatePresence>
      <motion.a
        href={href}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl cursor-pointer mb-8"
        style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-50" />
          </div>
          <div>
            <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
              {loggedCount === 0 ? "You haven't logged any habits today" : `${loggedCount}/3 habits logged — keep going!`}
            </p>
            <p className="hidden md:block text-zinc-400 text-sm mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
              Log your habits to update your Eco Score
            </p>
          </div>
        </div>
        <div className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-black"
          style={{ background: "#4ade80" }}>
          Log now
        </div>
      </motion.a>
    </AnimatePresence>
  );
}

/* ── Tips carousel ── */
const TIPS = [
  { icon: "🥗", title: "Eat plant-based", tip: "Choosing a plant-based meal instead of beef saves up to 5 kg CO₂ — that's worth +500 points." },
  { icon: "🚌", title: "Use public transport", tip: "Taking the bus instead of driving 10 minutes saves ~1 kg CO₂ — worth +100 points." },
  { icon: "🚿", title: "Shorter showers", tip: "Cutting your shower from 15 to 5 minutes saves ~0.3 kg CO₂ and conserves water." },
  { icon: "💡", title: "Turn off lights", tip: "Turning off lights when leaving a room saves ~0.05 kg CO₂ per hour — small but it adds up." },
  { icon: "♻️", title: "Recycle more", tip: "Recycling one plastic bottle saves ~0.1 kg CO₂ compared to landfill disposal." },
];

function TipsCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + TIPS.length) % TIPS.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-2xl overflow-hidden mb-8"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-green-400" />
          <p className="text-zinc-300 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
            Daily Tip
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === index ? "16px" : "6px", height: "6px", background: i === index ? "#4ade80" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <div className="flex gap-1">
            {(["←", "→"] as const).map((arrow, i) => (
              <button key={arrow} onClick={() => go(i === 0 ? -1 : 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 hover:text-green-400"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", fontFamily: "var(--font-body)" }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ height: "100px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index} custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex items-center gap-4 px-5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span className="text-3xl shrink-0">{TIPS[index].icon}</span>
            <div>
              <p className="text-white text-sm font-medium mb-1" style={{ fontFamily: "var(--font-body)" }}>{TIPS[index].title}</p>
              <p className="text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>{TIPS[index].tip}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
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

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.firstName) setFirstName(data.firstName.toUpperCase());

        if (data.activities && data.activities.length > 0) {
          const uniqueCategories = Array.from(
            new Set(data.activities.map((a: { category: string }) => {
              const c = a.category.toLowerCase();
              if (c === "shower" || c === "dishwasher") return "water";
              return c;
            }))
          );
          setLoggedToday(uniqueCategories as string[]);
          
          const totalEmissions = data.activities.reduce(
            (sum: number, act: { co2_emissions_kg?: number | string }) => sum + Number(act.co2_emissions_kg || 0), 0
          );
          setEcoScore(Math.max(0, Math.round(1000 - totalEmissions * 50)));
        }

        setStreak(1);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#111318] items-center justify-center">
        <p className="text-green-400 font-mono animate-pulse">Loading...</p>
      </div>
    );
  }

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
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-white leading-none mb-1 uppercase"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                GOOD MORNING, {firstName}
              </h1>
              <p className="text-zinc-400 text-sm flex items-center gap-2" style={{ fontFamily: "var(--font-body)" }}>
                <Calendar size={13} />
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)" }}>
              <Flame size={14} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                {streak} day<span className="hidden md:inline"> streak</span>
              </span>
            </div>
          </motion.div>

          {/* Zon 1: Control Center (Eco Score + Habits) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-8 lg:gap-12"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Vänster: Eco Score Section */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <EcoScoreRing score={ecoScore} />
              <div className="flex gap-4 sm:gap-6 mt-6 pt-6 w-full max-w-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[{ label: "Yesterday", val: "—" }, { label: "Weekly avg", val: "—" }, { label: "Best day", val: "—" }].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <p className="text-white text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>{s.val}</p>
                    <p className="text-zinc-400 text-sm mt-0.5" style={{ fontFamily: "var(--font-body)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avdelare */}
            <div className="hidden lg:block w-px bg-white/5" />
            <div className="block lg:hidden h-px w-full bg-white/5" />

            {/* Höger: Habits Section */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-5">
                <p className="text-zinc-400 text-sm tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
                  Today&apos;s habits
                </p>
                <div className="px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-zinc-300 text-xs font-medium" style={{ fontFamily: "var(--font-body)" }}>
                    {loggedToday.length} / 3 logged
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <CategoryCard icon={Car} label="Transport" color="#fb923c" logged={loggedToday.includes("transport")} href="/dashboard/log" />
                <CategoryCard icon={Droplet} label="Water" color="#22d3ee" logged={loggedToday.includes("water")} href="/dashboard/log" />
                <CategoryCard icon={Zap} label="Energy" color="#c084fc" logged={loggedToday.includes("energy")} href="/dashboard/log" />
              </div>
            </div>
          </motion.div>

          {/* Zon 2: Huvud-KPI (Fullbredds-graf Eco Score) - SWAPPED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <EcoScoreChart />
          </motion.div>

          {/* Zon 3: Support Data & Insights (Nedre Grid) - SWAPPED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            <CO2Chart userId={userId} />
            <WaterChart />
            <EnergyChart />
          </motion.div>

          {/* Zon 4: Footer-tips */}
          <TipsCarousel />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}