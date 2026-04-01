export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(74,222,128,0.1)",
      background: "rgba(4,7,15,0.97)",
      padding: "3rem 2rem 2rem",
      textAlign: "center",
      fontFamily: "var(--font-dm-sans, sans-serif)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <a href="/charities" style={{ color: "#64748b", textDecoration: "none", fontSize: ".85rem" }}>Charities</a>
          <a href="/draw" style={{ color: "#64748b", textDecoration: "none", fontSize: ".85rem" }}>Monthly Draw</a>
          <a href="/leaderboard" style={{ color: "#64748b", textDecoration: "none", fontSize: ".85rem" }}>Leaderboard</a>
          <a href="/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: ".85rem" }}>Dashboard</a>
        </div>
        <p style={{ color: "#1e293b", fontSize: ".78rem" }}>
          © {new Date().getFullYear()} Golf Charity — Play. Win. Give.
        </p>
      </div>
    </footer>
  );
}