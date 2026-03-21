"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";

export default function EBAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("users").select("id, full_name, email, preferred_committee").eq("role", "ADMIN").eq("status", "APPROVED")
      .then(({ data }) => setAdmins(data || []));
  }, []);

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
