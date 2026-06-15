/// <reference lib="WebWorker" />
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

// ── Precache all build outputs injected by vite-plugin-pwa ────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Take control of all clients as soon as possible
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(self.clients.claim()),
);

// ── API requests — always go to the network, never cache ─────────────────────
registerRoute(
  ({ url }) => url.pathname.startsWith("/api"),
  new NetworkOnly(),
);

// ── Google Fonts — long-lived cache ─────────────────────────────────────────
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "smartzim-fonts",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
);

// ── Navigation requests — NetworkFirst with offline fallback ──────────────────
// Try the network for up to 3 s. If the request fails (no network) and the
// page isn't in cache, serve the branded offline.html instead of a browser
// error. If the page IS in cache (e.g. the user visited it before) we serve
// the cached version immediately.
const navigationStrategy = new NetworkFirst({
  cacheName: "smartzim-pages",
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
  ],
});

registerRoute(
  new NavigationRoute(
    async (params) => {
      try {
        return await navigationStrategy.handle(params);
      } catch {
        // Network failed and no cache hit — serve the offline page
        const offlineCache = await caches.open("smartzim-offline");
        const cachedOffline = await offlineCache.match("/offline.html");
        if (cachedOffline) return cachedOffline;
        // Last resort: look in the precache
        const precached = await caches.match("/offline.html");
        if (precached) return precached;
        return new Response(
          "<h1>You're offline</h1><p>Please check your connection and try again.</p>",
          { headers: { "Content-Type": "text/html" } },
        );
      }
    },
    { denylist: [/^\/api/] },
  ),
);

// ── Precache offline.html into its own named cache for reliability ────────────
// This runs at install time so the page is always available.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("smartzim-offline").then((cache) =>
      cache.add(new Request("/offline.html", { cache: "reload" })),
    ),
  );
});
