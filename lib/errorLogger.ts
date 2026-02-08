type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

interface ErrorLogEntry {
  timestamp: string
  severity: ErrorSeverity
  source: string
  message: string
  stack?: string
  context?: Record<string, unknown>
}

export function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>,
  severity: ErrorSeverity = 'error'
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    severity,
    source,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  }

  if (severity === 'critical' || severity === 'error') {
    console.error(`[${entry.severity.toUpperCase()}] [${entry.source}]`, entry.message, context ?? '')
  } else if (severity === 'warning') {
    console.warn(`[${entry.severity.toUpperCase()}] [${entry.source}]`, entry.message, context ?? '')
  }

  // Futuro: enviar a Supabase, Sentry, o servicio externo
}

export function logWarning(source: string, message: string, context?: Record<string, unknown>): void {
  logError(source, message, context, 'warning')
}
