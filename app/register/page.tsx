"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sprout, Check, X } from "lucide-react";
import { handleSignUp } from "@/lib/auth-actions";

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
      <p className="text-sm" style={{ color: colors[score], fontFamily: "var(--font-body)" }}>
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
    setError("");
    try {
      await handleSignUp(email, password, firstName, lastName, username);
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      triggerError(errorMessage);
    }
  };

  const passwordsMatch = confirmPassword !== "" && password === confirmPassword;
  const passwordsMismatch = confirmPassword !== "" && password !== confirmPassword;

  const stepTitles = ["CREATE ACCOUNT", "YOUR NAME", "USERNAME", "SET PASSWORD"];
  const stepSubs = [
    "Start with your email address",
    "Welcome, let's get to know you",
    "Choose a unique username",
    "Almost there — secure your account",
  ];

  return (
  <main className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative bg-[#111318] px-4 py-16">

    {/* Logo */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 mb-10"
    >
      <Link href="/" className="flex items-center gap-3 group">
        <Sprout className="text-green-400 w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
        <span
          className="gradient-text"
          style={{ fontFamily: "var(--font-display)", fontSize: "24px", letterSpacing: "0.05em" }}
        >
          ECO TRACKER
        </span>
      </Link>
    </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative z-10"
        style={{ maxWidth: "clamp(340px,38vw,560px)" }}
      >
        <div
          className={`rounded-2xl p-[clamp(2rem,4vw,3.5rem)] w-full ${shaking ? "shake" : ""}`}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Progress bar */}
          <div className="flex gap-2 mb-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  className="h-full"
                  style={{ background: "#4ade80" }}
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
              <p className="text-zinc-400 tracking-[0.2em] uppercase mb-4 text-sm"
                style={{ fontFamily: "var(--font-body)" }}>
                Step {step + 1} of {TOTAL_STEPS}
              </p>

              <h2 className="text-white mb-3 leading-none text-[clamp(2.2rem,3.5vw,3.5rem)]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                {stepTitles[step]}
              </h2>

              <p className="text-zinc-400 mb-8 text-sm">
                {step === 1 && firstName
                  ? <><span className="text-green-400">{firstName}</span>, what is your last name?</>
                  : stepSubs[step]}
              </p>

              {step === 0 && (
                <form onSubmit={onStep0} className="space-y-6">
                  <FloatingInput label="Email address" type="email" value={email}
                    onChange={(v) => { setEmail(v); setError(""); }} autoFocus />
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" />
                </form>
              )}

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

              {step === 2 && (
                <form onSubmit={onStep2} className="space-y-6">
                  <div>
                    <FloatingInput label="Username" type="text" value={username}
                      onChange={(v) => { setUsername(v.toLowerCase().replace(/\s/g, "")); setError(""); }}
                      autoFocus />
                    {username.length >= 3 && (
                      <p className="text-sm text-zinc-500 mt-2 pl-1" style={{ fontFamily: "var(--font-body)" }}>
                        Your profile: <span className="text-green-400">@{username}</span>
                      </p>
                    )}
                  </div>
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" />
                  <BackButton onClick={goBack} />
                </form>
              )}

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
                          {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
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
                          {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
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

          <p className="text-center text-zinc-400 mt-10 text-sm">
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
      className="w-full rounded-2xl font-semibold text-black flex items-center justify-center gap-3 py-[clamp(1rem,1.5vw,1.25rem)] text-[clamp(1rem,1.1vw,1.125rem)]"
      style={{ background: "#4ade80", fontFamily: "var(--font-body)" }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
    >
      {label} <ArrowRight size={20} />
    </motion.button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-center text-zinc-400 hover:text-zinc-200 transition-colors pt-1 text-sm"
      style={{ fontFamily: "var(--font-body)" }}>
      ← Go back
    </button>
  );
}