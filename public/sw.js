// Bump the version whenever you deploy to bust stale HTML caches
const CACHE_NAME = "werewords-vi-v2";
// Only cache true static assets — never HTML pages
const STATIC_ASSETS = ["/manifest.json", "/theme.mp3"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k !== CACHE_NAME)
						.map((k) => caches.delete(k))
				)
			)
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	// HTML navigation → always fetch from network so React hydration always matches.
	// Fall back to the cached root shell only when completely offline.
	if (event.request.mode === "navigate") {
		event.respondWith(fetch(event.request).catch(() => caches.match("/")));
		return;
	}

	// Static assets → cache-first
	event.respondWith(
		caches
			.match(event.request)
			.then((cached) => cached || fetch(event.request))
	);
});
