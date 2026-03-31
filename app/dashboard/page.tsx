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
  draw_id: string;
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

  // ✅ Score edit state
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  // ✅ Payment return status banner
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    // Cancellation modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  useEffect(() => {
    init();
    checkPaymentReturn();
  }, []);

  const checkPaymentReturn = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentStatus("success");
      // Clean URL without reload
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("payment") === "failed") {
      setPaymentStatus("failed");
      window.history.replaceState({}, "", "/dashboard");
    }
  };

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

    // Auto-lapse expired subscriptions
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
      .select("id, match_type, prize_amount, status, draw_id, created_at")
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

  // ==================== CANCELLATION FLOW (with beautiful modal) ====================
  const handleCancelSubscription = async () => {
    if (!userId || !cancelReason) return;
    setCancelLoading(true);

    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: "inactive",
        subscription_end_date: null,
      })
      .eq("id", userId);

    if (!error) {
      setProfile((prev) =>
        prev ? { ...prev, subscription_status: "inactive", subscription_end_date: null } : null
      );
      setShowCancelModal(false);
      setCancelReason("");
      alert("✅ Subscription cancelled successfully. You will lose access to future draws.");
    } else {
      alert("Failed to cancel subscription. Please try again.");
    }
    setCancelLoading(false);
  };

  const totalWon = winners.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const isActive = profile?.subscription_status === "active";

  // ✅ Build a Set of draw IDs the user won in, for participation summary
  const wonDrawIds = new Set(winners.map((w) => w.draw_id));

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
 {/* NAVBAR */}
<div className="flex justify-between items-center px-8 py-5 border-b border-slate-700">
  <h1 className="text-xl font-bold">Golf Charity</h1>

  <div className="flex items-center gap-6">
    
    {/* 🏆 Leaderboard Button */}
    <a
      href="/leaderboard"
      className="text-sm text-emerald-400 hover:text-emerald-300 transition font-medium"
    >
      🏆 Leaderboard
    </a>

    {/* Sign Out */}
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
</div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        <h2 className="text-3xl font-bold">Your Dashboard</h2>

        {/* ✅ Payment return banner */}
        {paymentStatus === "success" && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl px-5 py-4 text-sm font-medium">
            ✓ Payment successful! Your subscription is now active.
          </div>
        )}
        {paymentStatus === "failed" && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl px-5 py-4 text-sm font-medium">
            ✗ Payment failed. Please try again.
          </div>
        )}

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
            
            {/* Active Subscription State + Cancellation Button */}
            {profile?.subscription_end_date && isActive && (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  Renews:{" "}
                  {new Date(profile.subscription_end_date).toLocaleDateString()}
                </p>
                               <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  Cancel Subscription →
                </button>
              </>
            )}

            {!isActive && (
              <div className="space-y-2 mt-4">
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
                          : w.status === "approved"
                          ? "bg-blue-500/20 text-blue-400"
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

        {/* Prize Pool */}
        <PrizePool />

        {/* ROW 2: Score entry + Scores display */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Add / Edit score */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
              {editingScore ? "Edit Score" : "Add Score"}
            </h3>
            {userId && (
              <ScoreInput
                userId={userId}
                onScoreAdded={() => fetchScores(userId)}
                // ✅ Pass edit props when a score is selected for editing
                editScore={editingScore ?? undefined}
                onEditDone={() => {
                  setEditingScore(null);
                  fetchScores(userId);
                }}
              />
            )}
          </div>

          {/* Scores list with edit buttons */}
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
                    className={`flex justify-between items-center px-4 py-3 rounded-lg transition ${
                      editingScore?.id === s.id
                        ? "bg-purple-500/20 border border-purple-500/40"
                        : "bg-slate-700"
                    }`}
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
                    {/* ✅ Edit button per score */}
                    <button
                      onClick={() =>
                        setEditingScore(editingScore?.id === s.id ? null : s)
                      }
                      className="text-xs text-purple-400 hover:text-purple-300 transition ml-2"
                    >
                      {editingScore?.id === s.id ? "Cancel" : "Edit"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ROW 3: Charity + Draw participation */}
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

          {/* ✅ Draw participation summary — now shows whether the user was entered */}
          <div className="bg-slate-800 p-6 rounded-xl">
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-1">
              Draw Participation
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {draws.length > 0
                ? `Showing last ${draws.length} published draw${draws.length > 1 ? "s" : ""}`
                : ""}
            </p>
            {draws.length === 0 ? (
              <p className="text-gray-500 text-sm">No draws published yet.</p>
            ) : (
              <div className="space-y-2">
                {draws.map((d) => {
                  const won = wonDrawIds.has(d.id);
                  return (
                    <div
                      key={d.id}
                      className="flex justify-between items-center bg-slate-700 px-4 py-3 rounded-lg"
                    >
                      <span className="text-gray-300">
                        {d.month} {d.year}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Entered badge — active subscribers at draw time are always entered */}
                        {isActive && (
                          <span className="text-xs bg-slate-600 text-gray-400 px-2 py-0.5 rounded">
                            Entered
                          </span>
                        )}
                        {won && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-medium">
                            Winner 🏆
                          </span>
                        )}
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded capitalize">
                          {d.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Independent Donation */}
        {userId && <Donate userId={userId} />}

        {/* Proof Upload (visible only to winners) */}
        {userId && <ProofUpload userId={userId} />}

      </div>


            {/* CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full mx-4 p-8">
            <h3 className="text-2xl font-medium mb-2">Cancel Subscription?</h3>
            <p className="text-red-400 text-sm mb-6">
              You will immediately lose access to all future draws and prize pools.
            </p>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Why are you cancelling?</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="Too expensive">Too expensive</option>
                <option value="Not enough wins">Not winning enough</option>
                <option value="Moving to another platform">Moving to another platform</option>
                <option value="No longer playing golf">No longer playing golf</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-medium transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading || !cancelReason}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-900 rounded-2xl font-medium transition"
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}