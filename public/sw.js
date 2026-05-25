const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `billmun-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `billmun-api-${CACHE_VERSION}`;

const STATIC_CACHE_URLS = [
  '/login',
  '/register',
  '/manifest.json',
  '/favicon.ico',
  '/NXTMUN.png',
];

const PUBLIC_PAGE_ALLOWLIST = new Set([
  '/login',
  '/register',
  '/gallery',
  '/contact',
  '/socials',
  '/terms',
  '/privacy',
  '/acceptable-use',
  '/maintenance',
]);

const API_CACHE_URLS = new Set([
  '/api/config/conference-status',
  '/api/config/public-settings',
  '/api/announcements/public',
  '/api/gallery',
]);

function isCacheableStaticAsset(request) {
  return request.destination === 'image' || request.destination === 'style' || request.destination === 'script' || request.destination === 'font';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return undefined;
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    if (!API_CACHE_URLS.has(url.pathname)) {
      return;
    }

    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        try {
          const freshResponse = await fetch(request);
          if (freshResponse.ok) {
            cache.put(request, freshResponse.clone());
          }
          return freshResponse;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw new Error(`No cached response for ${url.pathname}`);
        }
      }),
    );
    return;
  }

  if (request.destination === 'document') {
    if (!PUBLIC_PAGE_ALLOWLIST.has(url.pathname)) {
      return;
    }

    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        return cached || caches.match('/login');
      }),
    );
    return;
  }

  if (!isCacheableStaticAsset(request) && !url.pathname.startsWith('/_next/static/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        return cached;
      }

      const freshResponse = await fetch(request);
      if (freshResponse.ok) {
        const cache = await caches.open(STATIC_CACHE_NAME);
        cache.put(request, freshResponse.clone());
      }
      return freshResponse;
    }),
  );
});
