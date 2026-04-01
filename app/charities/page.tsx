"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = { id: string; name: string; description: string; image_url: string | null; is_featured: boolean; };

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const { ref: heroRef, inView: heroIn }       = useInView(0.05);
  const { ref: featRef, inView: featIn }       = useInView(0.1);
  const { ref: gridRef, inView: gridIn }       = useInView(0.05);

  useEffect(() => {
    supabase.from("charities").select("id,name,description,image_url,is_featured").order("is_featured",{ascending:false}).order("name").then(({ data }) => { setCharities(data||[]); setLoading(false); });
  }, []);

  const filtered = charities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.description||"").toLowerCase().includes(search.toLowerCase()));
  const featured = filtered.filter(c => c.is_featured);
  const regular  = filtered.filter(c => !c.is_featured);

  return (
    <>
      <style>{`
        @keyframes ring-p { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .fade-up  { opacity:0;transform:translateY(24px);transition:opacity .65s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1); }
        .fade-up.in{ opacity:1;transform:translateY(0); }
        .d1{transition-delay:.07s} .d2{transition-delay:.14s} .d3{transition-delay:.21s} .d4{transition-delay:.28s} .d5{transition-delay:.35s} .d6{transition-delay:.42s}
        .nav-lu   { position:relative; }
        .nav-lu::after{ content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#4ade80;transition:width .3s; }
        .nav-lu:hover::after{ width:100%; }
        .ring-dot::after{ content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid rgba(74,222,128,.4);animation:ring-p 2.5s ease-out infinite; }
        .feat-card{ transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s; }
        .feat-card:hover{ transform:translateY(-6px); box-shadow:0 20px 50px rgba(0,0,0,.4); }
        .reg-card { transition:transform .3s cubic-bezier(.16,1,.3,1),border-color .3s,box-shadow .3s; }
        .reg-card:hover{ transform:translateY(-5px); border-color:rgba(74,222,128,.25)!important; box-shadow:0 16px 40px rgba(0,0,0,.35); }
        .search-input:focus{ border-color:#4ade80!important; box-shadow:0 0 0 3px rgba(74,222,128,.12)!important; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", overflowX:"hidden", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)" }}>
        {/* Glow blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.07),transparent)", filter:"blur(90px)", top:-60, left:"10%" }} />
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.06),transparent)", filter:"blur(80px)", top:400, right:-60 }} />
        </div>

        {/* ── NAVBAR ── */}
        <nav style={{ position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center", padding:".9rem 2rem", borderBottom:"1px solid rgba(255,255,255,.06)", backdropFilter:"blur(14px)", background:"rgba(8,12,20,.82)" }}>
          <a href="/" style={{ display:"flex", alignItems:"center", gap:".55rem", textDecoration:"none", color:"#f1f5f9" }}>
            <div className="ring-dot" style={{ position:"relative", width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#22c55e)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".75rem", color:"#080c14" }}>G</div>
            <span style={{ fontWeight:600, fontSize:"1rem" }}>Golf Charity</span>
          </a>
          <div style={{ display:"flex", alignItems:"center", gap:"1.5rem" }}>
            <a href="/"            className="nav-lu" style={{ fontSize:".85rem", color:"#94a3b8", textDecoration:"none" }}>Home</a>
            <a href="/leaderboard" className="nav-lu" style={{ fontSize:".85rem", color:"#4ade80", textDecoration:"none" }}>🏆 Leaderboard</a>
            <a href="/dashboard" style={{ background:"#4ade80", color:"#080c14", fontWeight:700, fontSize:".83rem", padding:".5rem 1.1rem", borderRadius:9, textDecoration:"none", transition:"transform .2s,box-shadow .2s" }} onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLAnchorElement).style.boxShadow="0 8px 24px rgba(74,222,128,.35)";}} onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="none";(e.currentTarget as HTMLAnchorElement).style.boxShadow="none";}}>Dashboard →</a>
          </div>
        </nav>

        <div style={{ position:"relative", zIndex:1, maxWidth:1000, margin:"0 auto", padding:"3rem 1.5rem" }}>

          {/* ── HERO ── */}
          <div ref={heroRef} className={`fade-up ${heroIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:".5rem", padding:".35rem .9rem", borderRadius:9999, background:"rgba(250,204,21,.08)", border:"1px solid rgba(250,204,21,.2)", color:"#facc15", fontSize:".7rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:"1.25rem" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#facc15", display:"inline-block" }} />
              Every subscription makes an impact
            </div>
            <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(2.2rem,5vw,3.2rem)", fontWeight:900, lineHeight:1.08, marginBottom:".75rem" }}>
              Causes Worth<br />
              <span style={{ background:"linear-gradient(135deg,#facc15,#4ade80)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Playing For</span>
            </h1>
            <p style={{ color:"#64748b", fontSize:".95rem", maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>
              Every subscription contributes directly to these causes. Choose the one closest to your heart.
            </p>
          </div>

          {/* ── SEARCH ── */}
          <div className={`fade-up d1 ${heroIn?"in":""}`} style={{ marginBottom:"2.5rem" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"1rem", top:"50%", transform:"translateY(-50%)", fontSize:"1rem", pointerEvents:"none" }}>🔍</span>
              <input type="text" placeholder="Search charities…" value={search} onChange={e=>setSearch(e.target.value)} className="search-input"
                style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:11, padding:".8rem 1rem .8rem 2.75rem", color:"#f1f5f9", fontSize:".9rem", outline:"none", transition:"border-color .2s,box-shadow .2s", fontFamily:"inherit" }}
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4rem 0", gap:"1rem" }}>
              <div style={{ width:34, height:34, border:"2px solid rgba(74,222,128,.15)", borderTopColor:"#4ade80", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
              <p style={{ color:"#475569", fontSize:".85rem" }}>Loading charities…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"4rem 0" }}>
              <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>💚</div>
              <p style={{ color:"#64748b" }}>No charities found.</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* ── FEATURED ── */}
              {featured.length > 0 && (
                <div ref={featRef} style={{ marginBottom:"2.5rem" }}>
                  <div className={`fade-up ${featIn?"in":""}`} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
                    <span style={{ fontSize:".68rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#facc15" }}>⭐ Featured</span>
                    <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(250,204,21,.25),transparent)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"1.25rem" }}>
                    {featured.map((c,i) => (
                      <div key={c.id} className={`fade-up d${i+1} ${featIn?"in":""} feat-card`} onClick={()=>window.location.href=`/charities/${c.id}`} style={{ cursor:"pointer", borderRadius:16, padding:1, background:"linear-gradient(135deg,rgba(250,204,21,.4),rgba(74,222,128,.2),rgba(167,139,250,.25))" }}>
                        <div style={{ borderRadius:15, background:"#0d1422", overflow:"hidden", height:"100%" }}>
                          {c.image_url && <img src={c.image_url} alt={c.name} style={{ width:"100%", height:160, objectFit:"cover" }} />}
                          <div style={{ padding:"1.25rem" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".6rem" }}>
                              <h4 style={{ fontSize:"1.1rem", fontWeight:700, flex:1 }}>{c.name}</h4>
                              <span style={{ background:"rgba(250,204,21,.12)", border:"1px solid rgba(250,204,21,.3)", color:"#fde047", fontSize:".68rem", fontWeight:600, padding:".15rem .55rem", borderRadius:9999, marginLeft:".75rem", flexShrink:0 }}>Featured</span>
                            </div>
                            <p style={{ color:"#64748b", fontSize:".82rem", lineHeight:1.65, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>{c.description||"No description available."}</p>
                            <p style={{ color:"#facc15", fontSize:".78rem", fontWeight:600, marginTop:".75rem" }}>View details →</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REGULAR ── */}
              {regular.length > 0 && (
                <div ref={gridRef}>
                  <div className={`fade-up ${gridIn?"in":""}`} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
                    <span style={{ fontSize:".68rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#94a3b8" }}>{featured.length>0?"All Charities":"Charities"}</span>
                    <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,255,255,.07),transparent)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"1rem" }}>
                    {regular.map((c,i) => (
                      <div key={c.id} className={`fade-up d${(i%3)+1} ${gridIn?"in":""} reg-card`} onClick={()=>window.location.href=`/charities/${c.id}`} style={{ cursor:"pointer", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, overflow:"hidden" }}>
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} style={{ width:"100%", height:130, objectFit:"cover" }} />
                        ) : (
                          <div style={{ width:"100%", height:130, background:"rgba(74,222,128,.05)", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>💚</div>
                        )}
                        <div style={{ padding:"1rem" }}>
                          <h4 style={{ fontSize:".95rem", fontWeight:700, marginBottom:".4rem" }}>{c.name}</h4>
                          <p style={{ color:"#64748b", fontSize:".8rem", lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const, overflow:"hidden" }}>{c.description||"No description available."}</p>
                          <p style={{ color:"#4ade80", fontSize:".75rem", fontWeight:600, marginTop:".6rem" }}>View details →</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,.05)", padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem", marginTop:"2rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".5rem", color:"#374151", fontSize:".8rem" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(74,222,128,.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:800 }}>G</div>
            © 2026 Golf Charity. All rights reserved.
          </div>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {[["Home","/"],["Sign In","/auth"],["Dashboard","/dashboard"]].map(([l,h])=>(
              <a key={l} href={h} style={{ color:"#374151", fontSize:".8rem", textDecoration:"none", transition:"color .2s" }} onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="#374151")}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
