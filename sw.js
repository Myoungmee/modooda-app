// MoDooDa service worker: offline support for the app's own files only.
// It never caches task text, prompts or replies (those never leave the page).
const VERSION = '0.3.1-beta-19a5f21bf0';
const CACHE = `modooda-${VERSION}`;
const PRECACHE = [
  "./",
  "./app/",
  "./app/app.js",
  "./embed/",
  "./embed/embed.js",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/mascot.webp",
  "./landing.js",
  "./manifest.webmanifest",
  "./styles.css"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('modooda-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch other sites
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (e) {
        if (req.mode === 'navigate') {
          const shell = await cache.match(new URL('app/', scope).href);
          if (shell) return shell;
        }
        throw e;
      }
    }),
  );
});
