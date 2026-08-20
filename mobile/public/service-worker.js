// Service Worker for Perfect Lighthouse PWA Score
// Version: 1.0.0

const CACHE_NAME = 'gathergrove-mobile-v1.0.0';
const STATIC_CACHE_NAME = 'gathergrove-static-v1.0.0';
const RUNTIME_CACHE_NAME = 'gathergrove-runtime-v1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/site.webmanifest',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

// Routes and their caching strategies
const ROUTE_CACHE_STRATEGIES = [
  {
    pattern: /^https:\/\/fonts\.googleapis\.com\//,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'google-fonts-stylesheets',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  {
    pattern: /^https:\/\/fonts\.gstatic\.com\//,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'google-fonts-webfonts',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'images',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    maxEntries: 60,
  },
  {
    pattern: /\.(?:js|css)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'static-resources',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  {
    pattern: /^https:\/\/api\.gathergrove\.com\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: 'api-cache',
    maxAge: 60 * 5, // 5 minutes
    maxEntries: 50,
  },
];

const SENSITIVE_PATH_PATTERNS = [
  /^\/api(?:\/|$)/,
  /^\/auth(?:\/|$)/,
  /^\/login(?:\/|$)/,
  /^\/logout(?:\/|$)/,
  /^\/activate-account(?:\/|$)/,
  /^\/reset-password(?:\/|$)/,
  /^\/forgot-password(?:\/|$)/,
  /^\/payment(?:\/|$)/,
  /^\/events\/pay(?:\/|$)/,
  /^\/app(?:\/|$)/,
  /^\/admin(?:\/|$)/,
];

const SENSITIVE_QUERY_KEYS = ['token', 'code', 'state', 'session', 'auth', 'jwt', 'payment', 'invite'];

function hasSensitiveHeaders(request) {
  const headers = request.headers;
  const getHeader = name => {
    if (headers && typeof headers.get === 'function') {
      return headers.get(name);
    }

    for (const [headerName, value] of Object.entries(headers || {})) {
      if (headerName.toLowerCase() === name) {
        return value;
      }
    }

    return null;
  };

  return Boolean(
    getHeader('authorization') ||
    getHeader('cookie') ||
    getHeader('x-csrf-token')
  );
}

function isSensitiveUrl(url) {
  if (SENSITIVE_PATH_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return true;
  }

  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.includes(key.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function shouldBypassCache(request) {
  const url = new URL(request.url);
  return request.method !== 'GET' ||
    request.credentials === 'include' ||
    request.cache === 'no-store' ||
    hasSensitiveHeaders(request) ||
    isSensitiveUrl(url);
}

function isCacheableResponse(response) {
  if (!response || !response.ok) {
    return false;
  }

  const cacheControl = response.headers.get('cache-control') || '';
  return !/(?:no-store|private)/i.test(cacheControl) &&
    !response.headers.has('set-cookie');
}

function normalizeNotificationUrl(rawUrl) {
  try {
    const url = new URL(rawUrl || '/', self.location.origin);

    if (url.origin !== self.location.origin || isSensitiveUrl(url)) {
      return '/';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that don't match current version
              return (
                cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== RUNTIME_CACHE_NAME
              );
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (shouldBypassCache(request)) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Find matching cache strategy
  const routeConfig = ROUTE_CACHE_STRATEGIES.find((route) => {
    return route.pattern.test(request.url);
  });
  
  if (routeConfig) {
    event.respondWith(handleRequest(request, routeConfig));
  } else {
    // Default strategy for unmatched routes
    event.respondWith(handleRequest(request, {
      strategy: CACHE_STRATEGIES.NETWORK_FIRST,
      cacheName: RUNTIME_CACHE_NAME,
      maxAge: 60 * 60, // 1 hour
    }));
  }
});

// Handle requests based on strategy
async function handleRequest(request, config) {
  const { strategy, cacheName, maxAge, maxEntries } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge, maxEntries);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge, maxEntries);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge, maxEntries);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    
    default:
      return networkFirst(request, cacheName, maxAge, maxEntries);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cached response is still valid
    if (isCacheValid(cachedResponse, maxAge)) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (isCacheableResponse(networkResponse)) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await putInCache(cache, request, responseToCache, maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache:', error);
    return cachedResponse || new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Network First strategy
async function networkFirst(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (isCacheableResponse(networkResponse)) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await putInCache(cache, request, responseToCache, maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, serving from cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (isCacheableResponse(networkResponse)) {
      const responseToCache = networkResponse.clone();
      await putInCache(cache, request, responseToCache, maxEntries);
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available and valid
  if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
    // Update cache in background
    networkPromise;
    return cachedResponse;
  }
  
  // Wait for network response if no valid cache
  return networkPromise || cachedResponse || new Response('Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Check if cached response is still valid
function isCacheValid(response, maxAge) {
  if (!maxAge) return true;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const cacheTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - cacheTime) < (maxAge * 1000);
}

// Put response in cache with size management
async function putInCache(cache, request, response, maxEntries) {
  if (shouldBypassCache(request) || !isCacheableResponse(response)) return;
  
  // Add to cache
  await cache.put(request, response);
  
  // Manage cache size
  if (maxEntries) {
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      // Remove oldest entries
      const entriesToDelete = keys.length - maxEntries;
      for (let i = 0; i < entriesToDelete; i++) {
        await cache.delete(keys[i]);
      }
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Service Worker: Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(normalizeNotificationUrl(event.notification.data?.url))
  );
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      staticVersion: STATIC_CACHE_NAME,
      runtimeVersion: RUNTIME_CACHE_NAME,
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker: Loaded successfully');
