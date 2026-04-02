'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: user } = await supabase
        .from('users')
        .select('status')
        .eq('id', authUser.id)
        .maybeSingle();

      if (user?.status === 'APPROVED') {
        router.push('/dashboard');
      } else if (user?.status === 'REJECTED') {
        router.push('/rejected');
      }

      // Real-time status subscription
      const channel = supabase
        .channel(`user_status_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${authUser.id}`,
          },
          (payload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'APPROVED') {
              router.push('/dashboard');
            } else if (newStatus === 'REJECTED') {
              router.push('/rejected');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkStatus();
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-bg-card p-10 border border-border-subtle rounded-lg shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-pending-bg text-status-pending-text mb-4">
          <span className="text-2xl font-bold animate-pulse">!</span>
        </div>
        <h1 className="font-jotia text-3xl text-text-primary">Application Pending</h1>
        <p className="text-text-secondary">
          Your portal registration has been received and is currently under review by the Executive Board. 
          The page will refresh automatically once your status updates.
        </p>
        <div className="pt-6">
           <Link href="/" passHref>
             <Button variant="outline" className="w-full">Return Home</Button>
           </Link>
        </div>
      </div>
    </div>
  );
}
