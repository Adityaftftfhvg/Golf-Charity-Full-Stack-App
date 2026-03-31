"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
};

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase
      .from("charities")
      .select("id, name, description, image_url, is_featured")
      .order("is_featured", { ascending: false })
      .order("name");
    setCharities(data || []);
    setLoading(false);
  };

  const filtered = charities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.filter((c) => c.is_featured);
  const regular = filtered.filter((c) => !c.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white">

      {/* HEADER */}
      <div className="flex justify-between items-center px-8 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold">Golf Charity</h1>
        <div className="flex gap-4">
          <a href="/" className="text-sm text-gray-400 hover:text-white transition">Home</a>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* HERO */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Our Charities</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Every subscription contributes directly to these causes. Choose the one closest to your heart.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mb-10">
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading charities...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400">No charities found.</p>
        ) : (
          <>
            {/* FEATURED */}
            {featured.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">Featured</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featured.map((c) => (
                    // ✅ Clickable — links to charity detail page
                    <div
                      key={c.id}
                      onClick={() => window.location.href = `/charities/${c.id}`}
                      className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 hover:bg-slate-700 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-xl font-bold">{c.name}</h4>
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          Featured
                        </span>
                      </div>
                      {c.image_url && (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {c.description || "No description available."}
                      </p>
                      {/* ✅ View details link */}
                      <p className="text-yellow-400 text-xs mt-4 font-medium">
                        View details →
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALL CHARITIES */}
            {regular.length > 0 && (
              <div>
                <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
                  {featured.length > 0 ? "All Charities" : "Charities"}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regular.map((c) => (
                    // ✅ Clickable — links to charity detail page
                    <div
                      key={c.id}
                      onClick={() => window.location.href = `/charities/${c.id}`}
                      className="bg-slate-800 rounded-2xl p-5 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {c.image_url && (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h4 className="text-lg font-semibold mb-2">{c.name}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {c.description || "No description available."}
                      </p>
                      {/* ✅ View details link */}
                      <p className="text-green-400 text-xs mt-3 font-medium">
                        View details →
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
