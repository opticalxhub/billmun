'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Card, SectionLabel } from '@/components/ui';
import { displayRole } from '@/lib/roles';
import { DashboardHeader, DashboardLoadingState } from '@/components/dashboard-shell';
import { FadeIn, HoverScale } from '@/components/gsap-animations';

export default function DashboardHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      // Allow temp backdoor bypass to stay on /dashboard so we can build a central hub later
      if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
        setUserProfile({ id: '00000000-0000-0000-0000-000000000000', role: 'EXECUTIVE_BOARD', full_name: 'Engineer (Emergency)', status: 'APPROVED' });
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const authUserId = authUser?.id ?? null;
      if (!authUserId) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, email, full_name, role, status, dietary_restrictions, preferred_committee, allocated_country')
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
        if (profile.role === 'CHAIR' || profile.role === 'CO_CHAIR') router.push('/dashboard/chair');
        else if (profile.role === 'PRESS' || profile.role === 'MEDIA') router.push('/dashboard/press');
        else if (profile.role === 'ADMIN') router.push('/dashboard/admin');
        else if (profile.role === 'SECURITY') router.push('/dashboard/security');
        else router.push('/dashboard/delegate');
        return;
      }

      setUserProfile(profile);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return <DashboardLoadingState />;
  }

  // Define what panels a user can see based on role
  const isGodMode = typeof document !== 'undefined' && document.cookie.includes('emergency_expires=');
  const role = userProfile?.role?.toUpperCase();
  const isEB = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'].includes(role);

  return (
    <div className="min-h-screen bg-bg-base">
      <DashboardHeader 
        title="Conference Portal" 
        subtitle={`Welcome, ${userProfile?.full_name || 'Delegate'}. Your conference dashboard is ready.`}
        user={userProfile}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
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
          <FadeIn delay={0.1} from="bottom">
            <Link href="/dashboard/delegate" className="group">
              <HoverScale>
                <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
                  <div>
                    <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Delegate Dashboard</h3>
                    <p className="text-sm text-text-dimmed">Submit position papers, join blocs, and participate in committee sessions.</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
                  </div>
                </Card>
              </HoverScale>
            </Link>
          </FadeIn>
        )}

        {/* Chair Dashboard */}
        {(isGodMode || role === 'CHAIR' || isEB) && (
          <FadeIn delay={0.2} from="bottom">
            <Link href="/dashboard/chair" className="group">
              <HoverScale>
                <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
                  <div>
                    <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Chair Dashboard</h3>
                    <p className="text-sm text-text-dimmed">Lead debate sessions, manage speakers, and oversee committee proceedings.</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary border border-border-subtle px-2 py-1 rounded">Open Dashboard</div>
                  </div>
                </Card>
              </HoverScale>
            </Link>
          </FadeIn>
        )}

        {/* Press Dashboard */}
        {(isGodMode || role === 'PRESS' || role === 'MEDIA' || isEB) && (
          <Link href="/dashboard/press" className="group">
            <Card className="h-full hover:border-text-primary transition-colors cursor-pointer flex flex-col justify-between">
              <div>
                <h3 className="font-jotia text-2xl mb-2 group-hover:underline">Press Dashboard</h3>
                <p className="text-sm text-text-dimmed">Manage press coverage, media releases, and conference documentation.</p>
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
                <p className="text-sm text-text-dimmed">Handle delegate logistics, attendance tracking, and conference operations.</p>
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
                <p className="text-sm text-text-dimmed">Ensure conference security, access control, and emergency response.</p>
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
                <p className="text-sm text-text-dimmed bg-bg-base/70">Complete conference administration, user management, and system oversight.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="text-[10px] font-bold uppercase tracking-widest text-bg-base/50 border border-bg-base/20 px-2 py-1 rounded">System Admin</div>
              </div>
            </Card>
          </Link>
        )}

        </div>
      </div>
    </div>
  );
}
