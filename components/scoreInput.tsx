"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ScoreInput({
  userId,
  onScoreAdded,
}: {
  userId: string;
  onScoreAdded?: () => void;
}) {
  const [score, setScore] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const addScore = async () => {
    const num = parseInt(score);

    if (isNaN(num) || num < 1 || num > 45) {
      alert("Score must be between 1 and 45");
      return;
    }
    if (!date) {
      alert("Please select the date you played");
      return;
    }

    setLoading(true);

    await supabase.from("scores").insert({
      user_id: userId,
      score: num,
      played_at: date,
    });

    // Delete oldest if more than 5
    const { data } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", userId)
      .order("played_at", { ascending: false });

    if (data && data.length > 5) {
      const toDelete = data.slice(5).map((s) => s.id);
      await supabase.from("scores").delete().in("id", toDelete);
    }

    setScore("");
    setDate("");
    setLoading(false);
    onScoreAdded?.();
  };

  return (
    <div className="space-y-3">
      <input
        type="number"
        min={1}
        max={45}
        placeholder="Score (1–45)"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="p-3 rounded-lg text-black w-full"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="p-3 rounded-lg text-black w-full"
      />
      <button
        onClick={addScore}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg transition"
      >
        {loading ? "Adding..." : "Add Score"}
      </button>
    </div>
  );
}
