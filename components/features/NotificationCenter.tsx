"use client"

import { useState, useCallback, useEffect } from "react"
import { Bell, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { onAlertFired, type AlertSeverity } from "@/lib/alertEngine"

// ─── Tipos ──────────────────────────────────────────────────────

interface Notification {
  id: string
  message: string
  severity: AlertSeverity
  timestamp: Date
  read: boolean
}

// ─── Store global de notificaciones (simple, sin estado externo) ─

let notifications: Notification[] = []
let listeners: (() => void)[] = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function addNotification(message: string, severity: AlertSeverity) {
  const notification: Notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    severity,
    timestamp: new Date(),
    read: false,
  }
  notifications = [notification, ...notifications].slice(0, 50) // Máximo 50
  listeners.forEach((l) => l())
}

// ─── Componente NotificationCenter ──────────────────────────────

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [, forceUpdate] = useState(0)

  // Suscribirse a cambios en el store de notificaciones
  useEffect(() => {
    return subscribe(() => forceUpdate((n) => n + 1))
  }, [])

  // Suscribirse a alertas del AlertEngine
  useEffect(() => {
    return onAlertFired((message, severity) => {
      addNotification(message, severity)
    })
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    notifications = notifications.map((n) => ({ ...n, read: true }))
    forceUpdate((n) => n + 1)
  }, [])

  const clearAll = useCallback(() => {
    notifications = []
    forceUpdate((n) => n + 1)
  }, [])

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />
    }
  }

  const severityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-100"
      case "warning":
        return "bg-amber-50 border-amber-100"
      default:
        return "bg-blue-50 border-blue-100"
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop para cerrar al hacer click fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#02b1c4] hover:underline">
                    Marcar leídas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600">
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Sin notificaciones
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 ${!n.read ? "bg-slate-50" : ""}`}
                  >
                    <div className={`flex gap-2 p-2 rounded-lg border ${severityBg(n.severity)}`}>
                      {severityIcon(n.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {n.timestamp.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
