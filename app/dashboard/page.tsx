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
  // Dynamisk färg beroende på score
  const scoreColor = score > 700 ? "var(--accent-green)" : score > 400 ? "#facc15" : "#f87171";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius}
            fill="none" style={{ stroke: "var(--border-strong)" }} strokeWidth="10" />
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: "52px", color: scoreColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-sm tracking-widest uppercase mt-1"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Eco Score
          </span>
        </div>
      </div>
      <p className="text-sm mt-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
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
        background: "var(--bg-card)",
        border: logged ? `1px solid ${color}40` : "1px solid var(--border-subtle)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: logged ? "var(--text-secondary)" : "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          {logged ? "✓ Logged today" : "Not logged yet"}
        </p>
      </div>
      {!logged && (
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-black/5 dark:group-hover:bg-white/10"
          style={{ border: "1px solid var(--border-strong)" }}>
          <Plus size={16} className="transition-colors duration-300" style={{ color: "var(--text-muted)" }} strokeWidth={2.5} />
        </div>
      )}
    </motion.a>
  );
}

/* ── Eco Score chart (Area Chart med Gradient) ── */
function EcoScoreChart() {
  const [range, setRange] = useState("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // FIX: setTimeout för att undvika ESLint's cascading render error
    setTimeout(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    }, 0);
    
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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
  const chartColor = isDark ? "#4ade80" : "#16a34a";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Eco Score – last 7 days
        </p>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}
            <ChevronDown size={14} />
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
            <Tooltip 
              cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              formatter={(value: unknown) => [`${value}`, "Eco Score"]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#ecoGradient)" 
              activeDot={{ r: 6, fill: chartColor, stroke: tooltipBg, strokeWidth: 2 }}
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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    
    // FIX: setTimeout för att undvika ESLint's cascading render error
    setTimeout(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    }, 0);
    
    const observer = new MutationObserver(() => setIsDark(document.documentElement.getAttribute("data-theme") !== "light"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { window.removeEventListener("resize", check); observer.disconnect(); };
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
  const chartColor = "#c084fc";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Energy usage
        </p>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range}
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}>
              {["week", "month", "year"].map((opt) => (
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
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 12 }} />
            <YAxis stroke={axisColor} tick={{ fontSize: 12 }} unit=" kWh" />
            <Tooltip cursor={{ fill: "transparent" }}
              contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              formatter={(value: unknown) => [`${value} kWh`, "Energy"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}
              onMouseEnter={(entry) => { if (!isMobile && entry?.name) setHoveredBarName(entry.name); }}
              onMouseLeave={() => { if (!isMobile) setHoveredBarName(null); }}
              onClick={(entry) => { if (isMobile && entry?.name) setActiveBarName(entry.name); }}>
              {data.map((entry) => {
                const isActive = (isMobile && activeBarName === entry.name) || (!isMobile && hoveredBarName === entry.name);
                return (
                  <Cell key={`cell-${entry.name}`}
                    fill={chartColor}
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
  const [isDark, setIsDark] = useState(true);

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
    
    // FIX: setTimeout för att undvika ESLint's cascading render error
    setTimeout(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    }, 0);
    
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
  const chartColor = "#fb923c";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            CO₂ usage
          </p>

          <div className="relative" ref={popoverRef}>
            <button
              onClick={handleInfoClick}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: popoverOpen ? "rgba(251,146,60,0.15)" : "var(--bg-card-deep)",
                border: `1px solid ${popoverOpen ? "rgba(251,146,60,0.3)" : "var(--border-strong)"}`,
              }}
            >
              {popoverOpen ? <X size={11} className="text-orange-400" /> : <Info size={11} style={{ color: "var(--text-muted)" }} />}
            </button>

            <AnimatePresence>
              {popoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute -left-20 md:left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[85vw] sm:w-65 shadow-2xl"
                  style={{
                    background: "var(--bg-elevated)", border: "1px solid rgba(251,146,60,0.2)",
                    maxWidth: "280px"
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
                    <p className="text-xs animate-pulse" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Calculating your impact...</p>
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{engagingText}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range} <ChevronDown size={14} />
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
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
                itemStyle={{ color: tooltipText }}
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
                      fill={chartColor}
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
  const [isDark, setIsDark] = useState(true);

  const [weeklyData, setWeeklyData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    
    // FIX: setTimeout för att undvika ESLint's cascading render error
    setTimeout(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    }, 0);
    
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
  const chartColor = "#22d3ee";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#ffffff" : "#09090b";

  return (
    <div className="rounded-2xl p-6 relative"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Water usage
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            {range} <ChevronDown size={14} />
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
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", color: tooltipText }}
                itemStyle={{ color: tooltipText }}
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
                      fill={chartColor}
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
  if (loggedCount >= 1) return null;
  
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
        style={{ background: "var(--accent-green-subtle)", border: "1px solid var(--accent-green-badge-border)" }}
      >
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
        <div className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-black"
          style={{ background: "var(--accent-green)" }}>
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
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: "var(--bg-card-nested)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: "var(--accent-green)" }} />
          <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            Daily Tip
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === index ? "16px" : "6px", height: "6px", background: i === index ? "var(--accent-green)" : "var(--border-strong)" }} />
            ))}
          </div>
          <div className="flex gap-1">
            {(["←", "→"] as const).map((arrow, i) => (
              <button key={arrow} onClick={() => go(i === 0 ? -1 : 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ height: "100px", background: "var(--bg-card)" }}>
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
          >
            <span className="text-3xl shrink-0">{TIPS[index].icon}</span>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>{TIPS[index].title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>{TIPS[index].tip}</p>
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

        if (data.ecoScore !== undefined) {
          setEcoScore(data.ecoScore);
        }
        
        if (data.activities && data.activities.length > 0) {
          const uniqueCategories = Array.from(
            new Set(data.activities.map((a: { category: string }) => {
              const c = a.category.toLowerCase();
              if (c === "shower" || c === "dishwasher") return "water";
              return c;
            }))
          );
          setLoggedToday(uniqueCategories as string[]);
          
        }

        // --- STREAK CALCULATION LOGIC ---
        if (user) {
          const { data: history } = await supabase
            .from("eco_activities")
            .select("day")
            .eq("user_id", user.id)
            .order("day", { ascending: false });

          if (history && history.length > 0) {
            const uniqueDates = Array.from(
              new Set(
                history.map((row) => {
                  const d = new Date(row.day);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  return d.toISOString().split("T")[0];
                })
              )
            );

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
              
              while (uniqueDates.includes(getOffsetDate(offset))) {
                calculatedStreak++;
                offset++;
              }
            }
            setStreak(calculatedStreak);
          } else {
             setStreak(0);
          }
        }

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
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p className="font-mono animate-pulse" style={{ color: "var(--accent-green)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
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
              <h1 className="leading-none mb-1 uppercase"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                GOOD MORNING, {firstName}
              </h1>
              <p className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                <Calendar size={13} />
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full"
              style={{ background: "var(--accent-green-badge)", border: "1px solid var(--accent-green-badge-border)" }}>
              <Flame size={14} style={{ color: "var(--accent-green)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--accent-green)", fontFamily: "var(--font-body)" }}>
                {streak} day<span className="hidden md:inline"> streak</span>
              </span>
            </div>
          </motion.div>

          <LogBanner loggedCount={loggedToday.length} href="/dashboard/log" />

          {/* Zon 1: Control Center (Eco Score + Habits) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-6 sm:p-8 mb-8 flex flex-col lg:flex-row gap-8 lg:gap-12 shadow-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            {/* Vänster: Eco Score Section */}
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

            {/* Avdelare */}
            <div className="hidden lg:block w-px" style={{ background: "var(--border-faint)" }} />
            <div className="block lg:hidden h-px w-full" style={{ background: "var(--border-faint)" }} />

            {/* Höger: Habits Section */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Today&apos;s habits
                </p>
                <div className="px-3 py-1 rounded-full" style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                    {loggedToday.length} / 3 logged
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <CategoryCard icon={Car} label="Transport" color="#fb923c" logged={loggedToday.includes("transport")} href="/dashboard/log?tab=transport" />
                <CategoryCard icon={Droplet} label="Water" color="#22d3ee" logged={loggedToday.includes("water")} href="/dashboard/log?tab=water" />
                <CategoryCard icon={Zap} label="Energy" color="#c084fc" logged={loggedToday.includes("energy")} href="/dashboard/log?tab=energy" />
              </div>
            </div>
          </motion.div>

          {/* Zon 2: Huvud-KPI (Fullbredds-graf Eco Score) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <EcoScoreChart />
          </motion.div>

          {/* Zon 3: Support Data & Insights (Nedre Grid) */}
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