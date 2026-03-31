"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Leader = {
  id: string;
  name: string;
  avatar_url?: string;
  avg_score: number;
  total_scores: number;
};

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        console.log("🔍 Fetching leaderboard data...");

        const { data, error: queryError } = await supabase
          .from("users")
          .select("id, name, avatar_url, scores")
          .eq("subscription_status", "active");

        if (queryError) throw queryError;

        console.log("📊 Users returned:", data?.length || 0);

        if (!data || data.length === 0) {
          setError("No active subscribers with scores yet. Enter some test scores first!");
          setLoading(false);
          return;
        }

        const processed = data
          .map((user: any) => {
            let scores = user.scores;
            if (!scores || !Array.isArray(scores)) scores = [];

            if (scores.length === 0) return null;

            const avg =
              scores.reduce((sum: number, s: any) => sum + (s.score || s), 0) / scores.length;

            return {
              id: user.id,
              name: user.name,
              avatar_url: user.avatar_url,
              avg_score: Math.round(avg * 10) / 10,
              total_scores: scores.length,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.avg_score - a.avg_score)
          .slice(0, 10) as Leader[];

        console.log("🏆 Processed leaders:", processed.length);
        setLeaders(processed);
      } catch (err: any) {
        console.error("❌ Leaderboard error:", err);
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-xl">Loading champions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🏌️‍♂️</div>
          <h2 className="text-3xl font-medium mb-3">No leaders yet</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-3xl text-white font-medium"
          >
            Go to Dashboard &amp; Enter Scores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white pb-12">
      {/* ... same beautiful UI as before ... */}
      <div className="max-w-5xl mx-auto px-6 pt-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-serif tracking-tight">Leaderboard</h1>
            <p className="text-emerald-400 text-xl mt-2">This month’s top golfers • Real impact makers</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center gap-2 transition-all"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="space-y-4">
          {leaders.map((leader, i) => (
            <div
              key={leader.id}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 flex items-center gap-6 transition-all group"
            >
              <div className="w-12 h-12 flex items-center justify-center text-3xl font-bold text-emerald-400">
                {i + 1}
              </div>
              <div className="flex-1 flex items-center gap-4">
                {leader.avatar_url ? (
                  <img src={leader.avatar_url} alt={leader.name} className="w-12 h-12 rounded-2xl object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
                <div>
                  <div className="text-2xl font-medium">{leader.name}</div>
                  <div className="text-zinc-400 text-sm">Avg Stableford • {leader.avg_score}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-mono text-3xl font-bold">{leader.avg_score}</div>
                <div className="text-xs text-zinc-500">AVG SCORE</div>
              </div>
              <div className="text-xs px-4 py-2 bg-white/10 rounded-2xl">{leader.total_scores} scores</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-zinc-400 text-sm">
          Updated live • Only active subscribers • Resets every month
        </div>
      </div>
    </div>
  );
}