const CACHE_NAME = 'elinstall-v26';

// Képek és ikonok — ritkán változnak, cache-first
const STATIC_ASSETS = [
  './assets/flags/gb.png',
  './assets/flags/es.png',
  './assets/flags/hu.png',
  './assets/flags/se.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        // Értesítjük az összes nyitott lapot → azok automatikusan újratöltődnek
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isCode = url.pathname.endsWith('.js') ||
                 url.pathname.endsWith('.css') ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('.txt') ||
                 url.pathname.endsWith('/');

  if (isCode) {
    // JS/CSS/HTML: mindig hálózat először → friss verzió, offline esetén cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Képek, ikonok: cache-first
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
