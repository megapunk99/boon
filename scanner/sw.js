/**
 * 🌿 Boon Mobile Scanner — Service Worker
 *
 * Provides offline support and caching for the scanner PWA.
 * - Static assets: cache-first (instant load offline)
 * - API calls: network-first with timeout, fallback to cached response
 * - QR code images: cache-first
 *
 * @version 1.0.0
 */

const CACHE_NAME = 'boon-scanner-v2';

const STATIC_ASSETS = [
  '/scanner/',
  '/scanner/index.html',
  '/scanner/css/style.css',
  '/scanner/js/api.js',
  '/scanner/js/app.js',
  '/scanner/js/scanner.js',
  '/scanner/js/generator.js',
  '/scanner/js/offline.js',
  '/scanner/manifest.json',
];

// ── Install: cache essential assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: smart caching strategy ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Static scanner assets: cache-first (works offline) ──
  // API calls are handled by the IndexedDB offline queue (offline.js),
  // not the service worker, because SW scope is /scanner/.
  if (url.pathname.startsWith('/scanner/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Everything else: network-first (falls back to cache) ──
  event.respondWith(networkFirst(request));
});

// ── Cache-First Strategy ─────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503 });
  }
}

// ── Network-First Strategy ───────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

// ── Network-First with Timeout (for API calls) ───────────────────────────
async function networkFirstWithTimeout(request) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 8000)
  );

  try {
    const response = await Promise.race([
      fetch(request),
      timeoutPromise,
    ]);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Try cache fallback
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline JSON response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are offline. Data will sync when connection is restored.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
