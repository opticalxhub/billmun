'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all dashboard routes for instant navigation
    const routes = [
      // Main dashboard routes
      '/dashboard',
      '/dashboard/delegate',
      '/dashboard/chair',
      '/dashboard/admin',
      '/dashboard/security',
      '/dashboard/press',
      '/dashboard/media',
      
      // EB dashboard routes (sub-pages)
      '/eb/dash',
      '/eb/dash/overview',
      '/eb/dash/registrations',
      '/eb/dash/live-monitor',
      '/eb/dash/committees',
      '/eb/dash/documents',
      '/eb/dash/security',
      '/eb/dash/communications',
      '/eb/dash/contact',
      '/eb/dash/media-pr',
      '/eb/dash/settings',
      '/eb/dash/audit',
      '/eb/dash/internal-workspace',
      '/eb/dash/whatsapp',
      '/eb/dash/reports',
      '/eb/dash/schedule',
      '/eb/dash/conference',
      
      // Auth routes
      '/login',
      '/login/eb',
      '/register',
      '/register/success',
      
      // Public routes
      '/gallery',
      '/contact',
      '/socials',
      '/terms',
      '/privacy',
      '/committees',
      '/docs',
      '/pending',
      '/rejected',
      '/acceptable-use',
      '/maintenance',
    ];

    // Prefetch all routes
    routes.forEach(route => {
      try {
        router.prefetch(route);
      } catch (error) {
        // Silently ignore prefetch errors
        console.debug(`Failed to prefetch route: ${route}`);
      }
    });

    const dynamicRoutes = ['/911'];

    dynamicRoutes.forEach(route => {
      try {
        router.prefetch(route);
      } catch (error) {
        console.debug(`Failed to prefetch dynamic route: ${route}`);
      }
    });

  }, [router]);

  return null;
}
