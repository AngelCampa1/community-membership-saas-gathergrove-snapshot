/* eslint-env serviceworker */
/* eslint no-console: "off" */
/**
 * GatherGrove PWA Service Worker
 * Provides offline functionality, background sync, and caching strategies
 */

const CACHE_NAME = 'gathergrove-v1.0.0';
const API_CACHE_NAME = 'gathergrove-api-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: ['html', 'css', 'js', 'woff2', 'woff', 'ttf', 'eot'],
  // Network first for API calls
  NETWORK_FIRST: ['/api/', '/auth/'],
  // Stale while revalidate for images
  STALE_WHILE_REVALIDATE: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'],
};

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  OFFLINE_URL,
  // Add more critical assets
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
const ALLOWED_SYNC_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_SYNC_HEADER_NAMES = new Set(['accept', 'authorization', 'content-type', 'x-csrf-token']);
const MAX_SYNC_BODY_BYTES = 1024 * 1024;

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

function sanitizeSyncHeaders(headers) {
  const sanitized = new Headers();
  let sourceHeaders;

  try {
    sourceHeaders = new Headers(headers || {});
  } catch {
    return sanitized;
  }

  const headerEntries = typeof sourceHeaders.entries === 'function'
    ? sourceHeaders.entries()
    : Object.entries(sourceHeaders);

  for (const [name, value] of headerEntries) {
    const lowerName = name.toLowerCase();

    if (ALLOWED_SYNC_HEADER_NAMES.has(lowerName)) {
      sanitized.set(lowerName, value);
    }
  }

  if (!sanitized.has('accept')) {
    sanitized.set('accept', 'application/json');
  }

  return sanitized;
}

function validateQueuedSyncAction(action) {
  if (!action || typeof action.url !== 'string') {
    return null;
  }

  const method = String(action.method || 'POST').toUpperCase();
  if (!ALLOWED_SYNC_METHODS.has(method)) {
    return null;
  }

  let url;
  try {
    url = new URL(action.url, self.location.origin);
  } catch {
    return null;
  }

  if (url.origin !== self.location.origin || !url.pathname.startsWith('/api/v1/')) {
    return null;
  }

  let body = action.body;
  if (body && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  if (typeof body === 'string' && new Blob([body]).size > MAX_SYNC_BODY_BYTES) {
    return null;
  }

  return {
    url: url.toString(),
    method,
    headers: sanitizeSyncHeaders(action.headers),
    body,
  };
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

// Background sync tags
const SYNC_TAGS = {
  BACKGROUND_SYNC: 'background-sync',
  DATA_SYNC: 'data-sync',
  OFFLINE_ACTIONS: 'offline-actions',
};

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache;
      }),
      self.skipWaiting(), // Immediately activate new SW
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      }),
      self.clients.claim(), // Take control of all clients
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  if (shouldBypassCache(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle different resource types with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(handleCacheFirst(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleNetworkFirst(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleStaleWhileRevalidate(request));
  } else {
    event.respondWith(handleNetworkFirst(request));
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  
  if (event.tag === SYNC_TAGS.BACKGROUND_SYNC) {
    event.waitUntil(performBackgroundSync());
  } else if (event.tag === SYNC_TAGS.DATA_SYNC) {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === SYNC_TAGS.OFFLINE_ACTIONS) {
    event.waitUntil(processOfflineActions());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  
  const options = {
    body: 'You have new updates in GatherGrove!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-open.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-close.png',
      },
    ],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.title = payload.title || 'GatherGrove';
      options.data = { ...options.data, ...payload.data };
    } catch (parseError) {
      /* Error parsing push notification payload - using defaults */
    }
  }

  event.waitUntil(
    self.registration.showNotification('GatherGrove', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(normalizeNotificationUrl(event.notification.data?.url));
        }
      })
    );
  }
});

// Message event for client communication
self.addEventListener('message', (event) => {
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_CACHE_STATS':
        getCacheStats().then((stats) => {
          event.ports[0].postMessage(stats);
        });
        break;
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
      case 'FORCE_SYNC':
        registration.sync.register(SYNC_TAGS.BACKGROUND_SYNC);
        break;
    }
  }
});

// Cache strategies implementation

/**
 * Cache first strategy for static assets
 */
async function handleCacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return await caches.match(OFFLINE_URL);
  }
}

/**
 * Network first strategy for API calls
 */
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request, {
      timeout: 5000, // 5 second timeout
    });
    
    if (isCacheableResponse(response) && isApiRequest(request)) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

/**
 * Stale while revalidate strategy for images
 */
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cachedResponse || fetchPromise;
}

// Helper functions

function isStaticAsset(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop();
  return CACHE_STRATEGIES.CACHE_FIRST.includes(extension);
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => 
    url.pathname.includes(pattern)
  );
}

function isImageRequest(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop();
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.includes(extension);
}

// Background sync implementations

async function performBackgroundSync() {
  
  try {
    // Get offline actions from IndexedDB or cache
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        await executeAction(action);
        await removePendingAction(action.id);
      } catch (actionError) {
        /* Error executing pending action - will retry on next sync */
      }
    }
  } catch (syncError) {
    /* Error during background sync process */
  }
}

async function syncOfflineData() {
  
  try {
    // Sync cached API responses with server
    const apiCache = await caches.open(API_CACHE_NAME);
    const requests = await apiCache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
          await apiCache.put(request, response.clone());
        }
      } catch (fetchError) {
        /* Error fetching cached request for sync */
      }
    }
  } catch (dataSyncError) {
    /* Error during offline data sync process */
  }
}

async function processOfflineActions() {
  
  // This would integrate with the cache service's sync queue
  try {
    const response = await fetch('/api/sync/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestamp: Date.now() }),
    });

    if (response.ok) {
      /* Offline actions processed successfully */
    }
  } catch (err) {
    /* Error processing offline actions */
  }
}

// Utility functions

async function getPendingActions() {
  // This would integrate with IndexedDB or your storage system
  return [];
}

async function executeAction(action) {
  const safeAction = validateQueuedSyncAction(action);

  if (!safeAction) {
    throw new Error('Invalid queued action');
  }

  // Execute the pending action (API call, etc.)
  const response = await fetch(safeAction.url, {
    method: safeAction.method,
    headers: safeAction.headers,
    body: safeAction.body,
    credentials: 'same-origin',
  });
  
  if (!response.ok) {
    throw new Error(`Action failed: ${response.status}`);
  }
  
  return response;
}

async function removePendingAction() {
  // Remove the action from storage
}

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

