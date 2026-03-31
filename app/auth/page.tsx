"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!email || !password) return setError("Please enter email and password");
    setLoading(true);
    setError(null);

    console.log("Attempting login for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    console.log("Login result:", { data, error });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Login succeeded but no session returned — your email may not be confirmed yet.");
      setLoading(false);
      return;
    }

    console.log("Session OK, redirecting...");
    window.location.href = "/dashboard";
  };

  const signUp = async () => {
    if (!email || !password) return setError("Please enter email and password");
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    console.log("Signup result:", { data, error });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    try {
      await fetch("/api/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (e) {
      console.error("Welcome email failed:", e);
    }

    setLoading(false);

    if (data.session) {
      // Email confirmations are OFF — user is logged in immediately
      window.location.href = "/dashboard";
    } else {
      setError("Account created! Check your email to confirm before logging in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-slate-900">G</div>
          <span className="font-bold text-lg">Golf Charity</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Welcome Back 👋</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Sign in or create a new account</p>

        {/* ✅ Visible error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 text-white bg-slate-700 border border-slate-600 focus:border-green-500 focus:outline-none w-full mb-4 rounded-lg"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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