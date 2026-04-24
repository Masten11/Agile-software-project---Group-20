"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Leaf, BarChart2, Trophy, Settings } from "lucide-react";

const leftItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/progress", icon: BarChart2, label: "Progress" },
];

const rightItems = [
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200"
      >
        <Icon size={20} style={{ color: active ? "#4ade80" : "#52525b" }} className="transition-colors duration-200" />
        <span
          className="text-xs transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)", color: active ? "#4ade80" : "#52525b" }}
        >
          {label}
        </span>
      </Link>
    );
  };

  const logActive = pathname === "/dashboard/log";

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-2"
      style={{
  background: "rgba(17, 19, 24, 0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderTop: "1px solid rgba(255,255,255,0.07)",
  height: "64px",
}}
    >
      {/* Left items */}
      {leftItems.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}

      {/* Center – Log Habits (prominent) */}
      <Link
        href="/dashboard/log"
        className="flex flex-col items-center justify-center gap-1 flex-1"
      >
        <div
          className="flex items-center justify-center rounded-2xl mb-0.5 transition-all duration-200"
          style={{
            width: "48px",
            height: "36px",
            background: logActive
              ? "linear-gradient(135deg, #4ade80, #22d3ee)"
              : "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,211,238,0.2))",
            border: `1px solid ${logActive ? "transparent" : "rgba(74,222,128,0.3)"}`,
            boxShadow: logActive ? "0 0 16px rgba(74,222,128,0.4)" : "0 0 8px rgba(74,222,128,0.15)",
          }}
        >
          <Leaf size={20} style={{ color: logActive ? "#000" : "#ffffff" }} />
        </div>
        <span
          className="text-xs"
          style={{
            fontFamily: "var(--font-body)",
            color: logActive ? "#4ade80" : "#a1a1aa",
            opacity: 1,
          }}
        >
          Log
        </span>
      </Link>

      {/* Right items */}
      {rightItems.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </nav>
  );
}