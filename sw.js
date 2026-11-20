/* Офлайн-режим: спершу пробуємо мережу (щоб одразу отримувати оновлення гри),
   а без інтернету віддаємо збережену копію. */
const VERSION = "dvoryk-v4";
const FILES = ["./", "index.html", "style.css", "js/data.js", "js/game.js", "manifest.webmanifest",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(e.request, { signal: ctrl.signal, cache: "no-cache" });
      clearTimeout(t);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(e.request, { ignoreSearch: true })) || Response.error();
    }
  })());
});
