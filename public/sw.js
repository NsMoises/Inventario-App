self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(e.request);
        const cache = await caches.open("inventario-v1");
        cache.put(e.request, res.clone());
        return res;
      } catch {
        const cached = await caches.match(e.request);
        return cached ?? new Response("Offline", { status: 503 });
      }
    })()
  );
});
