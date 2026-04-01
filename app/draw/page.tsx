"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Draw = {
  id: string;
  numbers: number[];
  month: string;
  year: number;
  status: string;
  jackpot_rollover: number;
  draw_mode?: string;
  created_at: string;
};

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DEMO_DRAW: Draw = {
  id: "demo",
  numbers: [12, 27, 33, 8, 41],
  month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear(),
  status: "published",
  jackpot_rollover: 48500,
  draw_mode: "algorithmic-frequent",
  created_at: new Date().toISOString(),
};

const PAST_DRAWS: Draw[] = [
  { id: "p1", numbers: [5, 19, 28, 36, 42], month: MONTHS[(new Date().getMonth() + 11) % 12], year: new Date().getFullYear(), status: "published", jackpot_rollover: 0, draw_mode: "random", created_at: "" },
  { id: "p2", numbers: [11, 22, 31, 39, 45], month: MONTHS[(new Date().getMonth() + 10) % 12], year: new Date().getFullYear(), status: "published", jackpot_rollover: 32000, draw_mode: "algorithmic-frequent", created_at: "" },
  { id: "p3", numbers: [3, 17, 26, 34, 40], month: MONTHS[(new Date().getMonth() + 9) % 12], year: new Date().getFullYear(), status: "published", jackpot_rollover: 0, draw_mode: "random", created_at: "" },
];

function BallNumber({ n, delay = 0, size = 56 }: { n: number; delay?: number; size?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const color = n <= 15 ? "#4ade80" : n <= 30 ? "#facc15" : n <= 40 ? "#a78bfa" : "#f87171";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}55)`,
      border: `2px solid ${color}88`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-playfair,serif)",
      fontWeight: 900, fontSize: size * 0.35,
      color: "#fff",
      boxShadow: `0 4px 20px ${color}55, inset 0 1px 0 rgba(255,255,255,.25)`,
      transform: visible ? "scale(1) translateY(0)" : "scale(0) translateY(20px)",
      opacity: visible ? 1 : 0,
      transition: `transform .5s cubic-bezier(.34,1.56,.64,1), opacity .4s ease`,
      transitionDelay: `${delay}ms`,
      flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

export default function DrawPage() {
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [pastDraws, setPastDraws] = useState<Draw[]>([]);
  const [userScores, setUserScores] = useState<number[]>([]);
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [usingDemo, setUsingDemo] = useState(false);

  const { ref: heroRef, inView: heroIn } = useInView(0.05);
  const { ref: drawRef, inView: drawIn } = useInView(0.08);
  const { ref: pastRef, inView: pastIn } = useInView(0.08);
  const { ref: prizeRef, inView: prizeIn } = useInView(0.08);

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(!!s);
      if (s?.user) {
        const { data: scores } = await supabase.from("scores").select("score").eq("user_id", s.user.id).order("played_at", { ascending: false }).limit(5);
        if (scores) setUserScores(scores.map((r: { score: number }) => r.score));
      }

      try {
        const { data: draws, error } = await supabase.from("draws").select("*").order("created_at", { ascending: false }).limit(4);
        if (!error && draws && draws.length > 0) {
          const published = draws.find((d: Draw) => d.status === "published");
          setCurrentDraw(published || draws[0]);
          setPastDraws(draws.filter((d: Draw) => d.id !== (published || draws[0]).id));
        } else {
          setCurrentDraw(DEMO_DRAW);
          setPastDraws(PAST_DRAWS);
          setUsingDemo(true);
        }
     } catch (err) {
  console.log("Draw catch:", err);
  setCurrentDraw(DEMO_DRAW);
  setPastDraws(PAST_DRAWS);
  setUsingDemo(true);
} finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Countdown to end of month
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, mins, secs });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const checkMatches = (drawNums: number[], userNums: number[]) => {
    return userNums.filter(n => drawNums.includes(n)).length;
  };

  const matchCount = currentDraw ? checkMatches(currentDraw.numbers, userScores) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop:"6rem" }}>
        <div style={{ width: 36, height: 36, border: "2px solid rgba(250,204,21,.2)", borderTopColor: "#facc15", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-3px);opacity:.7} }
        @keyframes jackpot-glow { 0%,100%{box-shadow:0 0 30px rgba(250,204,21,.15)} 50%{box-shadow:0 0 60px rgba(250,204,21,.35)} }
        @keyframes match-flash { 0%,100%{background:rgba(74,222,128,.1)} 50%{background:rgba(74,222,128,.25)} }
        @keyframes rotate-slow { from{transform:rotate(0)} to{transform:rotate(360deg)} }

        .fade-up { opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
        .fade-up.in { opacity:1;transform:translateY(0); }
        .d1{transition-delay:.06s} .d2{transition-delay:.12s} .d3{transition-delay:.18s} .d4{transition-delay:.24s} .d5{transition-delay:.30s}

        .countdown-cell {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          padding: 1.25rem .75rem;
          text-align: center;
          min-width: 72px;
        }
        .countdown-num {
          font-family: var(--font-playfair,serif);
          font-size: 2.5rem;
          font-weight: 900;
          color: #facc15;
          line-height: 1;
          animation: ticker 1s ease-in-out infinite;
        }
        .countdown-lbl {
          font-size: .62rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #475569;
          margin-top: .3rem;
        }

        .prize-tier {
          transition: transform .3s, border-color .3s, box-shadow .3s;
        }
        .prize-tier:hover { transform: translateY(-4px); }

        .past-draw-card {
          transition: transform .3s, border-color .3s;
        }
        .past-draw-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,.12) !important; }

        .match-badge {
          animation: match-flash 2s ease infinite;
        }

        .jackpot-card { animation: jackpot-glow 3s ease infinite; }

        .cta-draw {
          background: linear-gradient(135deg,#facc15,#f97316);
          color: #050a0e;
          font-weight: 800;
          font-size: .92rem;
          padding: .75rem 1.75rem;
          border-radius: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          transition: transform .2s, box-shadow .25s;
        }
        .cta-draw:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(250,204,21,.45); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c14", color: "#f1f5f9", fontFamily: "var(--font-dm-sans,DM Sans,sans-serif)", overflowX: "hidden" }}>

        {/* Ambient blobs */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(250,204,21,.07),transparent)", filter: "blur(110px)", top: -100, left: "15%" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.06),transparent)", filter: "blur(90px)", bottom: "20%", right: -60 }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

          {/* Hero */}
          <div ref={heroRef} className={`fade-up ${heroIn ? "in" : ""}`} style={{ textAlign: "center", marginBottom: "3rem" }}>
            {usingDemo && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".28rem .8rem", borderRadius: 9999, background: "rgba(167,139,250,.1)", border: "1px solid rgba(167,139,250,.2)", color: "#c4b5fd", fontSize: ".68rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".9rem" }}>
                ✨ Preview Mode — Connect Supabase to see live draws
              </div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".35rem .9rem", borderRadius: 9999, background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.2)", color: "#facc15", fontSize: ".7rem", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#facc15", display: "inline-block", boxShadow: "0 0 8px #facc15" }} />
              Live Monthly Draw
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "clamp(2.4rem,5vw,3.5rem)", fontWeight: 900, lineHeight: 1.06, marginBottom: ".8rem", letterSpacing: "-.02em" }}>
              {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}<br />
              <span style={{ background: "linear-gradient(135deg,#facc15,#f97316 50%,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Prize Draw</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: ".95rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.75 }}>
              5 numbers drawn every month. Match 3, 4, or all 5 to win. Your golf scores are your entries.
            </p>
          </div>

          {/* Countdown */}
          <div className={`fade-up d1 ${heroIn ? "in" : ""}`} style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
              {[
                { v: timeLeft.days, l: "Days" },
                { v: timeLeft.hours, l: "Hours" },
                { v: timeLeft.mins, l: "Mins" },
                { v: timeLeft.secs, l: "Secs" },
              ].map((t, i) => (
                <div key={t.l}>
                  <div className="countdown-cell">
                    <div className="countdown-num">{String(t.v).padStart(2, "0")}</div>
                    <div className="countdown-lbl">{t.l}</div>
                  </div>
                  {i < 3 && <span style={{ color: "#facc15", fontSize: "1.5rem", fontWeight: 900, marginLeft: ".75rem" }}>:</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Current Draw Numbers */}
          {currentDraw && (
            <div ref={drawRef} className={`fade-up ${drawIn ? "in" : ""}`} style={{ marginBottom: "3rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#facc15" }}>🎰 This Month's Numbers</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(250,204,21,.3),transparent)" }} />
                <span style={{ fontSize: ".7rem", color: "#475569", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", padding: ".2rem .6rem", borderRadius: 6 }}>
                  {currentDraw.draw_mode === "algorithmic-frequent" ? "⚡ Algorithmic" : "🎲 Random"}
                </span>
              </div>

              {/* Big draw display */}
              <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(250,204,21,.15)", borderRadius: 22, padding: "2.5rem", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                  {currentDraw.numbers.map((n, i) => (
                    <BallNumber key={i} n={n} delay={drawIn ? i * 180 : 9999} size={72} />
                  ))}
                </div>

                {/* Jackpot rollover */}
                {currentDraw.jackpot_rollover > 0 && (
                  <div className="jackpot-card" style={{ display: "inline-flex", alignItems: "center", gap: ".75rem", background: "rgba(250,204,21,.1)", border: "1px solid rgba(250,204,21,.3)", borderRadius: 12, padding: ".85rem 1.5rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>💰</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: ".68rem", color: "#94a3b8", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Jackpot Rollover</div>
                      <div style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "1.4rem", fontWeight: 900, color: "#facc15" }}>₹{currentDraw.jackpot_rollover.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* User match result */}
                {session && userScores.length > 0 && (
                  <div>
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={{ fontSize: ".78rem", color: "#475569", marginBottom: ".75rem", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600 }}>Your Scores vs Draw Numbers</p>
                      <div style={{ display: "flex", justifyContent: "center", gap: ".6rem", flexWrap: "wrap" }}>
                        {userScores.map((s, i) => {
                          const matched = currentDraw.numbers.includes(s);
                          return (
                            <div
                              key={i}
                              style={{
                                width: 44, height: 44, borderRadius: "50%",
                                background: matched ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.04)",
                                border: `2px solid ${matched ? "rgba(74,222,128,.5)" : "rgba(255,255,255,.08)"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: ".9rem",
                                color: matched ? "#4ade80" : "#475569",
                                transition: "all .3s",
                              }}
                            >
                              {s}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {matchCount > 0 ? (
                      <div className="match-badge" style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 12, padding: ".7rem 1.4rem", color: "#4ade80", fontWeight: 700, fontSize: ".9rem" }}>
                        🎉 You matched {matchCount} number{matchCount !== 1 ? "s" : ""}! {matchCount >= 5 ? "JACKPOT!!" : matchCount >= 4 ? "Second Prize!" : "Third Prize!"}
                      </div>
                    ) : (
                      <p style={{ color: "#475569", fontSize: ".85rem" }}>No matches this month. Keep playing! 🏌️</p>
                    )}
                  </div>
                )}
                {!session && (
                  <Link href="/auth" className="cta-draw">Sign in to check your matches →</Link>
                )}
                {session && userScores.length === 0 && (
                  <Link href="/dashboard" className="cta-draw">Enter scores to participate →</Link>
                )}
              </div>
            </div>
          )}

          {/* Prize Tiers */}
          <div ref={prizeRef} style={{ marginBottom: "3rem" }}>
            <div className={`fade-up ${prizeIn ? "in" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8" }}>💰 Prize Pool Distribution</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(255,255,255,.1),transparent)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>
              {[
                { match: "5 Numbers", pct: "40%", label: "JACKPOT", rolls: true, color: "#facc15", icon: "🏆", delay: ".06s" },
                { match: "4 Numbers", pct: "35%", label: "2ND PRIZE", rolls: false, color: "#a78bfa", icon: "🥈", delay: ".12s" },
                { match: "3 Numbers", pct: "25%", label: "3RD PRIZE", rolls: false, color: "#4ade80", icon: "🥉", delay: ".18s" },
              ].map(tier => (
                <div
                  key={tier.match}
                  className={`prize-tier fade-up ${prizeIn ? "in" : ""}`}
                  style={{ transitionDelay: tier.delay, background: "rgba(255,255,255,.03)", border: `1px solid ${tier.color}22`, borderTop: `3px solid ${tier.color}`, borderRadius: 16, padding: "1.5rem", textAlign: "center" }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: ".6rem" }}>{tier.icon}</div>
                  <div style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "2rem", fontWeight: 900, color: tier.color }}>{tier.pct}</div>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#475569", marginBottom: ".6rem" }}>{tier.label}</div>
                  <div style={{ fontSize: ".88rem", color: "#64748b" }}>Match <strong style={{ color: "#f1f5f9" }}>{tier.match}</strong></div>
                  {tier.rolls && (
                    <div style={{ marginTop: ".75rem", fontSize: ".72rem", background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.2)", borderRadius: 8, padding: ".3rem .6rem", color: "#facc15", fontWeight: 600 }}>
                      🔄 Rolls over if unclaimed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Past Draws */}
          {pastDraws.length > 0 && (
            <div ref={pastRef} style={{ marginBottom: "3rem" }}>
              <div className={`fade-up ${pastIn ? "in" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8" }}>📜 Past Draws</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(255,255,255,.08),transparent)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                {pastDraws.map((draw, i) => (
                  <div
                    key={draw.id}
                    className={`past-draw-card fade-up d${i + 1} ${pastIn ? "in" : ""}`}
                    style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: ".9rem", marginBottom: ".2rem" }}>{draw.month} {draw.year}</p>
                      <p style={{ fontSize: ".72rem", color: "#475569" }}>{draw.draw_mode === "algorithmic-frequent" ? "⚡ Algorithmic" : "🎲 Random"}</p>
                    </div>
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      {draw.numbers.map((n, j) => (
                        <BallNumber key={j} n={n} delay={0} size={36} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className={`fade-up ${pastIn ? "in" : ""}`} style={{ textAlign: "center" }}>
            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              background: "linear-gradient(135deg,#4ade80,#22c55e)", color: "#050a0e",
              fontWeight: 800, fontSize: "1rem", padding: "1rem 2.25rem",
              borderRadius: 14, textDecoration: "none",
              boxShadow: "0 16px 50px rgba(74,222,128,.3)",
              transition: "transform .25s, box-shadow .25s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 24px 60px rgba(74,222,128,.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "none"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 16px 50px rgba(74,222,128,.3)"; }}
            >
              ⛳ Enter Your Scores to Participate
            </Link>
            <p style={{ color: "#374151", fontSize: ".78rem", marginTop: ".85rem" }}>Your 5 most recent Stableford scores are automatically entered each month</p>
          </div>
        </div>
      </div>
    </>
  );
}
