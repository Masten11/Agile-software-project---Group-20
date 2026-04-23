"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  AnimatePresence,
} from "framer-motion";
import { Eye, EyeOff, ArrowRight, Check, X } from "lucide-react";
import { handleSignUp } from "@/app/lib/auth-actions";

/* ─────────── Canvas particle system ─────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
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
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
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
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

/* ─────────── Floating label input ─────────── */
function FloatingInput({
  label, type, value, onChange, right, autoFocus,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode; autoFocus?: boolean;
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
          boxShadow: focused ? "0 0 24px rgba(74,222,128,0.1), inset 0 0 16px rgba(74,222,128,0.03)" : "none",
          transition: "border-color 0.25s, box-shadow 0.25s",
          paddingRight: right ? "50px" : "24px",
          fontFamily: "var(--font-body)",
        }}
      />
      <label style={{
        position: "absolute", left: "24px",
        top: active ? "12px" : "50%",
        transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? "11px" : "16px",
        color: active ? (focused ? "#4ade80" : "#52525b") : "#52525b",
        letterSpacing: active ? "0.12em" : "0",
        textTransform: active ? "uppercase" : "none",
        pointerEvents: "none", transition: "all 0.2s ease",
        fontFamily: "var(--font-body)",
      }}>
        {label}
      </label>
      {right && <div className="absolute right-5 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
}

/* ─────────── Password strength ─────────── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#f87171", "#fb923c", "#facc15", "#4ade80"];

  if (!password) return null;
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: i <= score ? colors[score] : "transparent" }}
              initial={{ width: "0%" }}
              animate={{ width: i <= score ? "100%" : "0%" }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score], fontFamily: "var(--font-body)" }}>
        {labels[score]}
      </p>
    </div>
  );
}

/* ─────────── Main page ─────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const TOTAL_STEPS = 4;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const lightBg = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(34,197,94,0.05), transparent 55%)`;

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const goBack = () => { setError(""); setStep((s) => s - 1); };

  const onStep0 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return triggerError("Enter a valid email address");
    setError(""); setStep(1);
  };

  const onStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return triggerError("Enter your first name");
    if (!lastName.trim()) return triggerError("Enter your last name");
    setError(""); setStep(2);
  };

  const onStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) return triggerError("Username must be at least 3 characters");
    if (/\s/.test(username)) return triggerError("Username cannot contain spaces");
    setError(""); setStep(3);
  };

  const onStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) return triggerError("Password must be at least 8 characters");
    if (password !== confirmPassword) return triggerError("Passwords do not match");
  
    setError(""); // Rensa eventuella gamla fel
  
    try {
      //anropar vi funktion (auth-action)
      await handleSignUp(email, password, firstName, lastName, username);
  
      // Om det lyckas, skicka användaren till dashboarden
      router.push("/dashboard");
  
    } catch (err: any) {
      // Om något går fel (t.ex. mejlen är upptagen), visa det i UI:t
      triggerError(err.message || "Registration failed. Please try again.");
    }
  };

  const passwordsMatch = confirmPassword !== "" && password === confirmPassword;
  const passwordsMismatch = confirmPassword !== "" && password !== confirmPassword;

  const stepTitles = ["CREATE ACCOUNT", "YOUR NAME", "USERNAME", "SET PASSWORD"];
  const stepSubs = [
    "Start with your email address",
    `Welcome, let's get to know you`,
    "Choose a unique username",
    "Almost there — secure your account",
  ];

  return (
    <main className="min-h-screen flex items-center justify-center overflow-hidden relative bg-[#030712] px-4 py-16">

      <ParticleCanvas />
      <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ background: lightBg }} />

      {/* Aurora */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aurora-blob w-175 h-175 bg-green-500/20"
          style={{ top: "-15%", left: "-10%", animation: "aurora-a 14s ease-in-out infinite" }} />
        <div className="aurora-blob w-137.5 h-137.5 bg-cyan-500/15"
          style={{ top: "25%", right: "-8%", animation: "aurora-b 17s ease-in-out infinite" }} />
        <div className="aurora-blob w-112.5 h-112.5 bg-blue-600/10"
          style={{ bottom: "-10%", left: "25%", animation: "aurora-a 20s ease-in-out infinite reverse" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative z-10"
        style={{ maxWidth: "clamp(340px,38vw,580px)" }}
      >
        <div
          className={`rounded-3xl p-[clamp(2rem,4vw,4rem)] w-full ${shaking ? "shake" : ""}`}
          style={{
            background: "linear-gradient(145deg, #0f172a 0%, #064e3b 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* Progress bar */}
          <div className="flex gap-2 mb-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  className="h-full"
                  style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: step > i ? "100%" : step === i ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              {/* Step label */}
              <p className="text-zinc-300 tracking-[0.2em] uppercase mb-4 text-[clamp(0.8rem,1vw,1rem)]"
                style={{ fontFamily: "var(--font-body)" }}>
                Step {step + 1} of {TOTAL_STEPS}
              </p>

              {/* Title */}
              <h2 className="text-white mb-3 leading-none text-[clamp(2.2rem,3.5vw,3.5rem)]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                {stepTitles[step]}
              </h2>

              {/* Subtitle */}
              <p className="text-zinc-300 mb-10 text-[clamp(1rem,1.1vw,1.125rem)]">
                {step === 1 && firstName
                  ? <><span className="text-green-400">{firstName}</span>, what is your last name?</>
                  : stepSubs[step]}
              </p>

              {/* ── Step 0: Email ── */}
              {step === 0 && (
                <form onSubmit={onStep0} className="space-y-6">
                  <FloatingInput label="Email address" type="email" value={email}
                    onChange={(v) => { setEmail(v); setError(""); }} autoFocus />
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" />
                </form>
              )}

              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <form onSubmit={onStep1} className="space-y-6">
                  <FloatingInput label="First name" type="text" value={firstName}
                    onChange={(v) => { setFirstName(v); setError(""); }} autoFocus />
                  <FloatingInput label="Last name" type="text" value={lastName}
                    onChange={(v) => { setLastName(v); setError(""); }} />
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" />
                  <BackButton onClick={goBack} />
                </form>
              )}

              {/* ── Step 2: Username ── */}
              {step === 2 && (
                <form onSubmit={onStep2} className="space-y-6">
                  <div className="relative">
                    <FloatingInput label="Username" type="text" value={username}
                      onChange={(v) => { setUsername(v.toLowerCase().replace(/\s/g, "")); setError(""); }}
                      autoFocus />
                    {username.length >= 3 && (
                      <p className="text-xs text-zinc-500 mt-2 pl-1" style={{ fontFamily: "var(--font-body)" }}>
                        Your profile: <span className="text-green-400">@{username}</span>
                      </p>
                    )}
                  </div>
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" />
                  <BackButton onClick={goBack} />
                </form>
              )}

              {/* ── Step 3: Password ── */}
              {step === 3 && (
                <form onSubmit={onStep3} className="space-y-6">
                  <div className="space-y-3">
                    <FloatingInput
                      label="Password" type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(v) => { setPassword(v); setError(""); }}
                      autoFocus
                      right={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="text-zinc-400 hover:text-green-400 transition-colors">
                          {showPw ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>
                      }
                    />
                    <PasswordStrength password={password} />
                  </div>

                  <FloatingInput
                    label="Confirm password" type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(v) => { setConfirmPassword(v); setError(""); }}
                    right={
                      <div className="flex items-center gap-2">
                        {passwordsMatch && <Check size={16} className="text-green-400" />}
                        {passwordsMismatch && <X size={16} className="text-red-400" />}
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="text-zinc-400 hover:text-green-400 transition-colors">
                          {showConfirm ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>
                      </div>
                    }
                  />

                  <ErrorMsg error={error} />
                  <SubmitButton label="Create Account" />
                  <BackButton onClick={goBack} />
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-zinc-400 mt-10 text-[clamp(0.9rem,1vw,1rem)]">
            Already have an account?{" "}
            <Link href="/login" className="text-green-400 hover:text-green-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

/* ─────────── Small helpers ─────────── */
function ErrorMsg({ error }: { error: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} className="text-red-400 text-sm" style={{ fontFamily: "var(--font-body)" }}>
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <motion.button
      type="submit"
      className="w-full rounded-2xl font-semibold text-black flex items-center justify-center gap-3 py-[clamp(1.2rem,1.5vw,1.5rem)] text-[clamp(1rem,1.1vw,1.125rem)]"
      style={{ background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)", fontFamily: "var(--font-body)" }}
      whileHover={{ scale: 1.02, boxShadow: "0 0 32px rgba(74,222,128,0.35)" }}
      whileTap={{ scale: 0.97 }}
    >
      {label} <ArrowRight size={22} />
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-center text-zinc-400 hover:text-zinc-200 transition-colors pt-1 text-[clamp(0.9rem,1vw,1rem)]"
      style={{ fontFamily: "var(--font-body)" }}>
      ← Go back
    </button>
  );
}