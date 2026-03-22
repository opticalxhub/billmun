'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function DataPreloader() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function preload() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

      // 1. Preload User Profile
      queryClient.prefetchQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
          const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });

      // 2. Preload Conference Settings
      queryClient.prefetchQuery({
        queryKey: ['conference-settings'],
        queryFn: async () => {
          const { data, error } = await supabase.from('conference_settings').select('*').eq('id', '1').single();
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000,
      });

      // 3. Preload Committee Assignment
      queryClient.prefetchQuery({
        queryKey: ['committee-assignment', userId],
        queryFn: async () => {
          const { data, error } = await supabase.from('committee_assignments').select('*').eq('user_id', userId).maybeSingle();
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }

    preload();
  }, [queryClient]);

  return null;
}
