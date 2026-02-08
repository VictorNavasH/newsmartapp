import { describe, it, expect, vi, beforeEach } from "vitest"
import { logError, logWarning } from "../errorLogger"

describe("lib/errorLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("logs Error objects with console.error for severity 'error'", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const error = new Error("Test error message")

    logError("TestSource", error)

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      "[ERROR] [TestSource]",
      "Test error message",
      ""
    )
  })

  it("logs string errors with console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    logError("MyService", "something failed")

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      "[ERROR] [MyService]",
      "something failed",
      ""
    )
  })

  it("logs critical severity with console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    logError("CriticalService", "crash", undefined, "critical")

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      "[CRITICAL] [CriticalService]",
      "crash",
      ""
    )
  })

  it("logs warnings with console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})

    logError("WarnService", "low disk", undefined, "warning")

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      "[WARNING] [WarnService]",
      "low disk",
      ""
    )
  })

  it("includes context when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const context = { userId: "123", page: "/treasury" }

    logError("AppError", "failed", context)

    expect(spy).toHaveBeenCalledWith(
      "[ERROR] [AppError]",
      "failed",
      context
    )
  })

  it("logWarning delegates to logError with warning severity", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})

    logWarning("WarnSource", "not critical")

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(
      "[WARNING] [WarnSource]",
      "not critical",
      ""
    )
  })

  it("does not log to console for info severity", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    logError("InfoSource", "just info", undefined, "info")

    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
