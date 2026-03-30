import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "onboarding@resend.dev";

export async function sendWelcomeEmail(to: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Golf Charity Platform 🏌️",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
        <h1 style="color:#4ade80;margin-bottom:8px;">Welcome aboard! 🎉</h1>
        <p style="color:#94a3b8;margin-bottom:24px;">You're now part of the Golf Charity Platform.</p>
        <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 10px;color:#f1f5f9;">1. Enter your golf scores after each round (1–45 Stableford)</p>
          <p style="margin:0 0 10px;color:#f1f5f9;">2. Participate in monthly prize draws automatically</p>
          <p style="margin:0;color:#f1f5f9;">3. Support your chosen charity with every subscription</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard"
           style="display:inline-block;padding:14px 28px;background:#4ade80;color:#0f172a;border-radius:8px;font-weight:bold;text-decoration:none;">
          Go to Dashboard →
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">Golf Charity Platform · Every round makes a difference.</p>
      </div>
    `,
  });
}

export async function sendDrawResultEmail(
  to: string,
  month: string,
  year: number,
  matched: number,
  prize: number
) {
  const isWinner = matched >= 3;
  await resend.emails.send({
    from: FROM,
    to,
    subject: isWinner ? `🎉 You won in the ${month} ${year} Draw!` : `${month} ${year} Draw Results`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
        ${isWinner ? `
          <h1 style="color:#facc15;margin-bottom:8px;">🎉 You Won!</h1>
          <p style="color:#94a3b8;margin-bottom:24px;">${month} ${year} Draw Results</p>
          <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="color:#94a3b8;font-size:13px;margin-bottom:4px;">YOU MATCHED</p>
            <p style="color:#4ade80;font-size:48px;font-weight:bold;margin:0;">${matched}</p>
            <p style="color:#94a3b8;font-size:13px;margin-top:4px;">numbers</p>
          </div>
          <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="color:#94a3b8;font-size:13px;margin-bottom:4px;">PRIZE AMOUNT</p>
            <p style="color:#facc15;font-size:40px;font-weight:bold;margin:0;">₹${prize.toFixed(2)}</p>
          </div>
          <p style="color:#f1f5f9;margin-bottom:20px;">Upload a screenshot of your scores to claim your prize.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard"
             style="display:inline-block;padding:14px 28px;background:#facc15;color:#0f172a;border-radius:8px;font-weight:bold;text-decoration:none;">
            Upload Proof Now →
          </a>
        ` : `
          <h1 style="color:#94a3b8;margin-bottom:8px;">${month} ${year} Draw Results</h1>
          <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;">
            <p style="color:#f1f5f9;margin:0;">You didn't match enough numbers this month. Keep entering scores for next month's draw!</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard"
             style="display:inline-block;padding:14px 28px;background:#4ade80;color:#0f172a;border-radius:8px;font-weight:bold;text-decoration:none;">
            Enter Next Month's Scores →
          </a>
        `}
        <p style="color:#475569;font-size:12px;margin-top:32px;">Golf Charity Platform · Every round makes a difference.</p>
      </div>
    `,
  });
}

export async function sendPayoutEmail(to: string, amount: number) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your prize payout has been processed ✅",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:12px;">
        <h1 style="color:#4ade80;margin-bottom:8px;">Payout Confirmed! ✅</h1>
        <p style="color:#94a3b8;margin-bottom:24px;">Your prize has been paid out.</p>
        <div style="background:#1e293b;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="color:#94a3b8;font-size:13px;margin-bottom:4px;">AMOUNT PAID</p>
          <p style="color:#facc15;font-size:48px;font-weight:bold;margin:0;">₹${amount.toFixed(2)}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard"
           style="display:inline-block;padding:14px 28px;background:#4ade80;color:#0f172a;border-radius:8px;font-weight:bold;text-decoration:none;">
          Go to Dashboard →
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">Golf Charity Platform · Every round makes a difference.</p>
      </div>
    `,
  });
}