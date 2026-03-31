"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  useEffect(() => {
    // Listen for session (handles hash-based OAuth from Google/Facebook/Microsoft)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        listener.subscription.unsubscribe();
        window.location.replace("/dashboard");
      }
    });

    // Also check immediately in case session already exists (handles code-based OAuth)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        listener.subscription.unsubscribe();
        window.location.replace("/dashboard");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}