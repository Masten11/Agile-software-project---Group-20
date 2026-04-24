"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase";
import {
  LayoutDashboard, Leaf, BarChart2, Trophy,
  Settings, Sprout, Users, PanelLeftClose,
  PanelLeftOpen, LogOut, MoreHorizontal,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/log", icon: Leaf, label: "Log Habits" },
  { href: "/dashboard/progress", icon: BarChart2, label: "Progress" },
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/dashboard/socials", icon: Users, label: "Socials" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("User");
  const [username, setUsername] = useState("username");
  const [initial, setInitial] = useState("U");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, username")
          .eq("id", user.id)
          .single();
        if (profile) {
          if (profile.first_name) {
            setFirstName(profile.first_name);
            setInitial(profile.first_name.charAt(0).toUpperCase());
          }
          if (profile.username) setUsername(profile.username);
          if (profile.last_name) setLastName(profile.last_name);
        }
      }
    }
    fetchUserData();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    if (popoverOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        initial={false}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex shrink-0 flex-col h-screen sticky top-0 overflow-hidden z-40"
        style={{
          background: "#1a1d23",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-6 shrink-0 group">
          <Sprout
            className="text-green-400 shrink-0 group-hover:scale-110 transition-transform duration-200"
            size={28}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="font-bold tracking-widest text-green-400 whitespace-nowrap group-hover:text-green-300 transition-colors duration-200"
                style={{ fontFamily: "var(--font-display)", fontSize: "18px" }}
              >
                ECO TRACKER
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group/item"
                  style={{
                    background: active ? "rgba(74,222,128,0.1)" : "transparent",
                    border: active ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                  }}
                >
                  <Icon
                    size={20}
                    className="shrink-0 transition-all duration-200 group-hover/item:scale-110"
                    style={{ color: active ? "#4ade80" : "#52525b" }}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm whitespace-nowrap transition-colors duration-200 group-hover/item:text-white"
                        style={{ fontFamily: "var(--font-body)", color: active ? "#4ade80" : "#a1a1aa" }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div className="px-2 pb-6 flex flex-col gap-2 shrink-0">

          {/* Profile card with popover */}
          <div className="relative" ref={popoverRef}>

            {/* Popover */}
            <AnimatePresence>
              {popoverOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full mb-2 left-0 right-0 rounded-xl overflow-hidden z-50"
                  style={{
                    background: "#22262e",
                    border: "1px solid rgba(255,255,255,0.09)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Header */}
                  {!collapsed && (
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-white text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>
                        {firstName}{lastName ? ` ${lastName}` : ""}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                        @{username}
                      </p>
                    </div>
                  )}

                  {/* Log out */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-red-500/10 group/logout"
                  >
                    <LogOut size={15} className="text-red-400 group-hover/logout:text-red-300 transition-colors" />
                    <span
                      className="text-sm text-red-400 group-hover/logout:text-red-300 transition-colors"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Log out
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile card button */}
            <button
  onClick={() => setPopoverOpen(!popoverOpen)}
  onMouseEnter={e => {
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.background = popoverOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)";
    e.currentTarget.style.border = popoverOpen ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)";
  }}
  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group/profile"
  style={{
    background: popoverOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
    border: popoverOpen ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
  }}
>
           
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
                style={{ background: "linear-gradient(135deg, #4ade80, #22d3ee)" }}
              >
                {initial}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                      {firstName}{lastName ? ` ${lastName}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500 whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                      @{username}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!collapsed && (
                <MoreHorizontal
                  size={15}
                  className="text-zinc-600 group-hover/profile:text-zinc-400 transition-colors shrink-0"
                />
              )}
            </button>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-xl transition-all duration-200 group/collapse hover:bg-white/5 gap-2"
            style={{ border: "1px solid rgba(255,255,255,0.05)" }}
          >
            {collapsed
  ? <PanelLeftOpen size={16} className="text-zinc-500 group-hover/collapse:text-zinc-300 transition-colors" />
  : (
    <>
      <PanelLeftClose size={16} className="text-zinc-500 group-hover/collapse:text-zinc-300 transition-colors" />
      <span
        className="text-xs text-zinc-500 group-hover/collapse:text-zinc-300 transition-colors"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Collapse
      </span>
    </>
  )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}