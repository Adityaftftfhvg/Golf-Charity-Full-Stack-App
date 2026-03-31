"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type WinnerRecord = {
  id: string;
  proof_url: string | null;
  status: string; // ✅ was incorrectly "payment_status" — now matches DB schema
};

export default function ProofUpload({ userId }: { userId: string }) {
  const [winner, setWinner] = useState<WinnerRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchWinnerStatus();
  }, [userId]);

  const fetchWinnerStatus = async () => {
    const { data } = await supabase
      .from("winners")
      .select("id, proof_url, status") // ✅ fixed: was selecting "payment_status, verified" — correct field is "status"
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setWinner(data ?? null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !winner) return;

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${winner.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("winner-proofs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("winner-proofs")
      .getPublicUrl(filePath);

    await supabase
      .from("winners")
      .update({ proof_url: urlData.publicUrl })
      .eq("id", winner.id);

    setMessage("Proof uploaded successfully!");
    fetchWinnerStatus();
    setUploading(false);
  };

  // Only render for actual winners
  if (!winner) return null;

  return (
    <div className="bg-white/10 rounded-xl p-5 space-y-3">
      <h3 className="text-lg font-semibold">Winner Verification</h3>

      <p className="text-sm text-gray-300">
        You are a winner! Please upload a screenshot of your scores as proof.
      </p>

      {winner.proof_url ? (
        <div className="space-y-2">
          <p className="text-green-400 text-sm">✓ Proof already submitted</p>
          <p className="text-sm text-gray-400">
            Status:{" "}
            <span
              className={`font-medium ${
                winner.status === "paid"
                  ? "text-green-400"
                  : winner.status === "approved"
                  ? "text-blue-400"
                  : winner.status === "rejected"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {/* ✅ fixed: now reads winner.status instead of winner.payment_status */}
              {winner.status === "pending"
                ? "Pending review"
                : winner.status === "approved"
                ? "Approved — payout processing"
                : winner.status === "paid"
                ? "Paid ✓"
                : winner.status === "rejected"
                ? "Rejected — contact support"
                : winner.status}
            </span>
          </p>
          {winner.status !== "paid" && winner.status !== "rejected" && (
            <label className="block text-sm text-purple-400 cursor-pointer hover:underline">
              Replace proof
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : (
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-purple-500 rounded-lg p-6 text-center hover:border-purple-400 transition">
            <p className="text-sm text-gray-300">
              {uploading
                ? "Uploading..."
                : "Click to upload your proof screenshot"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WEBP or PDF · Max 5MB
            </p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {message && <p className="text-sm text-green-400">{message}</p>}
    </div>
  );
}
