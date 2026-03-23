"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, Badge } from "@/components/ui";
import { DashboardLoadingState } from "@/components/dashboard-shell";

export default function CommitteesDashPage() {
  const [committees, setCommittees] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const [{ data: comms }, { data: assigns }] = await Promise.all([
          supabase.from("committees").select("*").order("name"),
          supabase.from("committee_assignments").select("committee_id"),
        ]);

        const counts: Record<string, number> = {};
        assigns?.forEach(a => {
          counts[a.committee_id] = (counts[a.committee_id] || 0) + 1;
        });

        if (comms) {
          setCommittees(comms.map(c => ({
            ...c,
            delegate_count: counts[c.id] || 0
          })));
        }
      } catch (error) {
        console.error("Error fetching committees:", error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCommittees();
  }, []);

  if (loading) {
    return <DashboardLoadingState type="overview" />;
  }
  if (fetchError) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load committees.</p><button onClick={() => window.location.reload()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jotia-bold text-3xl uppercase tracking-tight">Committees</h1>
        <p className="text-text-dimmed text-sm">Real-time committee oversight and delegate management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map((c) => (
          <Card key={c.id} className="flex flex-col border-border-subtle hover:border-border-emphasized transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="font-jotia-bold text-xl">{c.abbreviation}</div>
              <Badge variant={c.is_active ? 'approved' : 'default'}>{c.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
            </div>
            <p className="text-sm text-text-secondary flex-1 mb-6">{c.name}</p>
            <div className="flex justify-between items-end pt-4 border-t border-border-subtle">
              <div>
                <span className="text-[10px] uppercase text-text-dimmed block mb-1">Delegates</span>
                <span className="text-xl font-bold">{c.delegate_count}</span>
              </div>
              <Link 
                href={`/eb/dash/committees/${c.id}`} 
                className="text-xs font-bold uppercase tracking-widest hover:text-text-primary text-text-secondary transition-colors"
              >
                Manage &rarr;
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
