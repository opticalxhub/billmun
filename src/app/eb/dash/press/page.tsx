"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";

export default function PressDashboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase.from("press_releases").select("*").order("created_at", { ascending: false });
        if (err) throw err;
        setRows(data || []);
      } catch { setError(true); }
    })();
  }, []);

  if (error) return <Card><p className="text-status-rejected-text">Failed to load press releases.</p><button onClick={() => window.location.reload()} className="text-xs underline mt-2">Retry</button></Card>;

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
