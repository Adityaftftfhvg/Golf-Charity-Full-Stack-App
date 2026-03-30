"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScoreInput from "@/components/ScoreInput";
import CharitySelect from "@/components/CharitySelect";
import ProofUpload from "@/components/ProofUpload";
import PrizePool from "@/components/PrizePool";
import Donate from "@/components/Donate";

type Score = {
  id: string;
  score: number;
  played_at: string;
};

type UserProfile = {
  subscription_status: string;
  subscription_plan: string | null;
  subscription_end_date: string | null;
  charity_id: string | null;
  charity_percentage: number;
};

type Winner = {
  id: string;
  match_type: number;
  prize_amount: number;
  status: string;
  created_at: string;
};

type Draw = {
  id: string;
  month: string;
  year: number;
  status: string;
};

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setUserId(user.id);
    await Promise.all([
      fetchScores(user.id),
      fetchProfile(user.id),
      fetchWinnings(user.id),
      fetchDraws(),
    ]);
    setLoading(false);
  };

  const fetchScores = async (uid: string) => {
    const { data } = await supabase
      .from("scores")
      .select("id, score, played_at")
      .eq("user_id", uid)
      .order("played_at", { ascending: false })
      .limit(5);
    setScores(data || []);
  };

 const fetchProfile = async (uid: string) => {
  const { data } = await supabase
    .from("users")
    .select(
      "subscription_status, subscription_plan, subscription_end_date, charity_id, charity_percentage"
    )
    .eq("id", uid)
    .single();

  // ✅ Auto-lapse expired subscriptions
  if (data?.subscription_end_date && data.subscription_status === "active") {
    const isExpired = new Date(data.subscription_end_date) < new Date();
    if (isExpired) {
      await supabase
        .from("users")
        .update({ subscription_status: "inactive" })
        .eq("id", uid);
      data.subscription_status = "inactive";
    }
  }

  setProfile(data);
};

  const fetchWinnings = async (uid: string) => {
    const { data } = await supabase
      .from("winners")
      .select("id, match_type, prize_amount, status, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setWinners(data || []);
  };

  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("id, month, year, status")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(5);
    setDraws(data || []);
  };

  // ✅ Updated to use PhonePe instead of Stripe
  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    const amount = plan === "yearly" ? 799 : 99;
    const res = await fetch("/api/phonepe/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, userId, type: "subscription", plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const totalWon = winners.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const isActive = profile?.subscription_status === "active";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold">Golf Charity</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Sign out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        <h2 className="text-3xl font-bold">Your Dashboard</h2>

        {/* ROW 1: Subscription + Winnings */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Subscription status */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
              Subscription
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
              {profile?.subscription_plan && (
                <span className="text-gray-400 text-sm capitalize">
                  {profile.subscription_plan} plan
                </span>
              )}
            </div>
            {profile?.subscription_end_date && (
              <p className="text-gray-400 text-sm mb-4">
                Renews:{" "}
                {new Date(profile.subscription_end_date).toLocaleDateString()}
              </p>
            )}
            {!isActive && (
              <div className="space-y-2">
                <button
                  onClick={() => handleSubscribe("monthly")}
                  className="w-full bg-green-500 hover:bg-green-600 py-2 rounded-lg text-sm transition"
                >
                  Subscribe Monthly — ₹99
                </button>
                <button
                  onClick={() => handleSubscribe("yearly")}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm transition"
                >
                  Subscribe Yearly — ₹799 (Save 20%)
                </button>
              </div>
            )}
          </div>

          {/* Winnings overview */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
              Winnings
            </h3>
            <p className="text-3xl font-bold text-green-400 mb-1">
              ₹{totalWon.toFixed(2)}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Total won across all draws
            </p>
            {winners.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No winnings yet — keep playing!
              </p>
            ) : (
              <div className="space-y-2">
                {winners.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-300">
                      {w.match_type}-number match
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        w.status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {w.status}
                    </span>
                    <span className="text-white font-medium">
                      ₹{(w.prize_amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ROW 1.5: Prize Pool */}
        <PrizePool />

        {/* ROW 2: Score entry + Scores display */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Add score */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
              Add Score
            </h3>
            {userId && (
              <ScoreInput
                userId={userId}
                onScoreAdded={() => fetchScores(userId)}
              />
            )}
          </div>

          {/* Scores list */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
              Your Last 5 Scores
            </h3>
            {scores.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No scores yet — add your first score!
              </p>
            ) : (
              <div className="space-y-2">
                {scores.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center bg-slate-700 px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {i === 0 && (
                        <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                          Latest
                        </span>
                      )}
                      <span className="text-2xl font-bold text-purple-400">
                        {s.score}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {s.played_at
                        ? new Date(s.played_at).toLocaleDateString()
                        : "No date"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ROW 3: Charity + Draw history */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Charity */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-2">
              Your Charity
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Contributing{" "}
              <span className="text-green-400 font-medium">
                {profile?.charity_percentage || 10}%
              </span>{" "}
              of your subscription
            </p>
            {userId && <CharitySelect userId={userId} />}
          </div>

          {/* Draw participation */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
              Recent Draws
            </h3>
            {draws.length === 0 ? (
              <p className="text-gray-500 text-sm">No draws published yet.</p>
            ) : (
              <div className="space-y-2">
                {draws.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center bg-slate-700 px-4 py-3 rounded-lg"
                  >
                    <span className="text-gray-300">
                      {d.month} {d.year}
                    </span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded capitalize">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ROW 4: Independent Donation */}
        {userId && <Donate userId={userId} />}

        {/* ROW 5: Proof Upload (visible only to winners) */}
        {userId && <ProofUpload userId={userId} />}

      </div>
    </div>
  );
}
