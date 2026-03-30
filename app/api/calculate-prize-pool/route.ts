import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { drawId } = await req.json();
    if (!drawId) return NextResponse.json({ error: "drawId required" }, { status: 400 });

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

    // Step 3: Check for unclaimed jackpot from previous draw
    const { data: lastPool } = await supabase
      .from("prize_pool")
      .select("five_match_pool, draw_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let carriedJackpot = 0;
    if (lastPool) {
      const { count: prevFiveMatch } = await supabase
        .from("winners")
        .select("*", { count: "exact", head: true })
        .eq("draw_id", lastPool.draw_id)
        .eq("match_type", 5);

      if ((prevFiveMatch ?? 0) === 0) {
        carriedJackpot = lastPool.five_match_pool ?? 0;
      }
    }

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

    return NextResponse.json({ success: true, pool: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
