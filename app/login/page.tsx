"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sprout } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Kollar om användaren redan är inloggad och redirectar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router]);

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return triggerError("Enter a valid email address");
    if (password.length < 6) return triggerError("Password must be at least 6 characters");
    
    try {
        // Call API Route
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
         });

        // Parse the response
        const result = await response.json();

        // Handle API errors
        if (!response.ok) {
          throw new Error(result.error || "Failed to log in");
        }

        // Success!
        router.push("/dashboard");
        
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      triggerError(message);
    }
  };

  // Förhindrar UI-blixt av formuläret innan redirecten hinner ske
  if (isChecking) return <div className="min-h-screen bg-[#111318]" />;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#111318] px-4 py-16">
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="w-full"
        style={{ maxWidth: "clamp(340px,40vw,480px)" }}
      >
        <div
          className={`rounded-2xl p-[clamp(2rem,4vw,3.5rem)] w-full ${shaking ? "shake" : ""}`}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
          >
            <h2 className="text-white mb-3 leading-none text-[clamp(2.5rem,4vw,4rem)]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "0.05em" }}>
              WELCOME BACK
            </h2>
            <p className="text-zinc-400 mb-8 text-sm">Enter your details to continue</p>

            <form onSubmit={onLoginSubmit} className="space-y-6">
              <FloatingInput label="Email address" type="email" value={email}
                onChange={(v) => { setEmail(v); setError(""); }} autoFocus />
                
              <FloatingInput
                label="Password" type={showPw ? "text" : "password"}
                value={password}
                onChange={(v) => { setPassword(v); setError(""); }}
                right={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="text-zinc-400 hover:text-green-400 transition-colors">
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />

              <AnimatePresence>
                {error && (
                  <motion.p key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} className="text-red-400 text-sm">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              
              <motion.button
                type="submit"
                className="w-full rounded-2xl font-semibold text-black flex items-center justify-center gap-3 py-[clamp(1rem,1.5vw,1.25rem)] text-[clamp(1rem,1.1vw,1.125rem)]"
                style={{ background: "#4ade80", fontFamily: "var(--font-body)" }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in <ArrowRight size={20} />
              </motion.button>
            </form>
          </motion.div>

          <p className="text-center text-zinc-400 mt-10 text-sm">
            No account?{" "}
            <Link href="/register" className="text-green-400 hover:text-green-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}