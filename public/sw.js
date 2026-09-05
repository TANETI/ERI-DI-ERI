const CACHE_NAME =
  'eri-di-ery-static-v2'

const STATIC_PATHS = [
  '/manifest.webmanifest',
  '/manifest-mobile.webmanifest',
  '/manifest-desktop.webmanifest',
  '/favicon.svg',
  '/icons/icon-mobile-192.png',
  '/icons/icon-mobile-512.png',
  '/icons/icon-mobile-maskable-512.png',
  '/icons/icon-desktop-192.png',
  '/icons/icon-desktop-512.png',
  '/icons/icon-desktop-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener(
  'install',
  (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) =>
          cache.addAll(STATIC_PATHS),
        )
        .then(() =>
          self.skipWaiting(),
        ),
    )
  },
)

self.addEventListener(
  'activate',
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) =>
                  key !== CACHE_NAME,
              )
              .map((key) =>
                caches.delete(key),
              ),
          ),
        )
        .then(() =>
          self.clients.claim(),
        ),
    )
  },
)

self.addEventListener(
  'fetch',
  (event) => {
    const request =
      event.request

    if (
      request.method !== 'GET'
    ) {
      return
    }

    const url =
      new URL(request.url)

    if (
      url.origin !==
      self.location.origin
    ) {
      return
    }

    if (
      url.pathname.startsWith(
        '/api/',
      )
    ) {
      return
    }

    // Keep navigation behind Cloudflare Access.
    // Do not serve a cached index.html after an Access session expires.
    if (
      request.mode === 'navigate'
    ) {
      return
    }

    const cacheable =
      url.pathname.startsWith(
        '/assets/',
      ) ||
      STATIC_PATHS.includes(
        url.pathname,
      )

    if (!cacheable) {
      return
    }

    event.respondWith(
      caches
        .match(request)
        .then((cached) => {
          if (cached) {
            event.waitUntil(
              fetch(request)
                .then((response) => {
                  if (
                    response.ok
                  ) {
                    return caches
                      .open(CACHE_NAME)
                      .then((cache) =>
                        cache.put(
                          request,
                          response.clone(),
                        ),
                      )
                  }
                })
                .catch(() => undefined),
            )

            return cached
          }

          return fetch(request)
            .then((response) => {
              if (!response.ok) {
                return response
              }

              const copy =
                response.clone()

              void caches
                .open(CACHE_NAME)
                .then((cache) =>
                  cache.put(
                    request,
                    copy,
                  ),
                )

              return response
            })
        }),
    )
  },
)
