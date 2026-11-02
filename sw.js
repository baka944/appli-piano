// Réseau d'abord : chaque ouverture récupère la dernière version publiée, sans attendre la fin du cache du navigateur.
// Sans connexion, l'appli repart de la dernière copie reçue.
const CACHE = 'appli-piano';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
    }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || Response.error())));
});
