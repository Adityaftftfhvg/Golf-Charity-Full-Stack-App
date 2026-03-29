"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CharitySelect({ userId }: { userId: string }) {
  const [charities, setCharities] = useState<any[]>([]);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };

  const selectCharity = async (id: string) => {
    await supabase.from("users").update({ charity_id: id }).eq("id", userId);
    alert("Charity selected!");
  };

return (
  <div className="grid gap-2">
    {charities.map((c) => (
      <div
        key={c.id}
        onClick={() => selectCharity(c.id)}
        className="bg-slate-700 p-3 rounded cursor-pointer hover:bg-slate-600"
      >
        {c.name}
      </div>
    ))}
  </div>
);
}