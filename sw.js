// sw.js - Service Worker для PWA функциональности

const CACHE_NAME = 'globalway-v1.0.0';
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/js/web3.js',
    '/src/js/contracts.js',
    '/src/js/ui.js',
    '/components/dashboard.html',
    '/components/partners.html',
    '/components/matrix.html',
    '/components/tokens.html',
    '/components/settings.html',
    '/components/projects.html',
    '/components/admin.html',
    '/css/styles.css',
    '/css/responsive.css',
    '/css/animations.css',
    '/assets/images/logo.png',
    '/assets/images/background.jpg',
    '/assets/icons/favicon-32x32.png',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
    '/translations/en.json',
    '/translations/ru.json',
    '/translations/uk.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching files', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы к blockchain RPC
    if (event.request.url.includes('opbnb-mainnet-rpc.bnbchain.org') ||
        event.request.url.includes('opbnbscan.com') ||
        event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем из кэша если есть
                if (response) {
                    return response;
                }

                // Иначе делаем сетевой запрос
                return fetch(event.request)
                    .then(response => {
                        // Проверяем что ответ валидный
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ для кэширования
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Если оффлайн, возвращаем базовую страницу
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Обработка сообщений от главного потока
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(updateCache());
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(clearAllCache());
    }
});

// Обновление кэша
async function updateCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Updating cache...');
        await cache.addAll(CACHE_ASSETS);
        console.log('Service Worker: Cache updated');
        
        // Уведомляем все клиенты об обновлении
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'CACHE_UPDATED' });
        });
    } catch (error) {
        console.error('Service Worker: Error updating cache', error);
    }
}

// Очистка всего кэша
async function clearAllCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Service Worker: All cache cleared');
        
        // Уведомляем все клиенты
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
        });
    } catch (error) {
        console.error('Service Worker: Error clearing cache', error);
    }
}

// Синхронизация в фоне для ID маппингов
self.addEventListener('sync', event => {
    if (event.tag === 'sync-id-mappings') {
        event.waitUntil(syncIdMappings());
    }
});

// Синхронизация ID маппингов с backend
async function syncIdMappings() {
    try {
        // Здесь будет логика синхронизации с backend API
        console.log('Service Worker: Syncing ID mappings...');
        
        // Пока просто логируем
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ 
                type: 'SYNC_COMPLETE', 
                data: { type: 'id-mappings' }
            });
        });
    } catch (error) {
        console.error('Service Worker: Error syncing ID mappings', error);
    }
}

// Push уведомления (для будущего использования)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'New notification from GlobalWay',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/favicon-32x32.png',
            data: data.url ? { url: data.url } : null,
            actions: data.actions || []
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'GlobalWay', options)
        );
    }
});

// Клик по push уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Периодическая синхронизация (экспериментальная функция)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

// Фоновая синхронизация
async function performBackgroundSync() {
    try {
        console.log('Service Worker: Performing background sync...');
        
        // Здесь можно добавить логику для:
        // - Синхронизации ID маппингов
        // - Проверки обновлений контракта
        // - Кэширования новых данных
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ 
                type: 'BACKGROUND_SYNC_COMPLETE',
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Обработка ошибок
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred', event.error);
});

// Обработка необработанных отклонений промисов
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
    event.preventDefault();
});
