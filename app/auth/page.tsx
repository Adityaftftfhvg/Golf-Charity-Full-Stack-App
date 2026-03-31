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

    fetch("/api/send-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    if (data.session) {
      window.location.replace("/dashboard");
      return;
    }

    setMessage({
      text: "Account created! Check your email to confirm, then log in.",
      type: "success"
    });
    setLoading(false);
  };

  const signInWithProvider = async (provider: "google" | "facebook" | "azure") => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage({ text: error.message, type: "error" });
      setLoading(false);
    }
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
          className="p-3 text-white bg-slate-700 border border-slate-600 focus:border-green-500 focus:outline-none w-full mb-4 rounded-lg transition"
        />

        <input
          placeholder="Password (min 6 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          className="p-3 text-white bg-slate-700 border border-slate-600 focus:border-green-500 focus:outline-none w-full mb-6 rounded-lg transition"
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-3 text-gray-500">or continue with</span>
          </div>
        </div>

        {/* Social OAuth Buttons */}
        <div className="space-y-3">

          <button
            onClick={() => signInWithProvider("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border border-slate-600 p-3 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signInWithProvider("facebook")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 p-3 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4 shrink-0" fill="white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          <button
            onClick={() => signInWithProvider("azure")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border border-slate-600 p-3 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Continue with Microsoft
          </button>

        </div>

        <p className="text-gray-500 text-xs text-center mt-6">
          By signing up you agree to support great causes 💚
        </p>
      </div>
    </div>
  );
}