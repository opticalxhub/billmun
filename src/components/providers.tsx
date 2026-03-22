'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { DataPreloader } from './data-preloader';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Session refresh mechanism
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        router.push('/login');
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
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <DataPreloader />
      {children}
    </QueryClientProvider>
  );
}
