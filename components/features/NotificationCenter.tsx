"use client"

import { useState, useCallback, useEffect } from "react"
import { Bell, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { onAlertFired, type AlertSeverity } from "@/lib/alertEngine"
import { BRAND_COLORS } from "@/constants"

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

  useEffect(() => {
    return subscribe(() => forceUpdate((n) => n + 1))
  }, [])

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
        return <AlertCircle className="h-4 w-4 shrink-0" style={{ color: BRAND_COLORS.error }} />
      case "warning":
        return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: BRAND_COLORS.warning }} />
      default:
        return <Info className="h-4 w-4 shrink-0" style={{ color: BRAND_COLORS.primary }} />
    }
  }

  const severityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          backgroundColor: `${BRAND_COLORS.error}10`, // 10% opacity
          borderColor: `${BRAND_COLORS.error}30`, // 30% opacity
        }
      case "warning":
        return {
          backgroundColor: `${BRAND_COLORS.warning}10`,
          borderColor: `${BRAND_COLORS.warning}30`,
        }
      default:
        return {
          backgroundColor: `${BRAND_COLORS.primary}10`,
          borderColor: `${BRAND_COLORS.primary}30`,
        }
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
          <span
            className="absolute -top-0.5 -right-0.5 h-4 w-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: BRAND_COLORS.error }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs hover:underline font-medium"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    Marcar leídas
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-72 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p>Sin notificaciones nuevas</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-slate-50 transition-colors ${!n.read ? "bg-slate-50/50" : ""}`}
                  >
                    <div className="flex gap-2 p-2 rounded-lg border" style={severityStyles(n.severity)}>
                      {severityIcon(n.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
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
