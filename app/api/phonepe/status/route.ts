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

    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID!;
    const saltKey = process.env.NEXT_PUBLIC_SALT_KEY!;
    const saltIndex = process.env.NEXT_PUBLIC_SALT_INDEX!;
    const hostUrl = process.env.NEXT_PUBLIC_PHONE_PAY_HOST_URL!;

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

    if (data.code === "PAYMENT_SUCCESS") {
      // Save donation to Supabase
      if (type === "donation" && userId && charityId) {
        await supabase.from("donations").insert({
          user_id: userId,
          charity_id: charityId,
          amount: parseFloat(amount ?? "0"),
        });
      }

      // Update subscription status
      if (type === "subscription" && userId) {
        const plan = searchParams.get("plan") ?? "monthly";
        const endDate = plan === "yearly"
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
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success&type=${type}`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=failed`
    );
  } catch (err: any) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=failed`
    );
  }
}