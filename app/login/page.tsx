"use client";

import { handleLogin } from "@/app/lib/auth-actions";
import { useRouter } from "next/navigation";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  AnimatePresence,
} from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sprout } from "lucide-react";

/* ─────────── Canvas particle system ─────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#4ade80", "#22d3ee", "#86efac", "#67e8f9", "#60a5fa"];
    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.4 + 0.15,
      opacity: Math.random() * 0.35 + 0.05,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.rotation += p.rotSpeed;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}

/* ─────────── Floating label input ─────────── */
function FloatingInput({
  label,
  type,
  value,
  onChange,
  right,
  autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value !== "";

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        required
        className="w-full rounded-2xl px-[clamp(1rem,1.5vw,1.5rem)] pt-[clamp(1.5rem,2vw,2rem)] pb-[clamp(0.75rem,1vw,1rem)] text-[clamp(1rem,1.1vw,1.125rem)] text-white outline-none placeholder-transparent"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: focused
            ? "0 0 24px rgba(74,222,128,0.1), inset 0 0 16px rgba(74,222,128,0.03)"
            : "none",
          transition: "border-color 0.25s, box-shadow 0.25s",
          paddingRight: right ? "50px" : "24px",
          fontFamily: "var(--font-body)",
        }}
      />
      <label
        style={{
          position: "absolute",
          left: "24px",
          top: active ? "12px" : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? "11px" : "16px",
          color: active ? (focused ? "#4ade80" : "#52525b") : "#52525b",
          letterSpacing: active ? "0.12em" : "0",
          textTransform: active ? "uppercase" : "none",
          pointerEvents: "none",
          transition: "all 0.2s ease",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </label>
      {right && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}

/* ─────────── Main page ─────────── */
export default function LoginPage() {
  const router = useRouter();   //för att kunna komma vidare till dashboard
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const lightBg = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(34,197,94,0.05), transparent 55%)`;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return triggerError("Enter a valid email address");
    setError("");
    setStep(1);
  };

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (password.length < 6) return triggerError("Password must be at least 6 characters");
  
    try {
      //anropar auth_actions
      await handleLogin(email, password);
  
      //Om det lyckas, skicka användaren till dashboarden
      router.push("/dashboard"); 
  
    } catch (err: unknown) {
      // Om det blir fel (t.ex. fel lösenord), visa det i deras UI
      const message = err instanceof Error ? err.message : "Invalid email or password";
      triggerError(message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row overflow-hidden relative bg-[#030712]">

      {/* Particles */}
      <ParticleCanvas />

      {/* Mouse light */}
      <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ background: lightBg }} />

      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aurora-blob w-175 h-175 bg-green-500/20"
          style={{ top: "-15%", left: "-10%", animation: "aurora-a 14s ease-in-out infinite" }} />
        <div className="aurora-blob w-137.5 h-137.5 bg-cyan-500/15"
          style={{ top: "25%", right: "-8%", animation: "aurora-b 17s ease-in-out infinite" }} />
        <div className="aurora-blob w-112.5 h-112.5 bg-blue-600/10"
          style={{ bottom: "-10%", left: "25%", animation: "aurora-a 20s ease-in-out infinite reverse" }} />
      </div>

      {/* ── LEFT – branding ── */}
      {/* 1. Ändrat padding: lagt till pl-[clamp(2rem,8vw,8rem)] för att styra offsetten från vänsterkanten mjukt */}
      <div className="hidden lg:flex flex-col justify-center w-full lg:w-1/2 relative z-10 min-h-screen pr-8 pl-[clamp(2rem,8vw,24rem)]">
        {/* 2. Tagit bort ml-auto och mr-... så att den lägger sig snyggt till vänster inom sin halva */}
        <div className="w-full max-w-[clamp(400px,35vw,600px)]">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sprout className="text-green-400 mb-8 w-[clamp(4rem,7vw,8rem)] h-[clamp(4rem,7vw,8rem)]" />
            </motion.div>

            <h1
              className="gradient-text leading-none mb-6 text-[clamp(4rem,8vw,8.5rem)]"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.01em",
              }}
            >
              ECO<br />TRACKER
            </h1>

            <p
              className="text-zinc-300 mb-16 text-[clamp(1rem,1.2vw,1.5rem)] whitespace-nowrap"
              style={{
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                fontFamily: "var(--font-body)",
              }}
            >
              Track your habits. Help the planet.
            </p>

            <div className="flex flex-wrap gap-[clamp(1.5rem,3vw,3.5rem)]">
              {[
                { val: "0 kg", label: "CO₂ saved today" },
                { val: "0", label: "Habits logged" },
                { val: "0", label: "Day streak" },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    className="font-bold text-green-400 text-[clamp(1.5rem,2.5vw,2.5rem)]"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                  >
                    {s.val}
                  </div>
                  <div className="text-zinc-300 tracking-widest uppercase mt-2 text-[clamp(0.7rem,0.9vw,1rem)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT – login card ── */}
      <div className="flex items-center justify-center w-full lg:w-1/2 px-4 sm:px-8 py-16 relative z-10 min-h-screen">
        <div className="w-full flex flex-col items-center">

          {/* Mobile logo */}
          <motion.div
            className="lg:hidden text-center mb-10 w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
               {/* Mobil-loggan skalar också mjukt nu */}
               <Sprout className="text-green-400 w-[clamp(4rem,10vw,6rem)] h-[clamp(4rem,10vw,6rem)]" />
            </div>
            {/* Rubriken bryts inte fult på små mobiler */}
            <h1
              className="gradient-text leading-none text-[clamp(3.5rem,12vw,5rem)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ECO TRACKER
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="w-full max-w-[clamp(340px,35vw,650px)]"
          >
            <div
              className={`relative z-10 rounded-3xl p-[clamp(2rem,4vw,4rem)] w-full ${shaking ? "shake" : ""}`}
              style={{
                background: "linear-gradient(145deg, #0f172a 0%, #064e3b 100%)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              }}
            >
              {/* Progress bar */}
              <div className="flex gap-2 mb-10">
                {[0, 1].map((s) => (
                  <div key={s} className="h-2 flex-1 rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      className="h-full"
                      style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: step >= s ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 0 ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28 }}
                  >
                    <p className="text-zinc-300 tracking-[0.2em] uppercase mb-4 text-[clamp(0.8rem,1vw,1rem)]"
                      style={{ fontFamily: "var(--font-body)" }}>
                      Step 1 of 2
                    </p>
                    <h2
                      className="text-white mb-4 leading-none text-[clamp(2.5rem,4vw,4rem)]"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                    >
                      WELCOME BACK
                    </h2>
                    <p className="text-zinc-300 mb-10 text-[clamp(1rem,1.1vw,1.125rem)]">Enter your email to continue</p>

                    <form onSubmit={onEmailSubmit} className="space-y-6">
                      <FloatingInput
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(v) => { setEmail(v); setError(""); }}
                        autoFocus
                      />
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            key="err"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-400 text-sm"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <motion.button
                        type="submit"
                        /* Förbättrad klickyta på knappar py-[clamp(1.2rem...)] */
                        className="w-full rounded-2xl font-semibold text-black flex items-center justify-center gap-3 py-[clamp(1.2rem,1.5vw,1.5rem)] text-[clamp(1rem,1.1vw,1.125rem)]"
                        style={{
                          background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
                          fontFamily: "var(--font-body)",
                        }}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(74,222,128,0.35)" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Continue <ArrowRight size={22} />
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28 }}
                  >
                    <p className="text-zinc-300 tracking-[0.2em] uppercase mb-4 text-[clamp(0.8rem,1vw,1rem)]"
                      style={{ fontFamily: "var(--font-body)" }}>
                      Step 2 of 2
                    </p>
                    <h2
                      className="text-white mb-4 leading-none text-[clamp(2.5rem,4vw,4rem)]"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}
                    >
                      SIGN IN
                    </h2>
                    <p className="text-zinc-300 mb-10 text-[clamp(1rem,1.1vw,1.125rem)]">
                      <span className="text-green-400">{email}</span>
                    </p>

                    <form onSubmit={onLoginSubmit} className="space-y-6">
                      <FloatingInput
                        label="Password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(v) => { setPassword(v); setError(""); }}
                        autoFocus
                        right={
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="text-zinc-400 hover:text-green-400 transition-colors"
                          >
                            {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                          </button>
                        }
                      />
                      <AnimatePresence>
                        {error && (
                          <motion.p
                            key="err"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-red-400 text-sm"
                          >
                            {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <motion.button
                        type="submit"
                        /* Förbättrad klickyta py-[clamp(1.2rem...)] */
                        className="w-full rounded-2xl font-semibold text-black py-[clamp(1.2rem,1.5vw,1.5rem)] text-[clamp(1rem,1.1vw,1.125rem)]"
                        style={{
                          background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
                          fontFamily: "var(--font-body)",
                        }}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(74,222,128,0.35)" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Sign in
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => { setStep(0); setError(""); }}
                        className="w-full text-center text-zinc-400 hover:text-zinc-200 transition-colors pt-3 text-[clamp(0.9rem,1vw,1rem)]"
                      >
                        ← Different email
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-zinc-400 mt-12 text-[clamp(0.9rem,1vw,1rem)]">
                No account?{" "}
                <Link href="/register" className="text-green-400 hover:text-green-300 transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}