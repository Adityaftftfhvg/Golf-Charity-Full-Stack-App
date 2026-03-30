"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
  description: string;
};

export default function CharitySelect({ userId }: { userId: string }) {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [percentage, setPercentage] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCharities();
    fetchUserCharity();
  }, [userId]);

  const fetchCharities = async () => {
    const { data } = await supabase
      .from("charities")
      .select("id, name, description")
      .order("name");
    setCharities(data || []);
  };

  const fetchUserCharity = async () => {
    const { data } = await supabase
      .from("users")
      .select("charity_id, charity_percentage")
      .eq("id", userId)
      .single();
    if (data?.charity_id) setSelected(data.charity_id);
    if (data?.charity_percentage) setPercentage(data.charity_percentage);
  };

  const saveCharity = async () => {
    setSaving(true);
    await supabase
      .from("users")
      .update({ charity_id: selected, charity_percentage: percentage })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (charities.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No charities available yet. Ask an admin to add some!
      </p>
    );
  }

  return (
    <div className="space-y-4">

      {/* Charity selector */}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full p-3 rounded-lg text-black"
      >
        <option value="">Select a charity...</option>
        {charities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Percentage slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-400">
            Donation percentage
          </label>
          <span className="text-green-400 font-bold text-lg">
            {percentage}%
          </span>
        </div>

        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          className="w-full accent-green-500 cursor-pointer"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>10% (minimum)</span>
          <span>100%</span>
        </div>

        {/* Visual breakdown */}
        <div className="bg-slate-700 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Goes to charity</span>
            <span className="text-green-400 font-medium">{percentage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Goes to prize pool</span>
            <span className="text-purple-400 font-medium">{100 - percentage}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={saveCharity}
        disabled={saving || !selected}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 py-2 rounded-lg text-sm transition"
      >
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Charity & Percentage"}
      </button>
    </div>
  );
}
