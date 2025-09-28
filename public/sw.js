const CACHE_NAME = 'arbeidsordre-v3.0'; // Major version bump to force complete cache clear
const urlsToCache = [
  '/',
  '/field',
  '/manifest.json'
];

// Enhanced cache busting
self.addEventListener('install', (event) => {
  console.log('SW: Installing version', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force immediate activation
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating version', CACHE_NAME);
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API calls and hot reload
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/node_modules/') ||
      url.searchParams.has('v') || // Skip Vite versioned assets
      url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received skip waiting message');
    self.skipWaiting();
  }
});