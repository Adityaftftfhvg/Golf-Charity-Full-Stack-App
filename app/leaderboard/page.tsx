"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Leader = { id: string; email: string; avg_score: number; total_scores: number; best_score: number; };

function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

const MEDAL = [
  { icon:"🥇", color:"#facc15", glow:"rgba(250,204,21,.2)",  border:"rgba(250,204,21,.4)",  bg:"rgba(250,204,21,.08)"  },
  { icon:"🥈", color:"#94a3b8", glow:"rgba(148,163,184,.1)", border:"rgba(148,163,184,.3)", bg:"rgba(148,163,184,.05)" },
  { icon:"🥉", color:"#f97316", glow:"rgba(249,115,22,.1)",  border:"rgba(249,115,22,.3)",  bg:"rgba(249,115,22,.05)"  },
];

export default function Leaderboard() {
  const [leaders, setLeaders]             = useState<Leader[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { ref: listRef, inView: listIn }  = useInView(0.05);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id||null));
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const { data: activeUsers, error: ue } = await supabase.from("users").select("id,email").eq("subscription_status","active");
      if (ue) throw ue;
      if (!activeUsers || activeUsers.length === 0) { setError("No active subscribers yet. Subscribe and enter scores to appear here!"); setLoading(false); return; }
      const activeIds = activeUsers.map(u => u.id);
      const { data: scoresData, error: se } = await supabase.from("scores").select("user_id,score").in("user_id", activeIds);
      if (se) throw se;
      if (!scoresData || scoresData.length === 0) { setError("No scores submitted yet. Enter your scores from the dashboard!"); setLoading(false); return; }
      const map: Record<string, { scores: number[]; email: string }> = {};
      activeUsers.forEach(u => { map[u.id] = { scores:[], email:u.email }; });
      scoresData.forEach(s => { if (map[s.user_id]) map[s.user_id].scores.push(s.score); });
      const processed: Leader[] = Object.entries(map).filter(([,v])=>v.scores.length>0).map(([id,v]) => {
        const avg = v.scores.reduce((a,b)=>a+b,0) / v.scores.length;
        return { id, email:v.email, avg_score:Math.round(avg*10)/10, total_scores:v.scores.length, best_score:Math.max(...v.scores) };
      }).sort((a,b)=>b.avg_score-a.avg_score).slice(0,10);
      setLeaders(processed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally { setLoading(false); }
  };

  const mask = (email: string) => { const [l,d] = email.split("@"); return `${l.slice(0,3)}***@${d}`; };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:34, height:34, border:"2px solid rgba(74,222,128,.15)", borderTopColor:"#4ade80", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <p style={{ color:"#475569", fontSize:".85rem" }}>Loading champions…</p>
    </div>
  );

  if (error || leaders.length === 0) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem" }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      <div style={{ textAlign:"center", maxWidth:420 }}>
        <div style={{ fontSize:"3.5rem", marginBottom:"1rem", animation:"float 6s ease-in-out infinite", display:"inline-block" }}>⛳</div>
        <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2rem", fontWeight:800, marginBottom:".75rem" }}>No leaders yet</h2>
        <p style={{ color:"#64748b", marginBottom:"2rem", fontSize:".9rem" }}>{error||"Be the first to submit scores!"}</p>
        <Link href="/dashboard" style={{ background:"#4ade80", color:"#080c14", fontWeight:700, padding:".85rem 2rem", borderRadius:11, textDecoration:"none", fontSize:".9rem" }}>Go to Dashboard & Enter Scores</Link>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ring-p  { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes gold-glow{ 0%,100%{box-shadow:0 0 20px rgba(250,204,21,.2)} 50%{box-shadow:0 0 40px rgba(250,204,21,.4)} }
        .nav-lu   { position:relative; }
        .nav-lu::after{ content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#4ade80;transition:width .3s; }
        .nav-lu:hover::after{ width:100%; }
        .ring-dot::after{ content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(74,222,128,.4);animation:ring-p 2.5s ease-out infinite; }
        .fade-up  { opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1); }
        .fade-up.in{ opacity:1;transform:translateY(0); }
        .d1{transition-delay:.05s} .d2{transition-delay:.1s} .d3{transition-delay:.15s} .d4{transition-delay:.2s} .d5{transition-delay:.25s}
        .d6{transition-delay:.3s} .d7{transition-delay:.35s} .d8{transition-delay:.4s} .d9{transition-delay:.45s} .d10{transition-delay:.5s}
        .leader-row{ transition:background .2s,border-color .2s; }
        .leader-row:hover{ background:rgba(255,255,255,.05)!important; }
        .gold-card{ animation: gold-glow 3s ease-in-out infinite; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", paddingBottom:"4rem", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)" }}>
        {/* Glow blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.1),transparent)", filter:"blur(100px)", top:-80, left:"25%" }} />
          <div style={{ position:"absolute", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.07),transparent)", filter:"blur(80px)", bottom:100, right:-40 }} />
        </div>

        {/* ── NAVBAR ── */}
        <nav style={{ position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center", padding:".9rem 2rem", borderBottom:"1px solid rgba(255,255,255,.06)", backdropFilter:"blur(14px)", background:"rgba(8,12,20,.82)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:".55rem", textDecoration:"none", color:"#f1f5f9" }}>
            <div className="ring-dot" style={{ position:"relative", width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".75rem", color:"#080c14" }}>G</div>
            <span style={{ fontWeight:600, fontSize:"1rem" }}>Golf Charity</span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
            <a href="/dashboard" className="nav-lu" style={{ fontSize:".85rem", color:"#94a3b8", textDecoration:"none" }}>Dashboard</a>
            <a href="/charities" className="nav-lu" style={{ fontSize:".85rem", color:"#94a3b8", textDecoration:"none" }}>Charities</a>
            <a href="/auth" style={{ background:"#4ade80", color:"#080c14", fontWeight:700, fontSize:".83rem", padding:".5rem 1.1rem", borderRadius:9, textDecoration:"none" }}>Get Started →</a>
          </div>
        </nav>

        <div style={{ position:"relative", zIndex:1, maxWidth:700, margin:"0 auto", padding:"3rem 1.5rem" }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom:"2.5rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#facc15", marginBottom:".5rem" }}>🏆 This Month</p>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.8rem", fontWeight:900, lineHeight:1 }}>Leaderboard</h1>
                <p style={{ color:"#475569", fontSize:".82rem", marginTop:".4rem" }}>Top 10 by avg Stableford · Active subscribers only</p>
              </div>
              <Link href="/" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#94a3b8", fontSize:".83rem", padding:".5rem 1rem", borderRadius:9, textDecoration:"none", transition:"all .2s" }} onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#f1f5f9";}} onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#94a3b8";}}>← Back</Link>
            </div>
          </div>

          {/* ── PODIUM (top 3) ── */}
          {leaders.length >= 3 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.15fr 1fr", gap:".75rem", marginBottom:"2rem", alignItems:"flex-end" }}>
              {[leaders[1], leaders[0], leaders[2]].map((leader, podiumIdx) => {
                const rankIdx = podiumIdx===0?1:podiumIdx===1?0:2;
                const m = MEDAL[rankIdx];
                const heights = [100, 130, 88];
                const isMe = leader.id === currentUserId;
                return (
                  <div key={leader.id} className={rankIdx===0?"gold-card":""} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", padding:"1rem .75rem .875rem", borderRadius:14, background: isMe?"rgba(74,222,128,.08)":m.bg, border:`1px solid ${isMe?"rgba(74,222,128,.35)":m.border}`, height:heights[podiumIdx], boxShadow: rankIdx===0?`0 0 30px ${m.glow}`:"none" }}>
                    <div style={{ fontSize:"1.6rem", marginBottom:".25rem" }}>{m.icon}</div>
                    <div style={{ fontSize:"1.2rem", fontWeight:800, fontFamily:"var(--font-playfair,serif)", color:m.color, lineHeight:1 }}>{leader.avg_score}</div>
                    <div style={{ fontSize:".68rem", color:"#64748b", marginTop:".2rem", textAlign:"center", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mask(leader.email).split("@")[0]}…</div>
                    {isMe && <span style={{ marginTop:".25rem", background:"rgba(74,222,128,.15)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", fontSize:".6rem", fontWeight:700, padding:".1rem .4rem", borderRadius:9999 }}>You</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FULL LIST ── */}
          <div ref={listRef} style={{ display:"flex", flexDirection:"column", gap:".625rem" }}>
            {leaders.map((leader, i) => {
              const isMe = leader.id === currentUserId;
              const m = MEDAL[i];
              return (
                <div key={leader.id} className={`fade-up d${Math.min(i+1,10)} ${listIn?"in":""} leader-row`} style={{ display:"flex", alignItems:"center", gap:".875rem", padding:".875rem 1rem", borderRadius:13, background: isMe?"rgba(74,222,128,.06)":i===0?MEDAL[0].bg:"rgba(255,255,255,.03)", border:`1px solid ${isMe?"rgba(74,222,128,.3)":m?m.border:"rgba(255,255,255,.07)"}`, boxShadow: i===0?`0 4px 24px ${MEDAL[0].glow}`:"none" }}>
                  {/* Rank */}
                  <div style={{ width:32, textAlign:"center", flexShrink:0, fontSize: m?"1.2rem":".82rem", fontWeight:700, color: m?undefined:"#374151", fontFamily: m?undefined:"monospace" }}>
                    {m ? m.icon : `#${i+1}`}
                  </div>
                  {/* Avatar */}
                  <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".85rem", background: isMe?"linear-gradient(135deg,#4ade80,#22c55e)":m?`linear-gradient(135deg,${m.color}44,${m.color}22)`:"rgba(255,255,255,.07)", color: isMe?"#080c14":m?.color||"#64748b" }}>
                    {leader.email[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" }}>
                      <span style={{ fontSize:".875rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mask(leader.email)}</span>
                      {isMe && <span style={{ background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.25)", color:"#4ade80", fontSize:".62rem", fontWeight:700, padding:".1rem .4rem", borderRadius:9999 }}>You</span>}
                    </div>
                    <p style={{ fontSize:".72rem", color:"#374151", marginTop:2 }}>{leader.total_scores} score{leader.total_scores!==1?"s":""} · Best: {leader.best_score}</p>
                  </div>
                  {/* Score */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.6rem", fontWeight:800, lineHeight:1, color: i===0?"#facc15":isMe?"#4ade80":"#e2e8f0" }}>{leader.avg_score}</div>
                    <div style={{ fontSize:".65rem", color:"#374151", letterSpacing:".06em" }}>AVG</div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ textAlign:"center", color:"#374151", fontSize:".75rem", marginTop:"2rem" }}>
            Updated live · Only active subscribers · Resets monthly
          </p>
        </div>
      </div>
    </>
  );
}
