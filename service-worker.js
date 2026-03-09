const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `serwaah-portal-${CACHE_VERSION}`;

// List of essential assets to cache
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
          console.warn('[Service Worker] Some assets could not be cached:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external API services - let them go through directly
  if (request.url.includes('sms.arkesel.com') || 
      request.url.includes('api.allorigins.win')) {
    event.respondWith(fetch(request).catch(err => {
      console.log('External API fetch error:', err);
      throw err;
    }));
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached response if available
        if (response) {
          return response;
        }

        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful responses for HTML, JS, CSS
          if (request.url.includes('/') && 
              (request.url.endsWith('.js') || 
               request.url.endsWith('.css') || 
               request.url.endsWith('.html') ||
               request.url.includes('.json'))) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }

          return response;
        }).catch(error => {
          console.log('Fetch failed:', error);
          // Return a custom offline page if needed
          if (request.method === 'GET') {
            return caches.match(request);
          }
          throw error;
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
