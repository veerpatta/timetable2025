// Service Worker for Veer Patta Public School Timetable
// Provides offline-first caching for the page shell and timetable data

const CACHE_NAME = 'vpps-timetable-v1';
const STATIC_CACHE_NAME = 'vpps-static-v1';

// Resources to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/VPPS Full Logo only.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method !== 'GET') {
    return; // Only handle GET requests
  }

  // For timetable data requests (if any API calls are made)
  if (url.pathname.includes('timetable') || url.pathname.includes('api')) {
    event.respondWith(
      networkFirstWithCache(request, CACHE_NAME)
    );
    return;
  }

  // For static assets and main page
  event.respondWith(
    cacheFirstWithNetworkFallback(request)
  );
});

// Cache-first strategy with network fallback (for static assets)
async function cacheFirstWithNetworkFallback(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    // If not in cache, fetch from network
    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Fetch failed for:', request.url, error);
    
    // Return a basic offline page or fallback
    if (request.destination === 'document') {
      return new Response(
        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    return new Response('Network error occurred', { status: 503 });
  }
}

// Network-first strategy with cache fallback (for dynamic data)
async function networkFirstWithCache(request, cacheName) {
  try {
    // Try network first
    console.log('Service Worker: Trying network first for:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the fresh response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Cached fresh data:', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving stale data from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available
    console.error('Service Worker: No cache available for:', request.url);
    return new Response('No cached data available', { status: 503 });
  }
}

// Background sync for future enhancements
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-timetable') {
    event.waitUntil(
      // Future: Sync timetable data in background
      console.log('Service Worker: Background timetable sync completed')
    );
  }
});

// Handle push notifications (for future enhancements)
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Timetable update available',
  icon: './icons/VPPS Full Logo only.png',
  badge: './icons/VPPS Full Logo only.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Timetable',
  icon: './icons/VPPS Full Logo only.png'
      },
      {
        action: 'close',
        title: 'Close',
  icon: './icons/VPPS Full Logo only.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('VPPS Timetable', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

console.log('Service Worker: Script loaded successfully');