"use client";

import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import { Leaf, Zap, Car, TrendingUp, Flame, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/utils/supabase";

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
          {/* Track */}
          <circle cx="100" cy="100" r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          {/* Progress */}
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
        </svg>
        {/* Score text */}
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
          <span className="text-xs text-zinc-500 tracking-widest uppercase mt-1"
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
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col gap-3 p-5 rounded-2xl cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: logged ? `1px solid ${color}44` : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: logged ? color : "#52525b", fontFamily: "var(--font-body)" }}>
          {logged ? "✓ Logged today" : "Not logged yet"}
        </p>
      </div>
    </motion.a>
  );
}

/* ── Placeholder chart ── */
function ChartPlaceholder({ label }: { label: string }) {
  const bars = [40, 65, 50, 80, 70, 90, 75];
  return (
    <div className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-zinc-400 text-xs tracking-widest uppercase mb-4"
        style={{ fontFamily: "var(--font-body)" }}>{label}</p>
      <div className="flex items-end gap-2 h-24">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t-md"
            style={{ background: "linear-gradient(180deg, #4ade80, #22d3ee33)" }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="flex-1 text-center text-xs text-zinc-600"
            style={{ fontFamily: "var(--font-body)" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}


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
      style={{ border: "1px solid rgba(74,222,128,0.15)" }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: "rgba(74,222,128,0.08)", borderBottom: "1px solid rgba(74,222,128,0.1)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-green-400" />
          <p className="text-green-400 text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-body)" }}>Daily Tip</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dots */}
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
          {/* Arrows */}
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

      {/* Content */}
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
/* ── Main page ── */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("USER");
  const [ecoScore, setEcoScore] = useState(1000); // Default perfect score
  const [streak, setStreak] = useState(0);
  const [loggedToday, setLoggedToday] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPersonalData() {
      // 1. Get the currently logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Fetch their real first name from the profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();

        if (profile?.first_name) {
          setFirstName(profile.first_name.toUpperCase());
        }

        // 3. Fetch today's eco activities
        const today = new Date().toISOString().split("T")[0]; // gets YYYY-MM-DD
        const { data: activities } = await supabase
          .from("eco_activities")
          .select("category, co2_emissions_kg")
          .eq("user_id", user.id)
          .gte("activity_date", today); // Only activities from today

        if (activities && activities.length > 0) {
          // Find out which categories they logged today
          const categories = activities.map((a) => a.category.toLowerCase());
          setLoggedToday(categories);

          // Calculate a dynamic Eco Score (Example logic: start at 1000, drop by 50 per kg of CO2)
          const totalEmissions = activities.reduce((sum, act) => sum + Number(act.co2_emissions_kg || 0), 0);
          const dynamicScore = Math.max(0, 1000 - (totalEmissions * 50));
          setEcoScore(Math.round(dynamicScore));
        }

        // Hardcoding streak for now until you build a historical streak calculator
        setStreak(1);
      }
      
      setLoading(false);
    }

    fetchPersonalData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#030712] items-center justify-center">
        <p className="text-green-400 font-mono animate-pulse">Loading personal data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h1 className="text-white leading-none mb-1 uppercase"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
                GOOD MORNING, {firstName}
              </h1>
              <p className="text-zinc-500 text-sm flex items-center gap-2"
                style={{ fontFamily: "var(--font-body)" }}>
                <Calendar size={13} />
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <Flame size={14} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                {streak} day streak
              </span>
            </div>
          </motion.div>

          {/* Score + categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Eco Score card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl p-8 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #0f172a 0%, #052e16 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              }}
            >
              <EcoScoreRing score={ecoScore} />
              <div className="flex gap-6 mt-6 pt-6 w-full"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {[
                  { label: "Yesterday", val: "—" }, // Can be made dynamic later
                  { label: "Weekly avg", val: "—" },
                  { label: "Best day", val: "—" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 text-center">
                    <p className="text-white text-base font-semibold"
                      style={{ fontFamily: "var(--font-display)" }}>{s.val}</p>
                    <p className="text-zinc-600 text-xs mt-0.5"
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
                <p className="text-zinc-400 text-xs tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-body)" }}>
                  Today&apos;s habits
                </p>
                <p className="text-zinc-600 text-xs" style={{ fontFamily: "var(--font-body)" }}>
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

          {/* Progress placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
          >
            <ChartPlaceholder label="Eco Score – last 7 days" />
            <ChartPlaceholder label="CO₂ usage – last 7 days" />
          </motion.div>

          <TipsCarousel />
        </div>
      </main>
    </div>
  );
}