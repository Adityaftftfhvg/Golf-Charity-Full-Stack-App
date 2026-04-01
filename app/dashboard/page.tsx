"use client";


import React from "react";







 import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ScoreInput from "@/components/ScoreInput";
import CharitySelect from "@/components/CharitySelect";
import ProofUpload from "@/components/ProofUpload";
import PrizePool from "@/components/PrizePool";
import Donate from "@/components/Donate";

type Score       = { id: string; score: number; played_at: string; };
type UserProfile = { subscription_status: string; subscription_plan: string | null; subscription_end_date: string | null; charity_id: string | null; charity_percentage: number; };
type Winner      = { id: string; match_type: number; prize_amount: number; status: string; draw_id: string; created_at: string; };
type Draw        = { id: string; month: string; year: number; status: string; draw_date?: string; };

function scoreStyle(s: number) {
  if (s >= 35) return { color:"#4ade80", border:"rgba(74,222,128,.35)", bg:"rgba(74,222,128,.07)" };
  if (s >= 25) return { color:"#facc15", border:"rgba(250,204,21,.35)", bg:"rgba(250,204,21,.07)" };
  return             { color:"#f87171", border:"rgba(248,113,113,.35)", bg:"rgba(248,113,113,.07)" };
}

export default function Dashboard() {
  const [userId, setUserId]               = useState<string | null>(null);
  const [scores, setScores]               = useState<Score[]>([]);
  const [profile, setProfile]             = useState<UserProfile | null>(null);
  const [winners, setWinners]             = useState<Winner[]>([]);
  const [draws, setDraws]                 = useState<Draw[]>([]);
  const [loading, setLoading]             = useState(true);
  const [editingScore, setEditingScore]   = useState<Score | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]   = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => { init(); checkPaymentReturn(); }, []);

  const checkPaymentReturn = () => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("payment") === "success") { setPaymentStatus("success"); window.history.replaceState({}, "", "/dashboard"); }
    else if (p.get("payment") === "failed") { setPaymentStatus("failed"); window.history.replaceState({}, "", "/dashboard"); }
  };

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    setUserId(user.id);
    await Promise.all([fetchScores(user.id), fetchProfile(user.id), fetchWinnings(user.id), fetchDraws()]);
    setLoading(false);
  };

  const fetchScores = async (uid: string) => {
    const { data } = await supabase.from("scores").select("id,score,played_at").eq("user_id", uid).order("played_at", { ascending: false }).limit(5);
    setScores(data || []);
  };

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("users").select("subscription_status,subscription_plan,subscription_end_date,charity_id,charity_percentage").eq("id", uid).single();
    if (data?.subscription_end_date && data.subscription_status === "active" && new Date(data.subscription_end_date) < new Date()) {
      await supabase.from("users").update({ subscription_status: "inactive" }).eq("id", uid);
      data.subscription_status = "inactive";
    }
    setProfile(data);
  };

  const fetchWinnings = async (uid: string) => {
    const { data } = await supabase.from("winners").select("id,match_type,prize_amount,status,draw_id,created_at").eq("user_id", uid).order("created_at", { ascending: false });
    setWinners(data || []);
  };

  const fetchDraws = async () => {
    const { data } = await supabase.from("draws").select("id,month,year,status,draw_date").in("status", ["published","upcoming","scheduled"]).order("created_at", { ascending: false }).limit(5);
    setDraws(data || []);
  };

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    const amount = plan === "yearly" ? 799 : 99;
    const res  = await fetch("/api/phonepe/pay", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ amount, userId, type:"subscription", plan }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleCancelSubscription = async () => {
    if (!userId || !cancelReason) return;
    setCancelLoading(true);
    const { error } = await supabase.from("users").update({ subscription_status:"inactive", subscription_end_date:null }).eq("id", userId);
    if (!error) {
      setProfile(p => p ? { ...p, subscription_status:"inactive", subscription_end_date:null } : null);
      setShowCancelModal(false); setCancelReason("");
      alert("✅ Subscription cancelled. You will lose access to future draws.");
    } else { alert("Failed to cancel. Please try again."); }
    setCancelLoading(false);
  };

  const totalWon   = winners.reduce((s,w) => s + (w.prize_amount || 0), 0);
  const isActive   = profile?.subscription_status === "active";
  const wonDrawIds = new Set(winners.map(w => w.draw_id));

  const C = {
    card: { background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"1.25rem" } as React.CSSProperties,
    label: { fontSize:".68rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase" as const, color:"#475569", marginBottom:".6rem" },
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1rem" }}>
      <div style={{ width:36, height:36, border:"2px solid rgba(74,222,128,.15)", borderTopColor:"#4ade80", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:"#475569", fontSize:".85rem" }}>Loading your dashboard…</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ring-p  { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        .db-card  { transition:border-color .25s,background .25s; }
        .db-card:hover { border-color:rgba(255,255,255,.12)!important; }
        .score-row{ transition:background .2s,border-color .2s; }
        .score-row:hover{ background:rgba(255,255,255,.05)!important; }
        .draw-row { transition:background .2s; }
        .draw-row:hover{ background:rgba(255,255,255,.05)!important; }
        .btn-grn  { transition:transform .2s,box-shadow .2s; }
        .btn-grn:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 8px 28px rgba(74,222,128,.35); }
        .btn-pur  { transition:transform .2s,box-shadow .2s; }
        .btn-pur:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 8px 28px rgba(167,139,250,.3); }
        .nav-lu   { position:relative; }
        .nav-lu::after{ content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#4ade80;transition:width .3s; }
        .nav-lu:hover::after{ width:100%; }
        .ring-dot::after{ content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(74,222,128,.4);animation:ring-p 2.5s ease-out infinite; }
        .fade-in  { animation:fadeIn .5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)" }}>
        {/* Glow blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.07),transparent)", filter:"blur(100px)", top:-80, left:"20%" }} />
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.06),transparent)", filter:"blur(100px)", top:300, right:-60 }} />
        </div>

       

        {/* ── CONTENT ── */}
        <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"2rem 1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Page title */}
          <div className="fade-in">
            <p style={{ fontSize:".68rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#4ade80" }}>Member Area</p>
            <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.9rem", fontWeight:800, marginTop:".2rem" }}>Your Dashboard</h1>
          </div>

          {/* Payment alerts */}
          {paymentStatus === "success" && <div className="fade-in" style={{ background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80", borderRadius:10, padding:".75rem 1rem", fontSize:".85rem", fontWeight:500 }}>✓ Payment successful! Your subscription is now active.</div>}
          {paymentStatus === "failed"  && <div className="fade-in" style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.3)", color:"#f87171", borderRadius:10, padding:".75rem 1rem", fontSize:".85rem", fontWeight:500 }}>✗ Payment failed. Please try again.</div>}

          {/* ── ROW 1: Subscription + Winnings ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>

            {/* Subscription */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:`3px solid ${isActive?"#4ade80":"#f87171"}` }}>
              <p style={C.label}>Subscription</p>
              <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"1rem" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:".35rem", padding:".2rem .7rem", borderRadius:9999, fontSize:".75rem", fontWeight:600, background: isActive?"rgba(74,222,128,.12)":"rgba(248,113,113,.12)", border:`1px solid ${isActive?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"}`, color: isActive?"#4ade80":"#f87171" }}>
                  {isActive && <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"ring-p 2s infinite" }} />}
                  {isActive ? "Active" : "Inactive"}
                </span>
                {profile?.subscription_plan && <span style={{ color:"#64748b", fontSize:".82rem", textTransform:"capitalize" }}>{profile.subscription_plan} plan</span>}
              </div>
              {profile?.subscription_end_date && isActive && (
                <div style={{ marginBottom:".75rem" }}>
                  <p style={{ color:"#64748b", fontSize:".82rem" }}>Renews: <span style={{ color:"#f1f5f9" }}>{new Date(profile.subscription_end_date).toLocaleDateString()}</span></p>
                  <button onClick={()=>setShowCancelModal(true)} style={{ color:"#f87171", fontSize:".8rem", background:"none", border:"none", cursor:"pointer", padding:0, marginTop:".4rem" }}>Cancel Subscription →</button>
                </div>
              )}
              {!isActive && (
                <div style={{ display:"flex", flexDirection:"column", gap:".6rem", marginTop:".75rem" }}>
                  <button className="btn-grn" onClick={()=>handleSubscribe("monthly")} style={{ background:"#4ade80", color:"#080c14", border:"none", borderRadius:9, padding:".7rem", fontWeight:700, fontSize:".87rem", cursor:"pointer" }}>Subscribe Monthly — ₹99</button>
                  <button className="btn-pur" onClick={()=>handleSubscribe("yearly")}  style={{ background:"rgba(167,139,250,.15)", border:"1px solid rgba(167,139,250,.3)", color:"#a78bfa", borderRadius:9, padding:".7rem", fontWeight:700, fontSize:".87rem", cursor:"pointer" }}>Subscribe Yearly — ₹799 <span style={{ opacity:.6, fontSize:".78rem" }}>(Save 20%)</span></button>
                </div>
              )}
            </div>

            {/* Winnings */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:"3px solid #facc15" }}>
              <p style={C.label}>Winnings</p>
              <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.2rem", fontWeight:800, background:"linear-gradient(135deg,#4ade80,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1.1, marginBottom:".3rem" }}>₹{totalWon.toFixed(2)}</div>
              <p style={{ color:"#475569", fontSize:".78rem", marginBottom:"1rem" }}>Total won across all draws</p>
              {winners.length === 0 ? (
                <p style={{ color:"#374151", fontSize:".82rem" }}>No winnings yet — keep playing!</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
                  {winners.slice(0,3).map(w => (
                    <div key={w.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:".5rem", borderBottom:"1px solid rgba(255,255,255,.05)", fontSize:".83rem" }}>
                      <span style={{ color:"#94a3b8" }}>{w.match_type}-number match</span>
                      <span style={{ padding:".15rem .55rem", borderRadius:9999, fontSize:".7rem", fontWeight:600, background: w.status==="paid"?"rgba(74,222,128,.12)":w.status==="approved"?"rgba(96,165,250,.12)":"rgba(250,204,21,.12)", border:`1px solid ${w.status==="paid"?"rgba(74,222,128,.3)":w.status==="approved"?"rgba(96,165,250,.3)":"rgba(250,204,21,.3)"}`, color: w.status==="paid"?"#4ade80":w.status==="approved"?"#60a5fa":"#facc15" }}>{w.status}</span>
                      <span style={{ fontWeight:700 }}>₹{(w.prize_amount||0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prize Pool component */}
          <div className="db-card fade-in" style={{ ...C.card }}>
            <PrizePool />
          </div>

          {/* ── ROW 2: Score entry + Scores list ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>

            {/* Add / Edit score */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:"3px solid #a78bfa" }}>
              <p style={C.label}>{editingScore ? "Edit Score" : "Add Score"}</p>
              {!isActive ? (
                <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", margin:"0 auto .75rem" }}>🔒</div>
                  <p style={{ color:"#64748b", fontSize:".83rem", marginBottom:"1rem" }}>Score entry is for active subscribers only.</p>
                  <button className="btn-grn" onClick={()=>handleSubscribe("monthly")} style={{ background:"#4ade80", color:"#080c14", border:"none", borderRadius:9, padding:".6rem 1.25rem", fontWeight:700, fontSize:".83rem", cursor:"pointer" }}>Subscribe to unlock</button>
                </div>
              ) : userId && (
                <ScoreInput userId={userId} onScoreAdded={()=>fetchScores(userId)} editScore={editingScore??undefined} onEditDone={()=>{ setEditingScore(null); fetchScores(userId); }} />
              )}
            </div>

            {/* Scores list */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:"3px solid #4ade80" }}>
              <p style={C.label}>Your Last 5 Scores</p>
              {scores.length === 0 ? (
                <p style={{ color:"#374151", fontSize:".83rem" }}>No scores yet — add your first!</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
                  {scores.map((s,i) => {
                    const sc = scoreStyle(s.score);
                    const editing = editingScore?.id === s.id;
                    return (
                      <div key={s.id} className="score-row" style={{ display:"flex", alignItems:"center", gap:".75rem", padding:".65rem .75rem", borderRadius:10, background: editing?"rgba(167,139,250,.08)":sc.bg, border:`1px solid ${editing?"rgba(167,139,250,.35)":sc.border}` }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${sc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1rem", color:sc.color, flexShrink:0 }}>{s.score}</div>
                        <div style={{ flex:1 }}>
                          {i===0 && <span style={{ display:"inline-block", background:"rgba(167,139,250,.15)", border:"1px solid rgba(167,139,250,.3)", color:"#a78bfa", fontSize:".65rem", fontWeight:600, padding:".1rem .45rem", borderRadius:9999, marginBottom:".2rem" }}>Latest</span>}
                          <p style={{ color:"#64748b", fontSize:".75rem" }}>{s.played_at?new Date(s.played_at).toLocaleDateString():"No date"}</p>
                        </div>
                        <button onClick={()=>setEditingScore(editing?null:s)} style={{ background:"none", border:"none", cursor:"pointer", color: editing?"#f87171":"#a78bfa", fontSize:".78rem", fontWeight:600 }}>{editing?"Cancel":"Edit"}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 3: Charity + Draws ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>

            {/* Charity */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:"3px solid #facc15" }}>
              <p style={C.label}>Your Charity</p>
              {!isActive ? (
                <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", margin:"0 auto .75rem" }}>🔒</div>
                  <p style={{ color:"#64748b", fontSize:".83rem", marginBottom:"1rem" }}>Charity selection is for active subscribers only.</p>
                  <button className="btn-grn" onClick={()=>handleSubscribe("monthly")} style={{ background:"#4ade80", color:"#080c14", border:"none", borderRadius:9, padding:".6rem 1.25rem", fontWeight:700, fontSize:".83rem", cursor:"pointer" }}>Subscribe to unlock</button>
                </div>
              ) : (
                <>
                  <p style={{ color:"#64748b", fontSize:".83rem", marginBottom:"1rem" }}>Contributing <span style={{ color:"#4ade80", fontWeight:700 }}>{profile?.charity_percentage||10}%</span> of your subscription</p>
                  {userId && <CharitySelect userId={userId} />}
                </>
              )}
            </div>

            {/* Draws */}
            <div className="db-card fade-in" style={{ ...C.card, borderLeft:"3px solid #60a5fa" }}>
              <p style={C.label}>Draw Participation</p>
              <p style={{ color:"#374151", fontSize:".75rem", marginBottom:".75rem" }}>{draws.length>0?`Last ${draws.length} draw${draws.length>1?"s":""}`:"—"}</p>
              {draws.length === 0 ? (
                <p style={{ color:"#374151", fontSize:".83rem" }}>No draws yet.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
                  {draws.map(d => {
                    const won = wonDrawIds.has(d.id);
                    const upcoming = d.status === "upcoming" || d.status === "scheduled";
                    return (
                      <div key={d.id} className="draw-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:".65rem .75rem", borderRadius:10, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
                        <div>
                          <span style={{ fontSize:".875rem", fontWeight:500 }}>{d.month} {d.year}</span>
                          {upcoming && d.draw_date && <p style={{ fontSize:".72rem", color:"#374151", marginTop:2 }}>Draw: {new Date(d.draw_date).toLocaleDateString()}</p>}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:".4rem" }}>
                          {upcoming ? <span style={{ padding:".15rem .55rem", borderRadius:9999, fontSize:".7rem", fontWeight:600, background:"rgba(96,165,250,.12)", border:"1px solid rgba(96,165,250,.3)", color:"#60a5fa" }}>Upcoming</span>
                                    : isActive && <span style={{ padding:".15rem .55rem", borderRadius:9999, fontSize:".7rem", fontWeight:600, background:"rgba(74,222,128,.12)", border:"1px solid rgba(74,222,128,.3)", color:"#4ade80" }}>Entered</span>}
                          {won && <span style={{ padding:".15rem .55rem", borderRadius:9999, fontSize:".7rem", fontWeight:600, background:"rgba(250,204,21,.12)", border:"1px solid rgba(250,204,21,.3)", color:"#facc15" }}>Winner 🏆</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Donate & Proof */}
          {userId && <div className="db-card fade-in" style={C.card}><Donate userId={userId} /></div>}
          {userId && <div className="db-card fade-in" style={C.card}><ProofUpload userId={userId} /></div>}
        </div>

        {/* ── CANCEL MODAL ── */}
        {showCancelModal && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"1rem" }}>
            <div style={{ background:"#0d1422", border:"1px solid rgba(248,113,113,.2)", borderRadius:18, padding:"2rem", maxWidth:420, width:"100%" }}>
              <h3 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.5rem", fontWeight:800, marginBottom:".4rem" }}>Cancel Subscription?</h3>
              <p style={{ color:"#f87171", fontSize:".83rem", marginBottom:"1.25rem" }}>You will immediately lose access to all future draws and prize pools.</p>
              <label style={{ display:"block", fontSize:".82rem", color:"#64748b", marginBottom:".5rem" }}>Why are you cancelling?</label>
              <select value={cancelReason} onChange={e=>setCancelReason(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:".7rem 1rem", color:"#f1f5f9", fontSize:".85rem", outline:"none", marginBottom:"1.25rem", fontFamily:"inherit" }}>
                <option value="">Select a reason…</option>
                <option value="Too expensive">Too expensive</option>
                <option value="Not enough wins">Not winning enough</option>
                <option value="Moving to another platform">Moving to another platform</option>
                <option value="No longer playing golf">No longer playing golf</option>
                <option value="Other">Other</option>
              </select>
              <div style={{ display:"flex", gap:".75rem" }}>
                <button onClick={()=>setShowCancelModal(false)} style={{ flex:1, padding:".75rem", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#94a3b8", fontWeight:600, fontSize:".87rem", cursor:"pointer" }}>Keep Subscription</button>
                <button onClick={handleCancelSubscription} disabled={cancelLoading||!cancelReason} style={{ flex:1, padding:".75rem", background:"rgba(220,38,38,.18)", border:"1px solid rgba(220,38,38,.35)", borderRadius:10, color:"#f87171", fontWeight:700, fontSize:".87rem", cursor:"pointer", opacity: (cancelLoading||!cancelReason)?.5:1 }}>
                  {cancelLoading?"Cancelling…":"Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}



