"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, Badge } from "@/components/ui";

export default function EBMediaPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("media_gallery").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);

  return (
    <Card>
      <h1 className="text-2xl font-jotia-bold mb-4">Media Review</h1>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{row.caption || "Untitled media"}</p>
              <p className="text-xs text-text-dimmed">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</p>
            </div>
            <Badge variant={(row.status || "pending").toLowerCase()}>{row.status || "PENDING"}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
