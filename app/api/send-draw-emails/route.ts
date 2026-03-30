import { NextRequest, NextResponse } from "next/server";
import { sendDrawResultEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { users } = await req.json();
    for (const user of users) {
      try {
        await sendDrawResultEmail(
          user.email,
          user.month,
          user.year,
          user.matched,
          user.prize
        );
      } catch (e) {
        console.error("Email failed for", user.email, e);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}