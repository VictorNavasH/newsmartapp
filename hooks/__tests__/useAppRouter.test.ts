import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAppRouter } from "../useAppRouter"

describe("hooks/useAppRouter", () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset hash and history state
    window.location.hash = ""
    window.history.replaceState(null, "", "/")

    pushStateSpy = vi.spyOn(window.history, "pushState")
    replaceStateSpy = vi.spyOn(window.history, "replaceState")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns / as initial path when no hash", () => {
    const { result } = renderHook(() => useAppRouter())
    expect(result.current.currentPath).toBe("/")
  })

  it("reads valid hash as initial path", () => {
    window.location.hash = "#/treasury"
    const { result } = renderHook(() => useAppRouter())
    expect(result.current.currentPath).toBe("/treasury")
  })

  it("falls back to / for invalid hash path", () => {
    window.location.hash = "#/nonexistent"
    const { result } = renderHook(() => useAppRouter())
    expect(result.current.currentPath).toBe("/")
  })

  it("navigate updates path and calls pushState", () => {
    const { result } = renderHook(() => useAppRouter())

    act(() => {
      result.current.navigate("/expenses")
    })

    expect(result.current.currentPath).toBe("/expenses")
    expect(pushStateSpy).toHaveBeenCalledWith(
      { path: "/expenses" },
      "",
      "#/expenses"
    )
  })

  it("navigate falls back to / for invalid paths", () => {
    const { result } = renderHook(() => useAppRouter())

    act(() => {
      result.current.navigate("/invalid-page")
    })

    expect(result.current.currentPath).toBe("/")
    expect(pushStateSpy).toHaveBeenCalledWith(
      { path: "/" },
      "",
      "#/"
    )
  })

  it("navigate works for all valid paths", () => {
    const validPaths = [
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
    ]

    const { result } = renderHook(() => useAppRouter())

    for (const path of validPaths) {
      act(() => {
        result.current.navigate(path)
      })
      expect(result.current.currentPath).toBe(path)
    }
  })

  it("responds to popstate events", () => {
    const { result } = renderHook(() => useAppRouter())

    act(() => {
      result.current.navigate("/treasury")
    })
    expect(result.current.currentPath).toBe("/treasury")

    // Simulate browser back button
    act(() => {
      const event = new PopStateEvent("popstate", {
        state: { path: "/expenses" },
      })
      window.dispatchEvent(event)
    })

    expect(result.current.currentPath).toBe("/expenses")
  })

  it("falls back to / on popstate with invalid path", () => {
    const { result } = renderHook(() => useAppRouter())

    act(() => {
      const event = new PopStateEvent("popstate", {
        state: { path: "/bad-route" },
      })
      window.dispatchEvent(event)
    })

    expect(result.current.currentPath).toBe("/")
  })

  it("falls back to / on popstate with null state", () => {
    const { result } = renderHook(() => useAppRouter())

    act(() => {
      result.current.navigate("/treasury")
    })

    act(() => {
      const event = new PopStateEvent("popstate", { state: null })
      window.dispatchEvent(event)
    })

    expect(result.current.currentPath).toBe("/")
  })
})
