"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Charity = { id: string; name: string; description: string; image_url: string | null; };

function useCountUp(target: number, duration = 2200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return { ref, inView };
}

// Golf ball arc animation component
function GolfBallAnimation() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {/* Flying golf ball with arc trail */}
      <div className="golf-ball-flight" style={{ position: "absolute", top: "18%", left: 0 }}>
        <div className="golf-ball" style={{
          width: 14, height: 14, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #ffffff, #d1d5db)",
          boxShadow: "0 2px 8px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.2)",
          position: "relative",
        }}>
          {/* Golf ball dimples */}
          <div style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "rgba(0,0,0,0.15)", top: 4, left: 4 }} />
          <div style={{ position: "absolute", width: 2, height: 2, borderRadius: "50%", background: "rgba(0,0,0,0.12)", top: 7, left: 8 }} />
          <div style={{ position: "absolute", width: 2, height: 2, borderRadius: "50%", background: "rgba(0,0,0,0.1)", top: 3, left: 9 }} />
        </div>
        {/* Motion trail */}
        <div className="ball-trail" />
      </div>

      {/* Second slower ball - different timing */}
      <div className="golf-ball-flight-2" style={{ position: "absolute", top: "45%", left: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), rgba(200,210,220,0.4))",
          boxShadow: "0 2px 6px rgba(255,255,255,0.15)",
        }} />
        <div className="ball-trail-2" />
      </div>

      {/* Golf club swing arc - decorative SVG path */}
      <svg
        style={{ position: "absolute", top: "5%", right: "5%", width: 280, height: 280, opacity: 0.04 }}
        viewBox="0 0 280 280"
      >
        {/* Club shaft */}
        <line x1="220" y1="20" x2="80" y2="220" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
        {/* Club head */}
        <ellipse cx="70" cy="228" rx="22" ry="10" fill="none" stroke="#4ade80" strokeWidth="2" transform="rotate(-30,70,228)" />
        {/* Swing arc path */}
        <path d="M 260 10 Q 200 80 140 160 Q 100 210 80 250" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="6,4" strokeLinecap="round" />
        {/* Small ball at end of path */}
        <circle cx="80" cy="250" r="6" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      </svg>

      {/* Grass/fairway indicator at bottom - subtle green gradient bar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.08), rgba(74,222,128,0.15), rgba(74,222,128,0.08), transparent)",
        pointerEvents: "none",
      }} />

      {/* Floating golf tee markers */}
      {[
        { x: "8%",  y: "70%", size: 18, delay: "0s",   dur: "8s",  color: "rgba(250,204,21,0.12)" },
        { x: "92%", y: "30%", size: 14, delay: "2.5s", dur: "10s", color: "rgba(74,222,128,0.1)" },
        { x: "5%",  y: "20%", size: 10, delay: "4s",   dur: "7s",  color: "rgba(167,139,250,0.1)" },
        { x: "88%", y: "75%", size: 12, delay: "1.5s", dur: "9s",  color: "rgba(250,204,21,0.08)" },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            animation: `float-tee ${item.dur} ease-in-out infinite`,
            animationDelay: item.delay,
          }}
        >
          {/* Tee shape */}
          <div style={{
            width: item.size * 0.35,
            height: item.size * 0.6,
            background: item.color,
            borderRadius: "50% 50% 0 0 / 30% 30% 0 0",
            margin: "0 auto",
          }} />
          <div style={{
            width: 1.5,
            height: item.size * 0.5,
            background: item.color,
            margin: "0 auto",
          }} />
        </div>
      ))}

      {/* Putting hole circle */}
      <div style={{
        position: "absolute",
        bottom: "12%",
        right: "10%",
        width: 40,
        height: 40,
        opacity: 0.06,
      }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #4ade80" }} />
        {/* Flag */}
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1.5, height: 32, background: "#4ade80", transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, width: 14, height: 9, background: "#4ade80", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [session, setSession] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const statsRef = useRef<HTMLDivElement>(null);

  const pool    = useCountUp(248500, 2200, statsVisible);
  const donated = useCountUp(84200,  2000, statsVisible);
  const members = useCountUp(1340,   1800, statsVisible);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(!!s));
    supabase.from("charities").select("id,name,description,image_url").eq("is_featured", true).limit(1).single().then(({ data }) => { if (data) setFeaturedCharity(data); });
    const iv = setInterval(() => setActiveStep(s => (s + 1) % 3), 3200);
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) ob.observe(statsRef.current);
    window.addEventListener("mousemove", handleMouseMove);
    return () => { clearInterval(iv); ob.disconnect(); window.removeEventListener("mousemove", handleMouseMove); };
  }, [handleMouseMove]);

  const { ref: heroRef,    inView: heroIn    } = useInView(0.05);
  const { ref: stepsRef,   inView: stepsIn   } = useInView(0.1);
  const { ref: tiersRef,   inView: tiersIn   } = useInView(0.1);
  const { ref: charityRef, inView: charityIn } = useInView(0.1);
  const { ref: testiRef,   inView: testiIn   } = useInView(0.1);

  const steps = [
    { n:"01", title:"Subscribe",     body:"Choose monthly or yearly. A portion goes directly to your chosen charity.", color:"#a78bfa", icon:"🎯" },
    { n:"02", title:"Submit Scores", body:"Enter your Stableford score (1–45) after each round. Keep your 5 most recent active.", color:"#4ade80", icon:"⛳" },
    { n:"03", title:"Win & Give",    body:"5 numbers drawn monthly. Match 3, 4, or 5 to win — charity gets guaranteed support.", color:"#facc15", icon:"🏆" },
  ];

  const tiers = [
    { match:"5 Numbers", pct:"40%", label:"Jackpot",      rolls:true,  c1:"rgba(250,204,21,.14)", border:"rgba(250,204,21,.35)", tc:"#fde047", glow:"rgba(250,204,21,.4)" },
    { match:"4 Numbers", pct:"35%", label:"2nd Prize",    rolls:false, c1:"rgba(167,139,250,.14)", border:"rgba(167,139,250,.35)", tc:"#c4b5fd", glow:"rgba(167,139,250,.35)" },
    { match:"3 Numbers", pct:"25%", label:"3rd Prize",    rolls:false, c1:"rgba(74,222,128,.14)",  border:"rgba(74,222,128,.35)",  tc:"#86efac", glow:"rgba(74,222,128,.35)" },
  ];

  const testimonials = [
    { q:"Won ₹4,200 in March. My charity got a cut too — that made it feel incredible.", n:"Rohan M.", loc:"Mumbai", avatar:"R" },
    { q:"Finally a golf platform that doesn't look like it was built in 2005. Obsessed.", n:"Priya S.", loc:"Bengaluru", avatar:"P" },
    { q:"Set up in 3 minutes. First draw I entered, I matched 3 numbers. Wild.", n:"Aditya K.", loc:"Delhi", avatar:"A" },
  ];

  return (
    <>
      <style>{`
        @keyframes hero-word { from{opacity:0;transform:translateY(40px) skewY(3deg);} to{opacity:1;transform:translateY(0) skewY(0);} }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(120px) rotate(0deg);} to{transform:rotate(360deg) translateX(120px) rotate(-360deg);} }
        @keyframes orbit2 { from{transform:rotate(180deg) translateX(80px) rotate(-180deg);} to{transform:rotate(540deg) translateX(80px) rotate(-540deg);} }
        @keyframes score-appear { 0%{opacity:0;transform:scale(0.5) translateY(20px);} 70%{transform:scale(1.08) translateY(0);} 100%{opacity:1;transform:scale(1);} }
        @keyframes bg-pan { 0%{background-position:0% 50%;} 100%{background-position:100% 50%;} }
        @keyframes float-card { 0%,100%{transform:translateY(0) rotate(-1deg);} 50%{transform:translateY(-14px) rotate(1deg);} }
        @keyframes float-card2 { 0%,100%{transform:translateY(-8px) rotate(1.5deg);} 50%{transform:translateY(6px) rotate(-0.5deg);} }
        @keyframes float-card3 { 0%,100%{transform:translateY(4px) rotate(0.5deg);} 50%{transform:translateY(-10px) rotate(-1.5deg);} }
        @keyframes number-pop { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes step-progress { from{width:0;opacity:0;} to{width:100%;opacity:1;} }

        /* Golf ball flying arc animation */
        @keyframes golf-arc {
          0%   { transform: translateX(0vw) translateY(0px); opacity: 0; }
          5%   { opacity: 1; }
          25%  { transform: translateX(25vw) translateY(-120px); }
          50%  { transform: translateX(55vw) translateY(-60px); }
          75%  { transform: translateX(80vw) translateY(-140px); }
          92%  { opacity: 1; }
          100% { transform: translateX(105vw) translateY(20px); opacity: 0; }
        }
        @keyframes golf-arc-2 {
          0%   { transform: translateX(0vw) translateY(0px); opacity: 0; }
          8%   { opacity: 0.7; }
          30%  { transform: translateX(30vw) translateY(-80px); }
          60%  { transform: translateX(60vw) translateY(-30px); }
          88%  { opacity: 0.5; }
          100% { transform: translateX(105vw) translateY(40px); opacity: 0; }
        }
        @keyframes ball-trail-fade {
          0%, 100% { opacity: 0; width: 0; }
          20%, 80% { opacity: 1; width: 40px; }
        }
        @keyframes float-tee {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50%       { transform: translateY(-12px) rotate(5deg); opacity: 1; }
        }

        .golf-ball-flight {
          animation: golf-arc 14s cubic-bezier(.4,0,.2,1) infinite;
          animation-delay: 1s;
        }
        .golf-ball-flight-2 {
          animation: golf-arc-2 20s cubic-bezier(.4,0,.2,1) infinite;
          animation-delay: 7s;
        }
        .ball-trail {
          position: absolute;
          top: 50%;
          right: 100%;
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4));
          transform: translateY(-50%);
          animation: ball-trail-fade 0.8s ease-in-out infinite;
          width: 45px;
          margin-right: 2px;
        }
        .ball-trail-2 {
          position: absolute;
          top: 50%;
          right: 100%;
          height: 1.5px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25));
          transform: translateY(-50%);
          width: 30px;
          opacity: 0.6;
          margin-right: 2px;
        }

        .h-word { animation: hero-word .9s cubic-bezier(.16,1,.3,1) both; }
        .hw1{animation-delay:.05s} .hw2{animation-delay:.16s} .hw3{animation-delay:.26s} .hw4{animation-delay:.36s} .hw5{animation-delay:.46s} .hw6{animation-delay:.56s}

        .hero-mouse-glow {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74,222,128,.06), transparent 70%);
          pointer-events: none;
          z-index: 0;
          transform: translate(-50%, -50%);
          transition: left .8s ease, top .8s ease;
          filter: blur(40px);
        }

        .score-card-float {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .score-card-float::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
          pointer-events: none;
        }

        .step-card {
          position: relative;
          overflow: hidden;
          transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s, border-color .4s, background .4s;
        }
        .step-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.04), transparent);
          opacity: 0;
          transition: opacity .3s;
          pointer-events: none;
        }
        .step-card:hover::after { opacity: 1; }

        .tier-card {
          position: relative;
          overflow: hidden;
          transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
          cursor: default;
        }
        .tier-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,.04), transparent 60%);
          opacity: 0;
          transition: opacity .4s;
          pointer-events: none;
        }
        .tier-card:hover { transform: translateY(-10px) scale(1.02); }
        .tier-card:hover::before { opacity: 1; }

        .testi-card {
          position: relative;
          overflow: hidden;
          transition: transform .3s cubic-bezier(.16,1,.3,1), border-color .3s, box-shadow .3s;
        }
        .testi-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4ade80, #a78bfa);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .35s cubic-bezier(.16,1,.3,1);
        }
        .testi-card:hover { transform: translateY(-5px); border-color: rgba(74,222,128,.2) !important; box-shadow: 0 20px 50px rgba(0,0,0,.4); }
        .testi-card:hover::after { transform: scaleX(1); }

        .stat-card {
          position: relative;
          overflow: hidden;
          transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s;
        }
        .stat-card:hover { transform: translateY(-6px); }
        .stat-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent);
          animation: shimmer-pass 3s ease infinite;
        }

        .cta-primary {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: #050a0e;
          font-weight: 800;
          padding: .95rem 2.25rem;
          border-radius: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-size: .95rem;
          transition: transform .22s, box-shadow .28s;
        }
        .cta-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
          transform: translateX(-100%);
        }
        .cta-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 50px rgba(74,222,128,.55); }
        .cta-primary:hover::before { animation: shimmer-pass .6s ease forwards; }

        .cta-secondary {
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          color: #94a3b8;
          padding: .95rem 2.25rem;
          border-radius: 12px;
          text-decoration: none;
          font-size: .95rem;
          font-weight: 500;
          transition: all .25s;
          display: inline-flex;
          align-items: center;
          gap: .4rem;
        }
        .cta-secondary:hover { background: rgba(255,255,255,.09); color: #f1f5f9; border-color: rgba(255,255,255,.18); transform: translateY(-2px); }

        .charity-card-wrap {
          padding: 1.5px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(250,204,21,.5), rgba(74,222,128,.3), rgba(167,139,250,.35));
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
          transition: box-shadow .4s;
        }
        .charity-card-wrap:hover { box-shadow: 0 30px 80px rgba(0,0,0,.5); }

        .number-glow {
          animation: number-pop 3s ease-in-out infinite;
        }

        .final-cta-section {
          position: relative;
          overflow: hidden;
        }
        .final-cta-section::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(74,222,128,.04) 60deg, transparent 120deg);
          animation: spin-slow 20s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Mouse-tracking glow */}
      <div className="hero-mouse-glow" style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }} />

      {/* Golf ball animation - replaces the star field */}
      <GolfBallAnimation />

      <div style={{ minHeight:"100vh", background:"#080c14", color:"#f1f5f9", overflowX:"hidden", fontFamily:"var(--font-dm-sans,DM Sans,sans-serif)" }}>

        {/* Animated background orbs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
          <div className="float-orb" style={{ "--d":"18s","--delay":"-5s", position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,.08),transparent)", filter:"blur(100px)", top:-150, left:"15%" } as React.CSSProperties} />
          <div className="float-orb" style={{ "--d":"22s","--delay":"-12s", position:"absolute", width:550, height:550, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,.07),transparent)", filter:"blur(100px)", top:400, right:-80 } as React.CSSProperties} />
          <div className="float-orb" style={{ "--d":"16s","--delay":"-8s", position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.055),transparent)", filter:"blur(80px)", bottom:200, left:-50 } as React.CSSProperties} />
        </div>

        {/* ── HERO ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"5.5rem 1.5rem 4rem", textAlign:"center" }} ref={heroRef}>
          {/* Radial hero glow */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,222,128,.07), transparent)", pointerEvents:"none" }} />
          {/* Bg golf image tint */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1400&q=60')", backgroundSize:"cover", backgroundPosition:"center 30%", opacity:.04, borderRadius:"2rem", pointerEvents:"none" }} />

          {/* Badge */}
          <div className="h-word hw1" style={{ display:"inline-flex", alignItems:"center", gap:".5rem", padding:".4rem 1.1rem", borderRadius:9999, background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.22)", color:"#4ade80", fontSize:".72rem", fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:"1.75rem" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#4ade80", display:"inline-block", boxShadow:"0 0 10px #4ade80", animation:"heartbeat 2s ease infinite" }} />
            Play Golf · Win Prizes · Fund Charities
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(2.8rem,6.5vw,5rem)", fontWeight:900, lineHeight:1.04, letterSpacing:"-.025em", marginBottom:"1.5rem" }}>
            <span className="h-word hw2" style={{ display:"inline-block" }}>Every</span>{" "}
            <span className="h-word hw3" style={{ display:"inline-block" }}>Round</span>{" "}
            <span className="h-word hw4" style={{ display:"inline-block" }}>You</span>{" "}
            <span className="h-word hw5" style={{ display:"inline-block" }}>Play</span>
            <br />
            <span className="h-word hw6 animated-gradient-text" style={{ display:"inline-block" }}>Makes a Difference</span>
          </h1>

          <p className="h-word hw6" style={{ fontSize:"1.1rem", color:"#64748b", maxWidth:560, margin:"0 auto 2.5rem", lineHeight:1.75, animationDelay:".62s" }}>
            Submit your golf scores, enter monthly prize draws, and automatically support a charity you care about — all in one platform.
          </p>

          {/* CTAs */}
          <div className="h-word" style={{ display:"flex", gap:".85rem", justifyContent:"center", flexWrap:"wrap", marginBottom:"3.5rem", animationDelay:".7s" }}>
            <a href={session?"/dashboard":"/auth"} className="cta-primary">
              {session?"Go to Dashboard":"Start Playing — Free"} →
            </a>
            <a href="/charities" className="cta-secondary">
              View Charities 💚
            </a>
          </div>

          {/* Floating score cards */}
          <div className="h-word" style={{ display:"flex", justifyContent:"center", gap:"1.25rem", flexWrap:"wrap", animationDelay:".78s" }}>
            {[
              { s:42, l:"Best Score",  c:"#facc15", a:"float-card",  deg:"-2deg" },
              { s:38, l:"This Month",  c:"#4ade80", a:"float-card2", deg:"1deg" },
              { s:31, l:"Last Round",  c:"#a78bfa", a:"float-card3", deg:"2deg" },
            ].map((card, i) => (
              <div
                key={i}
                className="score-card-float"
                style={{
                  background:"rgba(255,255,255,.04)",
                  border:"1px solid rgba(255,255,255,.1)",
                  borderRadius:18,
                  padding:"1.1rem 1.6rem",
                  textAlign:"center",
                  minWidth:110,
                  animation:`${card.a} ${5 + i}s ease-in-out infinite`,
                  animationDelay:`${-i * 2}s`,
                  boxShadow:`0 10px 40px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)`,
                }}
              >
                <div className="number-glow" style={{ fontSize:"2rem", fontWeight:900, fontFamily:"var(--font-playfair,serif)", color:card.c, lineHeight:1, animationDelay:`${i * .6}s` }}>{card.s}</div>
                <div style={{ fontSize:".7rem", color:"#475569", marginTop:5, fontWeight:500 }}>{card.l}</div>
                <div style={{ marginTop:8, height:2, borderRadius:9999, background:`${card.c}33` }}>
                  <div style={{ height:"100%", width:`${65 + i * 15}%`, borderRadius:9999, background:card.c, boxShadow:`0 0 8px ${card.c}` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop:"3rem", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:".62rem", letterSpacing:".14em", textTransform:"uppercase", color:"#2d3748", fontWeight:600 }}>Scroll to explore</span>
            <div style={{ width:28, height:44, border:"1.5px solid rgba(255,255,255,.1)", borderRadius:14, display:"flex", justifyContent:"center", paddingTop:8 }}>
              <div className="scroll-dot" style={{ width:4, height:10, borderRadius:9999, background:"rgba(74,222,128,.6)" }} />
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div style={{ position:"relative", zIndex:1, overflow:"hidden", borderTop:"1px solid rgba(255,255,255,.04)", borderBottom:"1px solid rgba(255,255,255,.04)", background:"rgba(74,222,128,.02)", padding:".65rem 0" }}>
          <div className="marquee-track" style={{ display:"flex", width:"max-content", whiteSpace:"nowrap" }}>
            {Array(10).fill("⛳ Play · 🏆 Win · 💚 Give · 🎰 Monthly Draw · Golf Charity · ").map((t,i)=>(
              <span key={i} style={{ fontSize:".72rem", fontWeight:600, letterSpacing:".12em", color:"rgba(74,222,128,.35)", padding:"0 2rem" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"4rem 1.5rem 2rem" }} ref={statsRef}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
            {[
              { v:`₹${(pool/1000).toFixed(1)}K`,    l:"Prize Pool Distributed", icon:"🏆", accent:"#facc15", border:"rgba(250,204,21,.35)", bg:"rgba(250,204,21,.04)" },
              { v:`₹${(donated/1000).toFixed(1)}K`, l:"Donated to Charities",   icon:"💚", accent:"#4ade80", border:"rgba(74,222,128,.35)",  bg:"rgba(74,222,128,.04)" },
              { v:`${members.toLocaleString()}+`,    l:"Active Members",          icon:"⛳", accent:"#a78bfa", border:"rgba(167,139,250,.35)", bg:"rgba(167,139,250,.04)" },
            ].map((stat, i) => (
              <div key={stat.l} className={`stat-card fade-up d${i+1} ${statsVisible?"in":""}`} style={{ background:stat.bg, border:`1px solid ${stat.border}`, borderRadius:18, padding:"2rem 1.5rem", textAlign:"center", position:"relative", overflow:"hidden" }}>
                <div className="stat-shimmer" />
                <div style={{ fontSize:"2rem", marginBottom:".6rem" }}>{stat.icon}</div>
                <div style={{ fontSize:"2.5rem", fontWeight:900, fontFamily:"var(--font-playfair,serif)", color:stat.accent, lineHeight:1.05, marginBottom:".4rem", textShadow:`0 0 30px ${stat.accent}55` }}>{stat.v}</div>
                <div style={{ fontSize:".78rem", color:"#475569", fontWeight:500 }}>{stat.l}</div>
                {/* Bottom glow line */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${stat.accent}88, transparent)` }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3.5rem 1.5rem" }} ref={stepsRef}>
          <div className={`fade-up ${stepsIn?"in":""}`} style={{ textAlign:"center", marginBottom:"3rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#4ade80", marginBottom:".6rem" }}>The Process</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", fontWeight:900, letterSpacing:"-.02em" }}>How It Works</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1.25rem" }}>
            {steps.map((item, i) => (
              <div
                key={i}
                className={`step-card fade-up d${i+1} ${stepsIn?"in":""}`}
                style={{
                  padding:"2rem",
                  borderRadius:18,
                  background: activeStep===i ? `${item.color}0d` : "rgba(255,255,255,.03)",
                  border:`1.5px solid ${activeStep===i ? item.color+"55" : "rgba(255,255,255,.07)"}`,
                  transform: activeStep===i ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: activeStep===i ? `0 20px 60px rgba(0,0,0,.35), 0 0 0 1px ${item.color}22` : "none",
                }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
                    <div style={{ fontSize:"1.5rem" }}>{item.icon}</div>
                    <div style={{ width:34, height:34, borderRadius:10, background:`${item.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".82rem", fontWeight:900, color:item.color, fontFamily:"var(--font-playfair,serif)", border:`1px solid ${item.color}33` }}>
                      {item.n}
                    </div>
                  </div>
                  {activeStep===i && (
                    <div style={{ display:"flex", gap:4 }}>
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width:j===0?8:5, height:j===0?8:5, borderRadius:"50%", background: j===0 ? item.color : `${item.color}55`, boxShadow: j===0 ? `0 0 10px ${item.color}` : "none", animation:"heartbeat 1.5s ease infinite", animationDelay:`${j * .2}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize:"1.15rem", fontWeight:800, color:activeStep===i ? item.color : "#f1f5f9", marginBottom:".65rem", letterSpacing:"-.01em" }}>{item.title}</h3>
                <p style={{ fontSize:".84rem", color:"#64748b", lineHeight:1.7 }}>{item.body}</p>
                {/* Progress bar */}
                <div style={{ marginTop:"1.5rem", height:3, borderRadius:9999, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                  <div style={{
                    height:"100%",
                    borderRadius:9999,
                    background:`linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                    width: activeStep===i ? "100%" : "0%",
                    transition:"width 3.2s cubic-bezier(.16,1,.3,1)",
                    boxShadow: activeStep===i ? `0 0 10px ${item.color}` : "none",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Second marquee (reversed) */}
        <div style={{ position:"relative", zIndex:1, overflow:"hidden", background:"rgba(167,139,250,.015)", padding:".55rem 0", marginBottom:"1rem" }}>
          <div className="marquee-track-reverse" style={{ display:"flex", width:"max-content", whiteSpace:"nowrap" }}>
            {Array(10).fill("3-Match · 4-Match · 5-Match JACKPOT · Monthly Draw · Your Scores Enter Automatically · ").map((t,i)=>(
              <span key={i} style={{ fontSize:".7rem", fontWeight:600, letterSpacing:".1em", color:"rgba(167,139,250,.3)", padding:"0 2rem" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── PRIZE TIERS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={tiersRef}>
          <div className={`fade-up ${tiersIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#a78bfa", marginBottom:".6rem" }}>Rewards</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", fontWeight:900, letterSpacing:"-.02em" }}>Prize Structure</h2>
            <p style={{ color:"#475569", marginTop:".5rem", fontSize:".88rem" }}>Monthly pool split across three winner tiers</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1.25rem" }}>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={`tier-card fade-up d${i+1} ${tiersIn?"in":""}`}
                style={{
                  padding:"2rem",
                  borderRadius:20,
                  background:tier.c1,
                  border:`1.5px solid ${tier.border}`,
                }}
              >
                {/* Rotating decorative ring */}
                <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", border:`1px solid ${tier.tc}22`, animation:"spin-slow 12s linear infinite", opacity:.5 }} />
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
                  <span style={{ background:`${tier.border.replace('.35','.1')}`, border:`1px solid ${tier.border}`, color:tier.tc, fontSize:".72rem", fontWeight:700, padding:".25rem .75rem", borderRadius:9999, letterSpacing:".06em" }}>{tier.label}</span>
                  {tier.rolls && <span style={{ fontSize:".7rem", color:tier.tc, opacity:.7, fontWeight:600 }}>🔄 Rolls Over</span>}
                </div>
                <div style={{ fontSize:"4rem", fontWeight:900, fontFamily:"var(--font-playfair,serif)", lineHeight:1, marginBottom:".5rem", color:tier.tc, textShadow:`0 0 40px ${tier.glow}` }}>{tier.pct}</div>
                <div style={{ fontSize:".8rem", color:"#475569", marginBottom:"1.5rem" }}>of monthly prize pool</div>
                <div style={{ paddingTop:"1.25rem", borderTop:`1px solid ${tier.border.replace('.35','.15')}`, display:"flex", alignItems:"center", gap:".6rem" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:tier.tc, boxShadow:`0 0 12px ${tier.glow}` }} />
                  <span style={{ fontWeight:700, color:"#f1f5f9", fontSize:".9rem" }}>{tier.match}</span>
                  <span style={{ color:"#475569", fontSize:".83rem" }}>to win</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED CHARITY ── */}
        {featuredCharity && (
          <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={charityRef}>
            <div className={`fade-up ${charityIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2rem" }}>
              <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#facc15", marginBottom:".6rem" }}>Impact</p>
              <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", fontWeight:900 }}>Featured Charity</h2>
            </div>
            <div className={`charity-card-wrap fade-up d1 ${charityIn?"in":""}`}>
              <div style={{ borderRadius:20, background:"#0b1220", padding:"2rem 2.5rem", display:"flex", gap:"2.5rem", alignItems:"center", flexWrap:"wrap", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.06),transparent)", filter:"blur(60px)", pointerEvents:"none" }} />
                {featuredCharity.image_url ? (
                  <img src={featuredCharity.image_url} alt={featuredCharity.name} style={{ width:190, height:190, objectFit:"cover", borderRadius:18, flexShrink:0, boxShadow:"0 20px 60px rgba(0,0,0,.5)" }} />
                ) : (
                  <div style={{ width:190, height:190, borderRadius:18, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"3.5rem", background:"rgba(250,204,21,.07)", border:"1px solid rgba(250,204,21,.15)" }}>💚</div>
                )}
                <div style={{ flex:1, minWidth:200 }}>
                  <span style={{ background:"rgba(250,204,21,.12)", border:"1px solid rgba(250,204,21,.3)", color:"#fde047", fontSize:".72rem", fontWeight:700, padding:".22rem .8rem", borderRadius:9999, display:"inline-block", marginBottom:".85rem", letterSpacing:".06em" }}>⭐ SPOTLIGHT CHARITY</span>
                  <h3 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, marginBottom:".75rem", letterSpacing:"-.01em" }}>{featuredCharity.name}</h3>
                  <p style={{ color:"#64748b", lineHeight:1.75, marginBottom:"1.5rem", fontSize:".9rem" }}>{featuredCharity.description}</p>
                  <div style={{ display:"flex", gap:".85rem", flexWrap:"wrap" }}>
                    <a href={`/charities/${featuredCharity.id}`} style={{ background:"rgba(250,204,21,.14)", border:"1px solid rgba(250,204,21,.3)", color:"#fde047", fontSize:".86rem", fontWeight:700, padding:".65rem 1.35rem", borderRadius:10, textDecoration:"none", transition:"all .25s" }} onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(250,204,21,.24)";(e.currentTarget as HTMLAnchorElement).style.transform="translateY(-2px)";}} onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.background="rgba(250,204,21,.14)";(e.currentTarget as HTMLAnchorElement).style.transform="none";}}>Learn More →</a>
                    <a href="/charities" style={{ color:"#64748b", fontSize:".86rem", padding:".65rem 1.35rem", textDecoration:"none", transition:"color .2s", display:"flex", alignItems:"center", gap:".3rem" }} onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="#64748b")}>All Charities →</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem" }} ref={testiRef}>
          <div className={`fade-up ${testiIn?"in":""}`} style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <p style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#4ade80", marginBottom:".6rem" }}>Community</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(1.8rem,3.5vw,2.6rem)", fontWeight:900, letterSpacing:"-.02em" }}>What Members Say</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"1.25rem" }}>
            {testimonials.map((t, i) => (
              <div key={i} className={`testi-card fade-up d${i+1} ${testiIn?"in":""}`} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:18, padding:"1.75rem", position:"relative", overflow:"hidden" }}>
                <div style={{ fontSize:"4rem", lineHeight:1, color:"rgba(74,222,128,.15)", position:"absolute", top:"1rem", right:"1.25rem", fontFamily:"serif", fontWeight:900 }}>"</div>
                <div style={{ fontSize:"2rem", marginBottom:"1rem", position:"relative" }}>"</div>
                <p style={{ color:"#94a3b8", fontSize:".875rem", lineHeight:1.75, marginBottom:"1.5rem", position:"relative" }}>{t.q}</p>
                <div style={{ display:"flex", alignItems:"center", gap:".85rem", paddingTop:"1.25rem", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,#4ade80,#a78bfa)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:".88rem", color:"#080c14", flexShrink:0, boxShadow:"0 4px 16px rgba(74,222,128,.3)" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize:".88rem", fontWeight:700 }}>{t.n}</div>
                    <div style={{ fontSize:".72rem", color:"#374151", fontWeight:500 }}>{t.loc}</div>
                  </div>
                  <div style={{ marginLeft:"auto", fontSize:"1rem" }}>⭐</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"3rem 1.5rem 5rem" }}>
          <div className="final-cta-section" style={{ padding:"4rem 2.5rem", borderRadius:24, background:"linear-gradient(135deg,rgba(74,222,128,.07),rgba(167,139,250,.06))", border:"1.5px solid rgba(74,222,128,.15)", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% -10%, rgba(74,222,128,.1), transparent)", pointerEvents:"none" }} />
            {[180,130,90].map((size, i) => (
              <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:size, height:size, borderRadius:"50%", border:`1px solid rgba(74,222,128,${.06 - i*.015})`, transform:"translate(-50%,-50%)", animation:`spin-slow ${20 + i*8}s linear infinite${i%2?" reverse":""}`, pointerEvents:"none" }} />
            ))}
            <p style={{ fontSize:".72rem", fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"#4ade80", marginBottom:".85rem", position:"relative" }}>Join the Community</p>
            <h2 style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, marginBottom:"1rem", position:"relative", letterSpacing:"-.02em" }}>Ready to Play?</h2>
            <p style={{ color:"#64748b", fontSize:"1rem", marginBottom:"2.5rem", maxWidth:480, margin:"0 auto 2.5rem", lineHeight:1.75 }}>
              Join golfers across the country making an impact with every round they play.
            </p>
            <div style={{ position:"relative", display:"flex", gap:".85rem", justifyContent:"center", flexWrap:"wrap" }}>
              <a href={session?"/dashboard":"/auth"} className="cta-primary">
                {session?"Go to Dashboard":"Join Now — It's Free"} →
              </a>
              <a href="/draw" className="cta-secondary">🎰 View Current Draw</a>
            </div>
            <p style={{ fontSize:".72rem", color:"#2d3748", marginTop:"1.25rem", position:"relative" }}>No commitment · Cancel anytime · 10% goes to charity</p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,.05)", padding:"1.75rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".6rem", color:"#2d3748", fontSize:".8rem" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(74,222,128,.15)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".68rem", fontWeight:900 }}>GC</div>
            © 2026 Golf Charity. All rights reserved.
          </div>
          <div style={{ display:"flex", gap:"1.75rem", alignItems:"center" }}>
            {[["Charities","/charities"],["Draw","/draw"],["Dashboard","/dashboard"],["Sign In","/auth"]].map(([l,h])=>(
              <a key={l} href={h} style={{ color:"#2d3748", fontSize:".8rem", textDecoration:"none", transition:"color .2s" }} onMouseEnter={e=>(e.currentTarget.style.color="#f1f5f9")} onMouseLeave={e=>(e.currentTarget.style.color="#2d3748")}>{l}</a>
            ))}
            <a href="/admin-login" style={{ color:"#1f2937", fontSize:".75rem", textDecoration:"none", transition:"color .2s", display:"flex", alignItems:"center", gap:".3rem" }} onMouseEnter={e=>(e.currentTarget.style.color="#f87171")} onMouseLeave={e=>(e.currentTarget.style.color="#1f2937")}>🔐</a>
          </div>
        </footer>
      </div>
    </>
  );
}
