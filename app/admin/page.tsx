"use client";

import { generateDraw } from "@/lib/draw";
import { supabase } from "@/lib/supabase";

export default function Admin() {
  const runDraw = async () => {
    const numbers = generateDraw();

    await supabase.from("draws").insert({
      numbers,
      month: "March",
    });

    alert("Draw created!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white">

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg max-w-md mx-auto text-center">

        <h1 className="text-2xl mb-6">Admin Panel</h1>

        <button
          onClick={runDraw}
          className="bg-red-500 px-6 py-3 rounded-lg hover:bg-red-600"
        >
          Run Monthly Draw 🎲
        </button>

      </div>

    </div>
  );
}