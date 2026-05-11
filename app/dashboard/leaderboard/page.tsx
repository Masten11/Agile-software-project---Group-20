"use client";

import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

export default function LeaderboardPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto pb-20 lg:pb-0">
        {/* Header - Håller samma layout som övriga sidor */}
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

        {/* Centered Coming Soon Message */}
        <div className="flex-1 flex items-center justify-center px-6 pb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-base font-medium mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
              Leaderboard coming soon
            </p>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              We are working on it — check back later to compete with friends!
            </p>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}