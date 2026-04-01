'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import WhatsAppTab from '@/components/whatsapp-tab';
import { Notepad } from '@/components/notepad';
import { AnnouncementBanner } from '@/components/announcement-banner';
import {
  DashboardAnimatedTabPanel,
  DashboardHeader,
  DashboardLoadingState,
  DashboardTabBar,
} from '@/components/dashboard-shell';
// LoadingSpinner available from loading-spinner if needed

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
  'WhatsApp',
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

  // Single consolidated API call for all delegate dashboard data
  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['delegate-dashboard'],
    queryFn: async () => {
      // Emergency Override Check
      if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
        return {
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'emergency@billmun.gomarai.com',
            full_name: 'MR. Abdulrahman',
            role: 'EXECUTIVE_BOARD',
            status: 'APPROVED',
            has_completed_onboarding: true
          },
          assignment: null,
          committee: null,
          committeeSession: null,
        };
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No session');
      
      const res = await fetch(`/api/delegate/dashboard?userId=${authUser.id}`);
      if (!res.ok) throw new Error('Failed to load dashboard data');
      return await res.json();
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const user = dashData?.user ?? null;
  const assignment = dashData?.assignment ?? null;
  const committee = dashData?.committee ?? null;
  const committeeSession = dashData?.committeeSession ?? null;
  const userLoading = dashLoading;
  const assignmentLoading = dashLoading;

  // Alias refetch for session-specific refresh
  const refetchSession = refetchDash;

  // Stable ref for refetchSession to avoid stale closures in subscription
  const refetchSessionRef = useRef(refetchSession);
  refetchSessionRef.current = refetchSession;

  // Real-time committee session subscription
  useEffect(() => {
    if (!assignment?.committee_id) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const channel = supabase
      .channel(`delegate-session-${assignment.committee_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'committee_sessions',
          filter: `committee_id=eq.${assignment.committee_id}`,
        },
        () => {
          // Debounce: only refetch once per 2s window to prevent cascading refreshes
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => refetchSessionRef.current(), 2000);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [assignment?.committee_id]);

  // Determine if we should show the full-page loader
  // Only show it on initial load of user OR if we're waiting for assignment to finish initial load
  const isInitialLoading = userLoading || (!!user && assignmentLoading && !assignment);

  const refreshData = useCallback(async () => {
    await refetchDash();
  }, [refetchDash]);

  // Memoize ctx to prevent unnecessary re-renders of all tabs
  const ctx: DelegateContext = useMemo(() => {
    if (!user) return null as any;
    return {
      user,
      assignment,
      committee,
      session: committeeSession,
      refreshData,
    };
  }, [user, assignment, committee, committeeSession, refreshData]);

  if (isInitialLoading) {
    return <DashboardLoadingState type="overview" />;
  }

  if (!user && !userLoading) {
    router.push('/login');
    return null;
  }

  const renderTabContent = () => {
    if (!ctx) return null;

    switch (activeTab) {
      case 'Overview': return <OverviewTab ctx={ctx} onTabChange={(tab) => setActiveTab(tab as TabName)} />;
      case 'My Committee': return <MyCommitteeTab ctx={ctx} />;
      case 'Documents': return <DocumentsTab ctx={ctx} />;
      case 'AI Feedback': return <AIFeedbackTab ctx={ctx} />;
      case 'Speeches': return <SpeechesTab ctx={ctx} />;
      case 'Blocs': return <BlocsTab ctx={ctx} />;
      case 'Resolution Builder': return <ResolutionBuilderTab ctx={ctx} />;
      case 'Schedule': return <ScheduleTab ctx={ctx} />;
      case 'Research': return <ResearchTab ctx={ctx} />;
      case 'WhatsApp': return <WhatsAppTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader
        user={user}
        title="Delegate Portal"
        subtitle={committee?.name || "Access your delegate workspace"}
        committeeName={committee?.name}
      />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <AnnouncementBanner user={user} committeeId={assignment?.committee_id} />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <div className="xl:col-span-8">
          <DashboardAnimatedTabPanel activeKey={activeTab}>
            {renderTabContent()}
          </DashboardAnimatedTabPanel>
        </div>

        <div className="xl:col-span-4 space-y-4 sm:space-y-6">
          <Notepad dashboardKey="DELEGATE" userId={user?.id} />
        </div>
      </div>
    </div>
  );
}