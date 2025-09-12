// sw.js — Service Worker для GlobalWay DApp (Vercel)
const CACHE_NAME = 'globalway-cache-v1';

// Кэшируем только «оболочку» (статические файлы). Компоненты HTML и ABI/JSON оставим сетевыми.
const URLS_TO_CACHE = [
  '/',                     // корень
  '/index.html',
  '/manifest.json',
  '/src/css/styles.css',
  '/src/css/responsive.css',
  '/src/css/animations.css',
  '/src/js/app.js',
  '/src/js/web3.js',
  '/src/js/contracts.js',
  '/src/js/ui.js',
  '/src/js/i18n.js',
  '/assets/images/background.jpg',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Стратегия:
// - Только GET-запросы перехватываем.
// - Для «оболочки» — cache-first (что положили в URLS_TO_CACHE).
// - Для всего остального (включая /components/*.html, /contracts/*.json, любые API) — network-first,
//   чтобы всегда получать свежие компоненты/ABI; если офлайн — тихо отдадим кэш, если он есть.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST/PUT и т.п. не трогаем

  const url = new URL(req.url);

  // Наш домен только (иначе блокируем внешние кошельки/скрипты)
  const sameOrigin = url.origin === self.location.origin;

  // Список путей, которые мы кэшируем как «оболочку»
  const isAppShell = sameOrigin && URLS_TO_CACHE.includes(url.pathname);

  if (isAppShell) {
    // cache first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
        // на всякий случай обновим кэш, если ресурс изменился
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        return resp;
      }))
    );
    return;
  }

  // Для компонентов, ABI и прочего — network first
  event.respondWith(
    fetch(req)
      .then((resp) => {
        // если ok — можно положить в кэш для офлайна
        if (sameOrigin && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      })
      .catch(() => caches.match(req) || (sameOrigin ? caches.match('/index.html') : undefined))
  );
});
