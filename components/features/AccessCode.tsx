"use client"

import { useState, useCallback } from "react"
import { Lock, Delete, ArrowRight } from "lucide-react"

const ACCESS_PIN = "1838"

interface AccessCodeProps {
  onSuccess: () => void
}

export function AccessCode({ onSuccess }: AccessCodeProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError(false)

    if (newPin.length === 4) {
      if (newPin === ACCESS_PIN) {
        onSuccess()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setPin("")
          setShake(false)
        }, 600)
      }
    }
  }, [pin, onSuccess])

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
    setError(false)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center gap-8 p-10">
        {/* Logo / Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Lock className="w-8 h-8 text-white/80" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">NÜA Smart App</h1>
          <p className="text-sm text-white/50">Introduce el código de acceso</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${shake ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? "bg-red-400 scale-110"
                    : "bg-white scale-110"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm -mt-4">Código incorrecto</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (key) => {
              if (key === "") return <div key="empty" />
              if (key === "del") {
                return (
                  <button
                    key="del"
                    onClick={handleDelete}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 active:bg-white/20 transition-colors"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                )
              }
              return (
                <button
                  key={key}
                  onClick={() => handleDigit(key)}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-light text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  {key}
                </button>
              )
            }
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
