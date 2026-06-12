"use client"

import { useEffect, useState } from "react"

// Breakpoint alineado con `md` de Tailwind (768px)
const MOBILE_BREAKPOINT = 768

/**
 * Detecta si el viewport es móvil (< 768px).
 * Devuelve `false` en el primer render (SSR-safe) y se actualiza al montar.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
