"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generateDraw } from "@/lib/draw";
import { countMatches } from "@/lib/match";

type User = {
  id: string;
  email: string;
  subscription_status: string;
  subscription_plan: string | null;
  charity_percentage: number;
  role: string;
};

type Draw = {
  id: string;
  numbers: number[];
  month: string;
  year: number;
  status: string;
  jackpot_rollover: number;
  draw_mode?: string;
  created_at: string;
};

type Winner = {
  id: string;
  user_id: string;
  match_type: number;
  prize_amount: number;
  status: string;
  proof_url: string | null;
  created_at: string;
  users?: { email: string };
};

type Charity = {
  id: string;
  name: string;
  description: string;
  is_featured: boolean;
};

type Tab = "users" | "draws" | "charities" | "winners" | "analytics";
type DrawMode = "random" | "algorithmic-frequent" | "algorithmic-rare";

// ─── Mini Bar Chart ───────────────────────────────────────────────
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
     {data.map((d, i) => (
  <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400">{d.value}</span>
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{ height: `${(d.value / max) * 100}px`, background: color, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-xs text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <p className="text-gray-500 text-sm mt-4">No data yet.</p>;
  let cumulative = 0;
  const radius = 60, cx = 70, cy = 70, strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-6 mt-4">
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const offset = circumference - cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={seg.label} cx={cx} cy={cy} r={radius} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset} />
          );
        })}
        <circle cx={cx} cy={cy} r={radius - strokeWidth / 2 - 2} fill="#1e293b" />
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-300">{seg.label}</span>
            <span className="text-white font-medium ml-auto pl-4">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [simResult, setSimResult] = useState<number[] | null>(null);
  const [publishing, setPublishing] = useState(false);

  // ── Algorithmic draw mode ──
  const [drawMode, setDrawMode] = useState<DrawMode>("random");
  const [generatingAlgo, setGeneratingAlgo] = useState(false);

  // ── Charity form ──
  const [charityName, setCharityName] = useState("");
  const [charityDesc, setCharityDesc] = useState("");

  // ── User subscription management ──
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => { checkAdminAccess(); }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") { window.location.href = "/dashboard"; return; }
    fetchAll();
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchDraws(), fetchWinners(), fetchCharities()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users")
      .select("id, email, subscription_status, subscription_plan, charity_percentage, role")
      .order("email");
    setUsers(data || []);
  };

  const fetchDraws = async () => {
    const { data } = await supabase.from("draws").select("*").order("created_at", { ascending: false });
    setDraws(data || []);
  };

  const fetchWinners = async () => {
    const { data } = await supabase.from("winners").select("*, users(email)").order("created_at", { ascending: false });
    setWinners(data || []);
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*").order("name");
    setCharities(data || []);
  };

  // ── ALGORITHMIC DRAW ────────────────────────────────────────────
  const generateAlgorithmicDraw = async (mode: "frequent" | "rare") => {
    setGeneratingAlgo(true);
    try {
      // Fetch all scores from active subscribers
      const { data: activeUsers } = await supabase.from("users")
        .select("id").eq("subscription_status", "active");

      if (!activeUsers || activeUsers.length === 0) {
        alert("No active subscribers — falling back to random draw.");
        setSimResult(generateDraw());
        setGeneratingAlgo(false);
        return;
      }

      const scoreFrequency: Record<number, number> = {};

      for (const user of activeUsers) {
        const { data: scores } = await supabase.from("scores")
          .select("score").eq("user_id", user.id)
          .order("played_at", { ascending: false }).limit(5);
        if (scores) {
          scores.forEach(({ score }) => {
            scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
          });
        }
      }

      if (Object.keys(scoreFrequency).length < 5) {
        alert("Not enough score data — falling back to random draw.");
        setSimResult(generateDraw());
        setGeneratingAlgo(false);
        return;
      }

      // Sort by frequency
      const sorted = Object.entries(scoreFrequency)
        .map(([score, count]) => ({ score: parseInt(score), count }))
        .sort((a, b) => mode === "frequent" ? b.count - a.count : a.count - b.count);

      // Pick top 5 with slight randomisation to avoid always same numbers
      const pool = sorted.slice(0, 10).map((s) => s.score);
      const picked: number[] = [];
      while (picked.length < 5 && pool.length > 0) {
        const idx = Math.floor(Math.random() * Math.min(5, pool.length));
        const val = pool.splice(idx, 1)[0];
        if (!picked.includes(val)) picked.push(val);
      }

      // Fill remaining with random if needed
      while (picked.length < 5) {
        const r = Math.floor(Math.random() * 45) + 1;
        if (!picked.includes(r)) picked.push(r);
      }

      setSimResult(picked);
    } catch (err) {
      console.error("Algorithmic draw error:", err);
      setSimResult(generateDraw());
    }
    setGeneratingAlgo(false);
  };

  const simulateDraw = async () => {
    if (drawMode === "random") {
      setSimResult(generateDraw());
    } else if (drawMode === "algorithmic-frequent") {
      await generateAlgorithmicDraw("frequent");
    } else {
      await generateAlgorithmicDraw("rare");
    }
  };

  const publishDraw = async () => {
    setPublishing(true);
    const numbers = simResult || generateDraw();
    const now = new Date();

    const { data: draw } = await supabase.from("draws").insert({
      numbers,
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
      status: "published",
      jackpot_rollover: 0,
      draw_mode: drawMode,
    }).select().single();

    if (!draw) { alert("Failed to create draw"); setPublishing(false); return; }

    try {
      const poolRes = await fetch("/api/calculate-prize-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: draw.id }),
      });
      const poolData = await poolRes.json();
      if (!poolData.success) console.error("Prize pool failed:", poolData.error);
    } catch (err) {
      console.error("Prize pool API error:", err);
    }

    const { data: activeUsers } = await supabase.from("users")
      .select("id, email").eq("subscription_status", "active");

    if (!activeUsers || activeUsers.length === 0) {
      alert("Draw published! No active subscribers to match.");
      setSimResult(null); setPublishing(false); fetchDraws(); return;
    }

    const pool = activeUsers.length * 10;
    const pool5 = pool * 0.4, pool4 = pool * 0.35, pool3 = pool * 0.25;
    const match5Winners: string[] = [], match4Winners: string[] = [], match3Winners: string[] = [];

    for (const user of activeUsers) {
      const { data: scores } = await supabase.from("scores").select("score")
        .eq("user_id", user.id).order("played_at", { ascending: false }).limit(5);
      if (!scores || scores.length === 0) continue;
      const matches = countMatches(scores.map((s) => s.score), numbers);
      if (matches === 5) match5Winners.push(user.id);
      else if (matches === 4) match4Winners.push(user.id);
      else if (matches === 3) match3Winners.push(user.id);
    }

    const insertWinners = async (userIds: string[], matchType: number, totalPrize: number) => {
      if (userIds.length === 0) return;
      const share = totalPrize / userIds.length;
      for (const uid of userIds) {
        await supabase.from("winners").insert({
          draw_id: draw.id, user_id: uid, match_type: matchType, prize_amount: share, status: "pending",
        });
      }
    };

    await insertWinners(match5Winners, 5, pool5);
    await insertWinners(match4Winners, 4, pool4);
    await insertWinners(match3Winners, 3, pool3);

    try {
      const emailPayload = activeUsers.map((user) => {
        let matched = 0, prize = 0;
        if (match5Winners.includes(user.id)) { matched = 5; prize = match5Winners.length > 0 ? pool5 / match5Winners.length : 0; }
        else if (match4Winners.includes(user.id)) { matched = 4; prize = match4Winners.length > 0 ? pool4 / match4Winners.length : 0; }
        else if (match3Winners.includes(user.id)) { matched = 3; prize = match3Winners.length > 0 ? pool3 / match3Winners.length : 0; }
        return { email: user.email, month: now.toLocaleString("default", { month: "long" }), year: now.getFullYear(), matched, prize };
      });
      await fetch("/api/send-draw-emails", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: emailPayload }),
      });
    } catch (e) { console.error("Draw emails failed:", e); }

    setSimResult(null); setPublishing(false);
    fetchDraws(); fetchWinners();
    alert(`Draw published! ✓\nMode: ${drawMode}\nWinners — 5-match: ${match5Winners.length}, 4-match: ${match4Winners.length}, 3-match: ${match3Winners.length}`);
  };

  const updateWinnerStatus = async (id: string, status: string) => {
    await supabase.from("winners").update({ status }).eq("id", id);
    if (status === "paid") {
      const winner = winners.find((w) => w.id === id);
      if (winner?.users?.email) {
        try {
          await fetch("/api/send-payout-email", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: winner.users.email, amount: winner.prize_amount }),
          });
        } catch (e) { console.error("Payout email failed:", e); }
      }
    }
    fetchWinners();
  };

  // ── CHARITY ─────────────────────────────────────────────────────
  const addCharity = async () => {
    if (!charityName) return alert("Name is required");
    await supabase.from("charities").insert({ name: charityName, description: charityDesc });
    setCharityName(""); setCharityDesc(""); fetchCharities();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("charities").update({ is_featured: !current }).eq("id", id);
    fetchCharities();
  };

  const deleteCharity = async (id: string) => {
    if (!confirm("Delete this charity?")) return;
    await supabase.from("charities").delete().eq("id", id);
    fetchCharities();
  };

  // ── USER MANAGEMENT ──────────────────────────────────────────────
  const toggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("users").update({ role: newRole }).eq("id", id);
    fetchUsers();
  };

  const toggleSubscription = async (id: string, currentStatus: string) => {
    setUpdatingUser(id);
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const update: Record<string, unknown> = { subscription_status: newStatus };
    if (newStatus === "active") {
      update.subscription_plan = "monthly";
      update.subscription_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      update.subscription_end_date = null;
    }
    await supabase.from("users").update(update).eq("id", id);
    setUpdatingUser(null);
    fetchUsers();
  };

  // ── ANALYTICS DATA ───────────────────────────────────────────────
  const activeCount = users.filter((u) => u.subscription_status === "active").length;
  const inactiveCount = users.filter((u) => u.subscription_status !== "active").length;
  const totalPool = activeCount * 10;

  const drawsByMonth = draws.slice(0, 6).reverse().map((d) => ({
    label: d.month?.slice(0, 3) || "—",
    value: d.numbers?.length > 0 ? activeCount * 10 : 0,
  }));

  const charityContrib = charities.slice(0, 5).map((c) => ({
    label: c.name.split(" ")[0],
    value: users.filter((u) => u.charity_percentage > 10).length * 5,
  }));

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: "users", label: "Users", emoji: "👥" },
    { key: "draws", label: "Draws", emoji: "🎲" },
    { key: "charities", label: "Charities", emoji: "💚" },
    { key: "winners", label: "Winners", emoji: "🏆" },
    { key: "analytics", label: "Analytics", emoji: "📊" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-700 bg-slate-900/80 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Restricted</span>
        </div>
        <button onClick={() => (window.location.href = "/dashboard")}
          className="text-sm text-gray-400 hover:text-white transition">
          ← Back to Dashboard
        </button>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid grid-cols-4 gap-px bg-slate-700 border-b border-slate-700">
        {[
          { label: "Total Users", value: users.length, color: "text-white" },
          { label: "Active Subscribers", value: activeCount, color: "text-green-400" },
          { label: "Prize Pool", value: `₹${totalPool}`, color: "text-yellow-400" },
          { label: "Draws Run", value: draws.length, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 px-6 py-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 px-8 pt-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition flex items-center gap-2 ${
              tab === t.key ? "bg-slate-800 text-white" : "text-gray-500 hover:text-white hover:bg-slate-800/50"
            }`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 mx-8 rounded-b-xl rounded-tr-xl p-6 mb-8">

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">All Users <span className="text-gray-500 font-normal">({users.length})</span></h2>
              <div className="flex gap-2 text-xs">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full">{activeCount} active</span>
                <span className="bg-slate-600 text-gray-400 px-2 py-1 rounded-full">{inactiveCount} inactive</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-slate-700 text-xs uppercase tracking-wide">
                    <th className="text-left py-3 pr-4">Email</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3 pr-4">Plan</th>
                    <th className="text-left py-3 pr-4">Charity %</th>
                    <th className="text-left py-3 pr-4">Role</th>
                    <th className="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                      <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.subscription_status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>{u.subscription_status}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400 capitalize">{u.subscription_plan || "—"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(u.charity_percentage || 10, 100)}%` }} />
                          </div>
                          <span className="text-gray-400 text-xs">{u.charity_percentage || 10}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          u.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-slate-600 text-gray-400"
                        }`}>{u.role || "user"}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleSubscription(u.id, u.subscription_status)}
                            disabled={updatingUser === u.id}
                            className={`text-xs px-3 py-1 rounded transition disabled:opacity-50 ${
                              u.subscription_status === "active"
                                ? "bg-red-500/20 hover:bg-red-500/40 text-red-400"
                                : "bg-green-500/20 hover:bg-green-500/40 text-green-400"
                            }`}>
                            {updatingUser === u.id ? "..." : u.subscription_status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => toggleAdmin(u.id, u.role)}
                            className="text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded transition">
                            {u.role === "admin" ? "Remove admin" : "Make admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-gray-500 text-sm mt-4">No users yet.</p>}
            </div>
          </div>
        )}

        {/* ── DRAWS TAB ── */}
        {tab === "draws" && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Draw Management</h2>

            {/* Draw Mode Selector */}
            <div className="bg-slate-700 p-5 rounded-xl mb-4">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Draw Mode</h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { key: "random" as DrawMode, label: "Random", desc: "Standard lottery-style random numbers", icon: "🎲" },
                  { key: "algorithmic-frequent" as DrawMode, label: "Most Common", desc: "Weighted toward most frequently played scores", icon: "📈" },
                  { key: "algorithmic-rare" as DrawMode, label: "Rarest Scores", desc: "Weighted toward least frequently played scores", icon: "📉" },
                ].map((mode) => (
                  <button key={mode.key} onClick={() => { setDrawMode(mode.key); setSimResult(null); }}
                    className={`p-4 rounded-xl text-left transition border ${
                      drawMode === mode.key
                        ? "border-purple-500/60 bg-purple-500/10"
                        : "border-slate-600 bg-slate-800 hover:border-slate-500"
                    }`}>
                    <div className="text-2xl mb-2">{mode.icon}</div>
                    <div className="text-sm font-medium text-white mb-1">{mode.label}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{mode.desc}</div>
                  </button>
                ))}
              </div>

              {/* Simulated numbers display */}
              {simResult && (
                <div className="mb-4 p-4 bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">Simulated numbers:</p>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full capitalize">
                      {drawMode === "random" ? "Random" : drawMode === "algorithmic-frequent" ? "Most Common" : "Rarest Scores"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {simResult.map((n, i) => (
                      <div key={i} className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={simulateDraw} disabled={publishing || generatingAlgo}
                  className="bg-slate-600 hover:bg-slate-500 px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
                  {generatingAlgo ? (
                    <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Analysing scores...</>
                  ) : "Simulate Draw"}
                </button>
                <button onClick={publishDraw} disabled={publishing || generatingAlgo}
                  className="bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
                  {publishing ? (
                    <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Publishing...</>
                  ) : simResult ? "Publish These Numbers" : "Generate & Publish Draw"}
                </button>
              </div>
              {publishing && (
                <p className="text-xs text-gray-400 mt-3 animate-pulse">Calculating prize pools, matching winners, sending emails...</p>
              )}
            </div>

            {/* Draw History */}
            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">Draw History</h3>
            <div className="space-y-3">
              {draws.map((d) => (
                <div key={d.id} className="bg-slate-700 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{d.month} {d.year}</p>
                      {d.draw_mode && d.draw_mode !== "random" && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          {d.draw_mode === "algorithmic-frequent" ? "📈 Most Common" : "📉 Rarest"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {(d.numbers || []).map((n, i) => (
                        <span key={i} className="text-xs bg-purple-500/30 text-purple-300 w-8 h-8 rounded-full flex items-center justify-center font-medium">{n}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    d.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>{d.status}</span>
                </div>
              ))}
              {draws.length === 0 && <p className="text-gray-500 text-sm">No draws yet.</p>}
            </div>
          </div>
        )}

        {/* ── CHARITIES TAB ── */}
        {tab === "charities" && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Charity Management</h2>
            <div className="bg-slate-700 p-5 rounded-xl mb-6">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Add New Charity</h3>
              <div className="space-y-3">
                <input placeholder="Charity name" value={charityName}
                  onChange={(e) => setCharityName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition" />
                <textarea placeholder="Description" value={charityDesc}
                  onChange={(e) => setCharityDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-gray-500 h-24 resize-none focus:outline-none focus:border-green-500 transition" />
                <button onClick={addCharity}
                  className="bg-green-500 hover:bg-green-600 px-5 py-2.5 rounded-xl text-sm font-medium transition">
                  + Add Charity
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {charities.map((c) => (
                <div key={c.id} className="bg-slate-700 p-4 rounded-xl flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{c.name}</p>
                      {c.is_featured && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Featured</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{c.description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggleFeatured(c.id, c.is_featured)}
                      className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg transition">
                      {c.is_featured ? "Unfeature" : "⭐ Feature"}
                    </button>
                    <button onClick={() => deleteCharity(c.id)}
                      className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {charities.length === 0 && <p className="text-gray-500 text-sm">No charities yet.</p>}
            </div>
          </div>
        )}

        {/* ── WINNERS TAB ── */}
        {tab === "winners" && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Winner Verification <span className="text-gray-500 font-normal">({winners.length})</span></h2>
            <div className="space-y-3">
              {winners.map((w) => (
                <div key={w.id} className="bg-slate-700 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{w.users?.email || w.user_id}</p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {w.match_type}-number match ·{" "}
                        <span className="text-yellow-400 font-medium">₹{(w.prize_amount || 0).toFixed(2)}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      w.status === "paid" ? "bg-green-500/20 text-green-400"
                        : w.status === "approved" ? "bg-blue-500/20 text-blue-400"
                        : w.status === "rejected" ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>{w.status}</span>
                  </div>
                  {w.proof_url ? (
                    <a href={w.proof_url} target="_blank" className="text-xs text-purple-400 hover:underline block mb-3">📎 View proof →</a>
                  ) : w.status === "pending" ? (
                    <p className="text-xs text-gray-500 mb-3">⏳ Awaiting proof upload from winner</p>
                  ) : null}
                  <div className="flex gap-2">
                    {w.status === "pending" && (
                      <>
                        <button onClick={() => updateWinnerStatus(w.id, "approved")}
                          className="text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1.5 rounded-lg transition">
                          ✓ Approve
                        </button>
                        <button onClick={() => updateWinnerStatus(w.id, "rejected")}
                          className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition">
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {w.status === "approved" && (
                      <button onClick={() => updateWinnerStatus(w.id, "paid")}
                        className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg transition">
                        💸 Mark as Paid
                      </button>
                    )}
                    {w.status === "rejected" && (
                      <button onClick={() => updateWinnerStatus(w.id, "pending")}
                        className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 px-3 py-1.5 rounded-lg transition">
                        ↩ Revert to Pending
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {winners.length === 0 && <p className="text-gray-500 text-sm">No winners yet.</p>}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Reports & Analytics</h2>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: users.length, sub: `${activeCount} active`, color: "text-white", bg: "bg-slate-700" },
                { label: "Prize Pool", value: `₹${totalPool}`, sub: `${activeCount} × ₹10`, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                { label: "Total Draws", value: draws.length, sub: "published", color: "text-purple-400", bg: "bg-purple-500/10" },
                { label: "Total Winners", value: winners.filter((w) => w.status !== "rejected").length, sub: `${winners.filter((w) => w.status === "paid").length} paid out`, color: "text-green-400", bg: "bg-green-500/10" },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} border border-slate-700 p-5 rounded-xl`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">

              {/* Prize Pool per Draw */}
              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-sm font-medium text-white mb-1">Prize Pool per Draw</p>
                <p className="text-xs text-gray-500">Based on active subscribers at time of draw</p>
                {drawsByMonth.length > 0
                  ? <BarChart data={drawsByMonth} color="linear-gradient(to top, #a78bfa, #7c3aed)" />
                  : <p className="text-gray-500 text-sm mt-4">No draws yet.</p>}
              </div>

              {/* Subscriber Breakdown Donut */}
              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-sm font-medium text-white mb-1">Subscriber Breakdown</p>
                <p className="text-xs text-gray-500">Active vs inactive users</p>
                <DonutChart segments={[
                  { label: "Active", value: activeCount, color: "#4ade80" },
                  { label: "Inactive", value: inactiveCount, color: "#374151" },
                ]} />
              </div>

              {/* Charity contribution chart */}
              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-sm font-medium text-white mb-1">Charity Contributions (Est.)</p>
                <p className="text-xs text-gray-500">Estimated ₹ contributed per charity</p>
                {charityContrib.length > 0
                  ? <BarChart data={charityContrib} color="linear-gradient(to top, #4ade80, #16a34a)" />
                  : <p className="text-gray-500 text-sm mt-4">No charities yet.</p>}
              </div>

              {/* Winner status breakdown */}
              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-sm font-medium text-white mb-1">Winner Status Breakdown</p>
                <p className="text-xs text-gray-500">Across all draws</p>
                <DonutChart segments={[
                  { label: "Pending", value: winners.filter((w) => w.status === "pending").length, color: "#facc15" },
                  { label: "Approved", value: winners.filter((w) => w.status === "approved").length, color: "#60a5fa" },
                  { label: "Paid", value: winners.filter((w) => w.status === "paid").length, color: "#4ade80" },
                  { label: "Rejected", value: winners.filter((w) => w.status === "rejected").length, color: "#f87171" },
                ]} />
              </div>

            </div>

            {/* Draw mode breakdown */}
            <div className="bg-slate-700 p-5 rounded-xl">
              <p className="text-sm font-medium text-white mb-4">Draw Mode History</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Random", key: "random", color: "text-gray-300", bg: "bg-slate-600" },
                  { label: "Most Common", key: "algorithmic-frequent", color: "text-purple-300", bg: "bg-purple-500/20" },
                  { label: "Rarest Scores", key: "algorithmic-rare", color: "text-blue-300", bg: "bg-blue-500/20" },
                ].map((mode) => (
                  <div key={mode.key} className={`${mode.bg} p-4 rounded-xl`}>
                    <p className={`text-2xl font-bold ${mode.color}`}>
                      {draws.filter((d) => (d.draw_mode || "random") === mode.key).length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{mode.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
