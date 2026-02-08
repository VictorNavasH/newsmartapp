"use client"

import { useState, useEffect, useCallback } from "react"

const VALID_PATHS = new Set([
  "/",
  "/reservations",
  "/revenue",
  "/expenses",
  "/costs",
  "/purchases",
  "/operations",
  "/products",
  "/forecasting",
  "/treasury",
  "/what-if",
  "/bank-connections",
  "/invoices",
  "/tablet-usage",
  "/ai-assistant",
  "/settings",
])

export function useAppRouter() {
  const getInitialPath = (): string => {
    if (typeof window === "undefined") return "/"
    const hash = window.location.hash.slice(1) // Remove #
    return VALID_PATHS.has(hash) ? hash : "/"
  }

  const [currentPath, setCurrentPath] = useState(getInitialPath)

  const navigate = useCallback((path: string) => {
    if (!VALID_PATHS.has(path)) path = "/"
    window.history.pushState({ path }, "", `#${path}`)
    setCurrentPath(path)
  }, [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const path = event.state?.path || "/"
      setCurrentPath(VALID_PATHS.has(path) ? path : "/")
    }

    window.addEventListener("popstate", handlePopState)

    // Set initial state if none exists
    if (!window.history.state?.path) {
      window.history.replaceState({ path: currentPath }, "", `#${currentPath}`)
    }

    return () => window.removeEventListener("popstate", handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { currentPath, navigate }
}
