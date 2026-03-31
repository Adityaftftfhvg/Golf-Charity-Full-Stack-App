export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, type, charityId, plan } = await req.json();

    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;
    const hostUrl = process.env.PHONEPE_HOST_URL!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    console.log("PhonePe ENV check:", {
      merchantId,
      saltKey: saltKey ? "SET" : "MISSING",
      saltIndex,
      hostUrl,
      baseUrl,
    });

    if (!merchantId || !saltKey || !saltIndex || !hostUrl || !baseUrl) {
      return NextResponse.json(
        { error: "Missing PhonePe environment variables" },
        { status: 500 }
      );
    }

   const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const redirectParams = new URLSearchParams({
      txnId: transactionId,
      type: type ?? "",
      userId: userId ?? "",
      charityId: charityId ?? "",
      amount: String(amount ?? 0),
      plan: plan ?? "monthly",
    });
    const redirectUrl = `${baseUrl}/api/phonepe/status?${redirectParams.toString()}`;

    const payload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: Math.round(amount * 100),
      redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: redirectUrl,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###${saltIndex}`;

    console.log("Calling PhonePe at:", `${hostUrl}/pg/v1/pay`);
    console.log("Transaction ID:", transactionId);
    console.log("Redirect URL:", redirectUrl);

    const response = await fetch(`${hostUrl}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();
    console.log("PhonePe full response:", JSON.stringify(data, null, 2));

    const phonePeRedirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!phonePeRedirectUrl) {
      return NextResponse.json(
        {
          error: "Failed to initiate payment",
          phonePeCode: data?.code,
          phonePeMessage: data?.message,
          phonePeResponse: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: phonePeRedirectUrl, transactionId });
  } catch (err: any) {
    console.error("PhonePe pay error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}