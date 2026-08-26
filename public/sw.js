const CACHE_NAME = 'star-media-pwa-cache-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

// Install Event
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event (Cache Invalidation)
self.addEventListener('activate', event => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Clearing Old Cache', cache);
              return caches.delete(cache);
            }
          })
        );
      });
    })
  );
});

// Fetch Event (Excluding Firebase / Firestore traffic)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // STRICTLY EXCLUDE Firestore APIs, Firebase Auth, and WebSockets from Service Worker caching
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    event.request.method !== 'GET' ||
    url.startsWith('ws:') ||
    url.startsWith('wss:')
  ) {
    // Network-only, bypass Service Worker cache entirely
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Cache static assets (JS/CSS built bundles, images) from our own domain
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || url.endsWith('.svg') || url.includes('fonts.googleapis.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for document requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Push Notification Event Listener
self.addEventListener('push', event => {
  console.log('Service Worker: Received push event', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('Push data JSON parsed:', data);
    } catch (e) {
      data = { body: event.data.text() };
      console.log('Push data text parsed:', data);
    }
  }

  const title = data.notification?.title || data.data?.title || 'إشعار جديد من منظومة العهد';
  const body = data.notification?.body || data.data?.body || data.body || '';
  const icon = data.notification?.icon || data.data?.icon || '/favicon.svg';
  const badge = data.notification?.badge || data.data?.badge || '/favicon.svg';
  
  // Custom click action link
  const clickAction = data.notification?.click_action || data.data?.click_action || '/';

  const options = {
    body: body,
    icon: icon,
    badge: badge,
    vibrate: [100, 50, 100],
    data: {
      url: clickAction,
      ...data.data
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Event Listener
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  event.notification.close();

  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Find an open tab and navigate/focus it, or open new window
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

