import { NextRequest, NextResponse } from "next/server";
import { sendPayoutEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    await sendPayoutEmail(email, amount);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}