/* Service worker: offline cache for the served PWA build.
   Strategy:
   - page navigations (HTML): network-first, so the app is always fresh when online
   - static assets: cache-first with a background refresh
   - /api/*: always live
   Bump CACHE when assets change so browsers drop stale copies. */
const CACHE = 'mcdo-kiosk-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/api.js',
  './js/cart.js',
  './js/ui.js',
  './js/router.js',
  './js/live.js',
  './js/app.js',
  './js/views/view-home.js',
  './js/views/view-platforms.js',
  './js/views/view-menu.js',
  './js/views/view-checkout.js',
  './js/views/view-orders.js',
  './js/views/view-order.js',
  './js/views/view-receipt.js',
  './js/views/view-points.js',
  './js/views/view-auth.js',
  './js/views/view-admin.js',
  './js/views/view-kitchen.js',
  './js/views/view-credits.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through
  if (url.pathname.startsWith('/api/')) return; // live data, never cached

  // Page loads: always try the network first so a new build is picked up.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: serve from cache fast, refresh in the background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
