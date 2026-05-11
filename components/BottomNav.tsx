"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Leaf, Trophy, Settings, Users } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const leftItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/socials", icon: Users, label: "Socials" },
];

const rightItems = [
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200"
      >
        <Icon size={20} style={{ color: active ? "var(--accent-green)" : "var(--text-muted)" }} className="transition-colors duration-200" />
        <span
          className="text-xs transition-colors duration-200"
          style={{ fontFamily: "var(--font-body)", color: active ? "var(--accent-green)" : "var(--text-muted)" }}
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
        background: isDark ? "rgba(17, 19, 24, 0.95)" : "rgba(244, 244, 245, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
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
              ? "linear-gradient(135deg, var(--accent-green), #22d3ee)"
              : "var(--accent-green-dim)",
            border: `1px solid ${logActive ? "transparent" : "var(--accent-green-border)"}`,
            boxShadow: logActive ? "0 0 16px var(--accent-green-glow)" : "0 0 8px var(--accent-green-subtle)",
          }}
        >
          <Leaf size={20} style={{ color: logActive ? (isDark ? "#000" : "#fff") : "var(--text-primary)" }} />
        </div>
        <span
          className="text-xs"
          style={{
            fontFamily: "var(--font-body)",
            color: logActive ? "var(--accent-green)" : "var(--text-secondary)",
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