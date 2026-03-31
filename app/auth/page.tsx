"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const login = async () => {
    if (!email || !password) {
      setMessage({ text: "Please enter your email and password", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.replace("/dashboard");
      return;
    }

    setMessage({ text: "Login succeeded but no session — email may not be confirmed.", type: "error" });
    setLoading(false);
  };

  const signUp = async () => {
    if (!email || !password) {
      setMessage({ text: "Please enter your email and password", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      // If already registered, try logging in with same credentials
      if (error.message.toLowerCase().includes("already")) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginData?.session) {
          window.location.replace("/dashboard");
          return;
        }
        setMessage({
          text: loginError?.message || "Account exists — try logging in with your password",
          type: "error"
        });
        setLoading(false);
        return;
      }

      setMessage({ text: error.message, type: "error" });
      setLoading(false);
      return;
    }

    // Send welcome email
    fetch("/api/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    if (data.session) {
      // Email confirmation OFF — redirect immediately
      window.location.replace("/dashboard");
      return;
    }

    // Email confirmation ON
    setMessage({
      text: "Account created! Check your email to confirm, then log in.",
      type: "success"
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-slate-900">G</div>
          <span className="font-bold text-lg">Golf Charity</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Welcome 👋</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Sign in or create a new account</p>

        {message && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-4 border ${
            message.type === "error"
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : "bg-green-500/20 border-green-500/40 text-green-400"
          }`}>
            {message.text}
          </div>
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="p-3 text-white bg-slate-700 border border-slate-600 focus:border-green-500 focus:outline-none w-full mb-4 rounded-lg"
        />

        <input
          placeholder="Password (min 6 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="p-3 text-white bg-slate-700 border border-slate-600 focus:border-green-500 focus:outline-none w-full mb-6 rounded-lg"
        />

        <button
          onClick={login}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 w-full p-3 mb-3 rounded-lg font-medium transition"
        >
          {loading ? "Please wait..." : "Login"}
        </button>

        <button
          onClick={signUp}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 w-full p-3 rounded-lg font-medium transition"
        >
          {loading ? "Please wait..." : "Create Account"}
        </button>

        <p className="text-gray-500 text-xs text-center mt-6">
          By signing up you agree to support great causes 💚
        </p>
      </div>
    </div>
  );
}
