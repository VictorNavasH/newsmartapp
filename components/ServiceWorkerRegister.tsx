"use client"

import { useEffect } from "react"

// Registra el service worker (solo en producción) para caché offline de assets
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si falla el registro la app sigue funcionando con normalidad
    })
  }, [])

  return null
}
