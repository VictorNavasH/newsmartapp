// Service worker de NÜA Smart App
// Estrategia conservadora: red primero, caché como respaldo.
// Solo cachea assets estáticos del mismo origen (nunca datos de Supabase ni APIs).
const CACHE_NAME = "nua-smart-app-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const CACHEABLE_DESTINATIONS = new Set(["style", "script", "image", "font"])

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  // Nunca interceptar peticiones a otros orígenes (Supabase, GoCardless, etc.)
  if (url.origin !== self.location.origin) return
  // No cachear rutas de API propias
  if (url.pathname.startsWith("/api/")) return

  const isStaticAsset = CACHEABLE_DESTINATIONS.has(request.destination) || url.pathname.startsWith("/_next/static")

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok && isStaticAsset) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        }
        // Chunk de un deploy anterior que ya no existe (404): servir la copia
        // cacheada para que los clientes con la versión vieja sigan funcionando
        if (!response.ok && isStaticAsset) {
          const cached = await caches.match(request)
          if (cached) return cached
        }
        return response
      })
      .catch(async () => {
        // Sin red: servir del caché lo que haya (assets o la última navegación)
        const cached = await caches.match(request)
        if (cached) return cached
        throw new Error("offline")
      }),
  )
})
