const CACHE_NAME = 'path-finder-v2';
const CACHE_PREFIX = 'path-finder-';
const APP_SCOPE = self.registration.scope;

const STATIC_ASSETS = [
  APP_SCOPE,
  new URL('manifest.json', APP_SCOPE).href,
  new URL('icons/icon-192.png', APP_SCOPE).href,
  new URL('icons/icon-512.png', APP_SCOPE).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const scopePath = new URL(APP_SCOPE).pathname;

  if (url.origin !== location.origin || !url.pathname.startsWith(scopePath)) return;

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === 'navigate') {
          const appShell = await caches.match(APP_SCOPE);
          if (appShell) return appShell;
        }

        throw new Error(`No cached response is available for ${event.request.url}.`);
      }),
  );
});
