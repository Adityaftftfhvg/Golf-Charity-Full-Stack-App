export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txnId = searchParams.get("txnId");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const charityId = searchParams.get("charityId");
    const amount = searchParams.get("amount");
    const plan = searchParams.get("plan") ?? "monthly";

    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;
    const hostUrl = process.env.PHONEPE_HOST_URL!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    console.log("PhonePe status check:", { txnId, type, userId, plan });

    const stringToHash = `/pg/v1/status/${merchantId}/${txnId}` + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###${saltIndex}`;

    const response = await fetch(
      `${hostUrl}/pg/v1/status/${merchantId}/${txnId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": merchantId,
        },
      }
    );

    const data = await response.json();
    console.log("PhonePe status response:", JSON.stringify(data, null, 2));

    if (data.code === "PAYMENT_SUCCESS") {
      if (type === "donation" && userId && charityId) {
        await supabase.from("donations").insert({
          user_id: userId,
          charity_id: charityId,
          amount: parseFloat(amount ?? "0"),
        });
      }

      if (type === "subscription" && userId) {
        const endDate =
          plan === "yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await supabase
          .from("users")
          .update({
            subscription_status: "active",
            subscription_plan: plan,
            subscription_end_date: endDate.toISOString(),
          })
          .eq("id", userId);
      }

      return NextResponse.redirect(
        `${baseUrl}/dashboard?payment=success&type=${type}`
      );
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed`);
  } catch (err: any) {
    console.error("PhonePe status error:", err.message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=failed`
    );
  }
}