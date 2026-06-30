const CACHE_NAME = 'ams-smk-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/inventory.html',
  '/consumables.html',
  '/loans.html',
  '/scan.html',
  '/analytics.html',
  '/cannibalization.html',
  '/stock-opname.html',
  '/uses.html',
  '/css/animations.css',
  '/css/background.css',
  '/css/floating-cards.css',
  '/js/api.js',
  '/js/animations.js',
  '/js/theme.js',
  '/js/utils.js',
  '/js/pwa.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local assets (not backend APIs)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline pages if needed
      });
    })
  );
});
