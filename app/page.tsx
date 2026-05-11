"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sprout, Leaf, BarChart2, Trophy, ArrowRight, Zap, Users, ChevronDown } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

/* ─── Section divider ─── */
function SectionDivider() {
  return (
    <div className="relative h-24 -my-1 pointer-events-none overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-full"
        style={{ background: "linear-gradient(180deg, transparent 0%, var(--accent-green-subtle) 50%, transparent 100%)" }} />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px mx-12 md:mx-24"
        style={{ background: "linear-gradient(90deg, transparent, var(--accent-green-dim), transparent)" }} />
    </div>
  );
}

/* ─── Fade-in on scroll ─── */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: Leaf, title: "Track Daily Habits", desc: "Log your transport, food, and energy habits in seconds. Every choice counts." },
  { icon: BarChart2, title: "See Your Impact", desc: "Visualize your carbon footprint over time with clear, beautiful charts." },
  { icon: Trophy, title: "Compete & Improve", desc: "Challenge friends, join groups, and climb the leaderboard while saving the planet." },
  { icon: Zap, title: "Eco Score", desc: "Get a daily score out of 1000 that reflects your environmental impact." },
  { icon: Users, title: "Groups", desc: "Create teams and work towards a shared sustainability goal together." },
  { icon: Sprout, title: "Daily Tips", desc: "Receive personalized suggestions to reduce your footprint every day." },
];

const STATS = [
  { val: "3", label: "Habit categories" },
  { val: "1000", label: "Max daily Eco Score" },
  { val: "CO₂", label: "Tracked in real time" },
];

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setHasSession(true);
      }
    };
    checkSession();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: isDark ? "rgba(17,19,24,0.85)" : "rgba(244,244,245,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <Sprout className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" style={{ color: "var(--accent-green)" }} />
          <span className="gradient-text font-bold tracking-widest"
            style={{ fontFamily: "var(--font-display)", fontSize: "18px" }}>
            ECO TRACKER
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {hasSession ? (
            <Link href="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
              Dashboard
            </Link>
          ) : (
            <>
              {/* Sign in hidden on mobile */}
              <Link href="/login"
                className="hidden sm:block text-sm transition-colors px-4 py-2 hover:opacity-70"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Sign in
              </Link>
              <Link href="/register"
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-16 px-6 md:px-12 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium"
            style={{ background: "var(--accent-green-badge)", border: "1px solid var(--accent-green-badge-border)", color: "var(--accent-green)", fontFamily: "var(--font-body)", letterSpacing: "0.1em" }}>
            🌿 Track your habits. Help the planet.
          </div>

          <h1 className="gradient-text leading-none mb-6"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3.5rem, 9vw, 8rem)", letterSpacing: "-0.01em" }}>
            YOUR DAILY<br />CHOICES MATTER
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
            Eco Tracker helps you understand and reduce your environmental impact — one habit at a time. Track, improve, and compete with friends.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {hasSession ? (
              <Link href="/dashboard"
                className="flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105"
                style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link href="/register"
                  className="flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105"
                  style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
                  Start for free <ArrowRight size={18} />
                </Link>
                <Link href="/login"
                  className="hidden sm:flex items-center gap-2 text-sm transition-colors px-6 py-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-body)" }}>
                  Sign in
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-8 md:gap-12 mt-16 flex-wrap"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold mb-1"
                style={{ color: "var(--accent-green)", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>{s.val}</p>
              <p className="text-xs tracking-widest uppercase"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="flex flex-col items-center gap-2 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-xs tracking-widest uppercase"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Dashboard preview ── */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-8">
        <FadeIn>
          <div className="rounded-2xl overflow-hidden p-6 md:p-10 shadow-lg"
            style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-xs ml-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                dashboard · eco-tracker.app
              </span>
            </div>
            
            <div className="flex flex-col gap-4 opacity-90 pointer-events-none">
              
              {/* Mock Control Center */}
              <div className="rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row gap-8 lg:gap-12"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Mock Eco Score Ring */}
                  <div className="relative w-32 h-32 mb-3 flex items-center justify-center">
                    <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" style={{ stroke: "var(--border-strong)" }} strokeWidth="8" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent-green)" strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={314} strokeDashoffset={314 * 0.28} />
                    </svg>
                    <div className="text-center">
                      <span className="text-3xl font-bold block leading-none" style={{ color: "var(--accent-green)", fontFamily: "var(--font-display)" }}>724</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full mt-4 pt-4" style={{ borderTop: "1px solid var(--border-faint)" }}>
                    <div className="flex-1 text-center"><p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>710</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Yesterday</p></div>
                    <div className="flex-1 text-center"><p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>680</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Avg</p></div>
                  </div>
                </div>
                
                <div className="hidden lg:block w-px" style={{ background: "var(--border-faint)" }} />
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Habits</p>
                     <p className="text-xs" style={{ color: "var(--text-secondary)" }}>2 / 3</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-subtle)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: "#fb923c" }} />
                      <span className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>Transport</span>
                      <span className="ml-auto text-xs" style={{ color: "var(--text-secondary)" }}>✓</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-card-nested)", border: "1px solid var(--border-subtle)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-strong)" }} />
                      <span className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Energy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock CO2 Chart */}
              <div className="rounded-2xl p-6 h-32 flex flex-col justify-between"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>CO₂ Usage</p>
                  <div className="flex items-end gap-2 h-16 opacity-50">
                    <div className="w-full bg-orange-400/80 rounded-t-sm h-[40%]" />
                    <div className="w-full bg-orange-400/80 rounded-t-sm h-[60%]" />
                    <div className="w-full bg-orange-400/80 rounded-t-sm h-[30%]" />
                    <div className="w-full bg-orange-400/80 rounded-t-sm h-[80%]" />
                    <div className="w-full bg-orange-400/80 rounded-t-sm h-[50%]" />
                  </div>
              </div>

            </div>
          </div>
        </FadeIn>
      </section>

      <SectionDivider />

      {/* ── Features ── */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-8">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase mb-3 text-center"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Features</p>
          <h2 className="text-center leading-none mb-12"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,4rem)" }}>
            EVERYTHING YOU NEED
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.07}>
              <div className="rounded-2xl h-full transition-all duration-200 p-4 md:p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="hidden md:flex w-10 h-10 rounded-xl items-center justify-center mb-4"
                  style={{ background: "var(--accent-green-subtle)" }}>
                  <f.icon size={20} style={{ color: "var(--accent-green)" }} />
                </div>
                <div className="flex md:hidden items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-green)" }} />
                </div>
                <p className="font-medium mb-1 text-xs md:text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                  {f.title}
                </p>
                <p className="text-xs leading-relaxed hidden sm:block" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Why it matters ── */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-8">
        <FadeIn>
          <div className="rounded-2xl p-8 md:p-12 text-center"
            style={{ background: "var(--accent-green-badge)", border: "1px solid var(--accent-green-badge-border)" }}>
            <p className="text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--accent-green)", fontFamily: "var(--font-body)" }}>Why it matters</p>
            <h2 className="leading-none mb-6"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,4rem)" }}>
              SMALL HABITS,<br />BIG IMPACT
            </h2>
            <p className="text-base max-w-2xl mx-auto leading-relaxed mb-8"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              The average person produces 12 kg of CO₂ every single day. Most of it comes from choices we barely notice — what we eat, how we travel, how much energy we use. Eco Tracker makes these invisible choices visible, so you can act on them. Aligned with UN Sustainable Development Goal 13: Climate Action.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105"
              style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
              Start tracking today <ArrowRight size={18} />
            </Link>
          </div>
        </FadeIn>
      </section>

      <SectionDivider />

      {/* ── How it works ── */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-8">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase mb-3 text-center"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>How it works</p>
          <h2 className="text-center leading-none mb-12"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,4rem)" }}>
            THREE SIMPLE STEPS
          </h2>
        </FadeIn>
        <div className="relative">
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--accent-green-border), transparent)" }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { step: "01", title: "Log your habits", desc: "Takes less than a minute. Choose transport, food, or energy and fill in what you did today.", icon: "🌿" },
              { step: "02", title: "See your Eco Score", desc: "Get an instant score out of 1000 that reflects your daily environmental impact.", icon: "📊" },
              { step: "03", title: "Improve & compete", desc: "Track progress over time, get tips, and challenge friends on the leaderboard.", icon: "🏆" },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.12}>
                <div className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 p-5 md:p-6 rounded-2xl md:text-center"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex md:flex-col items-center gap-3 md:gap-2 md:mb-5 shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shrink-0"
                      style={{ background: "var(--accent-green-dim)", border: "1px solid var(--accent-green-border)" }}>
                      {s.icon}
                    </div>
                    <span className="text-xs font-bold tracking-widest"
                      style={{ color: "var(--accent-green)", fontFamily: "var(--font-display)" }}>{s.step}</span>
                  </div>
                  <div>
                    <p className="font-medium mb-1.5 text-sm md:mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                      {s.title}
                    </p>
                    <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-24">
        <FadeIn>
          <div className="relative rounded-2xl overflow-hidden p-8 md:p-16 text-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 100%, var(--accent-green-badge), transparent 65%)" }} />
            <div className="relative z-10">
              <p className="text-xs tracking-widest uppercase mb-4"
                style={{ color: "var(--accent-green)", fontFamily: "var(--font-body)" }}>Ready to start?</p>
              <h2 className="leading-none mb-4"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,6vw,5rem)" }}>
                JOIN THE MOVEMENT
              </h2>
              <p className="text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Start tracking your habits today. It&apos;s free, takes less than a minute to set up, and every log makes a difference.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105"
                  style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}>
                  Create free account <ArrowRight size={18} />
                </Link>
                <Link href="/login"
                  className="w-full sm:w-auto flex items-center justify-center text-sm transition-colors px-8 py-3.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-body)" }}>
                  Already have an account
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 py-12"
        style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
            <span className="gradient-text font-bold"
              style={{ fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "0.1em" }}>
              ECO TRACKER
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            © 2026 Eco Habit Tracker. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "var(--accent-green-badge)", border: "1px solid var(--accent-green-badge-border)" }}>
            <span className="text-xs" style={{ color: "var(--accent-green)", fontFamily: "var(--font-body)" }}>
              Aligned with UN SDG 13 – Climate Action
            </span>
          </div>
        </div>
      </footer>

    </main>
  );
}