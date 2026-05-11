"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sprout, Check, X, Lock } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

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
        className="w-full rounded-2xl px-[clamp(1rem,1.5vw,1.5rem)] pt-[clamp(1.5rem,2vw,2rem)] pb-[clamp(0.75rem,1vw,1rem)] text-[clamp(1rem,1.1vw,1.125rem)] outline-none placeholder-transparent"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${focused ? "var(--border-active)" : "var(--border-subtle)"}`,
          boxShadow: focused ? "0 0 24px var(--accent-green-subtle), inset 0 0 16px var(--bg-card-deep)" : "none",
          transition: "border-color 0.25s, box-shadow 0.25s",
          color: "var(--text-primary)",
          paddingRight: right ? "50px" : "24px",
          fontFamily: "var(--font-body)",
        }}
      />
      <label style={{
        position: "absolute", left: "24px",
        top: active ? "12px" : "50%",
        transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? "11px" : "16px",
        color: active ? (focused ? "var(--accent-green)" : "var(--text-secondary)") : "var(--text-faint)",
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
  const colors = ["", "#ef4444", "#fb923c", "#facc15", "var(--accent-green)"];
  
  if (!password) return null;
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "var(--border-strong)" }}>
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
      <p className="text-sm" style={{ color: colors[score] || "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        {labels[score]}
      </p>
    </div>
  );
}


/* ─────────── Main page ─────────── */
export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const TOTAL_STEPS = 2; // Ändrat från 4 till 2

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

  const onStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return triggerError("Password must be at least 8 characters");

    // Validera styrkan på lösenordet i frontenden
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;

    if (score < 2) return triggerError("Please choose a stronger password.");

    if (password !== confirmPassword) return triggerError("Passwords do not match");
    setError("");
    
    try {
      // Skickar in tomma strängar för namn och username
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            email, 
            password, 
            firstName: "", 
            lastName: "", 
            username: "" 
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Registration failed. Please try again.");
        }

        router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      triggerError(errorMessage);
    }
  };

  const passwordsMatch = confirmPassword !== "" && password === confirmPassword;
  const passwordsMismatch = confirmPassword !== "" && password !== confirmPassword;

  // Uppdaterade titlar och sub-texter för 2 steg
  const stepTitles = ["CREATE ACCOUNT", "SET PASSWORD"];
  const stepSubs = [
    "Start with your email address",
    "Almost there — secure your account",
  ];

  return (
  <main className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative px-4 py-16" style={{ background: "var(--bg-primary)" }}>

    {/* Logo */}
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 mb-10"
    >
      <Link href="/" className="flex items-center gap-3 group">
        <Sprout className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" style={{ color: "var(--accent-green)" }} />
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
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Progress bar */}
          <div className="flex gap-2 mb-10">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "var(--border-strong)" }}>
                <motion.div
                  className="h-full"
                  style={{ background: "var(--accent-green)" }}
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
              <p className="tracking-[0.2em] uppercase mb-4 text-sm"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                Step {step + 1} of {TOTAL_STEPS}
              </p>

              <h2 className="mb-3 leading-none text-[clamp(2.2rem,3.5vw,3.5rem)]"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
                {stepTitles[step]}
              </h2>

              <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
                {stepSubs[step]}
              </p>

              {step === 0 && (
                <form onSubmit={onStep0} className="space-y-6">
                  <div className="space-y-3">
                    <FloatingInput label="Email address" type="email" value={email}
                      onChange={(v) => { setEmail(v); setError(""); }} autoFocus />
                    
                    {/* Psychological Safety Message */}
                    <div className="flex items-center gap-1.5 pl-2">
                      <Lock size={12} style={{ color: "var(--text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                        Your email is secure and will never be shared.
                      </p>
                    </div>
                  </div>
                  
                  <ErrorMsg error={error} />
                  <SubmitButton label="Continue" isDark={isDark} />
                </form>
              )}

              {step === 1 && (
                <form onSubmit={onStep1} className="space-y-6">
                  <div className="space-y-3">
                    <FloatingInput
                      label="Password" type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(v) => { setPassword(v); setError(""); }}
                      autoFocus
                      right={
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="transition-colors hover:scale-110" style={{ color: "var(--text-muted)" }}>
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
                        {passwordsMatch && <Check size={16} style={{ color: "var(--accent-green)" }} />}
                        {passwordsMismatch && <X size={16} style={{ color: "#ef4444" }} />}
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="transition-colors hover:scale-110" style={{ color: "var(--text-muted)" }}>
                          {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    }
                  />

                  <ErrorMsg error={error} />
                  <SubmitButton label="Create Account" isDark={isDark} />
                  <BackButton onClick={goBack} />
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <p className="text-center mt-10 text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="transition-colors hover:underline" style={{ color: "var(--accent-green)" }}>
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
          exit={{ opacity: 0 }} className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function SubmitButton({ label, isDark }: { label: string, isDark: boolean }) {
  return (
    <motion.button
      type="submit"
      className="w-full rounded-2xl font-semibold flex items-center justify-center gap-3 py-[clamp(1rem,1.5vw,1.25rem)] text-[clamp(1rem,1.1vw,1.125rem)] transition-colors"
      style={{ background: "var(--accent-green)", color: isDark ? "#000" : "#fff", fontFamily: "var(--font-body)" }}
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
      className="w-full text-center hover:opacity-80 transition-opacity pt-1 text-sm"
      style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
      ← Go back
    </button>
  );
}