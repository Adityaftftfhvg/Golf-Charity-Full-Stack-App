"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = { id: string; name: string; description: string; image_url: string | null; is_featured: boolean; };

// Demo charities shown when no DB data exists (fallback for local/empty DB)
const DEMO_CHARITIES: Charity[] = [
  { id: "demo-1", name: "Green Earth Foundation", description: "Protecting forests and natural habitats across India through direct conservation action, community engagement, and policy advocacy. Your subscription helps plant trees on golf courses nationwide.", image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=70", is_featured: true },
  { id: "demo-2", name: "Children's Sports Academy", description: "Giving underprivileged youth access to professional sports coaching, equipment, and mentorship. We believe every child deserves the chance to play.", image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=70", is_featured: true },
  { id: "demo-3", name: "Rural Health Initiative", description: "Delivering essential healthcare services to remote villages through mobile clinics, telemedicine, and community health workers. Bridging the urban-rural health gap one village at a time.", image_url: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=70", is_featured: false },
  { id: "demo-4", name: "Ocean Cleanup Drive", description: "Mobilising coastal communities to remove plastic waste from beaches and waterways before it enters the ocean ecosystem. Backed by science, driven by volunteers.", image_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&q=70", is_featured: false },
  { id: "demo-5", name: "Women in STEM", description: "Scholarships, mentorship, and hackathons empowering girls and women to pursue careers in science, technology, engineering, and mathematics across tier-2 and tier-3 cities.", image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=70", is_featured: false },
  { id: "demo-6", name: "Mental Wellness Trust", description: "Free and affordable therapy, peer support groups, and crisis helplines for people struggling with mental health across India. Destigmatising mental illness one conversation at a time.", image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=70", is_featured: false },
];

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

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; s: number; d: number }[]>([]);

  const { ref: heroRef, inView: heroIn } = useInView(0.05);
  const { ref: featRef, inView: featIn } = useInView(0.05);
  const { ref: gridRef, inView: gridIn } = useInView(0.05);

  useEffect(() => {
    // Generate ambient floating particles
    setParticles(Array.from({ length: 18 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: 2 + Math.random() * 4,
      d: 4 + Math.random() * 8,
    })));

    supabase
      .from("charities")
      .select("id,name,description,image_url,is_featured")
      .order("is_featured", { ascending: false })
      .order("name")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCharities(data);
        } else {
          setCharities(DEMO_CHARITIES);
          setUsingDemo(true);
        }
        setLoading(false);
      });
  }, []);

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );
  const featured = filtered.filter(c => c.is_featured);
  const regular  = filtered.filter(c => !c.is_featured);

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes float-p { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes badge-pulse { 0%,100%{box-shadow:0 0 0 rgba(250,204,21,0)} 50%{box-shadow:0 0 16px rgba(250,204,21,.3)} }

        .fade-up { opacity:0; transform:translateY(28px); transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
        .fade-up.in { opacity:1; transform:translateY(0); }
        .d1{transition-delay:.06s} .d2{transition-delay:.12s} .d3{transition-delay:.18s} .d4{transition-delay:.24s} .d5{transition-delay:.30s} .d6{transition-delay:.36s}

        .particle { position:absolute; border-radius:50%; pointer-events:none; animation:float-p var(--d,6s) ease-in-out infinite; }

        .feat-card {
          transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s;
          cursor: pointer;
        }
        .feat-card:hover { transform: translateY(-8px); box-shadow: 0 28px 60px rgba(0,0,0,.5); }

        .reg-card {
          transition: transform .32s cubic-bezier(.16,1,.3,1), border-color .28s, box-shadow .32s;
          cursor: pointer;
        }
        .reg-card:hover { transform: translateY(-6px); border-color: rgba(74,222,128,.3) !important; box-shadow: 0 20px 50px rgba(0,0,0,.4); }

        .search-wrap input:focus {
          border-color: #4ade80 !important;
          box-shadow: 0 0 0 3px rgba(74,222,128,.14) !important;
          outline: none;
        }

        .feat-badge { animation: badge-pulse 3s ease infinite; }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
        }

        .img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(5,9,18,.9));
          border-radius: inherit;
        }

        @media (max-width: 640px) {
          .feat-grid { grid-template-columns: 1fr !important; }
          .reg-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080c14", color: "#f1f5f9", overflowX: "hidden", fontFamily: "var(--font-dm-sans,DM Sans,sans-serif)" }}>

        {/* Ambient blobs */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,rgba(250,204,21,.08),transparent)", filter: "blur(100px)", top: -80, left: "5%" }} />
          <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.07),transparent)", filter: "blur(90px)", top: "40%", right: -60 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.06),transparent)", filter: "blur(80px)", bottom: "10%", left: "30%" }} />
          {particles.map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.s,
                height: p.s,
                background: i % 3 === 0 ? "rgba(74,222,128,.25)" : i % 3 === 1 ? "rgba(250,204,21,.2)" : "rgba(167,139,250,.2)",
                "--d": `${p.d}s`,
                animationDelay: `${-p.d * Math.random()}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1060, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

          {/* Hero */}
          <div ref={heroRef} className={`fade-up ${heroIn ? "in" : ""}`} style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            {usingDemo && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".3rem .85rem", borderRadius: 9999, background: "rgba(167,139,250,.1)", border: "1px solid rgba(167,139,250,.2)", color: "#c4b5fd", fontSize: ".68rem", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "1rem" }}>
                ✨ Preview Mode — Connect Supabase to see real charities
              </div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".35rem .9rem", borderRadius: 9999, background: "rgba(250,204,21,.08)", border: "1px solid rgba(250,204,21,.2)", color: "#facc15", fontSize: ".7rem", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#facc15", display: "inline-block", boxShadow: "0 0 8px #facc15" }} />
              Every subscription makes an impact
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "clamp(2.4rem,5vw,3.5rem)", fontWeight: 900, lineHeight: 1.06, marginBottom: ".8rem", letterSpacing: "-.02em" }}>
              Causes Worth<br />
              <span style={{ background: "linear-gradient(135deg,#facc15,#4ade80 60%,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Playing For</span>
            </h1>
            <p style={{ color: "#64748b", fontSize: ".95rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.75 }}>
              Every subscription contributes directly to these causes.<br />Choose the one closest to your heart.
            </p>
          </div>

          {/* Search */}
          <div className={`fade-up d1 ${heroIn ? "in" : ""} search-wrap`} style={{ marginBottom: "2.75rem" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1.1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none", zIndex: 2 }}>🔍</span>
              <input
                type="text"
                placeholder="Search charities by name or cause…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: ".85rem 1.1rem .85rem 2.9rem", color: "#f1f5f9", fontSize: ".9rem", transition: "border-color .2s,box-shadow .2s", fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1.25rem" }}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ borderRadius: 16, height: 220 }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "5rem 0" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>💚</div>
              <p style={{ color: "#64748b", fontSize: "1rem" }}>No charities match your search.</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* Featured */}
              {featured.length > 0 && (
                <div ref={featRef} style={{ marginBottom: "3rem" }}>
                  <div className={`fade-up ${featIn ? "in" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#facc15" }}>⭐ Featured Charities</span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(250,204,21,.3),transparent)" }} />
                  </div>
                  <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem" }}>
                    {featured.map((c, i) => (
                      <div
                        key={c.id}
                        className={`fade-up d${i + 1} ${featIn ? "in" : ""} feat-card`}
                        onClick={() => window.location.href = `/charities/${c.id}`}
                        style={{ borderRadius: 18, padding: 1.5, background: "linear-gradient(135deg,rgba(250,204,21,.5),rgba(74,222,128,.25),rgba(167,139,250,.3))" }}
                      >
                        <div style={{ borderRadius: 17, background: "#0b1220", overflow: "hidden", height: "100%" }}>
                          <div style={{ position: "relative" }}>
                            {c.image_url ? (
                              <img src={c.image_url} alt={c.name} style={{ width: "100%", height: 185, objectFit: "cover", display: "block" }} loading="lazy" />
                            ) : (
                              <div style={{ width: "100%", height: 185, background: "linear-gradient(135deg,rgba(74,222,128,.08),rgba(250,204,21,.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>💚</div>
                            )}
                            <div className="img-overlay" />
                            <div className="feat-badge" style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(250,204,21,.15)", border: "1px solid rgba(250,204,21,.4)", color: "#fde047", fontSize: ".68rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: 9999 }}>
                              ⭐ Featured
                            </div>
                          </div>
                          <div style={{ padding: "1.35rem" }}>
                            <h4 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: ".55rem", letterSpacing: "-.01em" }}>{c.name}</h4>
                            <p style={{ color: "#64748b", fontSize: ".83rem", lineHeight: 1.68, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.description || "No description available."}</p>
                            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: ".5rem", color: "#facc15", fontSize: ".78rem", fontWeight: 700 }}>
                              <span>View details</span>
                              <span style={{ fontSize: "1rem" }}>→</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular */}
              {regular.length > 0 && (
                <div ref={gridRef}>
                  <div className={`fade-up ${gridIn ? "in" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#94a3b8" }}>
                      {featured.length > 0 ? "All Charities" : "Our Charities"}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(255,255,255,.1),transparent)" }} />
                    <span style={{ fontSize: ".72rem", color: "#475569" }}>{regular.length} cause{regular.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="reg-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1.1rem" }}>
                    {regular.map((c, i) => (
                      <div
                        key={c.id}
                        className={`fade-up d${(i % 4) + 1} ${gridIn ? "in" : ""} reg-card`}
                        onClick={() => window.location.href = `/charities/${c.id}`}
                        style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, overflow: "hidden" }}
                      >
                        <div style={{ position: "relative" }}>
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.name} style={{ width: "100%", height: 140, objectFit: "cover", display: "block", transition: "transform .4s" }} loading="lazy" />
                          ) : (
                            <div style={{ width: "100%", height: 140, background: "linear-gradient(135deg,rgba(74,222,128,.06),rgba(167,139,250,.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>💚</div>
                          )}
                        </div>
                        <div style={{ padding: "1.1rem" }}>
                          <h4 style={{ fontSize: ".97rem", fontWeight: 700, marginBottom: ".45rem", letterSpacing: "-.01em" }}>{c.name}</h4>
                          <p style={{ color: "#64748b", fontSize: ".8rem", lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.description || "No description available."}</p>
                          <p style={{ color: "#4ade80", fontSize: ".76rem", fontWeight: 700, marginTop: ".75rem", display: "flex", alignItems: "center", gap: ".3rem" }}>
                            View details <span>→</span>
                          </p>
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
        <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,.05)", padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ color: "#374151", fontSize: ".8rem" }}>© 2026 Golf Charity. All rights reserved.</div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {[["Home", "/"], ["Dashboard", "/dashboard"], ["Leaderboard", "/leaderboard"]].map(([l, h]) => (
              <a key={l} href={h} style={{ color: "#374151", fontSize: ".8rem", textDecoration: "none", transition: "color .2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#4ade80")} onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
