"use client";

import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { Leaf, Zap, Car, TrendingUp, Flame, Calendar, Plus, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
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
function CategoryCard({
  icon: Icon, label, color, logged, href,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  logged: boolean;
  href: string;
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
        <p className="text-sm mt-0.5" style={{ color: logged ? color : "#71717a", fontFamily: "var(--font-body)" }}>
          {logged ? "✓ Logged today" : "Not logged yet"}
        </p>
      </div>
      {!logged && (
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 group-hover:bg-green-400/20"
          style={{ border: "1px solid rgba(74,222,128,0.3)" }}
        >
          <Plus size={16} className="text-green-400" strokeWidth={2.5} />
        </div>
      )}
    </motion.a>
  );
}

/* ── Placeholder chart ── */
function ChartPlaceholder({ label }: { label: string }) {
  const [range, setRange] = useState("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const datasets = {
    week: [
      { name: "M", value: 18 },
      { name: "T", value: 25 },
      { name: "W", value: 20 },
      { name: "T", value: 28 },
      { name: "F", value: 22 },
      { name: "S", value: 30 },
      { name: "S", value: 24 },
    ],

    month: [
      { name: "W1", value: 120 },
      { name: "W2", value: 98 },
      { name: "W3", value: 135 },
      { name: "W4", value: 110 },
      { name: "W5", value: 126 },
    ],

    year: [
      { name: "Jan", value: 410 },
      { name: "Feb", value: 380 },
      { name: "Mar", value: 450 },
      { name: "Apr", value: 420 },
      { name: "May", value: 470 },
      { name: "Jun", value: 430 },
      { name: "Jul", value: 490 },
      { name: "Aug", value: 460 },
      { name: "Sep", value: 440 },
      { name: "Oct", value: 500 },
      { name: "Nov", value: 470 },
      { name: "Dec", value: 520 },
    ],
  };

  const data = datasets[range as keyof typeof datasets];

  return (
    <div
  className="rounded-2xl p-6 relative"
  style={{
    overflow: "visible", 
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  }}
>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p
          className="text-zinc-400 text-sm tracking-widest uppercase"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {label}
        </p>

        <div className="relative">
  <button
    onClick={() => setDropdownOpen(!dropdownOpen)}
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      color: "#a1a1aa",
    }}
  >
    {range}
    <ChevronDown size={14} />
  </button>

  {dropdownOpen && (
    <div
        className="absolute right-0 mt-2 rounded-xl overflow-hidden z-999"     
        
        style={{
        background: "#1e2128",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      {["week", "month", "year"].map((opt) => (
        <div
          key={opt}
          onClick={() => {
            setRange(opt);
            setDropdownOpen(false);
          }}
          className="px-4 py-2 text-sm cursor-pointer"
          style={{
            color: range === opt ? "#4ade80" : "#a1a1aa",
          }}
        >
          {opt}
        </div>
      ))}
    </div>
  )}
</div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 260, position: "relative", zIndex: 1 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#71717a"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#71717a"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "12px",
              }}
            />
            <Bar
              dataKey="value"
              fill="#4ade80"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
        style={{
          background: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.18)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-50" />
          </div>
          <div>
            <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
              {loggedCount === 0
                ? "You haven't logged any habits today"
                : `${loggedCount}/3 habits logged — keep going!`}
            </p>
            <p className="text-zinc-400 text-sm mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
              Log your habits to update your Eco Score
            </p>
          </div>
        </div>
        <div
          className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-black"
          style={{ background: "#4ade80" }}
        >
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
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-green-400" />
          <p className="text-zinc-300 text-sm tracking-widest uppercase"
            style={{ fontFamily: "var(--font-body)" }}>Daily Tip</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? "16px" : "6px",
                  height: "6px",
                  background: i === index ? "#4ade80" : "rgba(255,255,255,0.15)",
                }} />
            ))}
          </div>
          <div className="flex gap-1">
            {(["←", "→"] as const).map((arrow, i) => (
              <button key={arrow} onClick={() => go(i === 0 ? -1 : 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 hover:text-green-400"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#71717a",
                  fontFamily: "var(--font-body)",
                }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ height: "100px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex items-center gap-4 px-5"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span className="text-3xl shrink-0">{TIPS[index].icon}</span>
            <div>
              <p className="text-white text-sm font-medium mb-1" style={{ fontFamily: "var(--font-body)" }}>
                {TIPS[index].title}
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                {TIPS[index].tip}
              </p>
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
  const [ecoScore, setEcoScore] = useState(1000);
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPersonalData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();
        if (profile?.first_name) setFirstName(profile.first_name.toUpperCase());

        const today = new Date().toISOString().split("T")[0];
        const { data: activities } = await supabase
          .from("eco_activities")
          .select("category, co2_emissions_kg")
          .eq("user_id", user.id)
          .gte("activity_date", today);

        if (activities && activities.length > 0) {
          const categories = activities.map((a) => a.category.toLowerCase());
          setLoggedToday(categories);
          const totalEmissions = activities.reduce((sum, act) => sum + Number(act.co2_emissions_kg || 0), 0);
          setEcoScore(Math.max(0, Math.round(1000 - totalEmissions * 50)));
        }
        setStreak(1);
      }
      setLoading(false);
    }
    fetchPersonalData();
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
              <p className="text-zinc-400 text-sm flex items-center gap-2"
                style={{ fontFamily: "var(--font-body)" }}>
                <Calendar size={13} />
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)" }}>
              <Flame size={14} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                {streak} day streak
              </span>
            </div>
          </motion.div>

          {/* Log banner */}
          <LogBanner loggedCount={loggedToday.length} href="/dashboard/log" />

          {/* Score + categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Eco Score card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl p-8 flex flex-col items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <EcoScoreRing score={ecoScore} />
              <div className="flex gap-6 mt-6 pt-6 w-full"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Yesterday", val: "—" },
                  { label: "Weekly avg", val: "—" },
                  { label: "Best day", val: "—" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <p className="text-white text-base font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}>{s.val}</p>
                    <p className="text-zinc-400 text-sm mt-0.5"
                      style={{ fontFamily: "var(--font-body)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-body)" }}>
                  Today&apos;s habits
                </p>
                <p className="text-zinc-400 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                  {loggedToday.length} / 3 logged
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <CategoryCard icon={Car} label="Transport" color="#22d3ee" logged={loggedToday.includes("transport")} href="/dashboard/log" />
                <CategoryCard icon={Leaf} label="Food" color="#4ade80" logged={loggedToday.includes("food")} href="/dashboard/log" />
                <CategoryCard icon={Zap} label="Energy" color="#facc15" logged={loggedToday.includes("energy")} href="/dashboard/log" />
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            <ChartPlaceholder label="Eco Score – last 7 days" />
            <ChartPlaceholder label="CO₂ usage – last 7 days" />
          </motion.div>

          <TipsCarousel />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}