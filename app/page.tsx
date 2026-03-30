"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
};

export default function HomePage() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [session, setSession] = useState<boolean>(false);

  useEffect(() => {
    checkSession();
    fetchFeaturedCharity();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(!!session);
  };

  const fetchFeaturedCharity = async () => {
    const { data } = await supabase
      .from("charities")
      .select("id, name, description, image_url")
      .eq("is_featured", true)
      .limit(1)
      .single();
    if (data) setFeaturedCharity(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">G</div>
          <span className="font-bold text-lg">Golf Charity</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/charities" className="text-sm text-gray-400 hover:text-white transition">Charities</a>
          {session ? (
            <a href="/dashboard" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium transition">
              Dashboard
            </a>
          ) : (
            <a href="/auth" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium transition">
              Get Started
            </a>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-green-500/10 border border-green-500/30 text-green-400 text-xs px-3 py-1 rounded-full mb-6">
          Play Golf. Win Prizes. Support Charities.
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Every Round You Play<br />
          <span className="text-green-400">Makes a Difference</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">
          Submit your golf scores, enter monthly prize draws, and automatically donate a portion of your subscription to a charity you care about.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={session ? "/dashboard" : "/auth"}
            className="bg-green-500 hover:bg-green-600 px-8 py-4 rounded-xl text-lg font-medium transition"
          >
            {session ? "Go to Dashboard" : "Start Playing"}
          </a>
          <a
            href="/charities"
            className="bg-slate-700 hover:bg-slate-600 px-8 py-4 rounded-xl text-lg font-medium transition"
          >
            View Charities
          </a>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Subscribe",
              description: "Choose a monthly or yearly plan. A portion of every subscription goes directly to your chosen charity.",
              color: "bg-purple-500",
            },
            {
              step: "2",
              title: "Submit Your Scores",
              description: "After each round, enter your golf score (1–45). Your 5 most recent scores are used in the monthly draw.",
              color: "bg-green-500",
            },
            {
              step: "3",
              title: "Win Prizes",
              description: "Each month, 5 numbers are drawn. Match 3, 4, or all 5 of your scores to win a share of the prize pool.",
              color: "bg-yellow-500",
            },
          ].map((item) => (
            <div key={item.step} className="bg-slate-800 rounded-2xl p-6 text-center">
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4`}>
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRIZE STRUCTURE */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Prize Structure</h2>
        <p className="text-center text-gray-400 mb-10">Monthly prize pool split across three winner tiers</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { match: "5 Numbers", share: "40%", label: "Jackpot", color: "border-yellow-500/50 bg-yellow-500/5", badge: "bg-yellow-500/20 text-yellow-400" },
            { match: "4 Numbers", share: "35%", label: "Second Prize", color: "border-purple-500/50 bg-purple-500/5", badge: "bg-purple-500/20 text-purple-400" },
            { match: "3 Numbers", share: "25%", label: "Third Prize", color: "border-green-500/50 bg-green-500/5", badge: "bg-green-500/20 text-green-400" },
          ].map((tier) => (
            <div key={tier.match} className={`border ${tier.color} rounded-2xl p-6 text-center`}>
              <span className={`text-xs px-2 py-1 rounded-full ${tier.badge} mb-4 inline-block`}>{tier.label}</span>
              <p className="text-4xl font-bold mb-2">{tier.share}</p>
              <p className="text-gray-400 text-sm">of prize pool</p>
              <p className="text-white font-medium mt-3">{tier.match} matched</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CHARITY */}
      {featuredCharity && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Featured Charity</h2>
          <div className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center">
            {featuredCharity.image_url && (
              <img
                src={featuredCharity.image_url}
                alt={featuredCharity.name}
                className="w-full md:w-48 h-48 object-cover rounded-xl flex-shrink-0"
              />
            )}
            <div>
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full mb-3 inline-block">Featured</span>
              <h3 className="text-2xl font-bold mb-3">{featuredCharity.name}</h3>
              <p className="text-gray-400 leading-relaxed mb-4">{featuredCharity.description}</p>
              <a href="/charities" className="text-green-400 hover:text-green-300 text-sm transition">
                View all charities →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-green-500/20 to-purple-500/20 border border-green-500/20 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to Play?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of golfers making an impact with every round they play.
          </p>
          <a
            href={session ? "/dashboard" : "/auth"}
            className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-xl text-lg font-medium transition inline-block"
          >
            {session ? "Go to Dashboard" : "Join Now — It's Free to Start"}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-700/50 px-8 py-6 flex justify-between items-center text-gray-500 text-sm">
        <span>© 2026 Golf Charity. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="/charities" className="hover:text-white transition">Charities</a>
          <a href="/auth" className="hover:text-white transition">Sign In</a>
        </div>
      </footer>

    </div>
  );
}
