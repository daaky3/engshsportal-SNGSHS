const CACHE_NAME = 'serwaah-portal-v2.4.5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://unpkg.com/dexie/dist/dexie.js',
  'https://unpkg.com/xlsx/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Error caching assets:', err);
          // Continue even if some assets fail to cache
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip cross-origin requests and certain patterns
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
