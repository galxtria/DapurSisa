/* DapurSisa offline SW — runtime cache, tanpa daftar hash manual */
const CACHE = 'dapursisa-v3'
const IMG_CACHE = 'dapursisa-img-v1'
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== IMG_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Foto makanan (Unsplash CDN): cache-first agar offline setelah dimuat sekali
  if (url.hostname === 'images.unsplash.com') {
    e.respondWith(
      caches.open(IMG_CACHE).then((c) =>
        c.match(request, { ignoreSearch: false }).then(
          (hit) =>
            hit ||
            fetch(request).then((res) => {
              if (res.ok || res.type === 'opaque') c.put(request, res.clone())
              return res
            }).catch(() => hit)
        )
      )
    )
    return
  }

  if (url.origin !== self.location.origin) return

  // Navigasi: network-first, fallback ke cache lalu index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    )
    return
  }

  // Aset: cache-first, lalu network + simpan
  e.respondWith(
    caches.match(request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})
