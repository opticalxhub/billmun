"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, SectionLabel, Badge } from "@/components/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLoadingState } from "@/components/dashboard-shell";

export default function EBDashOverview() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser && !document.cookie.includes('emergency_expires=')) throw new Error('No session');
      if (!authUser) return { id: 'emergency', role: 'EXECUTIVE_BOARD' };
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      return data;
    },
  });

  const { data: ebData, isLoading: ebLoading } = useQuery({
    queryKey: ['eb-overview'],
    enabled: !!user?.id,
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        { count: totalUsers }, { count: pending }, { count: approved },
        { count: docsToday }, { count: messagesToday }, { count: aiToday },
        { count: openIncidents },
        { data: logs },
        { data: commData }
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('documents').select('id', { count: 'exact' }).gte('uploaded_at', startOfDay),
        supabase.from('messages').select('id', { count: 'exact' }).gte('created_at', startOfDay),
        supabase.from('ai_feedback').select('id', { count: 'exact' }).gte('created_at', startOfDay),
        supabase.from('security_incidents').select('id', { count: 'exact' }).neq('status', 'RESOLVED'),
        supabase.from('audit_logs').select('*, actor:actor_id(full_name)').order('performed_at', { ascending: false }).limit(30),
        supabase.from('committees').select('*, committee_sessions(id, status), chair:chair_id(full_name)')
      ]);

      // Process committees
      const processedComms = await Promise.all((commData || []).map(async (c: any) => {
        const sessionId = c.committee_sessions?.[0]?.id;
        let presentCount = 0;
        if (sessionId) {
          const { data: latestRollCall } = await supabase
            .from('roll_call_records')
            .select('id')
            .eq('session_id', sessionId)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestRollCall) {
            const { count } = await supabase
              .from('roll_call_entries')
              .select('id', { count: 'exact', head: true })
              .eq('roll_call_id', latestRollCall.id)
              .in('status', ['PRESENT', 'PRESENT_AND_VOTING']);
            presentCount = count || 0;
          }
        }
        return {
          id: c.id,
          name: c.name,
          chair_name: c.chair?.full_name || 'No Chair',
          session_status: c.committee_sessions?.[0]?.status || 'OFFLINE',
          present_count: presentCount,
        };
      }));

      return {
        stats: {
          totalUsers: totalUsers ?? 0,
          pending: pending ?? 0,
          approved: approved ?? 0,
          committeesInSession: commData?.filter(c => c.is_active)?.length ?? 0,
          documentsToday: docsToday ?? 0,
          messagesToday: messagesToday ?? 0,
          ai_analyses_today: aiToday ?? 0,
          open_incidents: openIncidents ?? 0,
        },
        activityFeed: logs || [],
        committees: processedComms
      };
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("eb-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => queryClient.invalidateQueries({ queryKey: ['eb-overview'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "committee_sessions" }, () => queryClient.invalidateQueries({ queryKey: ['eb-overview'] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "security_incidents" }, () => queryClient.invalidateQueries({ queryKey: ['eb-overview'] }))
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  if (userLoading || ebLoading) {
    return <DashboardLoadingState type="overview" />;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionLabel>Live Committee Grid</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {committees.map((c) => (
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
            {activityFeed.map((log) => (
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
  );
}
