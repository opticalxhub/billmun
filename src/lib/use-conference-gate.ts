'use client';

import { useQuery } from '@tanstack/react-query';

export type ConferenceStatus = 'OPEN' | 'CLOSED' | 'PRE_CONFERENCE' | 'POST_CONFERENCE';

export interface ConferenceWindow {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
}

export interface ConferenceStatusData {
  status: ConferenceStatus;
  manual_override: 'OPEN' | 'CLOSED' | null;
  current_window: ConferenceWindow | null;
  next_window: ConferenceWindow | null;
  windows: ConferenceWindow[];
  post_conference_message: string;
  server_time: string;
}

const BYPASS_ROLES = [
  'EXECUTIVE_BOARD',
  'SECRETARY_GENERAL',
  'DEPUTY_SECRETARY_GENERAL',
];

export function useConferenceGate(userRole?: string) {
  const { data, isLoading } = useQuery<ConferenceStatusData>({
    queryKey: ['conference-status'],
    queryFn: async () => {
      const res = await fetch('/api/config/conference-status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch conference status');
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
    retryDelay: 1000,
  });

  const canBypass = userRole ? BYPASS_ROLES.includes(userRole) : false;
  const isLocked = data ? data.status !== 'OPEN' && !canBypass : false;

  return {
    data,
    isLoading,
    isLocked,
    canBypass,
    status: data?.status ?? 'CLOSED',
  };
}
