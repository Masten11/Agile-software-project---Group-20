"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, Medal, Flame, Award } from "lucide-react";

type LeaderboardUser = {
  user_id: string;
  username: string;
  avatar_gradient: string;
  eco_score: number;
  total_co2_kg: number;
  total_water_l: number;
  total_energy_kwh: number;
  streak: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard");
        const json = await response.json();

        if (response.ok && json.success) {
          setLeaderboard(json.data);
        } else {
          setError(json.error || "Failed to load leaderboard");
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("An unexpected error occurred while fetching the leaderboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto w-full px-6 py-10 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="leading-none mb-1 uppercase"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)" }}>
              LEADERBOARD
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              See how you rank against other eco-trackers
            </p>
          </motion.div>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full px-6 pb-10">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin" style={{ color: "var(--accent-green)" }} size={32} />
            </div>
          ) : error ? (
            <div className="flex flex-col h-64 items-center justify-center text-center">
              <p className="text-sm" style={{ color: "#ef4444", fontFamily: "var(--font-body)" }}>{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-center">
              <Trophy size={48} style={{ color: "var(--border-strong)" }} className="mb-4" />
              <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                No users found. Be the first to log a habit!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {leaderboard.map((user, index) => {
                  const rankColor = 
                    index === 0 ? "#fbbf24" : // Gold
                    index === 1 ? "#9ca3af" : // Silver
                    index === 2 ? "#b45309" : // Bronze
                    "var(--text-muted)";

                  return (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                      style={{ 
                        background: "var(--bg-card)", 
                        border: "1px solid var(--border-subtle)" 
                      }}
                    >
                      {/* Rank Icon */}
                      <div className="w-8 shrink-0 flex justify-center items-center font-bold text-sm" style={{ color: rankColor, fontFamily: "var(--font-body)" }}>
                        {index === 0 ? <Trophy size={18} /> : 
                         index === 1 ? <Award size={18} /> : 
                         index === 2 ? <Medal size={18} /> : 
                         `#${index + 1}`}
                      </div>

                      {/* Avatar */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0" 
                        style={{ background: user.avatar_gradient || "var(--border-strong)" }}
                      >
                        {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                      </div>

                      {/* Info & Metrics */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                          {user.username || "Anonymous"}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                            CO₂ <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{user.total_co2_kg.toFixed(1)} kg</span>
                          </span>
                          <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>·</span>
                          <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                            Water <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{user.total_water_l.toFixed(0)} L</span>
                          </span>
                          <span style={{ color: "var(--border-strong)", fontSize: "10px" }}>·</span>
                          <span className="text-xs tracking-wide" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                            Energy <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{user.total_energy_kwh.toFixed(1)} kWh</span>
                          </span>
                        </div>
                      </div>

                      {/* Streak & Score */}
                      <div className="shrink-0 text-right pr-2 flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-3">
                          {user.streak > 0 && (
                            <div 
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                              style={{ background: "var(--bg-card-deep)", border: "1px solid var(--border-subtle)" }}
                            >
                              <Flame size={12} style={{ color: "var(--text-muted)" }} />
                              <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                                {user.streak}
                              </span>
                            </div>
                          )}
                          <p className="font-bold text-xl leading-none" style={{ color: "var(--accent-green)", fontFamily: "var(--font-display)" }}>
                            {user.eco_score}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}