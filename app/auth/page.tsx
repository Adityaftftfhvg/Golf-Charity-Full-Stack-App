"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [particles, setParticles] = useState<{x:number;y:number;s:number;d:number;c:string}[]>([]);
  const [focusedField, setFocusedField] = useState<string|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setParticles(Array.from({length: 20}, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: 2 + Math.random() * 3,
      d: 4 + Math.random() * 8,
      c: ["rgba(74,222,128,.5)","rgba(167,139,250,.5)","rgba(250,204,21,.4)"][Math.floor(Math.random()*3)],
    })));

    // Animated canvas grid
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spacing = 40;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dist = Math.sqrt((x - canvas.width/2)**2 + (y - canvas.height/2)**2);
          const pulse = Math.sin(dist/40 - frame/30) * .5 + .5;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI*2);
          ctx.fillStyle = `rgba(74,222,128,${pulse * .08})`;
          ctx.fill();
        }
      }
      frame++;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMsg(error.message); setLoading(false); }
      else window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) { setMsg(error.message); setLoading(false); }
      else { setSuccess(true); setLoading(false); }
    }
  };

  return (
    <>
      <style>{`
        @keyframes auth-card-in { from{opacity:0;transform:scale(.92) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes float-p { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes border-rotate { from{background-position:0% 50%} to{background-position:100% 50%} }
        @keyframes success-in { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes checkmark { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }
        @keyframes field-glow { from{box-shadow:0 0 0 rgba(74,222,128,0)} to{box-shadow:0 0 0 4px rgba(74,222,128,.12)} }

        .auth-card { animation: auth-card-in .55s cubic-bezier(.16,1,.3,1) both; }

        .auth-input {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(255,255,255,.09);
          border-radius: 12px;
          padding: .85rem 1.1rem;
          color: #f1f5f9;
          font-size: .93rem;
          font-family: inherit;
          transition: border-color .22s, box-shadow .22s, background .22s;
          outline: none;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,.14);
          background: rgba(74,222,128,.03);
        }

        .auth-submit {
          width: 100%;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: #050a0e;
          font-weight: 800;
          font-size: .95rem;
          padding: .95rem;
          border-radius: 13px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform .22s, box-shadow .28s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          letter-spacing: -.01em;
        }
        .auth-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
          transform: translateX(-100%);
        }
        .auth-submit:hover:not(:disabled)::before { animation: shimmer-pass .55s ease forwards; }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 44px rgba(74,222,128,.55); }
        .auth-submit:disabled { opacity: .65; cursor: not-allowed; }

        .mode-btn {
          flex: 1;
          padding: .6rem;
          border-radius: 9px;
          border: none;
          font-family: inherit;
          font-size: .85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .25s;
        }
        .mode-btn.active {
          background: rgba(74,222,128,.12);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,.3);
        }
        .mode-btn.inactive {
          background: transparent;
          color: #475569;
          border: 1px solid transparent;
        }
        .mode-btn.inactive:hover { color: #94a3b8; }

        .success-icon { animation: success-in .5s cubic-bezier(.34,1.56,.64,1) both; }
        .particle-auth { position: absolute; border-radius: 50%; animation: float-p var(--d) ease-in-out infinite; animation-delay: var(--delay); }

        .google-btn {
          width: 100%;
          background: rgba(255,255,255,.05);
          border: 1.5px solid rgba(255,255,255,.1);
          color: #94a3b8;
          font-weight: 600;
          font-size: .88rem;
          padding: .8rem;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all .25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .6rem;
        }
        .google-btn:hover { background: rgba(255,255,255,.09); color: #f1f5f9; border-color: rgba(255,255,255,.2); transform: translateY(-1px); }
      `}</style>

      <div style={{ minHeight:"80vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", position:"relative", overflow:"hidden" }}>

        {/* Animated canvas grid background */}
        <canvas ref={canvasRef} style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }} />

        {/* Ambient glows */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div className="float-orb" style={{ "--d":"20s","--delay":"-8s", position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.09),transparent)", filter:"blur(100px)", top:"5%", left:"10%" } as React.CSSProperties} />
          <div className="float-orb" style={{ "--d":"16s","--delay":"-4s", position:"absolute", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.07),transparent)", filter:"blur(90px)", bottom:"10%", right:"5%" } as React.CSSProperties} />
        </div>

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div key={i} className="particle-auth" style={{ position:"fixed", left:`${p.x}%`, top:`${p.y}%`, width:p.s, height:p.s, background:p.c, zIndex:0, "--d":`${p.d}s`, "--delay":`${-p.d * Math.random()}s` } as React.CSSProperties} />
        ))}

        {/* Card */}
        <div className="auth-card" style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420 }}>
          {/* Animated gradient border */}
          <div style={{ padding:1.5, borderRadius:24, background:"linear-gradient(270deg,#4ade80,#a78bfa,#facc15,#4ade80)", backgroundSize:"300% 300%", animation:"border-rotate 4s ease infinite" }}>
            <div style={{ borderRadius:22, background:"rgba(8,12,20,.97)", padding:"2.5rem", backdropFilter:"blur(30px)" }}>

              {/* Logo */}
              <div style={{ textAlign:"center", marginBottom:"2rem" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:"1.1rem", color:"#050a0e", margin:"0 auto .85rem", boxShadow:"0 12px 40px rgba(74,222,128,.4)", animation:"heartbeat 3s ease infinite" }}>GC</div>
                  {/* Ring */}
                  <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:"1.5px solid rgba(74,222,128,.3)", animation:"pulse-ring 2.5s ease-out infinite" }} />
                </div>
                <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.8rem", fontWeight:900, marginBottom:".3rem", letterSpacing:"-.02em" }}>Golf Charity</h1>
                <p style={{ color:"#475569", fontSize:".83rem" }}>{mode==="login" ? "Welcome back, golfer!" : "Join the community"}</p>
              </div>

              {success ? (
                <div style={{ textAlign:"center", padding:"1rem 0" }}>
                  <div className="success-icon" style={{ fontSize:"4rem", marginBottom:"1rem" }}>✅</div>
                  <h3 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.4rem", fontWeight:800, marginBottom:".5rem" }}>Check your email!</h3>
                  <p style={{ color:"#64748b", fontSize:".88rem", lineHeight:1.7 }}>We sent a confirmation link to <strong style={{ color:"#f1f5f9" }}>{email}</strong>. Click it to activate your account.</p>
                </div>
              ) : (
                <>
                  {/* Mode toggle */}
                  <div style={{ display:"flex", gap:".4rem", background:"rgba(255,255,255,.04)", borderRadius:11, padding:".3rem", marginBottom:"1.75rem" }}>
                    <button className={`mode-btn ${mode==="login"?"active":"inactive"}`} onClick={() => { setMode("login"); setMsg(""); }}>Sign In</button>
                    <button className={`mode-btn ${mode==="signup"?"active":"inactive"}`} onClick={() => { setMode("signup"); setMsg(""); }}>Create Account</button>
                  </div>

                  <form onSubmit={handle} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                    <div>
                      <label style={{ display:"block", fontSize:".74rem", fontWeight:700, color:"#475569", marginBottom:".45rem", letterSpacing:".08em", textTransform:"uppercase" }}>Email Address</label>
                      <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} required />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:".74rem", fontWeight:700, color:"#475569", marginBottom:".45rem", letterSpacing:".08em", textTransform:"uppercase" }}>Password</label>
                      <input className="auth-input" type="password" placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} required minLength={6} />
                    </div>

                    {msg && (
                      <div style={{ background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.25)", borderRadius:10, padding:".75rem 1rem", color:"#f87171", fontSize:".83rem", display:"flex", alignItems:"center", gap:".5rem" }}>
                        ⚠️ {msg}
                      </div>
                    )}

                    <button type="submit" className="auth-submit" disabled={loading || !email || !password}>
                      {loading ? (
                        <><div style={{ width:16, height:16, border:"2.5px solid rgba(5,10,14,.3)", borderTopColor:"#050a0e", borderRadius:"50%", animation:"spin-slow .7s linear infinite" }} /> Verifying…</>
                      ) : (
                        mode==="login" ? "Sign In →" : "Create Account →"
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div style={{ display:"flex", alignItems:"center", gap:".75rem", margin:"1.25rem 0" }}>
                    <div style={{ flex:1, height:1, background:"rgba(255,255,255,.07)" }} />
                    <span style={{ fontSize:".72rem", color:"#374151", fontWeight:600 }}>OR</span>
                    <div style={{ flex:1, height:1, background:"rgba(255,255,255,.07)" }} />
                  </div>

                  <button className="google-btn" onClick={async () => {
                    await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:`${window.location.origin}/auth/callback` } });
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                </>
              )}
            </div>
          </div>

          <p style={{ textAlign:"center", color:"#1f2937", fontSize:".74rem", marginTop:"1.25rem" }}>
            By signing up, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}
