"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { Shield, Moon, Sun, AlertTriangle, Check, Loader2, Eye, EyeOff } from "lucide-react";

/* ─── FloatingInput ─── */
function FloatingInput({
  label, value, onChange, type = "text", disabled = false, right,
}: {
  label: string; value: string;
  onChange?: (v: string) => void;
  type?: string; disabled?: boolean;
  right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value !== "";
  
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => !disabled && setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={label}
        disabled={disabled}
        className="w-full rounded-2xl px-6 pt-7 pb-3 text-sm outline-none placeholder-transparent transition-colors"
        style={{
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: focused ? "0 0 24px rgba(74,222,128,0.08), inset 0 0 12px rgba(74,222,128,0.02)" : "none",
          color: disabled ? "#71717a" : "#ffffff",
          cursor: disabled ? "not-allowed" : "text",
          fontFamily: "var(--font-body)",
          paddingRight: right ? "50px" : "24px",
        }}
      />
      <label style={{
        position: "absolute", left: "24px",
        top: active ? "10px" : "50%",
        transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? "10px" : "14px",
        color: disabled ? "#52525b" : active ? (focused ? "#4ade80" : "#a1a1aa") : "#52525b",
        letterSpacing: active ? "0.1em" : "0",
        textTransform: active ? "uppercase" : "none",
        pointerEvents: "none",
        transition: "all 0.2s ease",
        fontFamily: "var(--font-body)",
      }}>
        {label}
      </label>
      {right && <div className="absolute right-5 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  );
}

/* ─── Password Strength Component ─── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["", "#f87171", "#fb923c", "#facc15", "#4ade80"];
  if (!password) return null;
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: i <= score ? colors[score] : "transparent" }}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Custom Theme Toggle ─── */
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors duration-300 ${isDark ? "justify-end" : "justify-start"}`}
      style={{ background: isDark ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)" }}
    >
      <motion.div
        layout
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
        style={{ background: isDark ? "#4ade80" : "#ffffff" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? <Moon size={12} color="#000" /> : <Sun size={12} color="#000" />}
      </motion.div>
    </button>
  );
}

const AVATAR_GRADIENTS = [
  { id: "green", background: "linear-gradient(135deg, #4ade80, #22d3ee)" },
  { id: "purple", background: "linear-gradient(135deg, #c084fc, #ec4899)" },
  { id: "orange", background: "linear-gradient(135deg, #fb923c, #facc15)" },
  { id: "blue", background: "linear-gradient(135deg, #60a5fa, #818cf8)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // State för att spåra initial data (för att veta om något ändrats)
  const [initialProfile, setInitialProfile] = useState({
    firstName: "", lastName: "", username: "", activeGradient: AVATAR_GRADIENTS[0].background
  });

  // Profile State
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [activeGradient, setActiveGradient] = useState(AVATAR_GRADIENTS[0].background);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Preferences
  const [isDark, setIsDark] = useState(true);

  // Avgör om profilen har ändrats
  const isDirty = 
    firstName !== initialProfile.firstName || 
    lastName !== initialProfile.lastName || 
    username !== initialProfile.username || 
    activeGradient !== initialProfile.activeGradient;

  // FETCH DATA FROM API
  useEffect(() => {
    async function loadUserData() {
      try {
        const response = await fetch("/api/dashboard/settings");
        if (response.ok) {
          const data = await response.json();
          
          setUserId(data.userId);
          setEmail(data.email);
          
          if (data.profile) {
            const fName = data.profile.first_name || "";
            const lName = data.profile.last_name || "";
            const uName = data.profile.username || "";
            const grad = data.profile.avatar_gradient || AVATAR_GRADIENTS[0].background;

            setFirstName(fName);
            setLastName(lName);
            setUsername(uName);
            setActiveGradient(grad);

            setInitialProfile({ firstName: fName, lastName: lName, username: uName, activeGradient: grad });
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  // SAVE PROFILE VIA API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isDirty) return;
    setIsSavingProfile(true);
    
    const formattedUsername = username.toLowerCase().replace(/\s/g, "");

    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username: formattedUsername,
          activeGradient
        }),
      });

      if (response.ok) {
        setInitialProfile({ firstName, lastName, username: formattedUsername, activeGradient });
        setProfileMessage({ type: "success", text: "Profile updated" });
        setTimeout(() => setProfileMessage({ type: "", text: "" }), 3000);
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // SAVE PASSWORD VIA API
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    setIsSavingSecurity(true);
    
    try {
      const response = await fetch("/api/dashboard/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        alert("Password updated successfully!");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Failed to update password", error);
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
  const isProfileBtnDisabled = isSavingProfile || !isDirty;

  if (loading) return <div className="flex h-screen bg-[#111318] items-center justify-center"><Loader2 className="animate-spin text-green-400" size={32} /></div>;

  return (
    <div className="flex h-screen bg-[#111318] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-white leading-none mb-1 uppercase" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>SETTINGS</h1>
            <p className="text-zinc-400 text-sm" style={{ fontFamily: "var(--font-body)" }}>Manage your account and preferences</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* LEFT COLUMN */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 space-y-6">
              <div className="rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-black" style={{ background: activeGradient }}>{avatarLetter}</div>
                    <div>
                      <h2 className="text-white font-medium" style={{ fontFamily: "var(--font-body)" }}>Profile Picture</h2>
                      <p className="text-zinc-500 text-xs mt-1">Visible on leaderboard and socials</p>
                    </div>
                  </div>
                  <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-5">
                    <FloatingInput label="Email Address" value={email} disabled />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FloatingInput label="First Name" value={firstName} onChange={setFirstName} />
                      <FloatingInput label="Last Name" value={lastName} onChange={setLastName} />
                    </div>
                    <FloatingInput label="Username" value={username} onChange={setUsername} />
                    <div className="pt-2">
                      <p className="text-xs text-zinc-500 tracking-widest uppercase mb-3">Choose accent color</p>
                      <div className="flex gap-3">
                        {AVATAR_GRADIENTS.map((g) => (
                          <button 
                            key={g.id} 
                            type="button" 
                            onClick={() => setActiveGradient(g.background)} 
                            className="w-8 h-8 rounded-full transition-transform duration-200" 
                            style={{ 
                              background: g.background, 
                              border: activeGradient === g.background ? "2px solid white" : "2px solid transparent", 
                              transform: activeGradient === g.background ? "scale(1.15)" : "scale(1)" 
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </form>
                </div>
                
                {/* Save Changes Footer */}
                <div className="pt-8 flex items-center justify-end gap-4">
                  <AnimatePresence>
                    {profileMessage.text && (
                      <motion.p
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0 }}
                        className="text-sm flex items-center gap-1.5 text-green-400"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        <Check size={14} />
                        {profileMessage.text}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button 
                    form="profile-form" 
                    type="submit" 
                    disabled={isProfileBtnDisabled} 
                    className="w-40 rounded-xl font-semibold px-6 py-2.5 text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100"
                    style={{ 
                      background: isProfileBtnDisabled ? "#27272a" : "#4ade80",
                      color: isProfileBtnDisabled ? "#a1a1aa" : "#000000",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
              
              {/* Appearance */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Sun size={16} className="text-zinc-400" /> Appearance</h3>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-sm text-white">Dark Mode</p>
                  <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
                </div>
              </div>

              {/* Security */}
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2"><Shield size={16} className="text-zinc-400" /> Security</h3>
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <FloatingInput 
                    label="Current Password" 
                    type={showCurrentPw ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={setCurrentPassword} 
                    right={<button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="text-zinc-500 hover:text-green-400 transition-colors">{showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                  />
                  <div className="space-y-2">
                    <FloatingInput 
                      label="New Password" 
                      type={showNewPw ? "text" : "password"} 
                      value={newPassword} 
                      onChange={setNewPassword} 
                      right={<button type="button" onClick={() => setShowNewPw(!showNewPw)} className="text-zinc-500 hover:text-green-400 transition-colors">{showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                    />
                    <PasswordStrength password={newPassword} />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSavingSecurity || newPassword.length < 8 || !currentPassword} 
                    className="w-full rounded-xl text-white px-4 py-3 text-sm transition-all hover:bg-white/10 border border-white/10 bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingSecurity ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl p-6 mt-auto" style={{ background: "rgba(248,113,113,0.03)", border: "1px solid rgba(248,113,113,0.15)" }}>
                <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Danger Zone</h3>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                  Deleting your account permanently removes all your data, Eco Score, and history. There is no going back.
                </p>
                <button type="button" className="w-full rounded-xl text-red-400 px-4 py-3 text-sm transition-all hover:bg-red-500/10 border border-red-400/20">
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}