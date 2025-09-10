// sw.js - Service Worker for PWA functionality
const CACHE_NAME = 'globalway-v1.0.0';
const urlsToCache = [
  '/',
  '/src/css/styles.css',
  '/src/css/responsive.css',
  '/src/css/animations.css',
  '/src/js/app.js',
  '/src/js/web3.js',
  '/src/js/contracts.js',
  '/src/js/ui.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});
