"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

type Event = {
  title: string;
  date: string;
  location: string;
  description: string;
  spots: number;
  status: "open" | "coming" | "closed";
};

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
  events?: Event[] | null;
};

const FALLBACK_EVENTS: Event[] = [
  {
    title: "Annual Charity Golf Day",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Royal Golf Club, Mumbai",
    description: "Join fellow golfers for an 18-hole scramble format raising funds for this charity. Prizes, food, and a great cause await.",
    spots: 24,
    status: "open",
  },
  {
    title: "Virtual Fundraising Gala",
    date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    location: "Online Event",
    description: "Live leaderboard tracking and prize announcements. Compete with golfers across the country from your own course.",
    spots: 100,
    status: "coming",
  },
];

const DEMO_CHARITIES: Record<string, Charity> = {
  "demo-1": { id: "demo-1", name: "Green Earth Foundation", description: "Protecting forests and natural habitats across India through direct conservation action, community engagement, and policy advocacy. Since 2010, we have planted over 2 million trees and restored more than 400 hectares of degraded land. Your subscription helps fund everything from sapling nurseries to community forest wardens. Every rupee goes directly to on-the-ground impact, with zero administrative overhead.", image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80", is_featured: true },
  "demo-2": { id: "demo-2", name: "Children's Sports Academy", description: "Giving underprivileged youth access to professional sports coaching, equipment, and mentorship since 2015. We run 48 academies across 12 states, training over 6,000 children annually in cricket, football, badminton, and yes — golf. We believe sport teaches resilience, teamwork, and discipline — skills that last a lifetime.", image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80", is_featured: true },
  "demo-3": { id: "demo-3", name: "Rural Health Initiative", description: "Delivering essential healthcare services to remote villages through mobile clinics, telemedicine, and community health workers. Our fleet of 32 medical vans visits over 1,200 villages every month, providing free consultations, diagnostics, and medicines.", image_url: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=900&q=80", is_featured: false },
  "demo-4": { id: "demo-4", name: "Ocean Cleanup Drive", description: "Mobilising coastal communities to remove plastic waste from beaches and waterways before it enters the ocean ecosystem. Our volunteers have collected over 800 tonnes of plastic since 2018, and we have a target of 1,000 tonnes by end of 2026.", image_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=900&q=80", is_featured: false },
  "demo-5": { id: "demo-5", name: "Women in STEM", description: "Scholarships, mentorship, and hackathons empowering girls and women to pursue careers in science, technology, engineering, and mathematics across tier-2 and tier-3 cities. 94% of our scholarship recipients complete their degrees — triple the national average.", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80", is_featured: false },
  "demo-6": { id: "demo-6", name: "Mental Wellness Trust", description: "Free and affordable therapy, peer support groups, and crisis helplines for people struggling with mental health across India. We have facilitated over 180,000 therapy sessions and trained 4,000 peer counsellors. Destigmatising mental illness one conversation at a time.", image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80", is_featured: false },
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

export default function CharityDetailPage() {
  const { id } = useParams();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [joined, setJoined] = useState<Set<number>>(new Set());
  const [session, setSession] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { ref: statsRef, inView: statsIn } = useInView(0.1);
  const { ref: eventsRef, inView: eventsIn } = useInView(0.08);
  const { ref: ctaRef, inView: ctaIn } = useInView(0.1);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s);
      if (s?.user) {
        setJoinEmail(s.user.email || "");
        setJoinName(s.user.user_metadata?.full_name || "");
      }
    });
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    const idStr = id as string;

    // Check demo first
    if (DEMO_CHARITIES[idStr]) {
      setCharity(DEMO_CHARITIES[idStr]);
      setLoading(false);
      return;
    }

    supabase
      .from("charities")
      .select("*")
      .eq("id", idStr)
      .single()
      .then(({ data }) => {
        setCharity(data);
        setLoading(false);
      });
  }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const hasRealEvents = Array.isArray(charity?.events) && (charity?.events?.length ?? 0) > 0;
  const eventsToShow: Event[] = hasRealEvents ? (charity?.events as Event[]) : FALLBACK_EVENTS;

  const handleJoin = async (event: Event, idx: number) => {
    if (!session) {
      window.location.href = "/auth";
      return;
    }
    setSelectedEvent(event);
    setShowJoinModal(true);
  };

  const submitJoin = async () => {
    if (!joinName.trim()) return;
    setJoining(eventsToShow.indexOf(selectedEvent!));
    await new Promise(r => setTimeout(r, 1200));
    const idx = eventsToShow.indexOf(selectedEvent!);
    setJoined(prev => new Set([...prev, idx]));
    setJoining(null);
    setJoinSuccess(true);
  };

  const closeModal = () => {
    setShowJoinModal(false);
    setSelectedEvent(null);
    setJoinSuccess(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "2.5px solid rgba(74,222,128,.15)", borderTopColor: "#4ade80", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!charity) {
    return (
      <div style={{ minHeight: "80vh", background: "#080c14", color: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ fontSize: "3rem" }}>🏌️</div>
        <p>Charity not found.</p>
        <Link href="/charities" style={{ color: "#4ade80", textDecoration: "none" }}>← Back to Charities</Link>
      </div>
    );
  }

  const parallaxOffset = Math.min(scrollY * 0.3, 80);

  return (
    <>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes stat-count { from{transform:scale(.85);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes join-pulse { 0%,100%{box-shadow:0 0 0 rgba(74,222,128,0)} 50%{box-shadow:0 0 24px rgba(74,222,128,.4)} }
        @keyframes modal-in { from{opacity:0;transform:scale(.94) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes success-pop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes confetti { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(-60px) rotate(360deg);opacity:0} }

        .fade-up { opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
        .fade-up.in { opacity:1;transform:translateY(0); }
        .d1{transition-delay:.08s} .d2{transition-delay:.16s} .d3{transition-delay:.24s}

        .stat-card { transition: transform .3s; }
        .stat-card:hover { transform: translateY(-5px); }

        .event-card {
          transition: transform .32s cubic-bezier(.16,1,.3,1), border-color .28s, box-shadow .32s;
        }
        .event-card:hover { transform: translateY(-4px); border-color: rgba(74,222,128,.3) !important; box-shadow: 0 16px 40px rgba(0,0,0,.4); }

        .join-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg,#4ade80,#22c55e);
          color: #050a0e;
          font-weight: 800;
          font-size: .85rem;
          padding: .65rem 1.4rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: transform .2s, box-shadow .25s;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: .4rem;
          animation: join-pulse 3s ease infinite;
        }
        .join-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);
          transform: translateX(-100%);
          transition: transform .5s ease;
        }
        .join-btn:hover::before { transform: translateX(100%); }
        .join-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(74,222,128,.5); }
        .join-btn:disabled { background: rgba(74,222,128,.3); cursor: not-allowed; animation: none; }

        .joined-badge {
          background: rgba(74,222,128,.12);
          border: 1px solid rgba(74,222,128,.3);
          color: #4ade80;
          font-size: .82rem;
          font-weight: 700;
          padding: .55rem 1.2rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: .4rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: fade-in .2s ease;
        }
        .modal-box {
          background: #0d1525;
          border: 1px solid rgba(74,222,128,.2);
          border-radius: 20px;
          padding: 2rem;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 40px 100px rgba(0,0,0,.6);
          animation: modal-in .3s cubic-bezier(.16,1,.3,1);
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 10px;
          padding: .75rem 1rem;
          color: #f1f5f9;
          font-size: .9rem;
          font-family: inherit;
          transition: border-color .2s, box-shadow .2s;
          outline: none;
          box-sizing: border-box;
        }
        .form-input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,.14); }

        .success-icon { animation: success-pop .4s cubic-bezier(.16,1,.3,1) both; }
        .confetti-item { position: absolute; animation: confetti 1.2s ease forwards; }

        .cta-big {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg,#4ade80,#22c55e);
          color: #050a0e;
          font-weight: 800;
          font-size: 1.1rem;
          padding: 1.25rem 2rem;
          border-radius: 16px;
          text-decoration: none;
          display: block;
          text-align: center;
          transition: transform .25s, box-shadow .25s;
          box-shadow: 0 16px 50px rgba(74,222,128,.3);
        }
        .cta-big:hover { transform: translateY(-3px); box-shadow: 0 24px 60px rgba(74,222,128,.5); }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c14", color: "#f1f5f9", fontFamily: "var(--font-dm-sans,DM Sans,sans-serif)" }}>

        {/* Hero image with parallax */}
        <div style={{ position: "relative", height: 420, overflow: "hidden", marginBottom: 0 }}>
          <div style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${parallaxOffset}px)`,
            transition: "transform 0s",
          }}>
            {charity.image_url ? (
              <img src={charity.image_url} alt={charity.name} style={{ width: "100%", height: "120%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,rgba(74,222,128,.12),rgba(167,139,250,.08))" }} />
            )}
          </div>
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,12,20,.2) 0%, rgba(8,12,20,.85) 80%, #080c14 100%)" }} />

          {/* Back link */}
          <div style={{ position: "absolute", top: "1.5rem", left: "1.5rem", zIndex: 10 }}>
            <Link href="/charities" style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", background: "rgba(0,0,0,.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 9999, padding: ".45rem 1rem", color: "#f1f5f9", textDecoration: "none", fontSize: ".82rem", fontWeight: 600, transition: "all .2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,.65)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,.45)")}
            >
              ← All Charities
            </Link>
          </div>

          {/* Title overlay at bottom of hero */}
          <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0, padding: "0 2rem", maxWidth: 900, margin: "0 auto", animation: "fadeInUp .7s ease both" }}>
            {charity.is_featured && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", background: "rgba(250,204,21,.15)", border: "1px solid rgba(250,204,21,.4)", color: "#fde047", fontSize: ".7rem", fontWeight: 700, padding: ".2rem .75rem", borderRadius: 9999, marginBottom: ".75rem", letterSpacing: ".08em" }}>
                ⭐ FEATURED CHARITY
              </div>
            )}
            <h1 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-.02em", textShadow: "0 2px 20px rgba(0,0,0,.5)" }}>
              {charity.name}
            </h1>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem 5rem" }}>

          {/* Stats */}
          <div ref={statsRef} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "2.5rem", marginTop: "-.5rem" }}>
            {[
              { v: "₹2.4L", l: "Raised This Month", icon: "💰", color: "#4ade80" },
              { v: "184", l: "Golfers Supporting", icon: "⛳", color: "#a78bfa" },
              { v: `${eventsToShow.length}`, l: "Upcoming Events", icon: "📅", color: "#facc15" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`stat-card fade-up d${i + 1} ${statsIn ? "in" : ""}`}
                style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${s.color}22`, borderTop: `2px solid ${s.color}55`, borderRadius: 14, padding: "1.5rem", textAlign: "center" }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: ".4rem" }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: ".7rem", color: "#475569", marginTop: ".4rem", letterSpacing: ".06em", textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* About */}
          <div className={`fade-up ${statsIn ? "in" : ""}`} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, padding: "2rem", marginBottom: "2.5rem" }}>
            <p style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#475569", marginBottom: "1rem" }}>Our Story</p>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "#94a3b8" }}>{charity.description || "No description available."}</p>
          </div>

          {/* Events */}
          <div ref={eventsRef} style={{ marginBottom: "3rem" }}>
            <div className={`fade-up ${eventsIn ? "in" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "1.7rem", fontWeight: 800 }}>📅 Upcoming Events</h2>
              {!hasRealEvents && (
                <span style={{ fontSize: ".68rem", color: "#475569", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", padding: ".2rem .6rem", borderRadius: 6 }}>Preview</span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.25rem" }}>
              {eventsToShow.map((event, i) => (
                <div
                  key={i}
                  className={`fade-up d${i + 1} ${eventsIn ? "in" : ""} event-card`}
                  style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, padding: "1.5rem", position: "relative", overflow: "hidden" }}
                >
                  {/* Event top accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: event.status === "open" ? "linear-gradient(90deg,#4ade80,#22d3ee)" : "rgba(255,255,255,.06)", borderRadius: "18px 18px 0 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: ".4rem", letterSpacing: "-.01em" }}>{event.title}</h4>
                      <p style={{ color: "#4ade80", fontWeight: 600, fontSize: ".85rem" }}>{formatDate(event.date)}</p>
                      <p style={{ color: "#475569", fontSize: ".8rem", marginTop: ".2rem" }}>📍 {event.location}</p>
                    </div>
                    <span style={{
                      fontSize: ".68rem", fontWeight: 700, padding: ".3rem .7rem", borderRadius: 9999, letterSpacing: ".06em", flexShrink: 0, marginLeft: "1rem",
                      background: event.status === "open" ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.06)",
                      border: `1px solid ${event.status === "open" ? "rgba(74,222,128,.35)" : "rgba(255,255,255,.08)"}`,
                      color: event.status === "open" ? "#4ade80" : "#64748b",
                    }}>
                      {event.status === "open" ? "🟢 OPEN" : "🔜 SOON"}
                    </span>
                  </div>

                  <p style={{ color: "#64748b", fontSize: ".83rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>{event.description}</p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: ".78rem", color: "#475569", display: "flex", alignItems: "center", gap: ".4rem" }}>
                      <span>👥</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#64748b" }}>{event.spots} spots</span>
                    </div>

                    {event.status === "open" ? (
                      joined.has(i) ? (
                        <div className="joined-badge">✅ Registered!</div>
                      ) : (
                        <button
                          className="join-btn"
                          disabled={joining === i}
                          onClick={() => handleJoin(event, i)}
                        >
                          {joining === i ? (
                            <>
                              <div style={{ width: 14, height: 14, border: "2px solid rgba(5,10,14,.3)", borderTopColor: "#050a0e", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                              Joining…
                            </>
                          ) : (
                            <>Join the Day →</>
                          )}
                        </button>
                      )
                    ) : (
                      <span style={{ fontSize: ".82rem", color: "#475569", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", padding: ".5rem 1rem", borderRadius: 10 }}>Coming Soon</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Big CTA */}
          <div ref={ctaRef} className={`fade-up ${ctaIn ? "in" : ""}`}>
            <Link href="/dashboard" className="cta-big">
              💚 Support {charity.name} — Go to Dashboard
            </Link>
            <p style={{ textAlign: "center", color: "#374151", fontSize: ".78rem", marginTop: ".85rem" }}>
              10% of your subscription goes directly to your chosen charity
            </p>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {joinSuccess ? (
              <div style={{ textAlign: "center", padding: "1rem 0", position: "relative" }}>
                {/* Confetti */}
                {["#4ade80","#facc15","#a78bfa","#22d3ee","#f87171"].map((color, i) => (
                  <div key={i} className="confetti-item" style={{ left: `${15 + i * 18}%`, top: "30%", width: 8, height: 8, background: color, borderRadius: 2, animationDelay: `${i * .1}s` }} />
                ))}
                <div className="success-icon" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
                <h3 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "1.5rem", fontWeight: 800, marginBottom: ".5rem" }}>You&apos;re in!</h3>
                <p style={{ color: "#64748b", fontSize: ".88rem", marginBottom: "1.5rem" }}>
                  You&apos;ve successfully registered for <strong style={{ color: "#f1f5f9" }}>{selectedEvent?.title}</strong>. Check your email for confirmation.
                </p>
                <button onClick={closeModal} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#f1f5f9", padding: ".65rem 1.5rem", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: ".88rem", fontWeight: 600 }}>
                  Done ✓
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "1.4rem", fontWeight: 800, marginBottom: ".3rem" }}>Join the Event</h3>
                    <p style={{ color: "#64748b", fontSize: ".83rem" }}>{selectedEvent?.title}</p>
                  </div>
                  <button onClick={closeModal} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, padding: 0 }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "#64748b", marginBottom: ".4rem", letterSpacing: ".06em", textTransform: "uppercase" }}>Your Name *</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter your full name"
                      value={joinName}
                      onChange={e => setJoinName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "#64748b", marginBottom: ".4rem", letterSpacing: ".06em", textTransform: "uppercase" }}>Email Address</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="your@email.com"
                      value={joinEmail}
                      onChange={e => setJoinEmail(e.target.value)}
                    />
                  </div>
                  <div style={{ background: "rgba(74,222,128,.06)", border: "1px solid rgba(74,222,128,.15)", borderRadius: 10, padding: ".85rem 1rem" }}>
                    <p style={{ fontSize: ".8rem", color: "#4ade80", fontWeight: 600, marginBottom: ".25rem" }}>📅 {formatDate(selectedEvent?.date || "")}</p>
                    <p style={{ fontSize: ".78rem", color: "#64748b" }}>📍 {selectedEvent?.location}</p>
                    <p style={{ fontSize: ".78rem", color: "#64748b", marginTop: ".25rem" }}>👥 {selectedEvent?.spots} spots available</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button onClick={closeModal} style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "#64748b", padding: ".7rem", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: ".88rem", fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button
                    className="join-btn"
                    onClick={submitJoin}
                    disabled={!joinName.trim() || joining !== null}
                    style={{ flex: 2, justifyContent: "center", animation: "none" }}
                  >
                    {joining !== null ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid rgba(5,10,14,.3)", borderTopColor: "#050a0e", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Registering…</>
                    ) : (
                      "Confirm Registration →"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
