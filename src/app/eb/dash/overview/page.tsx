"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLoadingState } from "@/components/dashboard-shell";
import { Notepad } from "@/components/notepad";

export default function EBDashOverview() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser && !document.cookie.includes('emergency_expires=')) throw new Error('No session');
      if (!authUser) return { id: 'emergency', role: 'EXECUTIVE_BOARD' };
      const { data } = await supabase.from('users').select('id, email, full_name, role, status, created_at, updated_at').eq('id', authUser.id).maybeSingle();
      return data;
    },
  });

  const { data: ebData, isLoading: ebLoading, isError: ebError } = useQuery({
    queryKey: ['eb-overview'],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch("/api/eb/overview", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load EB overview");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['eb-overview'] });
      }, 2000);
    };

    const channel = supabase
      .channel("eb-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, debouncedInvalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "committee_sessions" }, debouncedInvalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "security_incidents" }, debouncedInvalidate)
      .subscribe();
      
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (userLoading || ebLoading) {
    return <DashboardLoadingState type="overview" />;
  }
  if ((userError || ebError) && !ebData) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-4"><p className="text-status-rejected-text font-jotia text-lg">Failed to load EB overview.</p><button onClick={() => window.location.reload()} className="px-4 py-2 border border-border-subtle rounded-button text-sm hover:bg-bg-raised">Retry</button></div></div>;
  }

  const stats = ebData?.stats || { totalUsers: 0, pending: 0, approved: 0, committeesInSession: 0, documentsToday: 0, messagesToday: 0, ai_analyses_today: 0, open_incidents: 0 };
  const activityFeed = ebData?.activityFeed || [];
  const committees = ebData?.committees || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Overview</h1>
          <p className="text-sm text-text-dimmed">Executive Board global perspective</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <SectionLabel>Total Registered</SectionLabel>
          <div className="text-3xl font-bold mt-1">{stats.totalUsers}</div>
        </Card>
        <Card className="p-4">
          <SectionLabel>Pending Approval</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-pending-text">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <SectionLabel>Approved Users</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-approved-text">{stats.approved}</div>
        </Card>
        <Card className="p-4">
          <SectionLabel>Committees Active</SectionLabel>
          <div className="text-3xl font-bold mt-1">{stats.committeesInSession}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <SectionLabel>Documents Today</SectionLabel>
          <div className="text-3xl font-bold mt-1">{stats.documentsToday}</div>
        </Card>
        <Card className="p-4">
          <SectionLabel>Messages Today</SectionLabel>
          <div className="text-3xl font-bold mt-1">{stats.messagesToday}</div>
        </Card>
        <Card className="p-4">
          <SectionLabel>AI Analyses Today</SectionLabel>
          <div className="text-3xl font-bold mt-1">{stats.ai_analyses_today}</div>
        </Card>
        <Card className="p-4 border-status-rejected-border bg-status-rejected-bg/10">
          <SectionLabel>Open Security Incidents</SectionLabel>
          <div className="text-3xl font-bold mt-1 text-status-rejected-text">{stats.open_incidents}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <SectionLabel>Live Committee Grid</SectionLabel>
              <div className="grid grid-cols-1 gap-3 mt-4">
                {committees.map((c: any) => (
                  <div key={c.id} className="p-3 rounded border border-border-subtle bg-bg-raised">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold">{c.name}</span>
                      <Badge variant={c.session_status === 'ACTIVE' ? 'approved' : 'default'}>{c.session_status}</Badge>
                    </div>
                    <div className="text-xs text-text-secondary flex justify-between">
                      <span>Chair: {c.chair_name}</span>
                      <span>Present: {c.present_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card>
              <SectionLabel>Live Activity Feed</SectionLabel>
              <div className="space-y-3 mt-4 max-h-[400px] overflow-auto pr-2">
                {activityFeed.length === 0 && <p className="text-xs text-text-dimmed">No recent activity</p>}
                {activityFeed.map((log: any) => (
                  <div key={log.id} className="text-sm pb-3 border-b border-border-subtle last:border-0">
                    <div className="flex items-start justify-between">
                      <span className="font-medium">{log.actor?.full_name || 'System'}</span>
                      <span className="text-[10px] text-text-dimmed">{new Date(log.performed_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-text-secondary mt-1">{log.action}</p>
                    {log.target_type && <p className="text-[10px] text-text-dimmed mt-1 uppercase">{log.target_type} : {log.target_id?.slice(0,8)}</p>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-4">
          {user?.id && <Notepad dashboardKey="EB_OVERVIEW" userId={user.id} />}
        </div>
      </div>
    </div>
  );
}
