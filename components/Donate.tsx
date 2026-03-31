"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Charity = {
  id: string;
  name: string;
};

export default function Donate({ userId }: { userId: string }) {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState("");
  const [amount, setAmount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const presets = [5, 10, 25, 50];

  useEffect(() => {
    fetchCharities();
    checkReturnStatus();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase
      .from("charities")
      .select("id, name")
      .order("name");
    setCharities(data || []);
    if (data && data.length > 0) setCharityId(data[0].id);
  };

  const checkReturnStatus = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success" && params.get("type") === "donation") {
      setMessage("Thank you for your donation! 💚");
    } else if (params.get("payment") === "failed") {
      setMessage("Payment failed. Please try again.");
    }
  };

const handleDonate = async () => {
  if (!charityId || amount < 1) return;
  setLoading(true);

  try {
    const res = await fetch("/api/phonepe/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        userId,
        type: "donation",
        charityId,
      }),
    });

    const data = await res.json();
    console.log("PhonePe response in browser:", data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      setMessage(
        `Error: ${data.phonePeCode || data.error || "Unknown error"} — ${data.phonePeMessage || ""}`
      );
      setLoading(false);
    }
  } catch (err: any) {
    console.error("Fetch error:", err);
    setMessage("Network error: " + err.message);
    setLoading(false);
  }
};

  return (
    <div className="bg-slate-800 p-6 rounded-xl space-y-4">
      <div>
        <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-1">
          Make a Donation
        </h3>
        <p className="text-xs text-gray-500">
          One-time donation — independent of your subscription
        </p>
      </div>

      {/* Status message */}
      {message && (
        <p className={`text-sm font-medium ${
          message.includes("Thank you") ? "text-green-400" : "text-red-400"
        }`}>
          {message}
        </p>
      )}

      {/* Charity selector */}
      {charities.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No charities available yet. Ask an admin to add some!
        </p>
      ) : (
        <select
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="w-full p-3 rounded-lg text-black text-sm"
        >
          {charities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Amount presets */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Select amount</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`py-2 rounded-lg text-sm font-medium transition ${
                amount === p
                  ? "bg-green-500 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              ₹{p}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3">
          <span className="text-gray-400 text-sm">₹</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full py-2 bg-transparent text-white text-sm outline-none"
            placeholder="Custom amount"
          />
        </div>
      </div>

      {/* Donate button */}
      <button
        onClick={handleDonate}
        disabled={loading || !charityId || amount < 1}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
            Redirecting to PhonePe...
          </>
        ) : (
          `Donate ₹${amount}`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secured by PhonePe · 100% goes to the charity
      </p>
    </div>
  );
}
