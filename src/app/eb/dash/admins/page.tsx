"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";

export default function EBAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase.from("users").select("id, full_name, email, preferred_committee").eq("role", "ADMIN").eq("status", "APPROVED");
        if (err) throw err;
        setAdmins(data || []);
      } catch { setError(true); }
    })();
  }, []);

  if (error) return <Card><p className="text-status-rejected-text">Failed to load admins.</p><button onClick={() => window.location.reload()} className="text-xs underline mt-2">Retry</button></Card>;

  return (
    <Card>
      <h1 className="text-2xl font-jotia-bold mb-4">Admin Team</h1>
      <div className="space-y-2">
        {admins.map((admin) => (
          <div key={admin.id} className="p-3 rounded-card border border-border-subtle bg-bg-raised">
            <p className="text-sm font-semibold">{admin.full_name}</p>
            <p className="text-xs text-text-dimmed">{admin.email} · {admin.preferred_committee || "Unassigned"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
