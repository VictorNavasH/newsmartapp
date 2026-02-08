"use client"

import { useEffect, useRef } from "react"
import { evaluateAlerts, type AlertContext } from "@/lib/alertEngine"

/**
 * Hook que evalúa alertas cuando cambian los datos.
 * Se conecta al dashboard o a cualquier vista que tenga métricas.
 */
export function useAlerts(context: AlertContext | null, enabled = true) {
  const lastEvalRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled || !context) return

    // No evaluar más de una vez cada 30 segundos
    const now = Date.now()
    if (now - lastEvalRef.current < 30_000) return

    lastEvalRef.current = now
    evaluateAlerts(context)
  }, [context, enabled])
}
