"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    if (!email || !password) return alert("Please enter email and password");
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // ✅ Send welcome email via API route (uses Resend server-side)
    try {
      await fetch("/api/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (e) {
      console.error("Welcome email failed:", e);
      // Don't block signup if email fails
    }

    setLoading(false);
    alert("Account created! Check your email to confirm your account.");
  };

  const login = async () => {
    if (!email || !password) return alert("Please enter email and password");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-slate-900">
            G
          </div>
          <span className="font-bold text-lg">Golf Charity</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">
          Welcome Back 👋
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Sign in or create a new account
        </p>

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
