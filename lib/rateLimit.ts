interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitConfig {
  /** Máximo de peticiones en la ventana */
  maxRequests: number
  /** Ventana de tiempo en milisegundos */
  windowMs: number
}

/**
 * Rate limiting simple en memoria.
 * Para producción con múltiples instancias, usar Redis o Upstash.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const resetIn = entry.resetTime - now

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining, resetIn }
}
