const CACHE_VERSION = 'globalway-v1.2.0';
const CACHE_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/main.css',
  './css/components.css',
  './js/config.js',
  './js/web3.js',
  './js/contracts.js',
  './js/utils.js',
  './js/ui.js',
  './js/admin.js',
  './js/app.js',
  './components/dashboard.html',
  './components/partners.html',
  './components/matrix.html',
  './components/tokens.html',
  './components/projects.html',
  './components/admin.html',
  './contracts/contracts-config.json',
  './assets/icons/logo.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/planets/gwt-coin.png',
  './manifest.json'
];

// Install - кэширование файлов
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Caching assets');
      // ✅ Кэшируем файлы по одному, чтобы увидеть какой файл не загружается
      return Promise.all(
        CACHE_ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(() => {
      console.log('[SW] Install complete, skipping waiting');
      return self.skipWaiting();
    }).catch(err => {
      console.error('[SW] Install failed:', err);
    })
  );
});

// Activate - удаление старого кеша
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch - стратегия Network First для HTML/JSON, Cache First для статики
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем внешние запросы (API blockchain, CDN и т.д.)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Пропускаем chrome-extension и другие протоколы
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // ✅ Network First для HTML (всегда свежие данные)
  if (request.destination === 'document' || 
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Кэшируем успешный ответ
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, берём из кеша
          return caches.match(request).then(cached => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // ✅ Network First для JSON (contracts-config.json и т.д.)
  if (request.headers.get('accept')?.includes('application/json') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // ✅ Cache First для статики (CSS, JS, изображения)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      }).catch(err => {
        console.error('[SW] Fetch failed:', request.url, err);
        return new Response('Network error', { status: 503 });
      });
    })
  );
});

// Обработка push-уведомлений (опционально)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'GlobalWay';
  const options = {
    body: data.body || 'New notification',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если есть открытое окно, фокусируемся на нём
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
