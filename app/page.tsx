"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
};

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

export default function HomePage() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [session, setSession] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const poolCount = useCountUp(248500, 2200, statsVisible);
  const donatedCount = useCountUp(84200, 2000, statsVisible);
  const membersCount = useCountUp(1340, 1800, statsVisible);

  useEffect(() => {
    checkSession();
    fetchFeaturedCharity();
    const interval = setInterval(() => setActiveStep(s => (s + 1) % 3), 3000);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => { clearInterval(interval); observer.disconnect(); };
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(!!session);
  };

  const fetchFeaturedCharity = async () => {
    const { data } = await supabase
      .from("charities")
      .select("id, name, description, image_url")
      .eq("is_featured", true)
      .limit(1)
      .single();
    if (data) setFeaturedCharity(data);
  };

  const steps = [
    { step: "01", title: "Subscribe", description: "Choose monthly or yearly. A portion of every subscription goes directly to your chosen charity.", icon: "◈", color: "#a78bfa" },
    { step: "02", title: "Submit Scores", description: "After each round, enter your Stableford score (1–45). Your 5 most recent scores enter you into the draw.", icon: "◎", color: "#4ade80" },
    { step: "03", title: "Win & Give", description: "5 numbers drawn monthly. Match 3, 4, or 5 to win prizes — while your charity receives guaranteed support.", icon: "◉", color: "#facc15" },
  ];

  const tiers = [
    { match: "5 Numbers", share: "40%", label: "Jackpot", rolls: true, gradient: "from-yellow-500/20 to-amber-500/10", border: "border-yellow-500/40", badge: "bg-yellow-500/20 text-yellow-300", glow: "shadow-yellow-500/20" },
    { match: "4 Numbers", share: "35%", label: "Second Prize", rolls: false, gradient: "from-purple-500/20 to-violet-500/10", border: "border-purple-500/40", badge: "bg-purple-500/20 text-purple-300", glow: "shadow-purple-500/20" },
    { match: "3 Numbers", share: "25%", label: "Third Prize", rolls: false, gradient: "from-green-500/20 to-emerald-500/10", border: "border-green-500/40", badge: "bg-green-500/20 text-green-300", glow: "shadow-green-500/20" },
  ];

  const { ref: heroRef, inView: heroIn } = useInView(0.1);
  const { ref: stepsRef, inView: stepsIn } = useInView(0.1);
  const { ref: tiersRef, inView: tiersIn } = useInView(0.1);
  const { ref: charityRef, inView: charityIn } = useInView(0.1);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#080c14", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .hero-glow {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        .grain {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
        }

        .fade-up {
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1);
        }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.d1 { transition-delay: 0.1s; }
        .fade-up.d2 { transition-delay: 0.2s; }
        .fade-up.d3 { transition-delay: 0.3s; }
        .fade-up.d4 { transition-delay: 0.4s; }
        .fade-up.d5 { transition-delay: 0.5s; }

        .step-card {
          transition: all 0.4s cubic-bezier(.16,1,.3,1);
          cursor: default;
        }
        .step-card.active-step {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        .tier-card {
          transition: all 0.35s cubic-bezier(.16,1,.3,1);
        }
        .tier-card:hover {
          transform: translateY(-8px);
        }

        .cta-btn {
          position: relative; overflow: hidden;
          transition: all 0.3s ease;
        }
        .cta-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .cta-btn:hover::before { transform: translateX(100%); }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(74,222,128,0.35); }

        .nav-link { position: relative; }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px;
          background: #4ade80; transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .stat-card {
          transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-4px); }

        .charity-card {
          transition: all 0.4s cubic-bezier(.16,1,.3,1);
        }
        .charity-card:hover { transform: scale(1.01); }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes scroll-indicator {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(6px); opacity: 0.4; }
        }

        .float { animation: float 6s ease-in-out infinite; }
        .pulse-ring::before {
          content: '';
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid #4ade80; opacity: 0;
          animation: pulse-ring 2s ease-out infinite;
        }
        .scroll-dot { animation: scroll-indicator 1.5s ease-in-out infinite; }

        .number-display {
          font-family: 'Playfair Display', serif;
          background: linear-gradient(135deg, #4ade80, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="grain" />

      {/* Ambient glows */}
      <div className="hero-glow" style={{ background: "radial-gradient(circle, rgba(74,222,128,0.12), transparent)", top: "-100px", left: "30%" }} />
      <div className="hero-glow" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.1), transparent)", top: "200px", right: "-100px" }} />

      {/* NAVBAR */}
      <nav className="relative z-50 flex justify-between items-center px-8 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="relative pulse-ring w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "#080c14" }}>G</div>
          <span className="font-semibold text-lg tracking-tight">Golf Charity</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="/charities" className="nav-link text-sm text-gray-400 hover:text-white transition-colors">Charities</a>
          <a href={session ? "/dashboard" : "/auth"} className="cta-btn bg-green-500 hover:bg-green-400 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "#080c14" }}>
            {session ? "Dashboard →" : "Get Started →"}
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center" ref={heroRef}>
        <div className={`fade-up ${heroIn ? "visible" : ""}`}>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-medium" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ animation: "pulse-ring 1.5s infinite" }} />
            Play Golf · Win Prizes · Fund Charities
          </div>
        </div>

        <h1 className={`fade-up d1 ${heroIn ? "visible" : ""} text-6xl md:text-7xl font-bold leading-[1.05] mb-6 tracking-tight`} style={{ fontFamily: "'Playfair Display', serif" }}>
          Every Round You Play<br />
          <span style={{ background: "linear-gradient(135deg, #4ade80 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Makes a Difference
          </span>
        </h1>

        <p className={`fade-up d2 ${heroIn ? "visible" : ""} text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed`}>
          Submit your golf scores, enter monthly prize draws, and automatically support a charity you care about — all in one platform.
        </p>

        <div className={`fade-up d3 ${heroIn ? "visible" : ""} flex flex-col sm:flex-row gap-4 justify-center mb-16`}>
          <a href={session ? "/dashboard" : "/auth"} className="cta-btn inline-flex items-center justify-center gap-2 bg-green-500 px-8 py-4 rounded-xl text-base font-semibold" style={{ color: "#080c14" }}>
            {session ? "Go to Dashboard" : "Start Playing — Free"}
            <span>→</span>
          </a>
          <a href="/charities" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8" }}>
            View Charities
          </a>
        </div>

        {/* Floating score cards */}
        <div className={`fade-up d4 ${heroIn ? "visible" : ""} relative flex justify-center items-center gap-4 flex-wrap`}>
          {[
            { score: 38, label: "This Month", delay: "0s" },
            { score: 42, label: "Best Score", delay: "1s" },
            { score: 31, label: "Last Round", delay: "2s" },
          ].map((card) => (
            <div key={card.label} className="float px-6 py-4 rounded-2xl text-center" style={{ animationDelay: card.delay, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
              <div className="text-3xl font-bold number-display">{card.score}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex flex-col items-center gap-2 opacity-30">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
          <div className="scroll-dot w-1 h-4 rounded-full bg-gray-500" />
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16" ref={statsRef}>
        <div className="grid grid-cols-3 gap-6">
          {[
            { value: `₹${(poolCount / 1000).toFixed(1)}K`, label: "Prize Pool Distributed", icon: "🏆" },
            { value: `₹${(donatedCount / 1000).toFixed(1)}K`, label: "Donated to Charities", icon: "💚" },
            { value: `${membersCount.toLocaleString()}+`, label: "Active Members", icon: "⛳" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card text-center p-8 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold mb-2 number-display">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" ref={stepsRef}>
        <div className={`fade-up ${stepsIn ? "visible" : ""} text-center mb-16`}>
          <p className="text-xs uppercase tracking-widest text-green-400 mb-3 font-medium">The Process</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>How It Works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className={`fade-up d${i + 1} ${stepsIn ? "visible" : ""} step-card p-8 rounded-2xl ${activeStep === i ? "active-step" : ""}`}
              style={{
                background: activeStep === i ? `rgba(${item.color === "#a78bfa" ? "167,139,250" : item.color === "#4ade80" ? "74,222,128" : "250,204,21"},0.06)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeStep === i ? item.color + "40" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl">{item.icon}</span>
                <span className="text-xs font-mono opacity-30">{item.step}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: activeStep === i ? item.color : "white" }}>{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>

              {/* Progress bar */}
              <div className="mt-6 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: activeStep === i ? "100%" : "0%", background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRIZE STRUCTURE */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" ref={tiersRef}>
        <div className={`fade-up ${tiersIn ? "visible" : ""} text-center mb-16`}>
          <p className="text-xs uppercase tracking-widest text-purple-400 mb-3 font-medium">Rewards</p>
          <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Prize Structure</h2>
          <p className="text-gray-500 mt-3">Monthly prize pool split across three winner tiers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div key={tier.match} className={`fade-up d${i + 1} ${tiersIn ? "visible" : ""} tier-card p-8 rounded-2xl bg-gradient-to-br ${tier.gradient} border ${tier.border} shadow-xl ${tier.glow}`}>
              <div className="flex justify-between items-start mb-6">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${tier.badge}`}>{tier.label}</span>
                {tier.rolls && <span className="text-xs text-yellow-400/60 font-medium">Jackpot Rolls Over →</span>}
              </div>
              <div className="text-6xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{tier.share}</div>
              <div className="text-gray-400 text-sm mb-4">of monthly prize pool</div>
              <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-white font-semibold">{tier.match}</span>
                <span className="text-gray-500 text-sm"> matched to win</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CHARITY */}
      {featuredCharity && (
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20" ref={charityRef}>
          <div className={`fade-up ${charityIn ? "visible" : ""} text-center mb-16`}>
            <p className="text-xs uppercase tracking-widest text-yellow-400 mb-3 font-medium">Impact</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Featured Charity</h2>
          </div>

          <div className={`fade-up d1 ${charityIn ? "visible" : ""} charity-card p-1 rounded-3xl`} style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.3), rgba(74,222,128,0.1), rgba(167,139,250,0.2))" }}>
            <div className="p-8 md:p-12 rounded-3xl flex flex-col md:flex-row gap-10 items-center" style={{ background: "#0d1422" }}>
              {featuredCharity.image_url ? (
                <img src={featuredCharity.image_url} alt={featuredCharity.name} className="w-full md:w-56 h-56 object-cover rounded-2xl flex-shrink-0" />
              ) : (
                <div className="w-full md:w-56 h-56 rounded-2xl flex-shrink-0 flex items-center justify-center text-6xl" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.15)" }}>💚</div>
              )}
              <div className="flex-1">
                <span className="text-xs px-3 py-1 rounded-full font-medium mb-4 inline-block" style={{ background: "rgba(250,204,21,0.15)", color: "#fde047" }}>⭐ Spotlight Charity</span>
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{featuredCharity.name}</h3>
                <p className="text-gray-400 leading-relaxed mb-6 text-lg">{featuredCharity.description}</p>
                <div className="flex gap-4">
                  <a href={`/charities/${featuredCharity.id}`} className="cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(250,204,21,0.15)", color: "#fde047", border: "1px solid rgba(250,204,21,0.3)" }}>
                    Learn More →
                  </a>
                  <a href="/charities" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    All Charities
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="relative p-16 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.08), rgba(167,139,250,0.08))", border: "1px solid rgba(74,222,128,0.15)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
          <p className="relative text-xs uppercase tracking-widest text-green-400 mb-4 font-medium">Join the Community</p>
          <h2 className="relative text-5xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Play?</h2>
          <p className="relative text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join golfers across the country making an impact with every round they play.
          </p>
          <a href={session ? "/dashboard" : "/auth"} className="cta-btn relative inline-flex items-center gap-3 bg-green-500 px-10 py-4 rounded-xl text-base font-bold" style={{ color: "#080c14" }}>
            {session ? "Go to Dashboard" : "Join Now — It's Free to Start"}
            <span>→</span>
          </a>
          <p className="relative text-gray-600 text-xs mt-6">No commitment required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80" }}>G</div>
          <span>© 2026 Golf Charity. All rights reserved.</span>
        </div>
        <div className="flex gap-8">
          <a href="/charities" className="hover:text-white transition-colors">Charities</a>
          <a href="/auth" className="hover:text-white transition-colors">Sign In</a>
          <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
        </div>
      </footer>
    </div>
  );
}
