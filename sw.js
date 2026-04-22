const CACHE = 'reserva-iguacu-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/formulario.html',
  '/styles.css',
  '/form.css',
  '/script.js',
  '/form.js',
  '/logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // PDFs e webhooks sempre buscam na rede
  if (e.request.url.includes('/docs/') || e.request.url.includes('n8n')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
