const CACHE_NAME = "archive-chorale-v1";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// L'app elle-même (structure/JS/CSS) est mise en cache pour un chargement instantané et
// hors-ligne. Les données (fichiers, dossiers) vivent dans IndexedDB, pas ici, et les
// appels vers l'API Google Drive passent toujours par le réseau (jamais mis en cache).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;
  if (url.includes("googleapis.com") || url.includes("accounts.google.com") || url.includes("drive.google.com")) {
    return; // toujours en direct pour Drive/Google
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
