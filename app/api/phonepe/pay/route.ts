import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, type, charityId } = await req.json();

    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID!;
    const saltKey = process.env.NEXT_PUBLIC_SALT_KEY!;
    const saltIndex = process.env.NEXT_PUBLIC_SALT_INDEX!;
    const hostUrl = process.env.NEXT_PUBLIC_PHONE_PAY_HOST_URL!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    const transactionId = `TXN_${userId}_${Date.now()}`;

    const payload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: Math.round(amount * 100), // paise
      redirectUrl: `${baseUrl}/api/phonepe/status?txnId=${transactionId}&type=${type}&userId=${userId}&charityId=${charityId ?? ""}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${baseUrl}/api/phonepe/status?txnId=${transactionId}&type=${type}&userId=${userId}&charityId=${charityId ?? ""}`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###${saltIndex}`;

    const response = await fetch(`${hostUrl}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();
    const redirectUrl = data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
    }

    return NextResponse.json({ url: redirectUrl, transactionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}