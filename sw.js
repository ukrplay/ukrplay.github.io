// sw.js
const CACHE_NAME = 'ukrplay-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.png',
  '/images/back.jpg',
  '/images/hero.jpg',
  '/images/LighthouseOfMadness.jpg',
  '/images/hypbreak.jpg',
  '/images/enotr.jpg',
  '/images/thauma.jpg',
  '/images/mashper.jpg'
];

// Встановлення: кешуємо файли
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Деякі файли не вдалося закешувати:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Активація: видаляємо старі кеші
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегія: спочатку мережа, потім кеш (для свіжих даних), але з фолбеком
self.addEventListener('fetch', event => {
  // Не кешуємо запити до Google Apps Script (коментарі, чат) — вони мають бути свіжими
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Якщо успішно — оновлюємо кеш
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Якщо мережа недоступна — віддаємо з кешу
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Якщо це навігація — повертаємо index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Офлайн', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
