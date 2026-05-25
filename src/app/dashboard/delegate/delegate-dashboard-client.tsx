'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import OverviewTab from './components/OverviewTab';
import MyCommitteeTab from './components/MyCommitteeTab';
import DocumentsTab from './components/DocumentsTab';
import AIFeedbackTab from './components/AIFeedbackTab';
import BlocsTab from './components/BlocsTab';
import ResolutionBuilderTab from './components/ResolutionBuilderTab';
import ScheduleTab from './components/ScheduleTab';
import ResearchTab from './components/ResearchTab';
import SpeechWorkspace from './components/SpeechWorkspace';
import ICJProceedingsTab from './components/ICJProceedingsTab';
import CrisisUpdatesTab from './components/CrisisUpdatesTab';
import { Notepad } from '@/components/notepad';
import { AnnouncementBanner } from '@/components/announcement-banner';
import {
  DashboardAnimatedTabPanel,
  DashboardHeader,
  DashboardLoadingState,
  DashboardTabBar,
} from '@/components/dashboard-shell';
import InteractiveOnboarding from '@/components/interactive-onboarding';
import { useConferenceGate } from '@/lib/use-conference-gate';
import { ConferenceLockScreen } from '@/components/conference-lock-screen';
import type { DelegateDashboardData } from '@/types/portal';
import type { DelegateContext } from './page';

const DEFAULT_TABS = [
  'Overview',
  'My Committee',
  'Documents',
  'Speeches & Research',
  'Resolutions & Blocs',
  'Schedule',
] as const;

const ICJ_TABS = [
  'Overview',
  'My Committee',
  'Court Proceedings',
  'Documents',
  'Speeches & Research',
  'Schedule',
] as const;

const CRISIS_TABS = [
  'Overview',
  'My Committee',
  'Crisis Updates',
  'Documents',
  'Speeches & Research',
  'Resolutions & Blocs',
  'Schedule',
] as const;

type TabName = string;

type DelegateDashboardClientProps = {
  initialData: DelegateDashboardData | null;
  emergencyAccess: boolean;
};

export default function DelegateDashboardClient({
  initialData,
  emergencyAccess,
}: DelegateDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['delegate-dashboard', initialData?.user?.id ?? 'anonymous'],
    enabled: !emergencyAccess,
    initialData: initialData ?? undefined,
    queryFn: async () => {
      const res = await fetch('/api/delegate/dashboard', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }

      return (await res.json()) as DelegateDashboardData;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const user = dashData?.user ?? initialData?.user ?? null;
  const assignment = dashData?.assignment ?? initialData?.assignment ?? null;
  const committee = dashData?.committee ?? initialData?.committee ?? null;
  const committeeSession = dashData?.committeeSession ?? initialData?.committeeSession ?? null;

  useEffect(() => {
    if (user && !user.has_completed_onboarding && user.id !== '00000000-0000-0000-0000-000000000000') {
      setShowOnboarding(true);
    }
  }, [user]);

  const refetchSessionRef = useRef(refetchDash);
  refetchSessionRef.current = refetchDash;

  useEffect(() => {
    if (!assignment?.committee_id) {
      return;
    }

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
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            void refetchSessionRef.current();
          }, 2000);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      void supabase.removeChannel(channel);
    };
  }, [assignment?.committee_id]);

  const refreshData = useCallback(async () => {
    await refetchDash();
  }, [refetchDash]);

  const ctx = useMemo<DelegateContext | null>(() => {
    if (!user) {
      return null;
    }

    return {
      user,
      assignment,
      committee,
      session: committeeSession,
      settings: dashData?.settings || initialData?.settings || null,
      stats: dashData?.stats || initialData?.stats || { documents: 0, aiToday: 0, speeches: 0, blocs: 0 },
      activity: dashData?.activity || initialData?.activity || [],
      refreshData,
    };
  }, [assignment, committee, committeeSession, dashData, initialData, refreshData, user]);

  const { data: confData, isLocked: confLocked, isLoading: confLoading } = useConferenceGate(user?.role);
  const isInitialLoading = dashLoading && !initialData;

  if (isInitialLoading || confLoading) {
    return <DashboardLoadingState type="overview" />;
  }

  if (confLocked && confData) {
    return <ConferenceLockScreen data={confData} />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const committeeAbbr = committee?.abbreviation?.toUpperCase() || '';
  const tabs: readonly string[] =
    committeeAbbr === 'ICJ' ? ICJ_TABS : committeeAbbr === 'CRISIS' ? CRISIS_TABS : DEFAULT_TABS;

  const renderTabContent = () => {
    if (!ctx) {
      return null;
    }
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab ctx={ctx} onTabChange={(tab) => setActiveTab(tab as TabName)} />;
      case 'My Committee':
        return <MyCommitteeTab ctx={ctx} />;
      case 'Court Proceedings':
        return <ICJProceedingsTab ctx={ctx} />;
      case 'Crisis Updates':
        return <CrisisUpdatesTab ctx={ctx} />;
      case 'Documents':
        return <DocumentsTab ctx={ctx} />;
      case 'Speeches & Research':
        return (
          <div className="space-y-6">
            <SpeechWorkspace ctx={ctx} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <AIFeedbackTab ctx={ctx} />
              <ResearchTab ctx={ctx} />
            </div>
          </div>
        );
      case 'Resolutions & Blocs':
        return (
          <div className="space-y-6">
            <ResolutionBuilderTab ctx={ctx} />
            <BlocsTab ctx={ctx} />
          </div>
        );
      case 'Schedule':
        return <ScheduleTab ctx={ctx} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader
        user={user}
        title="Delegate Portal"
        subtitle={committee?.name || 'Access your delegate workspace'}
        committeeName={committee?.name}
      />
      <DashboardTabBar tabs={tabs as string[]} activeTab={activeTab} onChange={setActiveTab} />

      <AnnouncementBanner user={user} committeeId={assignment?.committee_id} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 md:px-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardAnimatedTabPanel activeKey={activeTab}>{renderTabContent()}</DashboardAnimatedTabPanel>
        </div>

        <div className="space-y-4 sm:space-y-6 xl:col-span-4">
          <Notepad dashboardKey="DELEGATE" userId={user.id} />
        </div>
      </div>

      {showOnboarding && (
        <InteractiveOnboarding
          userRole={user.role}
          userName={user.full_name || 'Delegate'}
          dashboardType="delegate"
          onComplete={async () => {
            setShowOnboarding(false);
            try {
              await supabase.from('users').update({ has_completed_onboarding: true }).eq('id', user.id);
            } catch {
              // Ignore local onboarding persistence errors; the modal should still close.
            }
          }}
        />
      )}
    </div>
  );
}
