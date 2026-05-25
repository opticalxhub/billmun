'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LIGHTWEIGHT_PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/gallery',
  '/contact',
  '/socials',
];

const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/dashboard/delegate',
  '/dashboard/chair',
  '/eb/dash',
  '/eb/dash/overview',
  '/eb/dash/registrations',
  '/eb/dash/committees',
  '/eb/dash/documents',
  '/eb/dash/contact',
  '/eb/dash/settings',
];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = typeof document !== 'undefined' && document.cookie.includes('sb-');
    const routes = isAuthenticated ? [...LIGHTWEIGHT_PUBLIC_ROUTES, ...AUTHENTICATED_ROUTES] : LIGHTWEIGHT_PUBLIC_ROUTES;

    routes.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {
        // Ignore prefetch errors for non-critical optimization work.
      }
    });
  }, [router]);

  return null;
}
