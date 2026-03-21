"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";

export default function EBChairsPage() {
  const [chairs, setChairs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("users").select("id, full_name, email, preferred_committee").eq("role", "CHAIR").eq("status", "APPROVED")
      .then(({ data }) => setChairs(data || []));
  }, []);

  return (
    <Card>
      <h1 className="text-2xl font-jotia-bold mb-4">Chairs</h1>
      <div className="space-y-2">
        {chairs.map((chair) => (
          <div key={chair.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
            <p className="text-sm font-semibold">{chair.full_name}</p>
            <p className="text-xs text-text-dimmed">{chair.email} · {chair.preferred_committee || "Unassigned"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
