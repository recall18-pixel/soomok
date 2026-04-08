const CACHE_NAME = 'sales-card-v3';
const APP_SHELL = [
  './',
  './index.html',
  './sales.html',
  './clients.html',
  './reports.html',
  './settings.html',
  './style.css',
  './data.js',
  './home.js',
  './sales.js',
  './clients.js',
  './reports.js',
  './settings.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});
