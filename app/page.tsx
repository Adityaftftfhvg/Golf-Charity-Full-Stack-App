"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Charity = { id: string; name: string; description: string; image_url: string | null; };

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

export default function HomePage() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [session, setSession] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const pool    = useCountUp(248500, 2200, statsVisible);
  const donated = useCountUp(84200,  2000, statsVisible);
  const members = useCountUp(1340,   1800, statsVisible);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(!!session));
    supabase.from("charities").select("id,name,description,image_url").eq("is_featured", true).limit(1).single().then(({ data }) => { if (data) setFeaturedCharity(data); });
    const iv = setInterval(() => setActiveStep(s => (s + 1) % 3), 3200);
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) ob.observe(statsRef.current);
    return () => { clearInterval(iv); ob.disconnect(); };
  }, []);

  const { ref: heroRef,    inView: heroIn    } = useInView(0.05);
  const { ref: stepsRef,   inView: stepsIn   } = useInView(0.1);
  const { ref: tiersRef,   inView: tiersIn   } = useInView(0.1);
  const { ref: charityRef, inView: charityIn } = useInView(0.1);
  const { ref: testiRef,   inView: testiIn   } = useInView(0.1);

  const steps = [
    { n:"01", title:"Subscribe",     body:"Choose monthly or yearly. A portion goes directly to your chosen charity.", color:"#a78bfa" },
    { n:"02", title:"Submit Scores", body:"Enter your Stableford score (1–45) after each round. Keep your 5 most recent active.", color:"#4ade80" },
    { n:"03", title:"Win & Give",    body:"5 numbers drawn monthly. Match 3, 4, or 5 to win — charity gets guaranteed support.", color:"#facc15" },
  ];

  const tiers = [
    { match:"5 Numbers", pct:"40%", label:"Jackpot",      rolls:true,  c1:"rgba(250,204,21,.14)", c2:"rgba(250,204,21,.04)", border:"rgba(250,204,21,.4)", tc:"#fde047" },
    { match:"4 Numbers", pct:"35%", label:"Second Prize", rolls:false, c1:"rgba(167,139,250,.14)", c2:"rgba(167,139,250,.04)", border:"rgba(167,139,250,.4)", tc:"#c4b5fd" },
    { match:"3 Numbers", pct:"25%", label:"Third Prize",  rolls:false, c1:"rgba(74,222,128,.14)",  c2:"rgba(74,222,128,.04)",  border:"rgba(74,222,128,.4)",  tc:"#86efac" },
  ];

  const testimonials = [
    { q:"Won ₹4,200 in March. My charity got a cut too — that made it feel incredible.", n:"Rohan M.", loc:"Mumbai" },
    { q:"Finally a golf platform that doesn't look like it was built in 2005. Obsessed.", n:"Priya S.", loc:"Bengaluru" },
    { q:"Set up in 3 minutes. First draw I entered, I matched 3 numbers. Wild.", n:"Aditya K.", loc:"Delhi" },
  ];

  return (
    <>
      <style>{`
        @keyframes hero-fade { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
        @keyframes float     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes marquee   { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes scroll-dot{ 0%,100%{transform:translateY(0);opacity:1;} 50%{transform:translateY(6px);opacity:.3;} }
        @keyframes ring-pulse{ 0%{transform:scale(.9);opacity:1;} 100%{transform:scale(1.8);opacity:0;} }
        @keyframes bar-grow  { from{width:0} to{width:100%} }
        .h-fade  { animation: hero-fade .7s cubic-bezier(.16,1,.3,1) both; }
        .h1{animation-delay:.05s} .h2{animation-delay:.13s} .h3{animation-delay:.21s} .h4{animation-delay:.29s} .h5{animation-delay:.37s}
        .float   { animation: float 6s ease-in-out infinite; }
        .f2d{animation-delay:-2s;} .f3d{animation-delay:-4s;}
        .marquee { animation: marquee 22s linear infinite; }
        .sdot    { animation: scroll-dot 1.8s ease-in-out infinite; }
        .ring::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1.5px solid rgba(74,222,128,.4);animation:ring-pulse 2.5s ease-out infinite;}
        .fade-up{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
        .fade-up.in{opacity:1;transform:translateY(0);}
        .d1{transition-delay:.07s} .d2{transition-delay:.14s} .d3{transition-delay:.21s}
        .step-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s,border-color .4s,background .4s;}
        .tier-card{transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s;}
        .tier-card:hover{transform:translateY(-8px);}
        .cta-glow{transition:transform .25s,box-shadow .25s;}
        .cta-glow:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(74,222,128,.4);}
        .nav-link-u{position:relative;} .nav-link-u::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#4ade80;transition:width .3s;}
        .nav-link-u:hover::after{width:100%;}
        .stat-card{transition:transform .3s;} .stat-card:hover{transform:translateY(-4px);}
        .testi-card{transition:transform .3s,border-color .3s;} .testi-card:hover{transform:translateY(-4px);border-color:rgba(74,222,128,.25)!important;}
      `}</style>

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", overflowX:"hidden", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)" }}>

        {/* Glow blobs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.09),transparent)", filter:"blur(100px)", top:-120, left:"20%" }} />
          <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.07),transparent)", filter:"blur(100px)", top:300, right:-100 }} />
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.05),transparent)", filter:"blur(80px)", bottom:200, left:-60 }} />
        </div>

      

        {/* ── HERO ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"5rem 1.5rem 4rem", textAlign:"center" }} ref={heroRef}>
          {/* Bg image tint */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1400&q=60')", backgroundSize:"cover", backgroundPosition:"center", opacity:.05, borderRadius:"1.5rem", pointerEvents:"none" }} />

          <div className="h-fade h1" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", padding:".4rem 1rem", borderRadius:9999, background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.2)", color:"#4ade80", fontSize:".72rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", marginBottom:"1.5rem" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", display:"inline-block", boxShadow:"0 0 8px #4ade80" }} />
            Play Golf · Win Prizes · Fund Charities
          </div>

          <h1 className="h-fade h2" style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(2.8rem,6vw,4.5rem)", fontWeight:900, lineHeight:1.05, letterSpacing:"-.02em", marginBottom:"1.25rem" }}>
            Every Round You Play<br />
            <span style={{ background:"linear-gradient(135deg,#4ade80 0%,#a78bfa 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Makes a Difference</span>
          </h1>

          <p className="h-fade h3" style={{ fontSize:"1.1rem", color:"#64748b", maxWidth:560, margin:"0 auto 2rem", lineHeight:1.7 }}>
            Submit your golf scores, enter monthly prize draws, and automatically support a charity you care about — all in one platform.
          </p>

          <div className="h-fade h4" style={{ display:"flex", gap:".75rem", justifyContent:"center", flexWrap:"wrap", marginBottom:"3rem" }}>
            <a href={session?"/dashboard":"/auth"} className="cta-glow" style={{ background:"#4ade80", color:"#080c14", fontWeight:700, fontSize:".95rem", padding:".9rem 2rem", borderRadius:11, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:".4rem" }}>
              {session?"Go to Dashboard":"Start Playing — Free"} →
            </a>
            <a href="/charities" style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#94a3b8", fontWeight:500, fontSize:".95rem", padding:".9rem 2rem", borderRadius:11, textDecoration:"none", transition:"all .2s" }} onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,.09)";(e.currentTarget as HTMLAnchorElement).style.color="#f1f5f9";}} onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(255,255,255,.05)";(e.currentTarget as HTMLAnchorElement).style.color="#94a3b8";}}>
              View Charities
            </a>
          </div>

          {/* Floating score cards */}
          <div className="h-fade h5" style={{ display:"flex", justifyContent:"center", gap:"1rem", flexWrap:"wrap" }}>
            {[{ s:42, l:"Best Score", c:"#facc15", d:"0s" },{ s:38, l:"This Month", c:"#4ade80", d:"-2s" },{ s:31, l:"Last Round", c:"#a78bfa", d:"-4s" }].map((card,i)=>(
              <div key={i} className={`float ${i===1?"f2d":i===2?"f3d":""}`} style={{ animationDelay:card.d, background:"rgba(255,255,255,.045)", border:"1px solid rgba(255,255,255,.09)", borderRadius:14, padding:".9rem 1.4rem", backdropFilter:"blur(16px)", textAlign:"center", minWidth:100 }}>
                <div style={{ fontSize:"1.8rem", fontWeight:800, fontFamily:"var(--font-playfair,serif)", color:card.c, lineHeight:1 }}>{card.s}</div>
                <div style={{ fontSize:".7rem", color:"#475569", marginTop:4 }}>{card.l}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop:"2.5rem", display:"flex", flexDirection:"column", alignItems:"center", gap:6, opacity:.25 }}>
            <span style={{ fontSize:".65rem", letterSpacing:".12em", textTransform:"uppercase", color:"#64748b" }}>Scroll</span>
            <div className="sdot" style={{ width:3, height:16, borderRadius:9999, background:"#475569" }} />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div style={{ position:"relative", zIndex:1, overflow:"hidden", borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(74,222,128,.025)", padding:".6rem 0" }}>
          <div className="marquee" style={{ display:"flex", width:"max-content", whiteSpace:"nowrap" }}>
            {Array(8).fill("Play · Win · Give · Repeat · Golf Charity · ").map((t,i)=>(
              <span key={i} style={{ fontSize:".72rem", fontWeight:600, letterSpacing:".1em", color:"rgba(74,222,128,.45)", padding:"0 2rem" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3.5rem 1.5rem" }} ref={statsRef}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
            {[
              { v:`₹${(pool/1000).toFixed(1)}K`,    l:"Prize Pool Distributed", icon:"🏆", accent:"#facc15" },
              { v:`₹${(donated/1000).toFixed(1)}K`, l:"Donated to Charities",   icon:"💚", accent:"#4ade80" },
              { v:`${members.toLocaleString()}+`,    l:"Active Members",          icon:"⛳", accent:"#a78bfa" },
            ].map(stat=>(
              <div key={stat.l} className="stat-card" style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"1.75rem 1.5rem", textAlign:"center", borderTop:`2px solid ${stat.accent}44` }}>
                <div style={{ fontSize:"1.75rem", marginBottom:".5rem" }}>{stat.icon}</div>
                <div style={{ fontSize:"2rem", fontWeight:800, fontFamily:"var(--font-playfair,serif)", color:stat.accent, lineHeight:1.1, marginBottom:".4rem" }}>{stat.v}</div>
                <div style={{ fontSize:".78rem", color:"#475569" }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={stepsRef}>
          <div className={`fade-up ${stepsIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#4ade80", marginBottom:".5rem" }}>The Process</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.2rem", fontWeight:800 }}>How It Works</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1.25rem" }}>
            {steps.map((item,i)=>(
              <div key={i} className={`fade-up d${i+1} ${stepsIn?"in":""} step-card`} style={{ padding:"1.75rem", borderRadius:14, background: activeStep===i?`${item.color}0d`:"rgba(255,255,255,.03)", border:`1px solid ${activeStep===i?item.color+"55":"rgba(255,255,255,.07)"}`, transform: activeStep===i?"translateY(-5px)":"translateY(0)", boxShadow: activeStep===i?"0 16px 50px rgba(0,0,0,.3)":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${item.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", fontWeight:800, color:item.color, fontFamily:"var(--font-playfair,serif)" }}>{item.n}</div>
                  {activeStep===i && <div style={{ width:6, height:6, borderRadius:"50%", background:item.color, boxShadow:`0 0 10px ${item.color}` }} />}
                </div>
                <h3 style={{ fontSize:"1.1rem", fontWeight:700, color: activeStep===i?item.color:"#f1f5f9", marginBottom:".6rem" }}>{item.title}</h3>
                <p style={{ fontSize:".83rem", color:"#64748b", lineHeight:1.65 }}>{item.body}</p>
                <div style={{ marginTop:"1.25rem", height:2, borderRadius:9999, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:9999, background:item.color, width: activeStep===i?"100%":"0%", transition:"width .7s cubic-bezier(.16,1,.3,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRIZE TIERS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={tiersRef}>
          <div className={`fade-up ${tiersIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#a78bfa", marginBottom:".5rem" }}>Rewards</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.2rem", fontWeight:800 }}>Prize Structure</h2>
            <p style={{ color:"#475569", marginTop:".4rem", fontSize:".875rem" }}>Monthly pool split across three winner tiers</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1.25rem" }}>
            {tiers.map((tier,i)=>(
              <div key={i} className={`fade-up d${i+1} ${tiersIn?"in":""} tier-card`} style={{ padding:"1.75rem", borderRadius:14, background:`linear-gradient(135deg,${tier.c1},${tier.c2})`, border:`1px solid ${tier.border}`, boxShadow:`0 6px 30px ${tier.c1}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
                  <span style={{ background:`${tier.c1}`, border:`1px solid ${tier.border}`, color:tier.tc, fontSize:".72rem", fontWeight:600, padding:".2rem .7rem", borderRadius:9999 }}>{tier.label}</span>
                  {tier.rolls && <span style={{ fontSize:".68rem", color:"rgba(250,204,21,.6)", fontWeight:500 }}>Rolls Over →</span>}
                </div>
                <div style={{ fontSize:"3.5rem", fontWeight:900, fontFamily:"var(--font-playfair,serif)", lineHeight:1, marginBottom:".4rem" }}>{tier.pct}</div>
                <div style={{ fontSize:".78rem", color:"#475569", marginBottom:"1.25rem" }}>of monthly prize pool</div>
                <div style={{ paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                  <span style={{ fontWeight:700, color:"#f1f5f9" }}>{tier.match}</span>
                  <span style={{ color:"#475569", fontSize:".83rem" }}> matched to win</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED CHARITY ── */}
        {featuredCharity && (
          <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={charityRef}>
            <div className={`fade-up ${charityIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2rem" }}>
              <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#facc15", marginBottom:".5rem" }}>Impact</p>
              <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.2rem", fontWeight:800 }}>Featured Charity</h2>
            </div>
            <div className={`fade-up d1 ${charityIn?"in":""}`} style={{ padding:1, borderRadius:20, background:"linear-gradient(135deg,rgba(250,204,21,.4),rgba(74,222,128,.2),rgba(167,139,250,.3))" }}>
              <div style={{ borderRadius:19, background:"#0d1422", padding:"2rem", display:"flex", gap:"2rem", alignItems:"center", flexWrap:"wrap" }}>
                {featuredCharity.image_url ? (
                  <img src={featuredCharity.image_url} alt={featuredCharity.name} style={{ width:180, height:180, objectFit:"cover", borderRadius:14, flexShrink:0 }} />
                ) : (
                  <div style={{ width:180, height:180, borderRadius:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3rem", background:"rgba(250,204,21,.07)", border:"1px solid rgba(250,204,21,.15)" }}>💚</div>
                )}
                <div style={{ flex:1 }}>
                  <span style={{ background:"rgba(250,204,21,.12)", border:"1px solid rgba(250,204,21,.25)", color:"#fde047", fontSize:".72rem", fontWeight:600, padding:".2rem .75rem", borderRadius:9999, display:"inline-block", marginBottom:".75rem" }}>⭐ Spotlight Charity</span>
                  <h3 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"1.8rem", fontWeight:800, marginBottom:".75rem" }}>{featuredCharity.name}</h3>
                  <p style={{ color:"#64748b", lineHeight:1.7, marginBottom:"1.25rem", fontSize:".9rem" }}>{featuredCharity.description}</p>
                  <div style={{ display:"flex", gap:".75rem", flexWrap:"wrap" }}>
                    <a href={`/charities/${featuredCharity.id}`} className="cta-glow" style={{ background:"rgba(250,204,21,.15)", border:"1px solid rgba(250,204,21,.3)", color:"#fde047", fontSize:".85rem", fontWeight:600, padding:".6rem 1.25rem", borderRadius:9, textDecoration:"none" }}>Learn More →</a>
                    <a href="/charities" style={{ color:"#64748b", fontSize:".85rem", padding:".6rem 1.25rem", textDecoration:"none", transition:"color .2s" }} onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="#64748b")}>All Charities →</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={testiRef}>
          <div className={`fade-up ${testiIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#4ade80", marginBottom:".5rem" }}>Community</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.2rem", fontWeight:800 }}>What Members Say</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1.25rem" }}>
            {testimonials.map((t,i)=>(
              <div key={i} className={`fade-up d${i+1} ${testiIn?"in":""} testi-card`} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"1.5rem" }}>
                <div style={{ fontSize:"1.5rem", color:"rgba(74,222,128,.5)", marginBottom:".75rem" }}>"</div>
                <p style={{ color:"#94a3b8", fontSize:".875rem", lineHeight:1.7, marginBottom:"1.25rem" }}>{t.q}</p>
                <div style={{ display:"flex", alignItems:"center", gap:".75rem", paddingTop:"1rem", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#4ade80,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:".78rem", color:"#080c14" }}>{t.n[0]}</div>
                  <div>
                    <div style={{ fontSize:".85rem", fontWeight:600 }}>{t.n}</div>
                    <div style={{ fontSize:".72rem", color:"#374151" }}>{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>
          <div style={{ padding:"3.5rem 2rem", borderRadius:20, background:"linear-gradient(135deg,rgba(74,222,128,.07),rgba(167,139,250,.06))", border:"1px solid rgba(74,222,128,.15)", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(74,222,128,.07),transparent 60%)", pointerEvents:"none" }} />
            <p style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase", color:"#4ade80", marginBottom:".75rem" }}>Join the Community</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"2.5rem", fontWeight:800, marginBottom:"1rem" }}>Ready to Play?</h2>
            <p style={{ color:"#64748b", fontSize:"1rem", marginBottom:"2rem", maxWidth:480, margin:"0 auto 2rem" }}>Join golfers across the country making an impact with every round they play.</p>
            <a href={session?"/dashboard":"/auth"} className="cta-glow" style={{ background:"#4ade80", color:"#080c14", fontWeight:700, fontSize:"1rem", padding:"1rem 2.5rem", borderRadius:12, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:".4rem" }}>
              {session?"Go to Dashboard":"Join Now — It's Free"} →
            </a>
            <p style={{ fontSize:".72rem", color:"#374151", marginTop:"1rem" }}>No commitment · Cancel anytime</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,.05)", padding:"1.5rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".5rem", color:"#374151", fontSize:".8rem" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(74,222,128,.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:800 }}>G</div>
            © 2026 Golf Charity. All rights reserved.
          </div>
          <div style={{ display:"flex", gap:"1.5rem" }}>
            {[["Charities","/charities"],["Sign In","/auth"],["Dashboard","/dashboard"]].map(([l,h])=>(
              <a key={l} href={h} style={{ color:"#374151", fontSize:".8rem", textDecoration:"none", transition:"color .2s" }} onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="#374151")}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
