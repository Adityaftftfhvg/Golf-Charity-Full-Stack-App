"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const { data } = await supabase.from("users").select("role").eq("id", s.user.id).single();
        if (data?.role === "admin") {
          window.location.href = "/admin";
          return;
        }
      }
      setChecking(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single();
      if (userData?.role === "admin") {
        window.location.href = "/admin";
      } else {
        await supabase.auth.signOut();
        setError("Access denied. This account does not have admin privileges.");
        setLoading(false);
      }
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid rgba(248,113,113,.2)", borderTopColor: "#f87171", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(248,113,113,.1)} 50%{box-shadow:0 0 40px rgba(248,113,113,.25)} }
        @keyframes border-glow { 0%,100%{border-color:rgba(248,113,113,.25)} 50%{border-color:rgba(248,113,113,.5)} }

        .admin-input {
          width: 100%;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 11px;
          padding: .8rem 1.1rem;
          color: #f1f5f9;
          font-size: .92rem;
          font-family: inherit;
          transition: border-color .2s,box-shadow .2s;
          outline: none;
          box-sizing: border-box;
        }
        .admin-input:focus { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,.12); }

        .admin-submit {
          width: 100%;
          background: linear-gradient(135deg,#f87171,#ef4444);
          color: white;
          font-weight: 800;
          font-size: .95rem;
          padding: .9rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform .2s,box-shadow .25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
        }
        .admin-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(248,113,113,.45); }
        .admin-submit:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "#080c14" }}>

        {/* Ambient */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(248,113,113,.08),transparent)", filter: "blur(80px)", top: "10%", left: "20%" }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(248,113,113,.05),transparent)", filter: "blur(60px)", bottom: "20%", right: "15%" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, animation: "fadeInUp .5s ease both" }}>
          {/* Card */}
          <div style={{ width: 400, background: "rgba(255,255,255,.025)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 22, padding: "2.5rem", boxShadow: "0 40px 100px rgba(0,0,0,.5)", animation: "glow-pulse 4s ease infinite" }}>

            {/* Lock icon */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{ display: "inline-flex", width: 64, height: 64, borderRadius: "50%", background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.3)", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem", animation: "border-glow 3s ease infinite" }}>
                🔐
              </div>
              <h1 style={{ fontFamily: "var(--font-playfair,serif)", fontSize: "1.7rem", fontWeight: 900, marginBottom: ".4rem", letterSpacing: "-.02em" }}>Admin Access</h1>
              <p style={{ color: "#64748b", fontSize: ".85rem" }}>Sign in with your administrator account</p>
            </div>

            {/* Hint box */}
            <div style={{ background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)", borderRadius: 10, padding: ".85rem 1rem", marginBottom: "1.5rem", fontSize: ".78rem", color: "#94a3b8", lineHeight: 1.6 }}>
              <strong style={{ color: "#f87171" }}>Admin only.</strong> Regular user accounts will be denied access even with valid credentials.
            </div>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".5rem", letterSpacing: ".08em", textTransform: "uppercase" }}>Admin Email</label>
                <input
                  className="admin-input"
                  type="email"
                  placeholder="admin@golfcharity.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 700, color: "#64748b", marginBottom: ".5rem", letterSpacing: ".08em", textTransform: "uppercase" }}>Password</label>
                <input
                  className="admin-input"
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 8, padding: ".7rem 1rem", color: "#f87171", fontSize: ".83rem" }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="admin-submit" disabled={loading || !email || !password}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Verifying…</>
                ) : (
                  "Access Admin Panel →"
                )}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: "1.5rem" }}>
              <Link href="/" style={{ color: "#475569", fontSize: ".8rem", textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
              >
                ← Back to Golf Charity
              </Link>
            </div>
          </div>

          {/* Also accessible via /admin route note */}
          <p style={{ textAlign: "center", color: "#2d3748", fontSize: ".73rem", marginTop: "1rem" }}>
            Also accessible at <code style={{ color: "#374151", background: "rgba(255,255,255,.04)", padding: ".1rem .4rem", borderRadius: 4 }}>/admin</code> for logged-in admins
          </p>
        </div>
      </div>
    </>
  );
}
