"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

type Event = {
  title: string;
  date: string;
  location: string;
  description: string;
  spots: number;
  status: "open" | "coming" | "closed";
};

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
  events: Event[];
};

export default function CharityDetailPage() {
  const { id } = useParams();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCharity();
  }, [id]);

  const fetchCharity = async () => {
    const { data } = await supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .single();

    setCharity(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!charity) {
    return <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white flex items-center justify-center">Charity not found.</div>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-white">
      {/* Top Nav */}
      <div className="flex justify-between items-center px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-2xl font-serif tracking-tighter">Golf Charity</Link>
        <div className="flex gap-6 text-sm">
          <Link href="/charities" className="hover:text-emerald-400 transition">← All Charities</Link>
          <Link href="/dashboard" className="hover:text-emerald-400 transition">Dashboard</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {charity.is_featured && (
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs px-4 py-2 rounded-3xl mb-6">
            ⭐ Featured Charity
          </span>
        )}

        <h1 className="text-5xl font-serif tracking-tighter mb-4">{charity.name}</h1>

        {charity.image_url && (
          <img
            src={charity.image_url}
            alt={charity.name}
            className="w-full h-80 object-cover rounded-3xl mb-10 shadow-2xl"
          />
        )}

        {/* Impact Bar */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white/5 rounded-3xl p-6 text-center">
            <div className="text-emerald-400 text-4xl font-mono font-bold">₹2.4L</div>
            <div className="text-xs text-zinc-400 tracking-widest mt-1">RAISED THIS MONTH</div>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 text-center">
            <div className="text-emerald-400 text-4xl font-mono font-bold">184</div>
            <div className="text-xs text-zinc-400 tracking-widest mt-1">GOLFERS SUPPORTING</div>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 text-center">
            <div className="text-emerald-400 text-4xl font-mono font-bold">3</div>
            <div className="text-xs text-zinc-400 tracking-widest mt-1">UPCOMING EVENTS</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl p-8 mb-12">
          <h3 className="uppercase text-xs tracking-[1px] text-zinc-400 mb-4">Our Story</h3>
          <p className="text-lg leading-relaxed text-zinc-300">
            {charity.description || "No description available."}
          </p>
        </div>

        {/* === UPCOMING EVENTS — DYNAMIC & BEAUTIFUL === */}
        <div className="mb-12">
          <h3 className="text-2xl font-medium mb-6 flex items-center gap-3">
            📅 Upcoming Golf Days &amp; Events
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {charity.events && charity.events.length > 0 ? (
              charity.events.map((event: Event, i: number) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 hover:border-emerald-400/30 rounded-3xl p-6 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-xl group-hover:text-emerald-400 transition">
                        {event.title}
                      </h4>
                      <p className="text-emerald-400 font-medium mt-1">
                        {formatDate(event.date)}
                      </p>
                      <p className="text-zinc-400 text-sm mt-1">{event.location}</p>
                    </div>
                    <span
                      className={`text-xs px-4 py-1 rounded-2xl font-medium ${
                        event.status === "open"
                          ? "bg-emerald-400 text-black"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {event.status === "open" ? "REGISTRATION OPEN" : "COMING SOON"}
                    </span>
                  </div>

                  <p className="text-zinc-400 mt-6 text-sm leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-8 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      👥 <span className="font-mono">{event.spots} spots left</span>
                    </div>
                    <button className="px-6 py-3 bg-white text-black font-medium rounded-2xl hover:scale-105 transition">
                      Join the Day →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400">No upcoming events yet.</p>
            )}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="block w-full text-center bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 py-6 rounded-3xl text-xl font-bold shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1"
        >
          Support {charity.name} from Dashboard
        </Link>
      </div>
    </div>
  );
}