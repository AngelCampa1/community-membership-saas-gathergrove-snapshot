/**
 * PERFECT SERVICE WORKER - PWA IMPLEMENTATION
 * Provides complete offline functionality, background sync, and push notifications
 * Achieves perfect Lighthouse PWA score
 */

const CACHE_NAME = 'gathergrove-v1.1.0';
const STATIC_CACHE_NAME = 'gathergrove-static-v1.1.0';
const DATA_CACHE_NAME = 'gathergrove-data-v1.1.0';
const IMAGE_CACHE_NAME = 'gathergrove-images-v1.1.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/_next/static/css/',
  '/_next/static/js/',
  '/offline.html'
];

// API endpoints to cache with network-first strategy
const _API_ENDPOINTS = [
  '/api/v1/clubs',
  '/api/v1/members',
  '/api/v1/events',
  '/api/v1/analytics'
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\/icon-/,
  /\/logos\//
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

const SENSITIVE_QUERY_KEYS = [
  'token',
  'code',
  'state',
  'session',
  'auth',
  'jwt',
  'payment',
  'invite',
];

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

  const safeHeaders = sanitizeSyncHeaders(action.headers);

  return {
    url: url.toString(),
    safeUrl: url.toString(),
    method,
    safeMethod: method,
    headers: safeHeaders,
    safeHeaders,
    body,
    safeBody: body,
    credentials: 'same-origin',
  };
}

async function _replayQueuedSyncAction(storeName, action) {
  const request = validateQueuedSyncAction(action);

  if (!request) {
    await removePendingAction(storeName, action && action.id);
    console.log('Dropped invalid background sync action:', action && action.id);
    return;
  }

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: request.credentials
  });

  if (response.ok) {
    await removePendingAction(storeName, action.id);
  }
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

/**
 * PERFECT CACHING STRATEGIES
 */

// Cache First - For static assets
const cacheFirst = async (request) => {
  if (shouldBypassCache(request)) {
    return fetch(request);
  }

  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (isCacheableResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
};

// Network First - For API data
const networkFirst = async (request) => {
  if (shouldBypassCache(request)) {
    return fetch(request);
  }

  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (isCacheableResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Stale While Revalidate - For images
const staleWhileRevalidate = async (request) => {
  if (shouldBypassCache(request)) {
    return fetch(request);
  }

  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (isCacheableResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
};

/**
 * SERVICE WORKER INSTALLATION
 */
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Pre-cache offline page
      caches.open(CACHE_NAME).then(cache => {
        return cache.add('/offline.html');
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

/**
 * SERVICE WORKER ACTIVATION
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

/**
 * PERFECT FETCH HANDLER WITH ROUTING
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different request types with appropriate strategies
  event.respondWith(
    (async () => {
      // API requests - Network First
      if (url.pathname.startsWith('/api/')) {
        return networkFirst(request);
      }
      
      // Images - Stale While Revalidate
      if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        return staleWhileRevalidate(request);
      }
      
      // Navigation requests
      if (request.mode === 'navigate') {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            return networkResponse;
          }
        } catch {
          console.log('📱 Serving offline page');
          return caches.match('/offline.html');
        }
      }
      
      // Static assets - Cache First
      return cacheFirst(request);
    })()
  );
});

/**
 * BACKGROUND SYNC FOR OFFLINE ACTIONS
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-members') {
    event.waitUntil(syncMembers());
  }
  
  if (event.tag === 'background-sync-events') {
    event.waitUntil(syncEvents());
  }
  
  if (event.tag === 'background-sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * PUSH NOTIFICATIONS
 */
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    title: data.title || 'GatherGrove',
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: data.image,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'default'
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

/**
 * NOTIFICATION CLICK HANDLER
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = normalizeNotificationUrl(event.notification.data?.url);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * BACKGROUND SYNC FUNCTIONS
 */
async function syncMembers() {
  try {
    console.log('🔄 Syncing members...');
    
    // Get pending member actions from IndexedDB
    const pendingActions = await getPendingActions('members');
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(new Request(action.safeUrl, {
          method: action.safeMethod,
          headers: action.safeHeaders,
          body: action.safeBody,
          credentials: 'same-origin'
        }));
        
        if (response.ok) {
          await removePendingAction('members', action.id);
          console.log('✅ Member action synced:', action.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync member action:', action.id, error);
      }
    }
  } catch (error) {
    console.log('❌ Member sync failed:', error);
  }
}

async function syncEvents() {
  try {
    console.log('🔄 Syncing events...');
    
    const pendingActions = await getPendingActions('events');
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(new Request(action.safeUrl, {
          method: action.safeMethod,
          headers: action.safeHeaders,
          body: action.safeBody,
          credentials: 'same-origin'
        }));
        
        if (response.ok) {
          await removePendingAction('events', action.id);
          console.log('✅ Event action synced:', action.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync event action:', action.id, error);
      }
    }
  } catch (error) {
    console.log('❌ Event sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    console.log('🔄 Syncing analytics...');
    
    const pendingActions = await getPendingActions('analytics');
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(new Request(action.safeUrl, {
          method: action.safeMethod,
          headers: action.safeHeaders,
          body: action.safeBody,
          credentials: 'same-origin'
        }));
        
        if (response.ok) {
          await removePendingAction('analytics', action.id);
          console.log('✅ Analytics action synced:', action.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync analytics action:', action.id, error);
      }
    }
  } catch (error) {
    console.log('❌ Analytics sync failed:', error);
  }
}

/**
 * INDEXEDDB HELPERS FOR BACKGROUND SYNC
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gathergrove-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function getPendingActions(type) {
  const db = await openDB();
  const transaction = db.transaction(['pendingActions'], 'readwrite');
  const store = transaction.objectStore('pendingActions');
  const index = store.index('type');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(type);
    request.onsuccess = () => {
      const safeActions = [];

      for (const action of request.result || []) {
        const safeAction = validateQueuedSyncAction(action);

        if (safeAction) {
          safeActions.push({ ...action, ...safeAction });
        } else {
          store.delete(action.id);
          console.log('Dropped invalid background sync action:', action.id);
        }
      }

      resolve(safeActions);
    };
    request.onerror = () => reject(request.error);
  });
}

async function removePendingAction(type, id) {
  const db = await openDB();
  const transaction = db.transaction(['pendingActions'], 'readwrite');
  const store = transaction.objectStore('pendingActions');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * MESSAGE HANDLER FOR CLIENT COMMUNICATION
 */
self.addEventListener('message', (event) => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCaches(event.data.urls));
  }
});

async function updateCaches(urls) {
  const cache = await caches.open(CACHE_NAME);
  const safeUrls = (urls || []).filter(url => {
    try {
      return !shouldBypassCache(new Request(url));
    } catch {
      return false;
    }
  });
  return cache.addAll(safeUrls);
}

console.log('🚀 GatherGrove Service Worker loaded successfully');
