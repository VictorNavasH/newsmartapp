"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Los datos del restaurante se actualizan cada 5 minutos
            staleTime: 5 * 60 * 1000,
            // Mantener cache 30 minutos
            gcTime: 30 * 60 * 1000,
            // Refrescar al volver a la pestaña
            refetchOnWindowFocus: true,
            // No reintentar en errores de auth
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes("401")) return false
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
