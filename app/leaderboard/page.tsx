"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Leader = { id: string; email: string; avg_score: number; total_scores: number; best_score: number; rank: number; };

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

const DEMO_LEADERS: Leader[] = [
  { id:"1", email:"rohan.mehta@golf.in",   avg_score:41, total_scores:5, best_score:45, rank:1 },
  { id:"2", email:"priya.sharma@golf.in",  avg_score:38, total_scores:5, best_score:43, rank:2 },
  { id:"3", email:"aditya.kumar@golf.in",  avg_score:36, total_scores:5, best_score:42, rank:3 },
  { id:"4", email:"neha.singh@golf.in",    avg_score:34, total_scores:4, best_score:40, rank:4 },
  { id:"5", email:"vikram.patel@golf.in",  avg_score:33, total_scores:5, best_score:39, rank:5 },
  { id:"6", email:"ananya.iyer@golf.in",   avg_score:31, total_scores:4, best_score:37, rank:6 },
  { id:"7", email:"arjun.nair@golf.in",    avg_score:30, total_scores:5, best_score:36, rank:7 },
  { id:"8", email:"kavya.reddy@golf.in",   avg_score:28, total_scores:3, best_score:34, rank:8 },
];

const RANK_COLORS = ["#facc15","#94a3b8","#f97316"];
const RANK_LABELS = ["🥇","🥈","🥉"];
const RANK_GLOW = ["rgba(250,204,21,.5)","rgba(148,163,184,.4)","rgba(249,115,22,.4)"];

function RankBar({ score, max, color, delay }: { score:number; max:number; color:string; delay:number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((score/max)*100), delay);
    return () => clearTimeout(t);
  }, [score, max, delay]);
  return (
    <div style={{ height:4, borderRadius:9999, background:"rgba(255,255,255,.06)", overflow:"hidden", marginTop:6 }}>
      <div style={{ height:"100%", width:`${width}%`, borderRadius:9999, background:color, transition:"width 1.2s cubic-bezier(.16,1,.3,1)", boxShadow:`0 0 8px ${color}` }} />
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string|null>(null);
  const { ref: heroRef, inView: heroIn } = useInView(0.05);
  const { ref: tableRef, inView: tableIn } = useInView(0.05);
  const { ref: podiumRef, inView: podiumIn } = useInView(0.08);

  useEffect(() => {
const fetchLeaderboard = async () => {
  try {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (!error && data && data.length > 0) setLeaders(data);
    else { setLeaders(DEMO_LEADERS); setUsingDemo(true); }
  } catch {
    setLeaders(DEMO_LEADERS); setUsingDemo(true);
  } finally {
    setLoading(false);
  }
};
fetchLeaderboard();
  }, []);

  const top3 = leaders.slice(0,3);
  const rest = leaders.slice(3);
  const maxScore = leaders[0]?.best_score || 45;

  const initials = (email: string) => email.split("@")[0].split(".").map((s:string) => s[0]?.toUpperCase()).join("").slice(0,2);
  const displayName = (email: string) => { const n = email.split("@")[0]; return n.split(".").map((s:string) => s.charAt(0).toUpperCase()+s.slice(1)).join(" "); };

  return (
    <>
      <style>{`
        @keyframes podium-rise { from{opacity:0;transform:translateY(60px) scaleY(0)} to{opacity:1;transform:translateY(0) scaleY(1)} }
        @keyframes crown-float { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-8px) rotate(5deg)} }
        @keyframes row-enter { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes rank-pop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes gold-shimmer { 0%{background-position:-200%} 100%{background-position:200%} }

        .leaderboard-row {
          transition: transform .28s cubic-bezier(.16,1,.3,1), background .22s, box-shadow .28s;
          cursor: default;
          animation: row-enter .6s cubic-bezier(.16,1,.3,1) both;
        }
        .leaderboard-row:hover {
          transform: translateX(6px) scale(1.01);
          background: rgba(255,255,255,.055) !important;
          box-shadow: 0 8px 30px rgba(0,0,0,.3), 4px 0 0 rgba(74,222,128,.4) !important;
        }

        .podium-bar { transform-origin: bottom; animation: podium-rise 1s cubic-bezier(.34,1.2,.64,1) both; }

        .gold-text {
          background: linear-gradient(90deg, #facc15, #fde68a, #f59e0b, #facc15);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gold-shimmer 3s linear infinite;
        }

        .crown { animation: crown-float 3s ease-in-out infinite; display:inline-block; }
        .rank-num { animation: rank-pop .5s cubic-bezier(.34,1.56,.64,1) both; }

        .stat-pill {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 9999px;
          padding: .25rem .75rem;
          font-size: .75rem;
          font-weight: 600;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          gap: .3rem;
        }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)", overflowX:"hidden" }}>

        {/* Ambient bg */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div className="float-orb" style={{ "--d":"18s","--delay":"-6s", position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.07),transparent)", filter:"blur(100px)", top:-60, right:"10%" } as React.CSSProperties} />
          <div className="float-orb" style={{ "--d":"22s","--delay":"-10s", position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.06),transparent)", filter:"blur(90px)", bottom:"20%", left:"5%" } as React.CSSProperties} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>

          {/* Hero */}
          <div ref={heroRef} className={`fade-up ${heroIn?"in":""}`} style={{ textAlign:"center", marginBottom:"3rem" }}>
            {usingDemo && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:".4rem", padding:".28rem .8rem", borderRadius:9999, background:"rgba(167,139,250,.1)", border:"1px solid rgba(167,139,250,.2)", color:"#c4b5fd", fontSize:".68rem", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", marginBottom:".9rem" }}>
                ✨ Preview Mode
              </div>
            )}
            <div className="crown" style={{ fontSize:"3rem", marginBottom:".75rem" }}>🏆</div>
            <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(2.2rem,5vw,3.5rem)", fontWeight:900, lineHeight:1.06, letterSpacing:"-.02em", marginBottom:".75rem" }}>
              <span className="gold-text">Monthly</span> Leaderboard
            </h1>
            <p style={{ color:"#64748b", fontSize:".95rem", maxWidth:440, margin:"0 auto", lineHeight:1.75 }}>
              Top performers by average Stableford score this month.
            </p>
          </div>

          {/* Podium visualization */}
          {!loading && top3.length === 3 && (
            <div ref={podiumRef} style={{ marginBottom:"3rem" }}>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:"1rem", height:200, position:"relative" }}>
                {/* 2nd place */}
                <div className={`fade-up d2 ${podiumIn?"in":""}`} style={{ textAlign:"center", flex:1, maxWidth:160 }}>
                  <div style={{ marginBottom:".5rem" }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,rgba(148,163,184,.3),rgba(148,163,184,.1))", border:"2px solid rgba(148,163,184,.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto .4rem", fontWeight:900, fontSize:".9rem", color:"#94a3b8" }}>{initials(top3[1].email)}</div>
                    <div style={{ fontSize:".78rem", color:"#64748b", fontWeight:600 }}>{displayName(top3[1].email)}</div>
                    <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.4rem", fontWeight:900, color:"#94a3b8" }}>{top3[1].avg_score}</div>
                  </div>
                  <div className="podium-bar" style={{ animationDelay:".2s", height:120, background:"linear-gradient(to top, rgba(148,163,184,.3), rgba(148,163,184,.1))", border:"1px solid rgba(148,163,184,.2)", borderRadius:"10px 10px 0 0", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"1rem" }}>
                    <span style={{ fontSize:"1.5rem" }}>🥈</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className={`fade-up d1 ${podiumIn?"in":""}`} style={{ textAlign:"center", flex:1, maxWidth:160 }}>
                  <div style={{ marginBottom:".5rem" }}>
                    <div style={{ position:"relative", display:"inline-block" }}>
                      <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#facc15,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto .4rem", fontWeight:900, fontSize:"1rem", color:"#050a0e", boxShadow:"0 8px 30px rgba(250,204,21,.5)", animation:"glow-gold 3s ease infinite" }}>{initials(top3[0].email)}</div>
                      <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", fontSize:"1.2rem" }} className="crown">👑</div>
                    </div>
                    <div style={{ fontSize:".78rem", fontWeight:700 }} className="gold-text">{displayName(top3[0].email)}</div>
                    <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.7rem", fontWeight:900 }} className="gold-text">{top3[0].avg_score}</div>
                  </div>
                  <div className="podium-bar" style={{ animationDelay:".05s", height:160, background:"linear-gradient(to top, rgba(250,204,21,.25), rgba(250,204,21,.08))", border:"1px solid rgba(250,204,21,.3)", borderRadius:"10px 10px 0 0", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:".75rem", boxShadow:"0 -10px 40px rgba(250,204,21,.15)" }}>
                    <span style={{ fontSize:"1.8rem" }}>🥇</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className={`fade-up d3 ${podiumIn?"in":""}`} style={{ textAlign:"center", flex:1, maxWidth:160 }}>
                  <div style={{ marginBottom:".5rem" }}>
                    <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,rgba(249,115,22,.3),rgba(249,115,22,.1))", border:"2px solid rgba(249,115,22,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto .4rem", fontWeight:900, fontSize:".85rem", color:"#f97316" }}>{initials(top3[2].email)}</div>
                    <div style={{ fontSize:".78rem", color:"#64748b", fontWeight:600 }}>{displayName(top3[2].email)}</div>
                    <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.3rem", fontWeight:900, color:"#f97316" }}>{top3[2].avg_score}</div>
                  </div>
                  <div className="podium-bar" style={{ animationDelay:".35s", height:90, background:"linear-gradient(to top, rgba(249,115,22,.25), rgba(249,115,22,.08))", border:"1px solid rgba(249,115,22,.2)", borderRadius:"10px 10px 0 0", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"1rem" }}>
                    <span style={{ fontSize:"1.3rem" }}>🥉</span>
                  </div>
                </div>
              </div>
              {/* Stage base */}
              <div style={{ height:8, background:"linear-gradient(90deg,rgba(250,204,21,.15),rgba(74,222,128,.1),rgba(250,204,21,.15))", borderRadius:"0 0 8px 8px", marginTop:0 }} />
            </div>
          )}

          {/* Full table */}
          <div ref={tableRef}>
            <div className={`fade-up ${tableIn?"in":""}`} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
              <span style={{ fontSize:".68rem", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:"#64748b" }}>⛳ Full Rankings</span>
              <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,255,255,.08),transparent)" }} />
              <span style={{ fontSize:".7rem", color:"#374151" }}>{leaders.length} players</span>
            </div>

            {loading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
                {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:72, borderRadius:14 }} />)}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
                {leaders.map((leader, i) => (
                  <div
                    key={leader.id}
                    className="leaderboard-row"
                    style={{
                      animationDelay:`${i*.07}s`,
                      background: i===0 ? "rgba(250,204,21,.05)" : i===1 ? "rgba(148,163,184,.04)" : i===2 ? "rgba(249,115,22,.04)" : "rgba(255,255,255,.03)",
                      border: i===0 ? "1px solid rgba(250,204,21,.2)" : i===1 ? "1px solid rgba(148,163,184,.15)" : i===2 ? "1px solid rgba(249,115,22,.15)" : "1px solid rgba(255,255,255,.06)",
                      borderRadius:16,
                      padding:"1rem 1.25rem",
                      display:"flex",
                      alignItems:"center",
                      gap:"1rem",
                      boxShadow: i===0 ? "0 0 0 1px rgba(250,204,21,.08), inset 0 1px 0 rgba(250,204,21,.05)" : "none",
                    }}
                    onMouseEnter={() => setHoveredRow(leader.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Rank */}
                    <div className="rank-num" style={{ animationDelay:`${i*.07 + .2}s`, width:40, textAlign:"center", flexShrink:0 }}>
                      {i < 3 ? (
                        <span style={{ fontSize:"1.4rem" }}>{RANK_LABELS[i]}</span>
                      ) : (
                        <span style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.2rem", fontWeight:900, color:"#374151" }}>#{leader.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width:44, height:44, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:".88rem",
                      background: i===0 ? "linear-gradient(135deg,#facc15,#f59e0b)" : i===1 ? "linear-gradient(135deg,rgba(148,163,184,.4),rgba(148,163,184,.2))" : i===2 ? "linear-gradient(135deg,rgba(249,115,22,.4),rgba(249,115,22,.2))" : "rgba(255,255,255,.07)",
                      color: i < 3 ? "#050a0e" : "#94a3b8",
                      border: i < 3 ? `2px solid ${RANK_COLORS[i]}55` : "1px solid rgba(255,255,255,.09)",
                      boxShadow: i < 3 ? `0 4px 20px ${RANK_GLOW[i]}` : "none",
                      transition:"transform .25s",
                      transform: hoveredRow===leader.id ? "scale(1.1) rotate(5deg)" : "scale(1)",
                    }}>
                      {initials(leader.email)}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:".9rem", marginBottom:".25rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayName(leader.email)}</span>
                        {i===0 && <span className="crown" style={{ fontSize:".9rem", flexShrink:0 }}>👑</span>}
                      </div>
                      <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                        <span className="stat-pill">⛳ {leader.total_scores} rounds</span>
                        <span className="stat-pill">🏆 Best: {leader.best_score}</span>
                      </div>
                      <RankBar score={leader.avg_score} max={maxScore} color={i < 3 ? RANK_COLORS[i] : "#4ade80"} delay={i * 80 + 400} />
                    </div>

                    {/* Score */}
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.8rem", fontWeight:900, lineHeight:1, color: i < 3 ? RANK_COLORS[i] : "#f1f5f9", textShadow: i < 3 ? `0 0 20px ${RANK_GLOW[i]}` : "none" }}>{leader.avg_score}</div>
                      <div style={{ fontSize:".65rem", color:"#374151", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase" }}>avg pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className={`fade-up ${tableIn?"in":""}`} style={{ textAlign:"center", marginTop:"3rem" }}>
            <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", background:"linear-gradient(135deg,#4ade80,#22c55e)", color:"#050a0e", fontWeight:800, fontSize:".95rem", padding:".9rem 2rem", borderRadius:12, textDecoration:"none", transition:"transform .22s,box-shadow .28s", boxShadow:"0 12px 40px rgba(74,222,128,.3)" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="translateY(-3px)";(e.currentTarget as HTMLAnchorElement).style.boxShadow="0 20px 60px rgba(74,222,128,.5)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="none";(e.currentTarget as HTMLAnchorElement).style.boxShadow="0 12px 40px rgba(74,222,128,.3)";}}>
              ⛳ Submit Your Scores
            </a>
            <p style={{ color:"#2d3748", fontSize:".78rem", marginTop:".75rem" }}>Enter scores to climb the leaderboard</p>
          </div>
        </div>
      </div>
    </>
  );
}
