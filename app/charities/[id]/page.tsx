"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  if (!charity) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
      <p className="text-gray-400">Charity not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold">Golf Charity</h1>
        <div className="flex gap-4">
          <a href="/charities" className="text-sm text-gray-400 hover:text-white transition">← All Charities</a>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {charity.is_featured && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full mb-4 inline-block">
            ⭐ Featured Charity
          </span>
        )}

        <h2 className="text-4xl font-bold mb-6">{charity.name}</h2>

        {charity.image_url && (
          <img
            src={charity.image_url}
            alt={charity.name}
            className="w-full h-64 object-cover rounded-2xl mb-8"
          />
        )}

        <div className="bg-slate-800 rounded-2xl p-8 mb-6">
          <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">About</h3>
          <p className="text-gray-300 leading-relaxed text-lg">
            {charity.description || "No description available."}
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 mb-6">
          <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">How Your Contribution Helps</h3>
          <p className="text-gray-300 leading-relaxed">
            A portion of every Golf Charity subscription goes directly to {charity.name}. 
            You can increase your contribution percentage from your dashboard at any time.
          </p>
        </div>

        
          href="/dashboard"
          className="block text-center bg-green-500 hover:bg-green-600 py-4 rounded-xl font-medium transition"
        >
          Support This Charity — Go to Dashboard
        </a>
      </div>
    </div>
  );
}