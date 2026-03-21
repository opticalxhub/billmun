"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";

export default function PressDashboardPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("press_releases").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);

  return (
    <Card>
      <h1 className="text-2xl font-jotia-bold mb-4">Press Releases Review</h1>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
            <p className="text-sm font-semibold">{row.title}</p>
            <p className="text-xs text-text-dimmed">{row.status || "PENDING"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
