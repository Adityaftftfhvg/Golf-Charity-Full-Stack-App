"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [result, setResult] = useState<string>("loading...");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("charities").select("*");
        setResult(JSON.stringify({ data, error }, null, 2));
      } catch (e) {
        setResult("CRASH: " + String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: "2rem", color: "white", background: "#111", minHeight: "100vh" }}>
      <h1 style={{ color: "#4ade80" }}>Debug</h1>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: ".85rem" }}>{result}</pre>
    </div>
  );
}
