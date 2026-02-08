import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Solo enviar errores en producción
  enabled: process.env.NODE_ENV === "production",

  // Porcentaje de transacciones para performance monitoring (10%)
  tracesSampleRate: 0.1,

  // Porcentaje de sesiones para replay (errores: 100%, sesiones: 10%)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Filtrar errores ruidosos
  ignoreErrors: [
    // Errores de red comunes
    "Failed to fetch",
    "NetworkError",
    "AbortError",
    "Load failed",
    // Errores de extensiones de navegador
    /^chrome-extension/,
    /^moz-extension/,
  ],

  // Sanitizar datos sensibles
  beforeSend(event) {
    // No enviar en desarrollo
    if (process.env.NODE_ENV !== "production") return null

    // Eliminar datos sensibles de las breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((bc) => {
        if (bc.data?.url?.includes("supabase")) {
          bc.data.url = "[SUPABASE_URL]"
        }
        return bc
      })
    }

    return event
  },
})
