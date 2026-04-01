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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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
    const onOut = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onOut);
    return () => { subscription.unsubscribe(); window.removeEventListener("scroll", onScroll); document.removeEventListener("mousedown", onOut); };
  }, []);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  const links = [
    { href:"/charities",     label:"Charities",    icon:"💚" },
    { href:"/dashboard",     label:"Dashboard",    icon:"⚡" },
    { href:"/leaderboard",   label:"Leaderboard",  icon:"🏆" },
    { href:"/#how-it-works", label:"How It Works", icon:"🎯" },
    { href:"/draw",          label:"Monthly Draw", icon:"🎰" },
  ];

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = "/auth"; };

  return (
    <>
      <style>{`
        @keyframes nav-ring { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(2.2);opacity:0} }
        @keyframes nav-in { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes menu-drop { from{opacity:0;transform:translateY(-12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes admin-pulse { 0%,100%{box-shadow:0 0 0 rgba(248,113,113,0)} 50%{box-shadow:0 0 20px rgba(248,113,113,.3)} }
        @keyframes dot-live { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.6} }
        @keyframes shimmer-nav { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

        .gc-navbar {
          position: fixed !important;
          top: 0; left: 0; right: 0;
          z-index: 9999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: .85rem 2rem;
          transition: background .35s, border-color .35s, box-shadow .35s, backdrop-filter .35s;
          animation: nav-in .4s cubic-bezier(.16,1,.3,1) both;
        }
        .gc-navbar.top { background:rgba(8,12,20,.75); border-bottom:1px solid rgba(255,255,255,.04); backdrop-filter:blur(14px); }
        .gc-navbar.scrolled { background:rgba(4,7,15,.97); border-bottom:1px solid rgba(74,222,128,.1); box-shadow:0 4px 40px rgba(0,0,0,.55),0 1px 0 rgba(74,222,128,.04); backdrop-filter:blur(28px); }

        .gc-nav-link {
          position: relative;
          font-size: .84rem;
          color: #64748b;
          text-decoration: none;
          transition: color .22s;
          display: flex;
          align-items: center;
          gap: .28rem;
          padding: .38rem 0;
          font-weight: 500;
          white-space: nowrap;
        }
        .gc-nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg,#4ade80,#22d3ee);
          transition: width .32s cubic-bezier(.16,1,.3,1);
          border-radius: 9999px;
        }
        .gc-nav-link:hover { color: #e2e8f0; }
        .gc-nav-link:hover::after { width: 100%; }
        .gc-nav-link.active { color: #4ade80; }
        .gc-nav-link.active::after { width:100%; background:linear-gradient(90deg,#4ade80,#22c55e); }

        .nav-logo {
          position: relative;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg,#4ade80,#22c55e);
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: .78rem; color: #050a0e;
          flex-shrink: 0;
          transition: transform .3s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 20px rgba(74,222,128,.3);
        }
        .nav-logo:hover { transform: rotate(20deg) scale(1.1); }
        .nav-logo::before {
          content: '';
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(74,222,128,.35);
          animation: nav-ring 2.5s ease-out infinite;
        }

        .nav-cta {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg,#4ade80,#22c55e);
          color: #050a0e; font-weight: 800; font-size: .84rem;
          padding: .54rem 1.3rem; border-radius: 10px;
          text-decoration: none;
          transition: transform .22s, box-shadow .28s;
          display: inline-flex; align-items: center; gap: .35rem;
        }
        .nav-cta::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);
          transform: translateX(-100%);
        }
        .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(74,222,128,.55); }
        .nav-cta:hover::before { animation: shimmer-nav .55s ease forwards; }

        .admin-badge {
          font-size: .73rem; font-weight: 700;
          padding: .24rem .75rem; border-radius: 9999px;
          background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.3);
          color: #f87171; text-decoration: none;
          transition: all .22s;
          display: flex; align-items: center; gap: .3rem;
          animation: admin-pulse 3s ease infinite;
        }
        .admin-badge:hover { background:rgba(248,113,113,.22); transform:translateY(-1px); box-shadow:0 6px 22px rgba(248,113,113,.3); }

        .signout-btn {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);
          color: #64748b; font-size: .82rem; padding: .5rem 1rem;
          border-radius: 9px; cursor: pointer; transition: all .22s;
          font-family: inherit; font-weight: 500;
        }
        .signout-btn:hover { color:#f1f5f9; border-color:rgba(255,255,255,.18); background:rgba(255,255,255,.09); }

        .hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:.3rem; }
        .hamburger span { display:block; width:22px; height:2px; background:#64748b; border-radius:9999px; transition:all .32s cubic-bezier(.16,1,.3,1); }
        .hamburger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); background:#4ade80; }
        .hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
        .hamburger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); background:#4ade80; }

        .mobile-menu { animation: menu-drop .25s cubic-bezier(.16,1,.3,1) both; }

        @media (max-width:860px) { .gc-desktop-links{display:none!important;} .hamburger{display:flex!important;} }
      `}</style>

      <div style={{ height:66 }} aria-hidden="true" />

      <nav className={`gc-navbar ${scrolled?"scrolled":"top"}`} style={{ opacity: mounted ? 1 : 0 }}>
        {/* Logo */}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:".65rem", textDecoration:"none", color:"#f1f5f9" }}>
          <div className="nav-logo">GC</div>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.15 }}>
            <span style={{ fontWeight:800, fontSize:".93rem", letterSpacing:"-.02em" }}>Golf Charity</span>
            <span style={{ fontSize:".58rem", color:"#4ade80", letterSpacing:".1em", fontWeight:700, textTransform:"uppercase" }}>Play · Win · Give</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="gc-desktop-links" style={{ display:"flex", alignItems:"center", gap:"1.55rem" }}>
          {links.map(link => (
            <Link key={link.href} href={link.href} className={`gc-nav-link${isActive(link.href)?" active":""}`}>
              <span style={{ fontSize:".76rem" }}>{link.icon}</span>
              {link.label}
              {isActive(link.href) && (
                <span style={{ position:"absolute", top:-2, right:-6, width:5, height:5, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 8px #4ade80", animation:"dot-live 2s ease infinite" }} />
              )}
            </Link>
          ))}
          {isAdmin && <Link href="/admin" className="admin-badge">🔐 Admin</Link>}
          {session ? (
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          ) : (
            <Link href="/auth" className="nav-cta">Get Started →</Link>
          )}
        </div>

        {/* Hamburger */}
        <button className={`hamburger${menuOpen?" open":""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div ref={menuRef} className="mobile-menu" style={{ position:"fixed", top:66, left:0, right:0, background:"rgba(4,7,15,.98)", borderBottom:"1px solid rgba(74,222,128,.1)", padding:"1rem 1.5rem 1.6rem", display:"flex", flexDirection:"column", gap:".5rem", backdropFilter:"blur(30px)", boxShadow:"0 24px 60px rgba(0,0,0,.65)" }}>
            {links.map(link => (
              <Link key={link.href} href={link.href} className={`gc-nav-link${isActive(link.href)?" active":""}`} onClick={() => setMenuOpen(false)} style={{ fontSize:".92rem", padding:".65rem 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                <span style={{ fontSize:".88rem" }}>{link.icon}</span> {link.label}
              </Link>
            ))}
            {isAdmin && <Link href="/admin" className="admin-badge" style={{ alignSelf:"flex-start", marginTop:".35rem" }} onClick={() => setMenuOpen(false)}>🔐 Admin Panel</Link>}
            <div style={{ height:1, background:"rgba(255,255,255,.06)", margin:".5rem 0" }} />
            {session ? (
              <button className="signout-btn" onClick={handleSignOut} style={{ textAlign:"left" }}>Sign out</button>
            ) : (
              <Link href="/auth" className="nav-cta" style={{ alignSelf:"flex-start" }} onClick={() => setMenuOpen(false)}>Get Started →</Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
