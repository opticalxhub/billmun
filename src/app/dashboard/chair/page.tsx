'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CommandCenterTab from './components/CommandCenterTab';
import RollCallTab from './components/RollCallTab';
import TimersTab from './components/TimersTab';
import SpeakersListTab from './components/SpeakersListTab';
import PointsMotionsTab from './components/PointsMotionsTab';
// PointsSystem available if needed
import { DelegateStatsSpreadsheet } from './components/points/DelegateStatsSpreadsheet';
import ChairDocumentsTab from './components/ChairDocumentsTab';
import DelegatesTab from './components/DelegatesTab';
import AnalyticsTab from './components/AnalyticsTab';
import AIToolsTab from './components/AIToolsTab';
import BlocsTab from './components/BlocsTab';
import PreparationTab from './components/PreparationTab';
import CommitteeScheduleTab from './components/CommitteeScheduleTab';
import WhatsAppTab from '@/components/whatsapp-tab';
import { Notepad } from '@/components/notepad';
import { AnnouncementBanner } from '@/components/announcement-banner';
import {
  DashboardAnimatedTabPanel,
  DashboardHeader,
  DashboardLoadingState,
  DashboardTabBar,
} from '@/components/dashboard-shell';

const TABS = [
  'Command Center',
  'Roll Call',
  'Timers',
  'Speakers List',
  'Points & Motions',
  'Blocs & Resolutions',
  'Delegate Stats',
  'Documents',
  'Delegates',
  'Analytics',
  'AI Tools',
  'Preparation',
  'Committee Schedule',
  'WhatsApp',
] as const;

type TabName = (typeof TABS)[number];

export interface ChairContext {
  user: any;
  committee: any;
  session: any;
  delegates: any[];
  refreshData: () => Promise<void>;
}

export default function ChairDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabName>('Command Center');

  // useQuery for User Profile
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      // Emergency Override Check
      if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
        return {
          id: 'emergency-actor',
          email: 'emergency@billmun.com',
          full_name: 'Engineer (Emergency)',
          role: 'EXECUTIVE_BOARD',
          status: 'APPROVED',
          has_completed_onboarding: true
        };
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No session');
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, has_completed_onboarding, badge_status, ai_analyses_today, created_at, updated_at')
        .eq('id', authUser.id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // useQuery for Committee
  const { data: committee, isLoading: committeeLoading } = useQuery({
    queryKey: ['chair-committee', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Find committee where this user is chair or co-chair
      const { data: committeeData } = await supabase
        .from('committees')
        .select('*')
        .or(`chair_id.eq.${user!.id},co_chair_id.eq.${user!.id}`)
        .maybeSingle();

      if (committeeData) return committeeData;

      // Fallback: check committee_assignments
      const { data: assignData } = await supabase
        .from('committee_assignments')
        .select('committee_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (assignData) {
        const { data: c } = await supabase.from('committees').select('*').eq('id', assignData.committee_id).single();
        return c;
      }
      return null;
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Delegates
  const { data: delegates = [] } = useQuery({
    queryKey: ['committee-delegates', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('committee_assignments')
        .select(`
          user_id,
          country,
          seat_number,
          user:user_id (
            id,
            full_name,
            email,
            role,
            status
          )
        `)
        .eq('committee_id', committee!.id);
      
      return (data || [])
        .filter((a: any) => a.user?.status === 'APPROVED')
        .map((a: any) => ({
          ...a.user,
          user_id: a.user_id,
          country: a.country || 'Unknown',
          seat_number: a.seat_number || '',
        }));
    },
    staleTime: 2 * 60 * 1000,
  });

  // useQuery for Committee Session
  const { data: committeeSession, refetch: refetchSession } = useQuery({
    queryKey: ['chair-committee-session', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('committee_sessions')
        .select('*')
        .eq('committee_id', committee!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Stable refs for callbacks used in real-time subscriptions
  const refetchSessionRef = useRef(refetchSession);
  refetchSessionRef.current = refetchSession;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Real-time committee session subscription
  useEffect(() => {
    if (!committee?.id || !user?.id) return;
    let sessionDebounce: ReturnType<typeof setTimeout> | null = null;
    let docsDebounce: ReturnType<typeof setTimeout> | null = null;
    let speakersDebounce: ReturnType<typeof setTimeout> | null = null;
    
    const channels = [
      supabase
        .channel(`dashboard-chair-session-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'committee_sessions',
            filter: `committee_id=eq.${committee.id}`,
          },
          () => {
            if (sessionDebounce) clearTimeout(sessionDebounce);
            sessionDebounce = setTimeout(() => refetchSessionRef.current(), 2000);
          }
        )
        .subscribe(),
      supabase
        .channel(`dashboard-chair-docs-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `committee_id=eq.${committee.id}`,
          },
          () => {
            if (docsDebounce) clearTimeout(docsDebounce);
            docsDebounce = setTimeout(() => queryClientRef.current.invalidateQueries({ queryKey: ['chair-documents', committee.id] }), 2000);
          }
        )
        .subscribe(),
      supabase
        .channel(`dashboard-chair-speakers-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'speakers_list',
            filter: `committee_id=eq.${committee.id}`,
          },
          () => {
            if (speakersDebounce) clearTimeout(speakersDebounce);
            speakersDebounce = setTimeout(() => queryClientRef.current.invalidateQueries({ queryKey: ['chair-speakers', committee.id] }), 2000);
          }
        )
        .subscribe(),
    ];

    return () => {
      if (sessionDebounce) clearTimeout(sessionDebounce);
      if (docsDebounce) clearTimeout(docsDebounce);
      if (speakersDebounce) clearTimeout(speakersDebounce);
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [committee?.id, user?.id]);

  const loading = userLoading || (user && committeeLoading);

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chair-committee', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-session', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-delegates', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['speakers-list', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['roll-call', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin-tasks', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-announcements', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-resources', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-documents', committee?.id] }),
      queryClient.invalidateQueries({ queryKey: ['attendance-records', committee?.id] }),
    ]);
  }, [queryClient, user?.id, committee?.id]);

  if (loading) {
    return <DashboardLoadingState type="overview" />;
  }

  if (!user && !userLoading) {
    router.push('/login');
    return null;
  }

  const ctx: ChairContext = {
    user,
    committee,
    session: committeeSession,
    delegates,
    refreshData,
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader
        title="Chair Dashboard"
        subtitle={`Session active for ${ctx.committee?.name || 'No Committee'}`}
        committeeName={ctx.committee?.name || 'No Committee'}
        user={user}
      />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <AnnouncementBanner user={user} committeeId={committee?.id} />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <div className="xl:col-span-8">
          <DashboardAnimatedTabPanel activeKey={activeTab}>
            {activeTab === 'Command Center' && <CommandCenterTab ctx={ctx} />}
            {activeTab === 'Roll Call' && <RollCallTab ctx={ctx} />}
            {activeTab === 'Timers' && <TimersTab ctx={ctx} />}
            {activeTab === 'Speakers List' && <SpeakersListTab ctx={ctx} />}
            {activeTab === 'Points & Motions' && <PointsMotionsTab ctx={ctx} />}
            {activeTab === 'Blocs & Resolutions' && <BlocsTab ctx={ctx} />}
            {activeTab === 'Delegate Stats' && <DelegateStatsSpreadsheet committee={ctx.committee} />}
            {activeTab === 'Documents' && <ChairDocumentsTab ctx={ctx} />}
            {activeTab === 'Delegates' && <DelegatesTab ctx={ctx} />}
            {activeTab === 'Analytics' && <AnalyticsTab ctx={ctx} />}
            {activeTab === 'AI Tools' && <AIToolsTab ctx={ctx} />}
            {activeTab === 'Preparation' && <PreparationTab ctx={ctx} />}
            {activeTab === 'Committee Schedule' && <CommitteeScheduleTab committee={ctx.committee} user={ctx.user} />}
            {activeTab === 'WhatsApp' && <WhatsAppTab />}
          </DashboardAnimatedTabPanel>
        </div>

        <div className="xl:col-span-4 space-y-4 sm:space-y-6">
          <Notepad dashboardKey="CHAIR" userId={user?.id} />
        </div>
      </div>
    </div>
  );
}