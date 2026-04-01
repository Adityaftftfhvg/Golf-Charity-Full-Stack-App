"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [session, setSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(!!s);
      if (s?.user) {
        const { data } = await supabase.from("users").select("role").eq("id", s.user.id).single();
        setIsAdmin(data?.role === "admin");
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(!!s);
      if (!s) setIsAdmin(false);
    });

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const isActive = (href: string) => pathname === href;

  const links = [
    { href: "/charities",   label: "Charities",   icon: "💚" },
    { href: "/leaderboard", label: "Leaderboard",  icon: "🏆" },
    { href: "/dashboard",   label: "Dashboard",    icon: "⚡" },
    { href: "/#how-it-works", label: "How It Works", icon: "🎯" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <>
      <style>{`
        @keyframes ring-pulse { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes nav-slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .gc-nav-link {
          position: relative;
          font-size: .85rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color .2s ease;
          display: flex;
          align-items: center;
          gap: .3rem;
          padding: .3rem 0;
        }
        .gc-nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: #4ade80;
          transition: width .3s cubic-bezier(.16,1,.3,1);
          border-radius: 9999px;
        }
        .gc-nav-link:hover { color: #f1f5f9; }
        .gc-nav-link:hover::after { width: 100%; }
        .gc-nav-link.active { color: #4ade80; }
        .gc-nav-link.active::after { width: 100%; }
        .nav-logo-ring::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid rgba(74,222,128,.4);
          animation: ring-pulse 2.5s ease-out infinite;
        }
        .mobile-menu {
          animation: nav-slide-down .2s cubic-bezier(.16,1,.3,1) both;
        }
        .nav-cta {
          position: relative;
          overflow: hidden;
          background: #4ade80;
          color: #080c14;
          font-weight: 700;
          font-size: .85rem;
          padding: .5rem 1.25rem;
          border-radius: 9px;
          text-decoration: none;
          transition: transform .2s, box-shadow .2s;
          display: inline-flex;
          align-items: center;
          gap: .3rem;
        }
        .nav-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
          transform: translateX(-100%);
          transition: transform .5s ease;
        }
        .nav-cta:hover::before { transform: translateX(100%); }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(74,222,128,.4); }
        .admin-badge {
          font-size: .72rem;
          font-weight: 600;
          padding: .2rem .6rem;
          border-radius: 9999px;
          background: rgba(248,113,113,.12);
          border: 1px solid rgba(248,113,113,.3);
          color: #f87171;
          text-decoration: none;
          transition: all .2s;
        }
        .admin-badge:hover { background: rgba(248,113,113,.22); transform: translateY(-1px); }
        .hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: #94a3b8;
          border-radius: 9999px;
          transition: all .3s;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
      `}</style>

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: ".9rem 2rem",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.06)"}`,
          backdropFilter: "blur(16px)",
          background: scrolled ? "rgba(8,12,20,.95)" : "rgba(8,12,20,.82)",
          transition: "background .3s, border-color .3s, box-shadow .3s",
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,.3)" : "none",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: ".6rem", textDecoration: "none", color: "#f1f5f9" }}>
          <div
            className="nav-logo-ring"
            style={{
              position: "relative",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#4ade80,#22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: ".78rem",
              color: "#080c14",
              flexShrink: 0,
            }}
          >
            G
          </div>
          <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-.01em" }}>Golf Charity</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }} className="desktop-nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`gc-nav-link${isActive(link.href) ? " active" : ""}`}
            >
              <span style={{ fontSize: ".8rem" }}>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link href="/admin" className="admin-badge">
              🔐 Admin
            </Link>
          )}

          {session ? (
            <button
              onClick={handleSignOut}
              style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                color: "#94a3b8",
                fontSize: ".82rem",
                padding: ".45rem 1rem",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all .2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.1)"; }}
            >
              Sign out
            </button>
          ) : (
            <Link href="/auth" className="nav-cta">
              Get Started →
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: "none", flexDirection: "column", gap: 4, background: "none", border: "none", cursor: "pointer", padding: ".25rem" }}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="mobile-menu"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "rgba(8,12,20,.98)",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              padding: "1rem 2rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: ".75rem",
              backdropFilter: "blur(20px)",
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`gc-nav-link${isActive(link.href) ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: ".9rem", padding: ".5rem 0" }}
              >
                <span>{link.icon}</span> {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="admin-badge" style={{ alignSelf: "flex-start" }} onClick={() => setMenuOpen(false)}>
                🔐 Admin Panel
              </Link>
            )}
            <div style={{ height: 1, background: "rgba(255,255,255,.06)", margin: ".25rem 0" }} />
            {session ? (
              <button onClick={handleSignOut} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#94a3b8", fontSize: ".85rem", padding: ".6rem 1rem", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                Sign out
              </button>
            ) : (
              <Link href="/auth" className="nav-cta" style={{ alignSelf: "flex-start" }} onClick={() => setMenuOpen(false)}>
                Get Started →
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
