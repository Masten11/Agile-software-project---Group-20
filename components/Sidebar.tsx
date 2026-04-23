"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Leaf,
  BarChart2,
  Trophy,
  Settings,
  Sprout,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
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
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      initial={false}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex shrink-0 flex-col h-screen sticky top-0 overflow-hidden z-40"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #052e16 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
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
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: active ? "rgba(74,222,128,0.1)" : "transparent",
                  border: active ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                }}
              >
                <Icon
                  size={20}
                  className="shrink-0 transition-colors duration-200"
                  style={{ color: active ? "#4ade80" : "#52525b" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm whitespace-nowrap transition-colors duration-200"
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
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
            style={{ background: "linear-gradient(135deg, #4ade80, #22d3ee)" }}
          >
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                  Abdullah
                </p>
                <p className="text-xs text-zinc-500 whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                  @abdullah
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-xl transition-all duration-200 hover:bg-white/5 gap-2"
          style={{ border: "1px solid rgba(255,255,255,0.05)" }}
        >
          {collapsed
            ? <PanelLeftOpen size={16} className="text-zinc-500" />
            : (
              <>
                <PanelLeftClose size={16} className="text-zinc-500" />
                <span className="text-xs text-zinc-500" style={{ fontFamily: "var(--font-body)" }}>
                  Collapse
                </span>
              </>
            )}
        </button>
      </div>
    </motion.aside>
  );
}