"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Leader = {
  id: string;
  email: string;
  avg_score: number;
  total_scores: number;
  best_score: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaders();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  };

  const fetchLeaders = async () => {
    try {
      // Step 1: Get all active subscriber IDs + emails
      const { data: activeUsers, error: usersError } = await supabase
        .from("users")
        .select("id, email")
        .eq("subscription_status", "active");

      if (usersError) throw usersError;

      if (!activeUsers || activeUsers.length === 0) {
        setError("No active subscribers yet. Subscribe and enter your scores to appear here!");
        setLoading(false);
        return;
      }

      const activeIds = activeUsers.map((u) => u.id);

      // Step 2: Get scores from the SCORES TABLE (not users table)
      const { data: scoresData, error: scoresError } = await supabase
        .from("scores")
        .select("user_id, score")
        .in("user_id", activeIds);

      if (scoresError) throw scoresError;

      if (!scoresData || scoresData.length === 0) {
        setError("No scores submitted yet. Enter your scores from the dashboard!");
        setLoading(false);
        return;
      }

      // Step 3: Group scores by user_id
      const statsMap: Record<string, { scores: number[]; email: string }> = {};
      activeUsers.forEach((u) => {
        statsMap[u.id] = { scores: [], email: u.email };
      });
      scoresData.forEach((s) => {
        if (statsMap[s.user_id]) {
          statsMap[s.user_id].scores.push(s.score);
        }
      });

      // Step 4: Calculate stats, filter users with no scores, sort by avg descending
      const processed: Leader[] = Object.entries(statsMap)
        .filter(([, v]) => v.scores.length > 0)
        .map(([id, v]) => {
          const avg = v.scores.reduce((a, b) => a + b, 0) / v.scores.length;
          return {
            id,
            email: v.email,
            avg_score: Math.round(avg * 10) / 10,
            total_scores: v.scores.length,
            best_score: Math.max(...v.scores),
          };
        })
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 10);

      setLeaders(processed);
    } catch (err: any) {
      console.error("Leaderboard error:", err);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // Privacy: show first 3 chars + *** + @domain
  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const rankBadge = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `#${i + 1}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-zinc-400">Loading champions…</p>
        </div>
      </div>
    );
  }

  if (error || leaders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">⛳</div>
          <h2 className="text-3xl font-medium mb-3">No leaders yet</h2>
          <p className="text-zinc-400 mb-8">{error || "Be the first to submit scores!"}</p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-3xl text-white font-medium transition"
          >
            Go to Dashboard & Enter Scores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white pb-16">
      {/* Nav */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-2xl font-serif tracking-tighter">Golf Charity</Link>
        <div className="flex gap-6 text-sm">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition">Dashboard</Link>
          <Link href="/charities" className="text-zinc-400 hover:text-white transition">Charities</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs text-emerald-400 uppercase tracking-widest mb-2 font-medium">This Month</p>
            <h1 className="text-5xl font-serif tracking-tight">Leaderboard</h1>
            <p className="text-zinc-400 mt-2">Top 10 by average Stableford score · Active subscribers only</p>
          </div>
          <Link
            href="/"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm flex items-center gap-2 transition-all"
          >
            ← Back
          </Link>
        </div>

        {/* Leaderboard rows */}
        <div className="space-y-3">
          {leaders.map((leader, i) => {
            const isCurrentUser = leader.id === currentUserId;
            return (
              <div
                key={leader.id}
                className={`rounded-3xl p-5 flex items-center gap-5 transition-all border ${
                  isCurrentUser
                    ? "bg-emerald-500/10 border-emerald-400/40"
                    : "bg-white/5 hover:bg-white/8 border-white/10"
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center text-xl font-bold flex-shrink-0">
                  {rankBadge(i)}
                </div>

                {/* Avatar placeholder */}
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  👤
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {maskEmail(leader.email)}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {leader.total_scores} score{leader.total_scores !== 1 ? "s" : ""} submitted · Best: {leader.best_score}
                  </div>
                </div>

                {/* Avg Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-mono font-bold text-emerald-400">{leader.avg_score}</div>
                  <div className="text-xs text-zinc-500">AVG</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-zinc-600 text-sm">
          Updated live · Only active subscribers appear here · Resets monthly
        </div>
      </div>
    </div>
  );
}
