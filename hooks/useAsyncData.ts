"use client"

import { useState, useEffect, useCallback, type DependencyList } from "react"

interface UseAsyncDataReturn<T> {
  data: T
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Hook genérico para data fetching con loading/error state.
 *
 * @param fetcher - Función async que retorna los datos
 * @param deps - Dependencias que re-disparan el fetch
 * @param initialValue - Valor inicial mientras se carga
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  initialValue: T,
): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      console.error("[useAsyncData]", message)
      setError(message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refresh: load }
}
