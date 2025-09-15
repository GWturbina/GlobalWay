/**
 * Service Worker для GlobalWay PWA
 * Обеспечивает кеширование, офлайн работу и push уведомления
 */

const CACHE_NAME = 'globalway-v1.0.0';
const STATIC_CACHE = 'globalway-static-v1.0.0';
const DYNAMIC_CACHE = 'globalway-dynamic-v1.0.0';

// Файлы для кеширования при установке
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  
  // CSS файлы
  '/css/variables.css',
  '/css/styles.css',
  '/css/animations.css',
  '/css/responsive.css',
  
  // JavaScript файлы
  '/js/i18n.js',
  '/js/web3-manager.js',
  '/js/contract-manager.js',
  '/js/app.js',
  
  // Переводы
  '/translations/en.json',
  '/translations/ru.json',
  '/translations/uk.json',
  
  // Контракты
  '/contracts/GlobalWay.json',
  '/contracts/GWTToken.json',
  '/contracts/GlobalWayStats.json',
  
  // Иконки
  '/assets/icons/logo.png',
  '/assets/icons/logo-16x16.png',
  '/assets/icons/logo-32x32.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/favicon.ico',
  
  // Изображения
  '/assets/images/background.jpg',
  '/assets/images/planets/planet-club.png',
  '/assets/images/planets/planet-goals.png',
  '/assets/images/planets/planet-mission.png',
  '/assets/images/planets/planet-projects.png',
  '/assets/images/planets/planet-roadmap.png',
  '/assets/images/planets/gwt-coin.png',
  
  // Внешние библиотеки
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/web3/1.8.0/web3.min.js'
];

// Компоненты страниц для динамического кеширования
const DYNAMIC_FILES = [
  '/components/dashboard.html',
  '/components/partners.html',
  '/components/matrix.html',
  '/components/tokens.html',
  '/components/projects.html',
  '/components/settings.html',
  '/components/admin.html'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Кешируем статические файлы
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Предзагружаем компоненты
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Pre-caching components');
        return cache.addAll(DYNAMIC_FILES);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Принудительно активируем новый SW
      return self.skipWaiting();
    })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Очищаем старые кеши
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Берем контроль над всеми клиентами
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Игнорируем chrome-extension и другие схемы
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Специальная обработка для Web3 и блокчейн запросов
  if (isBlockchainRequest(url)) {
    event.respondWith(handleBlockchainRequest(request));
    return;
  }
  
  // Специальная обработка для API запросов
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Обычная стратегия кеширования
  event.respondWith(handleStaticRequest(request));
});

/**
 * Проверка блокчейн запросов
 */
function isBlockchainRequest(url) {
  return url.hostname.includes('bnbchain.org') ||
         url.hostname.includes('opbnb') ||
         url.pathname.includes('/rpc') ||
         url.pathname.includes('/api/v1');
}

/**
 * Обработка блокчейн запросов (всегда из сети)
 */
async function handleBlockchainRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Blockchain request failed:', error);
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Проверка API запросов
 */
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname !== location.hostname;
}

/**
 * Обработка API запросов (сеть с fallback на кеш)
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Кешируем успешные ответы
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ error: 'Offline - data unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Обработка статических запросов (кеш с fallback на сеть)
 */
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // Сначала проверяем кеш
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', url.pathname);
    
    // Фоновое обновление для критически важных файлов
    if (shouldUpdateInBackground(url)) {
      updateCacheInBackground(request);
    }
    
    return cachedResponse;
  }
  
  // Если нет в кеше, пытаемся получить из сети
  try {
    console.log('[SW] Fetching from network:', url.pathname);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Определяем подходящий кеш
      const cacheName = isStaticFile(url) ? STATIC_CACHE : DYNAMIC_CACHE;
      const cache = await caches.open(cacheName);
      
      // Кешируем ответ
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Cached response for:', url.pathname);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for:', url.pathname, error);
    
    // Возвращаем fallback страницу для HTML запросов
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/') || createOfflinePage();
    }
    
    // Для других типов файлов возвращаем ошибку
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Проверка статических файлов
 */
function isStaticFile(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.json'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         STATIC_FILES.includes(url.pathname);
}

/**
 * Проверка необходимости фонового обновления
 */
function shouldUpdateInBackground(url) {
  const criticalFiles = ['/translations/', '/contracts/', '/css/', '/js/'];
  return criticalFiles.some(path => url.pathname.startsWith(path));
}

/**
 * Фоновое обновление кеша
 */
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const url = new URL(request.url);
      const cacheName = isStaticFile(url) ? STATIC_CACHE : DYNAMIC_CACHE;
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
      console.log('[SW] Background updated:', request.url);
    }
  } catch (error) {
    console.log('[SW] Background update failed:', error);
  }
}

/**
 * Создание offline страницы
 */
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GlobalWay - Offline</title>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
          color: #ffffff;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
          padding: 2rem;
        }
        .logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          background: #FFD700;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          color: #0a0a0a;
        }
        h1 {
          color: #FFD700;
          margin-bottom: 1rem;
        }
        p {
          color: #b0b0b0;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .retry-btn {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          border: none;
          border-radius: 25px;
          padding: 12px 24px;
          color: #0a0a0a;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        .retry-btn:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="logo">GW</div>
        <h1>You're Offline</h1>
        <p>It looks like you're not connected to the internet. Some features may not be available until you reconnect.</p>
        <a href="/" class="retry-btn" onclick="window.location.reload()">Try Again</a>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/logo-32x32.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let targetUrl = '/';
  
  if (event.action) {
    // Обработка action buttons
    switch (event.action) {
      case 'open_dashboard':
        targetUrl = '/components/dashboard.html';
        break;
      case 'open_matrix':
        targetUrl = '/components/matrix.html';
        break;
      default:
        targetUrl = notificationData.url || '/';
    }
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Ищем открытое окно
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // Если окна нет, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Обработка сообщений от главного потока
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Обработка sync событий для фоновой синхронизации
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'user-data-sync') {
    event.waitUntil(syncUserData());
  }
  
  if (event.tag === 'transaction-sync') {
    event.waitUntil(syncTransactions());
  }
});

/**
 * Синхронизация данных пользователя
 */
async function syncUserData() {
  try {
    // Получаем сохраненные данные для синхронизации
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Синхронизируем критически важные данные
    for (const request of requests) {
      if (request.url.includes('/api/user/')) {
        await updateCacheInBackground(request);
      }
    }
    
    console.log('[SW] User data synced');
  } catch (error) {
    console.log('[SW] Sync failed:', error);
    throw error; // Retry sync
  }
}

/**
 * Синхронизация транзакций
 */
async function syncTransactions() {
  try {
    // Логика синхронизации транзакций
    console.log('[SW] Transactions synced');
  } catch (error) {
    console.log('[SW] Transaction sync failed:', error);
    throw error;
  }
}

// Периодическая фоновая синхронизация
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'user-data-refresh') {
    event.waitUntil(syncUserData());
  }
});

console.log('[SW] Service Worker script loaded');
