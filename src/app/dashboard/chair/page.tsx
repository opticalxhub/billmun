'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CommandCenterTab from './components/CommandCenterTab';
import RollCallTab from './components/RollCallTab';
import TimersTab from './components/TimersTab';
import SpeakersListTab from './components/SpeakersListTab';
import PointsMotionsTab from './components/PointsMotionsTab';
import ChairDocumentsTab from './components/ChairDocumentsTab';
import DelegatesTab from './components/DelegatesTab';
import AnalyticsTab from './components/AnalyticsTab';
import AIToolsTab from './components/AIToolsTab';
import PreparationTab from './components/PreparationTab';
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
  'Documents',
  'Delegates',
  'Analytics',
  'AI Tools',
  'Preparation',
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No session');
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, has_completed_onboarding, badge_status')
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
  const { data: delegates = [], isLoading: delegatesLoading } = useQuery({
    queryKey: ['committee-delegates', committee?.id],
    enabled: !!committee?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          committee_assignments!inner(id, country, seat_number)
        `)
        .eq('committee_assignments.committee_id', committee!.id);
      
      // Transform to flatten committee_assignments
      return (data || []).map((u: any) => ({
        ...u,
        country: u.committee_assignments?.[0]?.country || 'Unknown',
        seat_number: u.committee_assignments?.[0]?.seat_number || '',
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
    staleTime: 30 * 1000,
  });

  // Real-time committee session subscription
  useEffect(() => {
    if (!committee?.id || !user?.id) return;
    
    const channel = supabase
      .channel(`dashboard-chair-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'committee_sessions',
          filter: `committee_id=eq.${committee.id}`,
        },
        () => {
          refetchSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [committee?.id, user?.id, refetchSession]);

  const loading = userLoading || (user && committeeLoading);

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chair-committee', user?.id] }),
      queryClient.invalidateQueries({ queryKey: ['committee-delegates', committee?.id] }),
      refetchSession(),
    ]);
  }, [queryClient, user?.id, committee?.id, refetchSession]);

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
        subtitle={committee?.name ? `${committee.name}${committee?.topic ? ` · ${committee.topic}` : ''}` : 'Committee not assigned'}
      />
      <DashboardTabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <DashboardAnimatedTabPanel activeKey={activeTab}>
          {activeTab === 'Command Center' && <CommandCenterTab ctx={ctx} />}
          {activeTab === 'Roll Call' && <RollCallTab ctx={ctx} />}
          {activeTab === 'Timers' && <TimersTab ctx={ctx} />}
          {activeTab === 'Speakers List' && <SpeakersListTab ctx={ctx} />}
          {activeTab === 'Points & Motions' && <PointsMotionsTab ctx={ctx} />}
          {activeTab === 'Documents' && <ChairDocumentsTab ctx={ctx} />}
          {activeTab === 'Delegates' && <DelegatesTab ctx={ctx} />}
          {activeTab === 'Analytics' && <AnalyticsTab ctx={ctx} />}
          {activeTab === 'AI Tools' && <AIToolsTab ctx={ctx} />}
          {activeTab === 'Preparation' && <PreparationTab ctx={ctx} />}
        </DashboardAnimatedTabPanel>
      </div>
    </div>
  );
}