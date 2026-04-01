"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: "⛳" },
    { href: "/charities", label: "Charities", icon: "💚" },
    { href: "/draw", label: "Monthly Draw", icon: "🎰" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  ];

  const socials = [
    { label: "Twitter / X", icon: "𝕏", href: "#" },
    { label: "Instagram", icon: "◎", href: "#" },
    { label: "LinkedIn", icon: "in", href: "#" },
  ];

  return (
    <>
      <style>{`
        @keyframes footer-line {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes float-ball {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-8px) rotate(8deg); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity: .4; }
          50%      { opacity: .9; }
        }
        @keyframes shimmer-foot {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .gc-footer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #050810 0%, #020408 100%);
          border-top: 1px solid rgba(74,222,128,.12);
          font-family: var(--font-dm-sans, DM Sans, sans-serif);
        }

        /* Ambient glow bars */
        .gc-footer::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, #4ade80, #facc15, #4ade80, transparent);
          animation: glow-pulse 3s ease infinite;
        }

        .gc-footer-inner {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 4rem 2rem 2.5rem;
        }

        /* Top row */
        .gc-footer-top {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3.5rem;
        }

        /* Brand column */
        .gc-footer-brand-name {
          font-family: var(--font-playfair, serif);
          font-size: 1.7rem;
          font-weight: 900;
          letter-spacing: -.02em;
          background: linear-gradient(135deg, #facc15 0%, #4ade80 55%, #a78bfa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-foot 5s linear infinite;
          margin-bottom: .5rem;
          display: block;
        }

        .gc-footer-tagline {
          color: #334155;
          font-size: .82rem;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 1.4rem;
        }

        .gc-footer-desc {
          color: #475569;
          font-size: .83rem;
          line-height: 1.75;
          max-width: 280px;
        }

        /* Nav columns */
        .gc-footer-col-title {
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #4ade80;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        .gc-footer-col-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(74,222,128,.3), transparent);
          animation: footer-line .8s ease both;
          transform-origin: left;
        }

        .gc-footer-link {
          display: flex;
          align-items: center;
          gap: .6rem;
          color: #475569;
          text-decoration: none;
          font-size: .85rem;
          font-weight: 500;
          padding: .38rem 0;
          border-radius: 8px;
          transition: color .22s, transform .22s, padding-left .22s;
          cursor: pointer;
        }
        .gc-footer-link:hover {
          color: #e2e8f0;
          padding-left: .4rem;
        }
        .gc-footer-link .icon {
          font-size: .9rem;
          width: 22px;
          text-align: center;
          opacity: .6;
          transition: opacity .22s, transform .22s;
        }
        .gc-footer-link:hover .icon {
          opacity: 1;
          transform: scale(1.2);
        }

        /* Social pills */
        .gc-social-pill {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .4rem .9rem;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          background: rgba(255,255,255,.03);
          color: #475569;
          font-size: .78rem;
          font-weight: 600;
          text-decoration: none;
          transition: border-color .22s, color .22s, background .22s, transform .22s;
          cursor: pointer;
        }
        .gc-social-pill:hover {
          border-color: rgba(74,222,128,.3);
          color: #4ade80;
          background: rgba(74,222,128,.05);
          transform: translateY(-2px);
        }

        /* Stat chips */
        .gc-stat-chip {
          display: flex;
          align-items: center;
          gap: .7rem;
          padding: .75rem 1rem;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          transition: border-color .25s, background .25s;
        }
        .gc-stat-chip:hover {
          border-color: rgba(74,222,128,.2);
          background: rgba(74,222,128,.03);
        }
        .gc-stat-chip-val {
          font-family: var(--font-playfair, serif);
          font-size: 1.15rem;
          font-weight: 900;
          color: #facc15;
          line-height: 1;
        }
        .gc-stat-chip-label {
          font-size: .72rem;
          color: #475569;
          font-weight: 500;
        }

        /* Bottom bar */
        .gc-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,.05);
        }

        .gc-footer-copy {
          color: #1e293b;
          font-size: .76rem;
        }

        .gc-footer-legal {
          display: flex;
          gap: 1.5rem;
        }
        .gc-footer-legal a {
          color: #1e293b;
          font-size: .74rem;
          text-decoration: none;
          transition: color .2s;
        }
        .gc-footer-legal a:hover { color: #4ade80; }

        /* Golf ball deco */
        .gc-footer-ball {
          position: absolute;
          right: 6%;
          bottom: 3rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.06), rgba(255,255,255,.01));
          border: 1px solid rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          animation: float-ball 5s ease-in-out infinite;
          pointer-events: none;
          opacity: .4;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .gc-footer-top {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .gc-footer-stats {
            display: none;
          }
          .gc-footer-ball { display: none; }
        }
        @media (max-width: 520px) {
          .gc-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <footer className="gc-footer">
        {/* Ambient blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", width: 400, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(74,222,128,.04),transparent)", filter: "blur(60px)", top: 0, left: "10%" }} />
          <div style={{ position: "absolute", width: 300, height: 180, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(250,204,21,.03),transparent)", filter: "blur(50px)", top: 0, right: "15%" }} />
        </div>

        <div className="gc-footer-ball" aria-hidden="true">⛳</div>

        <div className="gc-footer-inner">
          <div className="gc-footer-top">

            {/* Brand column */}
            <div>
              <span className="gc-footer-brand-name">Golf Charity</span>
              <p className="gc-footer-tagline">Play · Win · Give</p>
              <p className="gc-footer-desc">
                A subscription golf platform where every round you play drives real charitable impact. Stableford scoring, monthly prize draws, and direct donations — all in one place.
              </p>

              {/* Stats row */}
              <div className="gc-footer-stats" style={{ display: "flex", gap: ".75rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
                {[
                  { val: "₹2Cr+", label: "Donated" },
                  { val: "5K+", label: "Golfers" },
                  { val: "48", label: "Charities" },
                ].map(s => (
                  <div key={s.label} className="gc-stat-chip">
                    <div>
                      <div className="gc-stat-chip-val">{s.val}</div>
                      <div className="gc-stat-chip-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Socials */}
              <div style={{ display: "flex", gap: ".6rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
                {socials.map(s => (
                  <a key={s.label} href={s.href} className="gc-social-pill" aria-label={s.label}>
                    <span style={{ fontWeight: 800, fontSize: ".85rem" }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation column */}
            <div>
              <div className="gc-footer-col-title">Navigate</div>
              <nav style={{ display: "flex", flexDirection: "column" }}>
                {links.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="gc-footer-link"
                    onMouseEnter={() => setHovered(l.label)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="icon">{l.icon}</span>
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* About column */}
            <div>
              <div className="gc-footer-col-title">Platform</div>
              <nav style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "How It Works", href: "/#how-it-works", icon: "🎯" },
                  { label: "Subscribe", href: "/auth", icon: "✦" },
                  { label: "Admin Panel", href: "/admin-login", icon: "🔒" },
                  { label: "Privacy Policy", href: "#", icon: "🛡️" },
                  { label: "Terms of Use", href: "#", icon: "📋" },
                ].map(l => (
                  <a key={l.label} href={l.href} className="gc-footer-link">
                    <span className="icon">{l.icon}</span>
                    {l.label}
                  </a>
                ))}
              </nav>

              {/* CTA */}
              <a
                href="/auth"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: ".5rem",
                  marginTop: "1.5rem",
                  padding: ".65rem 1.2rem",
                  background: "linear-gradient(135deg,rgba(74,222,128,.12),rgba(250,204,21,.06))",
                  border: "1px solid rgba(74,222,128,.22)",
                  borderRadius: 12,
                  color: "#4ade80",
                  fontSize: ".82rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background .25s, border-color .25s, transform .25s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(74,222,128,.2),rgba(250,204,21,.1))";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(74,222,128,.12),rgba(250,204,21,.06))";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <span>⛳</span>
                Start Playing Today
                <span style={{ marginLeft: ".1rem" }}>→</span>
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="gc-footer-bottom">
            <p className="gc-footer-copy">
              © {mounted ? new Date().getFullYear() : "2026"} Golf Charity — Play. Win. Give. All rights reserved.
            </p>
            <div className="gc-footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
