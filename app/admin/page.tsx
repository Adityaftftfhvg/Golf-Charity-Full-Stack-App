"use client";

import { useEffect, useState } from "react";
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

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [simResult, setSimResult] = useState<number[] | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Charity form
  const [charityName, setCharityName] = useState("");
  const [charityDesc, setCharityDesc] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchDraws(), fetchWinners(), fetchCharities()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, email, subscription_status, subscription_plan, charity_percentage, role")
      .order("email");
    setUsers(data || []);
  };

  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });
    setDraws(data || []);
  };

  const fetchWinners = async () => {
    const { data } = await supabase
      .from("winners")
      .select("*, users(email)")
      .order("created_at", { ascending: false });
    setWinners(data || []);
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*").order("name");
    setCharities(data || []);
  };

  // --- DRAW FUNCTIONS ---
  const simulateDraw = () => {
    const numbers = generateDraw();
    setSimResult(numbers);
  };

  const publishDraw = async () => {
    setPublishing(true);
    const numbers = simResult || generateDraw();
    const now = new Date();

    // Step 1: Create and publish the draw
    const { data: draw } = await supabase
      .from("draws")
      .insert({
        numbers,
        month: now.toLocaleString("default", { month: "long" }),
        year: now.getFullYear(),
        status: "published",
        jackpot_rollover: 0,
      })
      .select()
      .single();

    if (!draw) {
      alert("Failed to create draw");
      setPublishing(false);
      return;
    }

    // Step 2: Trigger prize pool calculation via API
    try {
      const poolRes = await fetch("/api/calculate-prize-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: draw.id }),
      });
      const poolData = await poolRes.json();
      if (!poolData.success) {
        console.error("Prize pool calculation failed:", poolData.error);
      }
    } catch (err) {
      console.error("Prize pool API error:", err);
    }

    // Step 3: Match users' scores against draw numbers
    const { data: activeUsers } = await supabase
      .from("users")
      .select("id")
      .eq("subscription_status", "active");

    if (!activeUsers || activeUsers.length === 0) {
      alert("Draw published! No active subscribers to match.");
      setSimResult(null);
      setPublishing(false);
      fetchDraws();
      return;
    }

    const pool = activeUsers.length * 10;
    const pool5 = pool * 0.4;
    const pool4 = pool * 0.35;
    const pool3 = pool * 0.25;

    const match5Winners: string[] = [];
    const match4Winners: string[] = [];
    const match3Winners: string[] = [];

    for (const user of activeUsers) {
      const { data: scores } = await supabase
        .from("scores")
        .select("score")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(5);

      if (!scores || scores.length === 0) continue;

      const userScores = scores.map((s) => s.score);
      const matches = countMatches(userScores, numbers);

      if (matches === 5) match5Winners.push(user.id);
      else if (matches === 4) match4Winners.push(user.id);
      else if (matches === 3) match3Winners.push(user.id);
    }

    const insertWinners = async (
      userIds: string[],
      matchType: number,
      totalPrize: number
    ) => {
      if (userIds.length === 0) return;
      const share = totalPrize / userIds.length;
      for (const uid of userIds) {
        await supabase.from("winners").insert({
          draw_id: draw.id,
          user_id: uid,
          match_type: matchType,
          prize_amount: share,
          status: "pending",
        });
      }
    };

    await insertWinners(match5Winners, 5, pool5);
    await insertWinners(match4Winners, 4, pool4);
    await insertWinners(match3Winners, 3, pool3);

    setSimResult(null);
    setPublishing(false);
    fetchDraws();
    fetchWinners();
    alert(
      `Draw published! Prize pool calculated ✓\nWinners — 5-match: ${match5Winners.length}, 4-match: ${match4Winners.length}, 3-match: ${match3Winners.length}`
    );
  };

  // --- WINNER FUNCTIONS ---
  const updateWinnerStatus = async (id: string, status: string) => {
    await supabase.from("winners").update({ status }).eq("id", id);
    fetchWinners();
  };

  // --- CHARITY FUNCTIONS ---
  const addCharity = async () => {
    if (!charityName) return alert("Name is required");
    await supabase.from("charities").insert({
      name: charityName,
      description: charityDesc,
    });
    setCharityName("");
    setCharityDesc("");
    fetchCharities();
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

  // --- USER FUNCTIONS ---
  const toggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("users").update({ role: newRole }).eq("id", id);
    fetchUsers();
  };

  // --- ANALYTICS ---
  const activeCount = users.filter((u) => u.subscription_status === "active").length;
  const totalPool = activeCount * 10;

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "draws", label: "Draws" },
    { key: "charities", label: "Charities" },
    { key: "winners", label: "Winners" },
    { key: "analytics", label: "Analytics" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-gray-400">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-red-400">Admin Panel</h1>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Back to Dashboard
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 px-8 pt-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-slate-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 mx-8 rounded-b-xl rounded-tr-xl p-6 mb-8">

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <h2 className="text-lg font-medium mb-4">All Users ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-slate-700">
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
                    <tr
                      key={u.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30"
                    >
                      <td className="py-3 pr-4 text-gray-300">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            u.subscription_status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {u.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400 capitalize">
                        {u.subscription_plan || "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        {u.charity_percentage || 10}%
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            u.role === "admin"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-slate-600 text-gray-400"
                          }`}
                        >
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleAdmin(u.id, u.role)}
                          className="text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded transition"
                        >
                          {u.role === "admin" ? "Remove admin" : "Make admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-gray-500 text-sm mt-4">No users yet.</p>
              )}
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {tab === "draws" && (
          <div>
            <h2 className="text-lg font-medium mb-6">Draw Management</h2>

            <div className="bg-slate-700 p-5 rounded-xl mb-6">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
                Run a Draw
              </h3>
              {simResult && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Simulated numbers:</p>
                  <div className="flex gap-2">
                    {simResult.map((n, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={simulateDraw}
                  disabled={publishing}
                  className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  Simulate Draw
                </button>
                <button
                  onClick={publishDraw}
                  disabled={publishing}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {publishing ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      Publishing...
                    </>
                  ) : simResult ? (
                    "Publish These Numbers"
                  ) : (
                    "Generate & Publish Draw"
                  )}
                </button>
              </div>
              {publishing && (
                <p className="text-xs text-gray-400 mt-3">
                  Calculating prize pools and matching winners...
                </p>
              )}
            </div>

            <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">
              Draw History
            </h3>
            <div className="space-y-3">
              {draws.map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-700 p-4 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {d.month} {d.year}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {(d.numbers || []).map((n, i) => (
                        <span
                          key={i}
                          className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      d.status === "published"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
              ))}
              {draws.length === 0 && (
                <p className="text-gray-500 text-sm">No draws yet.</p>
              )}
            </div>
          </div>
        )}

        {/* CHARITIES TAB */}
        {tab === "charities" && (
          <div>
            <h2 className="text-lg font-medium mb-6">Charity Management</h2>

            <div className="bg-slate-700 p-5 rounded-xl mb-6">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
                Add New Charity
              </h3>
              <div className="space-y-3">
                <input
                  placeholder="Charity name"
                  value={charityName}
                  onChange={(e) => setCharityName(e.target.value)}
                  className="w-full p-3 rounded-lg text-black"
                />
                <textarea
                  placeholder="Description"
                  value={charityDesc}
                  onChange={(e) => setCharityDesc(e.target.value)}
                  className="w-full p-3 rounded-lg text-black h-24 resize-none"
                />
                <button
                  onClick={addCharity}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm transition"
                >
                  Add Charity
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {charities.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-700 p-4 rounded-xl flex justify-between items-start"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{c.name}</p>
                      {c.is_featured && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{c.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={() => toggleFeatured(c.id, c.is_featured)}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded transition"
                    >
                      {c.is_featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      onClick={() => deleteCharity(c.id)}
                      className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {charities.length === 0 && (
                <p className="text-gray-500 text-sm">No charities yet.</p>
              )}
            </div>
          </div>
        )}

        {/* WINNERS TAB */}
        {tab === "winners" && (
          <div>
            <h2 className="text-lg font-medium mb-4">Winner Verification</h2>
            <div className="space-y-3">
              {winners.map((w) => (
                <div key={w.id} className="bg-slate-700 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">
                        {w.users?.email || w.user_id}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {w.match_type}-number match · £
                        {(w.prize_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        w.status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : w.status === "approved"
                          ? "bg-blue-500/20 text-blue-400"
                          : w.status === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                  {w.proof_url && (
                    <a
                      href={w.proof_url}
                      target="_blank"
                      className="text-xs text-purple-400 hover:underline block mb-3"
                    >
                      View proof →
                    </a>
                  )}
                  {!w.proof_url && w.status === "pending" && (
                    <p className="text-xs text-gray-500 mb-3">
                      Awaiting proof upload from winner
                    </p>
                  )}
                  <div className="flex gap-2">
                    {w.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateWinnerStatus(w.id, "approved")}
                          className="text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 px-3 py-1 rounded transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateWinnerStatus(w.id, "rejected")}
                          className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {w.status === "approved" && (
                      <button
                        onClick={() => updateWinnerStatus(w.id, "paid")}
                        className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1 rounded transition"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {w.status === "rejected" && (
                      <button
                        onClick={() => updateWinnerStatus(w.id, "pending")}
                        className="text-xs bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 px-3 py-1 rounded transition"
                      >
                        Revert to Pending
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {winners.length === 0 && (
                <p className="text-gray-500 text-sm">No winners yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          <div>
            <h2 className="text-lg font-medium mb-6">Reports & Analytics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: users.length },
                { label: "Active Subscribers", value: activeCount },
                { label: "Total Prize Pool", value: `£${totalPool}` },
                { label: "Total Draws", value: draws.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-700 p-5 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-gray-400 text-sm mb-3">
                  Subscription breakdown
                </p>
                <div className="space-y-2">
                  {["active", "inactive"].map((s) => {
                    const count = users.filter(
                      (u) => u.subscription_status === s
                    ).length;
                    return (
                      <div key={s} className="flex justify-between text-sm">
                        <span className="capitalize text-gray-300">{s}</span>
                        <span className="text-white font-medium">
                          {count} users
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-700 p-5 rounded-xl">
                <p className="text-gray-400 text-sm mb-3">Winners by status</p>
                <div className="space-y-2">
                  {["pending", "approved", "paid", "rejected"].map((s) => {
                    const count = winners.filter((w) => w.status === s).length;
                    return (
                      <div key={s} className="flex justify-between text-sm">
                        <span className="capitalize text-gray-300">{s}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
