'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import OverviewTab from './components/OverviewTab';
import MyCommitteeTab from './components/MyCommitteeTab';
import DocumentsTab from './components/DocumentsTab';
import AIFeedbackTab from './components/AIFeedbackTab';
import SpeechesTab from './components/SpeechesTab';
import BlocsTab from './components/BlocsTab';
import ResolutionBuilderTab from './components/ResolutionBuilderTab';
import ScheduleTab from './components/ScheduleTab';
import ResearchTab from './components/ResearchTab';
import {
  DashboardAnimatedTabPanel,
  DashboardHeader,
  DashboardLoadingState,
  DashboardTabBar,
} from '@/components/dashboard-shell';

const TABS = [
  'Overview',
  'My Committee',
  'Documents',
  'AI Feedback',
  'Speeches',
  'Blocs',
  'Resolution Builder',
  'Schedule',
  'Research',
] as const;

type TabName = (typeof TABS)[number];

export interface DelegateContext {
  user: any;
  assignment: any;
  committee: any;
  session: any;
  refreshData: () => Promise<void>;
}

export default function DelegateDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('Overview');

  // useQuery for User Profile
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Committee Assignment
  const { data: assignment, isLoading: assignmentLoading, refetch: refetchAssignment } = useQuery({
    queryKey: ['committee-assignment', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_assignments')
        .select('*')
        .eq('user_id', user!.id)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Committee Details
  const { data: committee, isLoading: committeeLoading } = useQuery({
    queryKey: ['committee', assignment?.committee_id],
    enabled: !!assignment?.committee_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('id', assignment!.committee_id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Committee Session
  const { data: committeeSession, refetch: refetchSession } = useQuery({
    queryKey: ['committee-session', assignment?.committee_id],
    enabled: !!assignment?.committee_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_sessions')
        .select('*')
        .eq('committee_id', assignment!.committee_id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 30 * 1000, // Shorter stale time for session status
  });

  // Real-time committee session subscription
  useEffect(() => {
    if (!assignment?.committee_id) return;
    
    const channel = supabase
      .channel(`dashboard-${user?.id || 'anonymous'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'committee_sessions',
          filter: `committee_id=eq.${assignment.committee_id}`,
        },
        () => {
          refetchSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignment?.committee_id, user?.id, refetchSession]);

  const loading = userLoading || (user && !assignment && assignmentLoading);

  const refreshData = useCallback(async () => {
    await Promise.all([refetchUser(), refetchAssignment(), refetchSession()]);
  }, [refetchUser, refetchAssignment, refetchSession]);

  if (loading) {
    return <DashboardLoadingState label="Loading delegate dashboard..." type={activeTab === 'Overview' ? 'overview' : 'list'} />;
  }

  if (!user && !userLoading) {
    router.push('/login');
    return null;
  }

  const ctx: DelegateContext = {
    user,
    assignment,
    committee,
    session: committeeSession,
    refreshData,
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader
        title="Delegate Dashboard"
        subtitle={committee?.name ? `${committee.name}${assignment?.country ? ` · ${assignment.country}` : ''}` : 'Committee assignment pending'}
      />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <DashboardAnimatedTabPanel activeKey={activeTab}>
          {activeTab === 'Overview' && <OverviewTab ctx={ctx} onTabChange={(tab) => setActiveTab(tab as TabName)} />}
          {activeTab === 'My Committee' && <MyCommitteeTab ctx={ctx} />}
          {activeTab === 'Documents' && <DocumentsTab ctx={ctx} />}
          {activeTab === 'AI Feedback' && <AIFeedbackTab ctx={ctx} />}
          {activeTab === 'Speeches' && <SpeechesTab ctx={ctx} />}
          {activeTab === 'Blocs' && <BlocsTab ctx={ctx} />}
          {activeTab === 'Resolution Builder' && <ResolutionBuilderTab ctx={ctx} />}
          {activeTab === 'Schedule' && <ScheduleTab ctx={ctx} />}
          {activeTab === 'Research' && <ResearchTab ctx={ctx} />}
        </DashboardAnimatedTabPanel>
      </div>
    </div>
  );
}