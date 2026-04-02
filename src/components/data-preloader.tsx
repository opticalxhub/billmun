'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function DataPreloader() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function preload() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userId = user.id;

        // === UNIVERSAL DATA (preload for all users) ===
        
        // 1. Conference Settings
        queryClient.prefetchQuery({
          queryKey: ['conference-settings'],
          queryFn: async () => {
            const { data, error } = await supabase.from('conference_settings').select('*').eq('id', '1').maybeSingle();
            if (error) throw error;
            return data;
          },
          staleTime: 10 * 60 * 1000,
        });

        // 2. Conference Status
        queryClient.prefetchQuery({
          queryKey: ['conference-status'],
          queryFn: async () => {
            const res = await fetch('/api/config/conference-status');
            if (!res.ok) throw new Error('Failed to fetch conference status');
            return res.json();
          },
          staleTime: 2 * 60 * 1000,
        });

        // 3. Schedule Events (for all users)
        queryClient.prefetchQuery({
          queryKey: ['schedule-events'],
          queryFn: async () => {
            const { data, error } = await supabase.from('schedule_events').select('*').order('start_time', { ascending: true });
            if (error) throw error;
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });

        // 4. Public Announcements
        queryClient.prefetchQuery({
          queryKey: ['announcements-public'],
          queryFn: async () => {
            const res = await fetch('/api/announcements/public');
            if (!res.ok) throw new Error('Failed to fetch announcements');
            return res.json();
          },
          staleTime: 3 * 60 * 1000,
        });

        // 5. User Profile (matches dashboards)
        queryClient.prefetchQuery({
          queryKey: ['user-profile'],
          queryFn: async () => {
            // Emergency Override Check
            if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
              return {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'emergency@billmun.com',
                full_name: 'Engineer (Emergency)',
                role: 'EXECUTIVE_BOARD',
                status: 'APPROVED',
                has_completed_onboarding: true
              };
            }

            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('No session');
            const { data, error } = await supabase.from('users').select('id, email, full_name, role, status, has_completed_onboarding, badge_status, ai_analyses_today, created_at, updated_at').eq('id', authUser.id).maybeSingle();
            if (error) throw error;
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });

        // Get user role for role-specific preloading
        const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
        const userRole = userData?.role;

        // === ROLE-SPECIFIC PRELOADING ===

        if (['DELEGATE', 'CHAIR', 'CO_CHAIR'].includes(userRole || '')) {
          // Delegate/Chair specific data
          
          // Committee assignment (matches delegate dashboard)
          const { data: assignment } = await supabase.from('committee_assignments').select('committee_id').eq('user_id', userId).maybeSingle();
          if (assignment?.committee_id) {
            // Committee info
            queryClient.prefetchQuery({
              queryKey: ['committee', assignment.committee_id],
              queryFn: async () => {
                const { data, error } = await supabase.from('committees').select('*').eq('id', assignment.committee_id).maybeSingle();
                if (error) throw error;
                return data;
              },
              staleTime: 5 * 60 * 1000,
            });

            // Committee schedule
            queryClient.prefetchQuery({
              queryKey: ['committee-schedule', assignment.committee_id],
              queryFn: async () => {
                const { data, error } = await supabase.from('committee_schedules').select('*').eq('committee_id', assignment.committee_id).order('start_time', { ascending: true });
                if (error) throw error;
                return data || [];
              },
              staleTime: 2 * 60 * 1000,
            });

            // Committee session
            queryClient.prefetchQuery({
              queryKey: ['committee-session', assignment.committee_id],
              queryFn: async () => {
                const { data, error } = await supabase.from('committee_sessions').select('*').eq('committee_id', assignment.committee_id).maybeSingle();
                if (error) throw error;
                return data;
              },
              staleTime: 1 * 60 * 1000,
            });
          }

          // Delegate-specific
          if (userRole === 'DELEGATE') {
            // DELEGATE DASHBOARD API (single consolidated call)
            queryClient.prefetchQuery({
              queryKey: ['delegate-dashboard'],
              queryFn: async () => {
                // Emergency Override Check
                if (typeof document !== 'undefined' && document.cookie.includes('emergency_expires=')) {
                  return {
                    user: {
                      id: '00000000-0000-0000-0000-000000000000',
                      email: 'emergency@billmun.com',
                      full_name: 'MR. Abdulrahman',
                      role: 'EXECUTIVE_BOARD',
                      status: 'APPROVED',
                      has_completed_onboarding: true
                    },
                    assignment: null,
                    committee: null,
                    committeeSession: null,
                  };
                }

                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) throw new Error('No session');
                
                const res = await fetch(`/api/delegate/dashboard?userId=${authUser.id}`);
                if (!res.ok) throw new Error('Failed to load dashboard data');
                return await res.json();
              },
              staleTime: 2 * 60 * 1000,
            });

            // Individual delegate queries (used by tabs)
            queryClient.prefetchQuery({
              queryKey: ['delegate-stats', userId],
              queryFn: async () => {
                const [docs, speeches, blocs, userFullData] = await Promise.all([
                  supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                  supabase.from('speeches').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                  supabase.from('bloc_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                  supabase.from('users').select('ai_analyses_reset_date, ai_analyses_today').eq('id', userId).maybeSingle(),
                ]);
                const today = new Date().toISOString().split('T')[0];
                const resetDate = userFullData.data?.ai_analyses_reset_date ? new Date(userFullData.data.ai_analyses_reset_date).toISOString().split('T')[0] : null;
                const aiToday = resetDate === today ? (userFullData.data?.ai_analyses_today || 0) : 0;
                return {
                  documents: docs.count || 0,
                  aiToday,
                  speeches: speeches.count || 0,
                  blocs: blocs.count || 0,
                };
              },
              staleTime: 60 * 1000,
            });

            queryClient.prefetchQuery({
              queryKey: ['delegate-activity', userId, assignment?.committee_id],
              queryFn: async () => {
                const committeeId = assignment?.committee_id;
                if (!committeeId) return [];
                
                // Get delegate's personal activities + committee activities
                const [personal, committeeDocs, announcements] = await Promise.all([
                  // Personal audit logs
                  supabase
                    .from('audit_logs')
                    .select('*')
                    .eq('actor_id', userId)
                    .not('action', 'ilike', '%rejected%')
                    .not('action', 'ilike', '%suspended%')
                    .not('action', 'ilike', '%admin%')
                    .not('action', 'ilike', '%security%')
                    .order('performed_at', { ascending: false })
                    .limit(5),
                  // Committee document activity
                  supabase
                    .from('documents')
                    .select('id, title, uploaded_at, reviewed_at, status, user_id, users(full_name)')
                    .eq('committee_id', committeeId)
                    .or(`status.eq.APPROVED,user_id.eq.${userId}`)
                    .order('uploaded_at', { ascending: false })
                    .limit(3),
                  // Committee announcements
                  supabase
                    .from('announcements')
                    .select('id, title, body, created_at, author_id, users(full_name)')
                    .or(`committee_id.eq.${committeeId},target_roles.cs.{DELEGATE}`)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(3),
                ]);

                const activities: any[] = [];
                
                // Add personal activities
                (personal.data || []).forEach((log: any) => {
                  const delegateActions = ['uploaded', 'submitted', 'joined', 'created', 'updated profile', 'speech', 'resolution', 'bloc', 'voted', 'spoke', 'motion'];
                  if (delegateActions.some(action => log.action.toLowerCase().includes(action))) {
                    activities.push({
                      id: `personal-${log.id}`,
                      action: log.action,
                      performed_at: log.performed_at,
                      type: 'personal'
                    });
                  }
                });

                // Add document activities
                (committeeDocs.data || []).forEach((doc: any) => {
                  if (doc.user_id === userId) {
                    activities.push({
                      id: `doc-${doc.id}`,
                      action: `You uploaded "${doc.title}"`,
                      performed_at: doc.uploaded_at,
                      type: 'document'
                    });
                  } else if (doc.status === 'APPROVED') {
                    const userName = (doc.users as any)?.full_name || 'Unknown';
                    activities.push({
                      id: `doc-${doc.id}`,
                      action: `${userName}'s document "${doc.title}" was approved`,
                      performed_at: doc.reviewed_at || doc.uploaded_at,
                      type: 'document'
                    });
                  }
                });

                // Add announcements
                (announcements.data || []).forEach((announcement: any) => {
                  activities.push({
                    id: `ann-${announcement.id}`,
                    action: `Announcement: ${announcement.title}`,
                    performed_at: announcement.created_at,
                    type: 'announcement'
                  });
                });

                return activities
                  .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
                  .slice(0, 10);
              },
              staleTime: 5 * 60 * 1000,
            });
          }

          // Chair-specific
          if (['CHAIR', 'CO_CHAIR'].includes(userRole || '')) {
            // Chair admin tasks
            queryClient.prefetchQuery({
              queryKey: ['chair-admin-tasks'],
              queryFn: async () => {
                const res = await fetch('/api/chair/admin-tasks');
                if (!res.ok) throw new Error('Failed to fetch admin tasks');
                return res.json();
              },
              staleTime: 2 * 60 * 1000,
            });

            // Committee delegates (matches chair dashboard)
            if (assignment?.committee_id) {
              queryClient.prefetchQuery({
                queryKey: ['committee-delegates', assignment.committee_id],
                queryFn: async () => {
                  const { data, error } = await supabase
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
                    .eq('committee_id', assignment.committee_id);
                  
                  return (data || [])
                    .filter((a: any) => a.user?.status === 'APPROVED' && a.user?.role === 'DELEGATE')
                    .map((a: any) => ({
                      ...a.user,
                      user_id: a.user_id,
                      country: a.country || 'Unknown',
                      seat_number: a.seat_number || '',
                    }));
                },
                staleTime: 2 * 60 * 1000,
              });
            }
          }
        }

        // EB/Admin specific data
        if (['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL', 'ADMIN'].includes(userRole || '')) {
          // EB Overview data
          queryClient.prefetchQuery({
            queryKey: ['eb-overview'],
            queryFn: async () => {
              const res = await fetch('/api/eb/overview');
              if (!res.ok) throw new Error('Failed to fetch EB overview');
              return res.json();
            },
            staleTime: 2 * 60 * 1000,
          });

          // EB Registrations
          queryClient.prefetchQuery({
            queryKey: ['eb-registrations'],
            queryFn: async () => {
              const res = await fetch('/api/eb/registrations');
              if (!res.ok) throw new Error('Failed to fetch registrations');
              return res.json();
            },
            staleTime: 3 * 60 * 1000,
          });

          // EB Media & PR
          queryClient.prefetchQuery({
            queryKey: ['eb-media-pr'],
            queryFn: async () => {
              const res = await fetch('/api/eb/media-pr');
              if (!res.ok) throw new Error('Failed to fetch media/PR');
              return res.json();
            },
            staleTime: 2 * 60 * 1000,
          });

          // EB Announcements
          queryClient.prefetchQuery({
            queryKey: ['eb-announcements'],
            queryFn: async () => {
              const res = await fetch('/api/eb/announcements');
              if (!res.ok) throw new Error('Failed to fetch announcements');
              return res.json();
            },
            staleTime: 2 * 60 * 1000,
          });

          // All committees
          queryClient.prefetchQuery({
            queryKey: ['committees'],
            queryFn: async () => {
              const { data, error } = await supabase.from('committees').select('*').order('name', { ascending: true });
              if (error) throw error;
              return data || [];
            },
            staleTime: 5 * 60 * 1000,
          });

          // Admin dashboard (exact match)
          if (userRole === 'ADMIN') {
            queryClient.prefetchQuery({
              queryKey: ['admin-dashboard', ''],
              queryFn: async () => {
                const res = await fetch('/api/admin/dashboard');
                if (!res.ok) throw new Error('Failed to fetch users');
                return res.json();
              },
              staleTime: 5 * 60 * 1000,
            });
          }
        }

        // Media/Press specific data
        if (['MEDIA', 'PRESS'].includes(userRole || '')) {
          queryClient.prefetchQuery({
            queryKey: ['press-dashboard'],
            queryFn: async () => {
              const res = await fetch('/api/press/dashboard');
              if (!res.ok) throw new Error('Failed to fetch press dashboard');
              return res.json();
            },
            staleTime: 2 * 60 * 1000,
          });
        }

        // Security specific data
        if (userRole === 'SECURITY') {
          queryClient.prefetchQuery({
            queryKey: ['security-dashboard'],
            queryFn: async () => {
              const res = await fetch('/api/security/dashboard');
              if (!res.ok) throw new Error('Failed to fetch security dashboard');
              return res.json();
            },
            staleTime: 1 * 60 * 1000,
          });
        }

      } catch (error) {
        console.error('Preload error:', error);
        // Don't throw - preloading failures shouldn't break the app
      }
    }

    // Start preloading immediately
    preload();
    
    // Also preload after a short delay to ensure auth is settled
    const timeout = setTimeout(preload, 1000);
    
    return () => clearTimeout(timeout);
  }, [queryClient]);

  return null;
}
