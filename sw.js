const CACHE_NAME = 'igris-workout-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.png',
  '/img/shadows/chibi_rig_plume.png',
  '/img/shadows/chibi_rig_body.png',
  '/img/shadows/chibi_rig_head.png',
  '/img/shadows/chibi_rig_arm_wave.png',
  '/img/shadows/chibi_rig_arm_sword.png',
  '/img/shadows/chibi_igris_perfect.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    return; // Não cacheia chamadas de API
  }
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
