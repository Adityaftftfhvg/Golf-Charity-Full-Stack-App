"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ScoreInput({ userId }: { userId: string }) {
  const [score, setScore] = useState("");

  const addScore = async () => {
    const num = parseInt(score);

    if (num < 1 || num > 45) {
      alert("Score must be between 1–45");
      return;
    }

    await supabase.from("scores").insert({
      user_id: userId,
      score: num,
    });

    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data && data.length > 5) {
      const extra = data.slice(5);
      extra.forEach(async (s) => {
        await supabase.from("scores").delete().eq("id", s.id);
      });
    }

    alert("Score added!");
  };

 return (
  <div className="flex gap-2">
    <input
      type="number"
      placeholder="Enter score"
      onChange={(e) => setScore(e.target.value)}
      className="p-2 rounded text-black w-full"
    />
    <button
      onClick={addScore}
      className="bg-purple-600 px-4 rounded hover:bg-purple-700"
    >
      Add
    </button>
  </div>
);
}