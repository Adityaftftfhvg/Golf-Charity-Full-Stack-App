"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type User = {
  id: string;
  email: string;
};

type Score = {
  user_id: string;
  score: number;
  created_at: string;
};

type LeaderboardUser = {
  id: string;
  name: string;
  avgScore: number;
  totalEntries: number;
  trend: "up" | "down" | "same";
};

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("monthly");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
    fetchLeaderboard();
  }, [filter]);

  // ✅ Get logged-in user
  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  };

  // ✅ Fetch real leaderboard
  const fetchLeaderboard = async () => {
    setLoading(true);

    // Get users
    const { data: usersData } = await supabase.from("users").select("id, email");

    // Get scores
    let query = supabase.from("scores").select("*");

    if (filter === "monthly") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.gte("created_at", firstDay.toISOString());
    }

    const { data: scoresData } = await query;

    if (!usersData || !scoresData) {
      setLoading(false);
      return;
    }

    // ✅ Calculate leaderboard
    const leaderboardMap: Record<string, LeaderboardUser> = {};

    scoresData.forEach((score: Score) => {
      if (!leaderboardMap[score.user_id]) {
        const user = usersData.find((u: User) => u.id === score.user_id);

        leaderboardMap[score.user_id] = {
          id: score.user_id,
          name: user?.email || "User",
          avgScore: 0,
          totalEntries: 0,
          trend: "same",
        };
      }

      leaderboardMap[score.user_id].avgScore += score.score;
      leaderboardMap[score.user_id].totalEntries += 1;
    });

    const finalData = Object.values(leaderboardMap).map((u) => ({
      ...u,
      avgScore: u.totalEntries ? u.avgScore / u.totalEntries : 0,
      trend: Math.random() > 0.66 ? "up" : Math.random() > 0.33 ? "down" : "same", // temp
    }));

    // Sort descending
    finalData.sort((a, b) => b.avgScore - a.avgScore);

    setUsers(finalData.slice(0, 10));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Impact <span className="text-emerald-500">Leaderboard</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Rankings based on your latest golf performance.
          </p>
        </header>

        {/* Filters */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setFilter("monthly")}
              className={`px-6 py-2 rounded-md ${
                filter === "monthly"
                  ? "bg-emerald-600"
                  : "text-gray-400"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilter("all-time")}
              className={`px-6 py-2 rounded-md ${
                filter === "all-time"
                  ? "bg-emerald-600"
                  : "text-gray-400"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={`p-5 rounded-xl flex justify-between items-center transition transform hover:-translate-y-1 ${
                  user.id === currentUserId
                    ? "border-2 border-emerald-400 bg-emerald-500/10"
                    : "bg-gray-900 border border-gray-800"
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-5">
                  <div className="text-lg font-bold">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `#${index + 1}`}
                  </div>

                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-400">
                      Entries: {user.totalEntries}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">
                      {user.avgScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>

                  <div>
                    {user.trend === "up" && (
                      <span className="text-green-500">▲</span>
                    )}
                    {user.trend === "down" && (
                      <span className="text-red-500">▼</span>
                    )}
                    {user.trend === "same" && (
                      <span className="text-gray-600">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back */}
        <div className="mt-12 text-center">
          <a href="/dashboard" className="text-gray-400 hover:text-white">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}