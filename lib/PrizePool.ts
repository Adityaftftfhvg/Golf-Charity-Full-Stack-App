import { supabase } from "@/lib/supabase";

export async function calculatePrizePool(drawId: string) {
  // Step 1: Get active subscriber count
  const { count: subscriberCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("subscription_status", "active");

  // Step 2: Get draw's prize contribution per user
  const { data: draw } = await supabase
    .from("draws")
    .select("prize_contribution")
    .eq("id", drawId)
    .single();

  const perUser = draw?.prize_contribution ?? 5.0;
  const totalPool = (subscriberCount ?? 0) * perUser;

  // Step 3: Get any carried jackpot from previous draw
  const { data: lastPool } = await supabase
    .from("prize_pool")
    .select("jackpot_carried, five_match_pool")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Check if last jackpot was unclaimed
  const { count: fiveMatchWinners } = await supabase
    .from("winners")
    .select("*", { count: "exact", head: true })
    .eq("draw_id", drawId)
    .eq("match_type", 5);

  const carriedJackpot =
    fiveMatchWinners === 0 ? (lastPool?.five_match_pool ?? 0) : 0;

  // Step 4: Calculate tier pools
  const five_match_pool = totalPool * 0.4 + carriedJackpot;
  const four_match_pool = totalPool * 0.35;
  const three_match_pool = totalPool * 0.25;

  // Step 5: Upsert into prize_pool table
  const { data, error } = await supabase
    .from("prize_pool")
    .upsert(
      {
        draw_id: drawId,
        total_pool: totalPool,
        five_match_pool,
        four_match_pool,
        three_match_pool,
        jackpot_carried: carriedJackpot,
      },
      { onConflict: "draw_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPrizePool(drawId: string) {
  const { data } = await supabase
    .from("prize_pool")
    .select("*")
    .eq("draw_id", drawId)
    .single();
  return data;
}