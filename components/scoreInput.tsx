"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ScoreInput({
  userId,
  onScoreAdded,
  // Optional: pass an existing score to enter edit mode
  editScore,
  onEditDone,
}: {
  userId: string;
  onScoreAdded?: () => void;
  editScore?: { id: string; score: number; played_at: string };
  onEditDone?: () => void;
}) {
  const isEditMode = !!editScore;

  const [score, setScore] = useState(
    isEditMode ? String(editScore.score) : ""
  );
  const [date, setDate] = useState(
    isEditMode ? editScore.played_at.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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

    if (isEditMode) {
      // UPDATE existing score
      await supabase
        .from("scores")
        .update({ score: num, played_at: date })
        .eq("id", editScore.id);

      setLoading(false);
      onEditDone?.();
      return;
    }

    // INSERT new score
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
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg transition"
        >
          {loading
            ? isEditMode
              ? "Saving..."
              : "Adding..."
            : isEditMode
            ? "Save Changes"
            : "Add Score"}
        </button>
        {isEditMode && onEditDone && (
          <button
            onClick={onEditDone}
            disabled={loading}
            className="px-4 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 py-3 rounded-lg transition text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
