"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email!");
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-full max-w-md">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Welcome Back 👋
        </h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 text-white w-full mb-4 rounded"
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 text-white w-full mb-4 rounded"
        />

        <button onClick={login} className="bg-green-500 w-full p-3 mb-2 rounded">
          Login
        </button>

        <button onClick={signUp} className="bg-purple-600 w-full p-3 rounded">
          Sign Up
        </button>

      </div>
    </div>
  );
}