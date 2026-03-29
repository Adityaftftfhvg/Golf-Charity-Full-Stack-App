"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6">
        <h1 className="text-2xl font-bold">Golf Charity</h1>
        <button
          onClick={() => router.push("/auth")}
          className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Login
        </button>
      </div>

      {/* HERO */}
      <div className="text-center mt-20 px-6">
        <h1 className="text-5xl font-bold mb-6">
          Play Golf. Win. Give Back ❤️
        </h1>

        <p className="text-gray-300 max-w-xl mx-auto mb-8">
          Enter scores, participate in draws, and support charities — all in one place.
        </p>

        <button
          onClick={() => router.push("/auth")}
          className="bg-green-500 px-6 py-3 rounded-lg text-lg hover:bg-green-600"
        >
          Get Started 🚀
        </button>
      </div>

      {/* FEATURES */}
      <div className="grid md:grid-cols-3 gap-6 px-10 mt-20">
        {[
          { title: "🎯 Track Scores", desc: "Keep last 5 scores smartly" },
          { title: "🎲 Monthly Draws", desc: "Fair automated system" },
          { title: "❤️ Charity", desc: "Support real causes" },
        ].map((f, i) => (
          <div key={i} className="bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl mb-2">{f.title}</h2>
            <p className="text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}