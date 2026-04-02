'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DataPreloader } from './data-preloader';
import { RoutePrefetcher } from './route-prefetcher';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number;
            if (status >= 400 && status < 500) return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
        refetchOnReconnect: true, // Do refetch on reconnect
      },
      mutations: {
        retry: 1, // Retry mutations once
      },
    },
  }));

  useEffect(() => {
    // Session refresh mechanism
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully
      }
      if (event === 'SIGNED_OUT') {
        // Use window.location for redirect to avoid router initialization issues
        window.location.href = '/login';
      }
    });

    // Check session every 5 minutes
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        // If session expires in less than 10 minutes, refresh it
        if (expiresAt - now < 10 * 60 * 1000) {
          await supabase.auth.refreshSession();
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DataPreloader />
      <RoutePrefetcher />
      {children}
    </QueryClientProvider>
  );
}
