"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState<"login" | "signup">("login");
  const [message, setMessage]   = useState<{ text: string; type: "error" | "success" } | null>(null);

  const login = async () => {
    if (!email || !password) { setMessage({ text: "Please enter your email and password", type: "error" }); return; }
    setLoading(true); setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage({ text: error.message, type: "error" }); setLoading(false); return; }
    if (data.session) { window.location.replace("/dashboard"); return; }
    setMessage({ text: "Login succeeded but no session — email may not be confirmed.", type: "error" });
    setLoading(false);
  };

  const signUp = async () => {
    if (!email || !password) { setMessage({ text: "Please enter your email and password", type: "error" }); return; }
    if (password.length < 6) { setMessage({ text: "Password must be at least 6 characters", type: "error" }); return; }
    setLoading(true); setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (d2?.session) { window.location.replace("/dashboard"); return; }
        setMessage({ text: e2?.message || "Account exists — try logging in", type: "error" });
        setLoading(false); return;
      }
      setMessage({ text: error.message, type: "error" }); setLoading(false); return;
    }
    fetch("/api/send-welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
    if (data.session) { window.location.replace("/dashboard"); return; }
    setMessage({ text: "Account created! Check your email to confirm.", type: "success" });
    setLoading(false);
  };

  const signInWithProvider = async (provider: "google" | "facebook") => {
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) { setMessage({ text: error.message, type: "error" }); setLoading(false); }
  };

  return (
    <>
      <style>{`
        @keyframes slide-in-left  { from { opacity:0; transform:translateX(-30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slide-in-right { from { opacity:0; transform:translateX( 30px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fade-in-up     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes drift          { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-18px) rotate(3deg);} }
        @keyframes glow-pulse     { 0%,100%{opacity:.5;} 50%{opacity:1;} }
        .panel-left  { animation: slide-in-left  0.7s cubic-bezier(.16,1,.3,1) both; }
        .panel-right { animation: slide-in-right 0.7s cubic-bezier(.16,1,.3,1) 0.1s both; }
        .form-field  { animation: fade-in-up 0.5s cubic-bezier(.16,1,.3,1) both; }
        .f1{animation-delay:.15s} .f2{animation-delay:.22s} .f3{animation-delay:.29s} .f4{animation-delay:.36s} .f5{animation-delay:.43s}
        .drift-card  { animation: drift 7s ease-in-out infinite; }
        .dc2 { animation-delay:-2.3s; } .dc3 { animation-delay:-4.6s; }
        .glow-pulse  { animation: glow-pulse 3s ease-in-out infinite; }
        .tab-active  { background:#4ade80; color:#080c14; }
        .tab-idle    { background:transparent; color:#64748b; }
        .oauth-btn   { transition: all .2s ease; }
        .oauth-btn:hover { transform:translateY(-2px); }
        .submit-btn  { transition: all .25s ease; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 35px rgba(74,222,128,.4); }
        .submit-btn:active:not(:disabled){ transform:translateY(0); }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", background:"#080c14", fontFamily:"var(--font-dm-sans, DM Sans, sans-serif)" }}>

        {/* ─── LEFT PANEL ─── */}
        <div className="panel-left" style={{ display:"none", width:"48%", position:"relative", overflow:"hidden", flexDirection:"column", justifyContent:"space-between", padding:"2.5rem" }}>
          <style>{`@media(min-width:900px){.panel-left{display:flex;}}`}</style>

          {/* BG image */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=75')", backgroundSize:"cover", backgroundPosition:"center" }} />
          {/* Overlay */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,rgba(8,12,20,.6) 0%,rgba(8,12,20,.88) 100%)" }} />
          {/* Green glow */}
          <div className="glow-pulse" style={{ position:"absolute", bottom:-80, left:-60, width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.22),transparent)", filter:"blur(60px)" }} />

          {/* Logo */}
          <div style={{ position:"relative", display:"flex", alignItems:"center", gap:".6rem" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".8rem", color:"#080c14" }}>G</div>
            <span style={{ fontWeight:600, fontSize:"1.05rem", color:"#f1f5f9", letterSpacing:"-.01em" }}>Golf Charity</span>
          </div>

          {/* Floating score cards */}
          <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:"1rem" }}>
            {[
              { score:42, label:"Best Score",   color:"#facc15", delay:"0s"    },
              { score:38, label:"Last Round",   color:"#4ade80", delay:"-2.3s" },
              { score:35, label:"Avg Stableford",color:"#a78bfa",delay:"-4.6s" },
            ].map((c,i) => (
              <div key={i} className={`drift-card`} style={{ animationDelay:c.delay, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:".75rem 1.25rem", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:"1rem", width:"fit-content" }}>
                <span style={{ fontSize:"1.6rem", fontWeight:800, fontFamily:"var(--font-playfair,serif)", color:c.color }}>{c.score}</span>
                <span style={{ fontSize:".75rem", color:"#94a3b8" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Headline */}
          <div style={{ position:"relative" }}>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.4rem", fontWeight:700, lineHeight:1.1, color:"#f1f5f9", marginBottom:".75rem" }}>
              Every round<br />
              <span style={{ background:"linear-gradient(135deg,#4ade80,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>makes a difference.</span>
            </h2>
            <p style={{ fontSize:".875rem", color:"#64748b", lineHeight:1.6 }}>
              Play golf. Enter monthly prize draws.<br />Support charity — automatically.
            </p>
            {/* Stats row */}
            <div style={{ display:"flex", gap:"1.5rem", marginTop:"1.5rem", paddingTop:"1.5rem", borderTop:"1px solid rgba(255,255,255,.07)" }}>
              {[["1,340+","Members"],["₹84K+","Donated"],["10%","Min. Charity"]].map(([v,l])=>(
                <div key={l}>
                  <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#4ade80" }}>{v}</div>
                  <div style={{ fontSize:".7rem", color:"#475569", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="panel-right" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", position:"relative" }}>
          {/* Glow blobs */}
          <div style={{ position:"absolute", top:-60, right:-60, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.12),transparent)", filter:"blur(80px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-40, left:-40, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.09),transparent)", filter:"blur(70px)", pointerEvents:"none" }} />

          <div style={{ width:"100%", maxWidth:420, position:"relative" }}>

            {/* Mobile logo */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:".6rem", marginBottom:"1.75rem" }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".8rem", color:"#080c14" }}>G</div>
              <span style={{ fontWeight:600, color:"#f1f5f9" }}>Golf Charity</span>
            </div>

            {/* Heading */}
            <h1 className="form-field f1" style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.9rem", fontWeight:700, color:"#f1f5f9", marginBottom:".3rem", textAlign:"center" }}>
              Welcome back 👋
            </h1>
            <p className="form-field f1" style={{ fontSize:".85rem", color:"#475569", textAlign:"center", marginBottom:"1.5rem" }}>
              Sign in or create an account to continue
            </p>

            {/* Tab switcher */}
            <div className="form-field f2" style={{ display:"flex", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:4, marginBottom:"1.5rem" }}>
              {(["login","signup"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setMessage(null); }} style={{ flex:1, padding:".55rem", borderRadius:7, border:"none", fontWeight:600, fontSize:".82rem", cursor:"pointer", transition:"all .2s ease", background: tab===t?"#4ade80":"transparent", color: tab===t?"#080c14":"#64748b" }}>
                  {t === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Alert */}
            {message && (
              <div className="form-field" style={{ padding:".75rem 1rem", borderRadius:10, marginBottom:"1rem", fontSize:".82rem", border:`1px solid`, background: message.type==="error"?"rgba(248,113,113,.1)":"rgba(74,222,128,.1)", borderColor: message.type==="error"?"rgba(248,113,113,.3)":"rgba(74,222,128,.3)", color: message.type==="error"?"#f87171":"#4ade80" }}>
                {message.text}
              </div>
            )}

            {/* Fields */}
            <div className="form-field f3" style={{ marginBottom:".75rem" }}>
              <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?login():signUp())}
                style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:".75rem 1rem", color:"#f1f5f9", fontSize:".875rem", outline:"none", transition:"border-color .2s,box-shadow .2s", fontFamily:"inherit" }}
                onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 3px rgba(74,222,128,.12)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.boxShadow="none";}}
              />
            </div>
            <div className="form-field f4" style={{ marginBottom:"1.25rem" }}>
              <input placeholder="Password (min 6 characters)" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?login():signUp())}
                style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:".75rem 1rem", color:"#f1f5f9", fontSize:".875rem", outline:"none", transition:"border-color .2s,box-shadow .2s", fontFamily:"inherit" }}
                onFocus={e=>{e.target.style.borderColor="#4ade80";e.target.style.boxShadow="0 0 0 3px rgba(74,222,128,.12)";}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.1)";e.target.style.boxShadow="none";}}
              />
            </div>

            {/* Submit */}
            <button className="form-field f5 submit-btn" onClick={tab==="login"?login:signUp} disabled={loading}
              style={{ width:"100%", padding:".85rem", borderRadius:10, border:"none", fontWeight:700, fontSize:".9rem", cursor: loading?"not-allowed":"pointer", background: loading?"rgba(74,222,128,.4)":"#4ade80", color:"#080c14", marginBottom:"1.25rem", opacity: loading?.7:1 }}>
              {loading ? "Please wait…" : tab==="login" ? "Sign In →" : "Create Account →"}
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.07)" }} />
              <span style={{ fontSize:".72rem", color:"#374151", fontWeight:500 }}>or continue with</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,.07)" }} />
            </div>

            {/* OAuth */}
            <div style={{ display:"flex", flexDirection:"column", gap:".625rem" }}>
              <button className="oauth-btn" onClick={()=>signInWithProvider("google")} disabled={loading}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:".65rem", padding:".75rem", borderRadius:10, border:"1px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.04)", color:"#e2e8f0", fontSize:".85rem", fontWeight:500, cursor:"pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button className="oauth-btn" onClick={()=>signInWithProvider("facebook")} disabled={loading}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:".65rem", padding:".75rem", borderRadius:10, border:"1px solid rgba(24,119,242,.3)", background:"rgba(24,119,242,.12)", color:"#93c5fd", fontSize:".85rem", fontWeight:500, cursor:"pointer" }}>
                <svg width="16" height="16" fill="#60a5fa" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Continue with Facebook
              </button>
            </div>

            <p style={{ fontSize:".72rem", color:"#374151", textAlign:"center", marginTop:"1.25rem" }}>
              By signing up you agree to support great causes 💚
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
