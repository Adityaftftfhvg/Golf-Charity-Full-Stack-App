"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pool = {
  draw_id: string;
  total_pool: number;
  five_match_pool: number;
  four_match_pool: number;
  three_match_pool: number;
  jackpot_carried: number;
  month: string;
  year: number;
};

export default function PrizePool() {
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestPool();
  }, []);

  const fetchLatestPool = async () => {
    // Get the latest published draw
    const { data: draw } = await supabase
      .from("draws")
      .select("id, month, year")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!draw) {
      setLoading(false);
      return;
    }

    // Get prize pool for that draw
    const { data: poolData } = await supabase
      .from("prize_pool")
      .select("*")
      .eq("draw_id", draw.id)
      .single();

    setPool(
      poolData ? { ...poolData, month: draw.month, year: draw.year } : null
    );
    setLoading(false);
  };

  if (loading)
    return <div className="bg-white/10 rounded-xl p-5 animate-pulse h-40" />;

  if (!pool)
    return (
      <div className="bg-white/10 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-2">Prize Pool</h3>
        <p className="text-gray-400 text-sm">No active prize pool yet.</p>
      </div>
    );

  return (
    <div className="bg-white/10 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prize Pool</h3>
        <span className="text-xs text-gray-400">
          {pool.month} {pool.year}
        </span>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          Total Pool
        </p>
        <p className="text-4xl font-bold text-green-400">
          ₹{Number(pool.total_pool).toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">5-Match</p>
          <p className="text-lg font-bold text-yellow-400">
            ₹{Number(pool.five_match_pool).toFixed(2)}
          </p>
          {pool.jackpot_carried > 0 && (
            <p className="text-xs text-orange-400">
              +₹{Number(pool.jackpot_carried).toFixed(2)} rollover
            </p>
          )}
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">4-Match</p>
          <p className="text-lg font-bold text-purple-400">
            ₹{Number(pool.four_match_pool).toFixed(2)}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">3-Match</p>
          {/* ✅ fixed: was missing ₹ symbol */}
          <p className="text-lg font-bold text-blue-400">
            ₹{Number(pool.three_match_pool).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
