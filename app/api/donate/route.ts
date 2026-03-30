import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { amount, charityId, charityName, userId } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Minimum donation is £1" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Donation to ${charityName}`,
              description: "One-time charitable donation via Golf Charity Platform",
            },
            unit_amount: Math.round(amount * 100), // convert to pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "donation",
        user_id: userId,
        charity_id: charityId,
        amount: amount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?donated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?donated=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}