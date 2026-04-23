"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Leaf, BarChart2, Trophy, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/log", icon: Leaf, label: "Log" },
  { href: "/dashboard/progress", icon: BarChart2, label: "Progress" },
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
      style={{
        background: "rgba(10, 15, 25, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-12"
            style={{
              background: active ? "rgba(74,222,128,0.1)" : "transparent",
            }}
          >
            <Icon
              size={20}
              style={{ color: active ? "#4ade80" : "#52525b" }}
              className="transition-colors duration-200"
            />
            <span
              className="text-xs transition-colors duration-200"
              style={{
                fontFamily: "var(--font-body)",
                color: active ? "#4ade80" : "#52525b",
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}