/* ========================================
   GlobalWay - Service Worker
   ======================================== */

const CACHE_NAME = 'globalway-v1';
const DYNAMIC_CACHE = 'globalway-dynamic-v1';

// Файлы для кеширования
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/animations.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/web3.js',
    '/js/contracts.js',
    '/js/wallet.js',
    '/js/storage.js',
    '/js/i18n.js',
    '/js/ui.js',
    '/js/router.js',
    '/js/auth.js',
    '/js/utils.js',
    '/assets/images/background.jpg',
    '/assets/planets/planet-club.png',
    '/assets/planets/planet-mission.png',
    '/assets/planets/planet-goals.png',
    '/assets/planets/planet-roadmap.png',
    '/assets/planets/planet-projects.png',
    '/assets/planets/gwt-coin.png',
    '/translations/en.json',
    '/translations/ru.json',
    '/translations/uk.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Игнорируем запросы к внешним ресурсам
    if (!url.origin.includes(self.location.origin)) {
        return;
    }
    
    // Игнорируем POST запросы и Web3 вызовы
    if (request.method !== 'GET' || url.pathname.includes('/api/') || url.pathname.includes('web3')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Возвращаем из кеша и обновляем в фоне
                    fetchAndCache(request);
                    return cachedResponse;
                }
                
                // Если нет в кеше, запрашиваем из сети
                return fetch(request)
                    .then(response => {
                        // Не кешируем неуспешные ответы
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонируем ответ
                        const responseToCache = response.clone();
                        
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // Для изображений возвращаем placeholder
                        if (request.destination === 'image') {
                            return caches.match('/assets/images/placeholder.png');
                        }
                    });
            })
    );
});

// Функция для обновления кеша в фоне
function fetchAndCache(request) {
    fetch(request)
        .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
                .then(cache => {
                    cache.put(request, responseToCache);
                });
        })
        .catch(() => {
            // Ошибка сети, используем кеш
        });
}

// Обработка push-уведомлений
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('GlobalWay', options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Синхронизация в фоне
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Функция синхронизации
async function syncData() {
    // Здесь можно добавить синхронизацию данных с сервером
    console.log('Background sync running...');
}
