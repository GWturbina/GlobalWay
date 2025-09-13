// sw.js - Service Worker для GlobalWay PWA

const CACHE_NAME = 'globalway-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './src/css/styles.css',
  './src/css/responsive.css',
  './src/css/animations.css',
  './src/js/web3.js',
  './src/js/contracts.js',
  './src/js/ui.js',
  './src/js/app.js',
  './src/translations/en.json',
  './src/translations/uk.json',
  './src/translations/ru.json',
  './assets/icons/favicon.ico',
  './assets/images/logo.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеширование файлов');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кешированный ответ, если есть
        if (response) {
          return response;
        }

        // Клонируем запрос
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Обработка push-уведомлений (для будущего использования)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от GlobalWay',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/favicon.ico'
  };

  event.waitUntil(
    self.registration.showNotification('GlobalWay', options)
  );
});
