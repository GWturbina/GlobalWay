const CACHE_NAME = 'globalway-v2'; // Изменена версия
const urlsToCache = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/main.css', 
  '/css/components.css',
  '/js/app.js',
  '/js/web3.js',
  '/js/contracts.js',
  '/js/ui.js',
  '/js/i18n.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Пропускаем внешние CDN
  if (event.request.url.includes('unpkg.com') || 
      event.request.url.includes('cdn.ethers.io') ||
      event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
