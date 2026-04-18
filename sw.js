const CACHE_NAME = 'expense-tracker-v6';
const ASSETS = [
  '/exptracker/',
  '/exptracker/index.html',
  '/exptracker/style.css',
  '/exptracker/app.js',
  '/exptracker/manifest.json',
  '/exptracker/icons/icon-192.png',
  '/exptracker/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
