"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, Badge, SectionLabel } from "@/components/ui";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { ChevronRight } from "lucide-react";

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

  const regularCommittees = committees.filter(c => !['ICJ', 'CRISIS', 'SC', 'UNSC'].includes(c.abbreviation?.toUpperCase()));
  const specialCommittees = committees.filter(c => ['ICJ', 'CRISIS', 'SC', 'UNSC'].includes(c.abbreviation?.toUpperCase()));

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-jotia-bold text-3xl uppercase tracking-tight">Committees</h1>
          <p className="text-text-dimmed text-sm">Real-time committee oversight and delegate management.</p>
        </div>
      </div>

      {specialCommittees.length > 0 && (
        <div className="space-y-6">
          <SectionLabel className="text-status-approved-text border-status-approved-border/30">Special Committees</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialCommittees.map((c) => (
              <CommitteeCard key={c.id} c={c} isSpecial />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <SectionLabel>Regular Committees</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularCommittees.map((c) => (
            <CommitteeCard key={c.id} c={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CommitteeCard({ c, isSpecial }: { c: any, isSpecial?: boolean }) {
  return (
    <Card className={`flex flex-col transition-all border-border-subtle hover:border-border-emphasized ${isSpecial ? 'bg-status-approved-bg/5 border-status-approved-border/20' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="font-jotia-bold text-xl flex items-center gap-2">
          {c.abbreviation}
          {isSpecial && <span className="text-[10px] bg-status-approved-bg text-status-approved-text px-1.5 py-0.5 rounded-full font-black">SPECIAL</span>}
        </div>
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
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest hover:text-text-primary text-text-secondary transition-colors"
        >
          Manage
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}