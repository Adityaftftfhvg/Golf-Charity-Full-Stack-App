"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScoreInput from "@/components/ScoreInput";
import CharitySelect from "@/components/CharitySelect";

export default function Dashboard() {
  const [scores, setScores] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
 
    if (user) {
      setUserId(user.id);
      fetchScores(user.id);
    }
       if (!user) {
  window.location.href = "/auth";
}
  };

const fetchScores = async (uid: string) => {
  setLoading(true);

  const { data } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(5);

  setScores(data?.map((s) => s.score) || []);
  setLoading(false);
};

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white">

    <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

    <div className="grid md:grid-cols-2 gap-6">

      {/* LEFT SIDE */}
      <div className="space-y-6">

        <div className="<div className="bg-slate-800 p-6 rounded-xl shadow-lg hover:scale-105 transition ">
          <h2 className="mb-2">User ID</h2>
          <p className="text-gray-400 text-sm">{userId}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
          <h2 className="mb-4">Add Score</h2>
          {userId && <ScoreInput userId={userId} />}
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
          <h2 className="mb-4">Charity</h2>
          {userId && <CharitySelect userId={userId} />}
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg hover:scale-105 transition">
        <h2 className="mb-4">Your Scores</h2>

        {loading ? (
          <p>Loading...</p>
        ) : scores.length === 0 ? (
          <p className="text-gray-400">No scores yet</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {scores.map((s, i) => (
              <div key={i} className="bg-purple-500 px-4 py-2 rounded-lg">
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>

  </div>
);
}