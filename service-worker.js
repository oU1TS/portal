const CACHE_NAME = 'ou1ts-portal-v3.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './changes.json',
    './js/changelog-modal.js',
    './js/spa-controller.js',
    './js/data-renderer.js',
    './js/cms.js',
    './js/auth.js',
    './js/auth-modal.js',
    './js/stars.js',
    './js/supabase-config.js',
    './manifest.json',
    './icons/icon.webp',
    './contributions.html'
];

// Install Event - Pre-cache critical shell assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching critical assets');
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('[SW] Non-critical pre-cache issue:', err);
            });
        })
    );
});

// Activate Event - Cleanup Old Caches & claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Clearing Old Cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network-First for freshness with safe Cache Fallback
self.addEventListener('fetch', (event) => {
    // Only handle same-origin GET requests (skip WebSockets, CORS APIs, Supabase, extensions)
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    if (event.request.url.includes('/ws') || event.request.url.includes('hot-reload')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Fallback to cache when offline
                const cached = await caches.match(event.request);
                if (cached) return cached;

                // Return valid HTTP response instead of undefined to prevent TypeError
                return new Response('Network request failed and resource is not in cache', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
    );
});
