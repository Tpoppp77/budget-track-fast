const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/dist/manifest.json',
    '/dist/bundle.js',
    '/dist/icon_72x72.png',
    '/dist/icon_96x96.png',
    '/dist/icon_128x128.png',
    '/dist/icon_144x144.png',
    '/dist/icon_152x152.png',
    '/dist/icon_192x192.png',
    '/dist/icon_384x384.png',
    '/dist/icon_512x512.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
]

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(FILES_TO_CACHE))

            .then(() => self.skipWaiting())
    )
})

self.addEventListener("activate", (event) => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];

    event.waitUntil(

        caches
            .keys()
            .then(cacheNames => {

                return cacheNames.filter(name => !currentCaches.includes(name))
            })
            .then(cachesToDelete => {

                return Promise.all(cachesToDelete.map(name => caches.delete(name)))
            })
            .then(() => self.clients.claim())
    )
})

self.addEventListener("fetch", (event) => {
    if (
        event.request.method !== "GET" ||
        !event.request.url.startsWith(self.location.origin)
    ) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches
                .open(RUNTIME_CACHE)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {

                            cache.put(event.request, response.clone());

                            return response;
                        })

                        .catch(() => caches.match(event.request));
                })
        );

        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse
                }
                caches
                    .open(RUNTIME_CACHE)
                    .then(response => {
                        return response || fetch(event.request)
                    })
            })
    )

})