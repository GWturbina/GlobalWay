// ===================================================================
// GlobalWay DApp Service Worker v2.0.0
// Updated: October 25, 2025
// Network: opBNB Mainnet
// ===================================================================

const CACHE_VERSION = 'globalway-v2.0.0';

// ✅ ПОЛНЫЙ СПИСОК ФАЙЛОВ ДЛЯ КЕШИРОВАНИЯ
const CACHE_ASSETS = [
  // Главная страница
  './',
  './index.html',
  
  // CSS
  './css/variables.css',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  
  // JavaScript - ВСЕ ОБНОВЛЕННЫЕ ФАЙЛЫ v2.0
  './js/config.js',
  './js/web3.js',
  './js/contracts.js',
  './js/utils.js',
  './js/ui.js',
  './js/admin.js',
  './js/app.js',
  './js/registration.js',  // ✅ ДОБАВЛЕНО!
  
  // HTML Components
  './components/dashboard.html',
  './components/partners.html',
  './components/matrix.html',
  './components/tokens.html',
  './components/projects.html',
  './components/admin.html',
  
  // ABI Files (если у вас есть папка abi/)
  './abi/GlobalWay.json',
  './abi/GWTToken.json',
  './abi/TechAccounts.json',
  './abi/Marketing.json',
  './abi/Quarterly.json',
  './abi/Investment.json',
  './abi/LeaderPool.json',
  './abi/Stats.json',
  './abi/Bridge.json',
  './abi/Governance.json',
  
  // ИЛИ contracts-config.json (если используете этот формат)
  // './contracts/contracts-config.json',
  
  // Assets
  './assets/icons/logo.png',
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png',
  './assets/planets/gwt-coin.png',
  
  // Translations (если есть)
  './translations/en.json',
  './translations/ru.json',
  './translations/uk.json',
  
  // PWA
  './manifest.json'
];

// ===================================================================
// INSTALL EVENT - Кэширование файлов
// ===================================================================
self.addEventListener('install', (event) => {
  console.log('[SW v2.0] 🔧 Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW v2.0] 📦 Caching app assets...');
        
        // Кэшируем файлы по одному для лучшей отладки
        return Promise.all(
          CACHE_ASSETS.map(url => {
            return cache.add(url)
              .then(() => {
                console.log(`[SW v2.0] ✅ Cached: ${url}`);
              })
              .catch(err => {
                console.warn(`[SW v2.0] ⚠️ Failed to cache: ${url}`, err.message);
              });
          })
        );
      })
      .then(() => {
        console.log('[SW v2.0] ✅ Installation complete, skipping waiting...');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW v2.0] ❌ Installation failed:', err);
      })
  );
});

// ===================================================================
// ACTIVATE EVENT - Удаление старого кеша
// ===================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW v2.0] 🔄 Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              console.log(`[SW v2.0] 🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW v2.0] ✅ Activation complete, claiming clients...');
        return self.clients.claim();
      })
      .then(() => {
        console.log('[SW v2.0] 🎉 Service Worker is now active and controlling all pages!');
      })
  );
});

// ===================================================================
// FETCH EVENT - Стратегии кэширования
// ===================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем внешние запросы (blockchain RPC, CDN, и т.д.)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Пропускаем non-http(s) протоколы
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Пропускаем запросы к blockchain API
  if (url.hostname.includes('bnbchain.org') || 
      url.hostname.includes('infura.io') ||
      url.hostname.includes('alchemy.com') ||
      url.hostname.includes('quicknode.com')) {
    return;
  }

  // ===================================================================
  // STRATEGY 1: Network First для HTML (всегда свежая версия)
  // ===================================================================
  if (request.destination === 'document' || 
      request.headers.get('accept')?.includes('text/html')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Кэшируем успешный ответ
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, берём из кеша
          console.log('[SW v2.0] 📡 Network unavailable, serving from cache');
          return caches.match(request).then(cached => {
            return cached || new Response(
              '<h1>Offline</h1><p>No internet connection. Please try again later.</p>', 
              { 
                status: 503,
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
        })
    );
    return;
  }

  // ===================================================================
  // STRATEGY 2: Network First для JSON (config, translations, ABI)
  // ===================================================================
  if (request.headers.get('accept')?.includes('application/json') ||
      url.pathname.endsWith('.json')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW v2.0] 📡 Network unavailable, serving JSON from cache');
          return caches.match(request).then(cached => {
            return cached || new Response(
              '{"error": "offline"}',
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // ===================================================================
  // STRATEGY 3: Cache First для статики (CSS, JS, изображения)
  // ===================================================================
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log(`[SW v2.0] 💾 Serving from cache: ${url.pathname}`);
          return cachedResponse;
        }
        
        // Если нет в кеше, загружаем из сети
        return fetch(request)
          .then((response) => {
            // Кэшируем только успешные ответы
            if (response && response.status === 200) {
              const clonedResponse = response.clone();
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(request, clonedResponse);
              });
            }
            return response;
          })
          .catch(err => {
            console.error('[SW v2.0] ❌ Fetch failed:', url.pathname, err.message);
            return new Response(
              'Network error',
              { status: 503 }
            );
          });
      })
  );
});

// ===================================================================
// PUSH NOTIFICATIONS (опционально)
// ===================================================================
self.addEventListener('push', (event) => {
  console.log('[SW v2.0] 📬 Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'GlobalWay';
  const options = {
    body: data.body || 'New notification from GlobalWay',
    icon: './assets/icons/icon-192x192.png',
    badge: './assets/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'globalway-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || './',
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ===================================================================
// NOTIFICATION CLICK
// ===================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v2.0] 🔔 Notification clicked');
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Если есть открытое окно, фокусируемся на нём
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ===================================================================
// MESSAGE HANDLER (для обновления кеша из приложения)
// ===================================================================
self.addEventListener('message', (event) => {
  console.log('[SW v2.0] 💬 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW v2.0] ⏭️ Skipping waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW v2.0] 🗑️ Clearing cache...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW v2.0] ✅ Cache cleared');
        return self.registration.unregister();
      })
    );
  }
});

// ===================================================================
// BACKGROUND SYNC (опционально, для офлайн транзакций)
// ===================================================================
self.addEventListener('sync', (event) => {
  console.log('[SW v2.0] 🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации транзакций
      Promise.resolve()
    );
  }
});

console.log('[SW v2.0] 🚀 Service Worker script loaded and ready!');
