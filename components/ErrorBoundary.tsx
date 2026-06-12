"use client"

import React from "react"
import * as Sentry from "@sentry/nextjs"
import { logError } from "@/lib/errorLogger"
import { AlertTriangle, RotateCcw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// Tras un deploy, los clientes con la versión anterior abierta intentan cargar
// chunks que ya no existen en Vercel. Es recuperable recargando: la página
// nueva trae los chunks nuevos.
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false
  return /Failed to load chunk|ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module/i.test(
    `${error.name} ${error.message}`,
  )
}

const CHUNK_RELOAD_KEY = "chunk-error-reloaded-at"

// Evita bucles de recarga si el error persiste (solo un auto-reload por minuto)
function tryAutoReloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Chunk obsoleto tras un deploy: recargar trae la versión nueva (no es un error real)
    if (isChunkLoadError(error) && tryAutoReloadOnce()) return

    logError('ErrorBoundary', error, {
      componentStack: errorInfo.componentStack ?? undefined,
    }, 'critical')

    // Reportar a Sentry con contexto del componente
    Sentry.captureException(error, {
      tags: { component: 'ErrorBoundary' },
      extra: { componentStack: errorInfo?.componentStack },
    })
  }

  handleReset = (): void => {
    // Un chunk obsoleto no se arregla re-renderizando: hace falta recargar la página
    if (isChunkLoadError(this.state.error)) {
      window.location.reload()
      return
    }
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error)
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-[#fe6d73]" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Algo salió mal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {chunkError
                ? "Hay una versión nueva de la app. Recarga para actualizarte."
                : "Ha ocurrido un error inesperado. Puedes intentar volver al dashboard."}
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#02b1c4] text-white rounded-lg hover:bg-[#02b1c4]/90 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {chunkError ? "Recargar" : "Volver al Dashboard"}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
