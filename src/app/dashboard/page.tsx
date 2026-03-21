'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Card, SectionLabel } from '@/components/ui';
import { displayRole } from '@/lib/roles';

export default function DashboardHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      // Allow temp backdoor bypass to stay on /dashboard so we can build a central hub later
        if (document.cookie.includes('emergency_expires=')) {
        setUserProfile({ role: 'EXECUTIVE_BOARD', full_name: 'Engineer', status: 'APPROVED' });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData.user?.id ?? session?.user?.id ?? null;
      if (!authUserId) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (!profile) {
        router.push('/login');
        return;
      }

      if (profile.status !== 'APPROVED' && !['EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(profile.role)) {
        if (profile.status === 'PENDING') router.push('/pending');
        else router.push('/rejected');
        return;
      }

      // Role-based redirect for single-access roles
      const isEB = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(profile.role);
      
      if (!isEB) {
        if (profile.role === 'CHAIR') router.push('/dashboard/chair');
        else if (profile.role === 'PRESS' || profile.role === 'MEDIA') router.push('/dashboard/press');
        else if (profile.role === 'ADMIN') router.push('/dashboard/admin');
        else router.push('/dashboard/delegate');
        return;
      }

      setUserProfile(profile);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Define what panels a user can see based on role
  const isGodMode = typeof document !== 'undefined' && document.cookie.includes('emergency_expires=');
  const role = userProfile?.role?.toUpperCase();
  const isEB = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(role);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-inter">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-widest">Central Hub</h1>
          <p className="text-gray-500">Welcome, {userProfile?.full_name || 'Delegate'}. Access your assigned tools below.</p>
        </div>
        {isGodMode && (
          <div className="bg-status-rejected-bg border border-status-rejected-border px-4 py-2 rounded-pill flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-rejected-text animate-pulse" />
            <span className="text-[10px] font-bold text-status-rejected-text uppercase tracking-widest">Emergency Override Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Everyone gets a profile card */}
        <Card className="col-span-full mb-4">
          <SectionLabel>My Profile</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Role</p>
              <p className="text-sm font-medium">{displayRole(userProfile?.role)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Committee</p>
              <p className="text-sm font-medium">{userProfile?.preferred_committee || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Country</p>
              <p className="text-sm font-medium">{userProfile?.allocated_country || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Dietary Restrictions</p>
              <p className="text-sm font-medium">{userProfile?.dietary_restrictions || 'None'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Status</p>
              <p className="text-sm font-medium text-status-approved-text uppercase">{userProfile?.status}</p>
            </div>
          </div>
        </Card>

        {/* Delegate Dashboard */}
        {(isGodMode || role === 'DELEGATE' || isEB) && (
          <Link href="/dashboard/delegate" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Delegate Dashboard</h3>
                <p className="text-sm text-text-dimmed">Access working papers, AI document analysis, and bloc management.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
              </div>
            </Card>
          </Link>
        )}

        {/* Chair Dashboard */}
        {(isGodMode || role === 'CHAIR' || isEB) && (
          <Link href="/dashboard/chair" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Chair Dashboard</h3>
                <p className="text-sm text-text-dimmed">Manage committee sessions, timers, speaker lists, and caucuses.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
              </div>
            </Card>
          </Link>
        )}

        {/* Press Dashboard */}
        {(isGodMode || role === 'PRESS' || role === 'MEDIA' || isEB) && (
          <Link href="/dashboard/press" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Press Dashboard</h3>
                <p className="text-sm text-text-dimmed">Upload media to the conference gallery and review press materials.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
              </div>
            </Card>
          </Link>
        )}

        {/* Admin Dashboard */}
        {(isGodMode || role === 'ADMIN' || isEB) && (
          <Link href="/dashboard/admin" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Admin Logistics</h3>
                <p className="text-sm text-text-dimmed">Manage delegate attendance, lavatory breaks, and live statuses.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
              </div>
            </Card>
          </Link>
        )}

        {/* Security Dashboard */}
        {(isGodMode || role === 'SECURITY' || isEB) && (
          <Link href="/dashboard/security" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Security Dashboard</h3>
                <p className="text-sm text-text-dimmed">Monitor venue access, incident reports, and safety protocols.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
              </div>
            </Card>
          </Link>
        )}

        {/* EB Core Dashboard */}
        {(isGodMode || isEB) && (
          <Link href="/eb/dash" className="group">
            <Card className="h-full border-text-primary transition-colors cursor-pointer bg-text-primary text-bg-base flex flex-col justify-between hover:opacity-90">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline text-bg-base">Executive Board</h3>
                <p className="text-sm text-bg-base/70">Master controls for users, announcements, media approval, and system settings.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-bg-base/50 border border-bg-base/20 px-2 py-1 rounded">System Admin</div>
              </div>
            </Card>
          </Link>
        )}

      </div>
    </div>
  );
}
