"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export default function OnboardingManager() {
  const [profile, setProfile] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('users')
        .select('id,email,full_name,role,preferred_committee,has_completed_onboarding')
        .eq('id', session.user.id)
        .single();

      if (error || !data) return;
      setProfile(data);

      const completed = data.has_completed_onboarding === true || data.has_completed_onboarding === 'true';
      if (!completed) {
        setShow(true);
      }

      // Presence tracking
      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: data.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          // Handle sync
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: data.id,
              full_name: data.full_name,
              role: data.role,
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    load();
  }, []);

  const complete = async () => {
    if (!profile?.id) {
      setShow(false);
      return;
    }

    await supabase
      .from('users')
      .update({ has_completed_onboarding: true })
      .eq('id', profile.id);

    setShow(false);
  };

  if (!show || !profile) return null;

  return (
    <OnboardingModal
      role={profile.role}
      full_name={profile.full_name || profile.email || 'User'}
      committee={profile.preferred_committee}
      onComplete={complete}
    />
  );
}
