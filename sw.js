// sw.js — 서비스워커 (cache-first → 오프라인 플레이)
const CACHE = 'escape-elevator-v4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/config.js',
  './js/storage.js',
  './js/game.js',
  './js/ui.js',
  './js/main.js',
  './manifest.webmanifest',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if(req.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try {
      const res = await fetch(req);
      const url = new URL(req.url);
      if(url.origin === location.origin && res.ok){
        const c = await caches.open(CACHE);
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if(req.mode === 'navigate'){
        const fallback = await caches.match('./index.html');
        if(fallback) return fallback;
      }
      throw err;
    }
  })());
});
