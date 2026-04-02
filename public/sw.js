const CACHE_NAME = 'billmun-v1';
const API_CACHE_NAME = 'billmun-api-v1';

// URLs to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/manifest.json',
  // Add other static assets that should be cached
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/config/conference-status',
  '/api/config/public-settings',
  '/api/announcements/public',
  '/api/gallery',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline, cache API responses
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Only intercept whitelisted public GET APIs; let all other /api/* through untouched
  if (url.pathname.startsWith('/api/')) {
    if (API_CACHE_URLS.some(apiUrl => url.pathname === new URL(apiUrl, self.location.origin).pathname)) {
      event.respondWith(
        caches.open(API_CACHE_NAME)
          .then((cache) => {
            return cache.match(request)
              .then((response) => {
                // Return cached version if available
                if (response) {
                  // Update cache in background
                  fetch(request).then((freshResponse) => {
                    if (freshResponse.ok) {
                      cache.put(request, freshResponse.clone());
                    }
                  }).catch(() => {
                    // Ignore network errors for background updates
                  });
                  return response;
                }

                // Fetch from network and cache
                return fetch(request).then((freshResponse) => {
                  if (freshResponse.ok) {
                    cache.put(request, freshResponse.clone());
                  }
                  return freshResponse;
                });
              })
          })
      );
      return;
    }
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network and cache
        return fetch(request).then((freshResponse) => {
          // Don't cache non-successful responses
          if (!freshResponse.ok) {
            return freshResponse;
          }

          // Cache the response
          const responseToCache = freshResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return freshResponse;
        });
      })
      .catch(() => {
        // Return a fallback page if available
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});
