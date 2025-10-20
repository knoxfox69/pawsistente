// Purpose: Service Worker for PWA functionality
// Context: Enables offline functionality and caching

const CACHE_NAME = 'pawsistente-v3';
const urlsToCache = [
  '/',
  '/events',
  '/schedule',
  '/about',
  '/manifest.json',
  '/site.webmanifest',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/icons/logo.svg'
];

// Purpose: Install event - cache resources
// Context: Caches essential app resources for offline use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Purpose: Fetch event - serve cached content
// Context: Serves cached content when offline, falls back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Always try network-first for app chunks and navigations to avoid stale/corrupted bundles
  const isImmutableChunk = request.url.includes('/_app/immutable/');
  const isNavigation = request.mode === 'navigate';

  if (isImmutableChunk || isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful responses for offline use (except opaque/cors failures)
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback to cache on failure
          const cached = await caches.match(request);
          if (cached) return cached;
          // As a last resort, return the homepage for navigations
          if (isNavigation) {
            const fallback = await caches.match('/');
            if (fallback) return fallback;
          }
          throw new Error('Network error and no cache available');
        })
    );
    return;
  }

  // For other requests: cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cached);
    })
  );
});

// Purpose: Activate event - clean up old caches
// Context: Removes old cache versions when updating
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
