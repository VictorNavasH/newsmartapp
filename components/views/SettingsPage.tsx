"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Settings,
  Activity,
  Database,
  User,
  Palette,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Table2,
  Users,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Armchair,
  UtensilsCrossed,
  FileText,
  Target,
  Save,
  RotateCcw,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { MenuBar } from "@/components/ui/menu-bar"
import { DocumentationTab } from "@/components/features/DocumentationTab"
import {
  fetchIntegrationStatuses,
  fetchViewRefreshLogs,
  fetchRestaurantCapacity,
  fetchRecentSyncLogs,
  type IntegrationStatus,
  type ViewRefreshLog,
  type RestaurantCapacity,
  type SyncLogEntry,
} from "@/lib/settingsService"
import { loadKPITargets, saveKPITargets } from "@/lib/kpiTargets"
import { DEFAULT_KPI_TARGETS } from "@/types/kpiTargets"
import type { KPITargets } from "@/types/kpiTargets"

// ============================================
// HELPERS
// ============================================

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca"
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffH < 24) return `Hace ${diffH}h`
  if (diffD < 7) return `Hace ${diffD}d`
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "ok":
    case "completed":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />
    case "error":
      return <XCircle className="w-4 h-4 text-red-500" />
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />
    default:
      return <HelpCircle className="w-4 h-4 text-slate-400" />
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ok: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Activo" },
    completed: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completado" },
    error: { bg: "bg-red-50", text: "text-red-700", label: "Error" },
    warning: { bg: "bg-amber-50", text: "text-amber-700", label: "Advertencia" },
    unknown: { bg: "bg-slate-100", text: "text-slate-500", label: "Sin datos" },
  }
  const c = config[status] || config.unknown
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <StatusIcon status={status} />
      {c.label}
    </span>
  )
}

// ============================================
// TABS (MenuBar items)
// ============================================

const settingsMenuItems = [
  {
    icon: Activity,
    label: "Estado del Sistema",
    href: "#status",
    gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, transparent 70%)",
    iconColor: "text-[#02b1c4]",
  },
  {
    icon: Database,
    label: "Datos y Vistas",
    href: "#data",
    gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, transparent 70%)",
    iconColor: "text-[#227c9d]",
  },
  {
    icon: User,
    label: "Perfil",
    href: "#profile",
    gradient: "radial-gradient(circle, rgba(254,109,115,0.15) 0%, transparent 70%)",
    iconColor: "text-[#fe6d73]",
  },
  {
    icon: Palette,
    label: "Apariencia",
    href: "#appearance",
    gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, transparent 70%)",
    iconColor: "text-[#ffcb77]",
  },
  {
    icon: Info,
    label: "Acerca de",
    href: "#about",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, transparent 70%)",
    iconColor: "text-[#17c3b2]",
  },
  {
    icon: Target,
    label: "Objetivos KPI",
    href: "#kpi-targets",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, transparent 70%)",
    iconColor: "text-[#17c3b2]",
  },
  {
    icon: FileText,
    label: "Documentación",
    href: "#docs",
    gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, transparent 70%)",
    iconColor: "text-[#227c9d]",
  },
]

// Mapa label → tab id interno
const labelToTab: Record<string, string> = {
  "Estado del Sistema": "status",
  "Datos y Vistas": "data",
  "Perfil": "profile",
  "Apariencia": "appearance",
  "Acerca de": "about",
  "Objetivos KPI": "kpi-targets",
  "Documentación": "docs",
}

const tabToLabel: Record<string, string> = Object.fromEntries(
  Object.entries(labelToTab).map(([k, v]) => [v, k])
)

// ============================================
// MAIN COMPONENT
// ============================================

interface SettingsPageProps {
  userName?: string
  userEmail?: string
}

export default function SettingsPage({ userName, userEmail }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("status")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data states
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [viewLogs, setViewLogs] = useState<ViewRefreshLog[]>([])
  const [capacity, setCapacity] = useState<RestaurantCapacity | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([])
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [kpiTargets, setKpiTargets] = useState<KPITargets>(DEFAULT_KPI_TARGETS)
  const [kpiSaved, setKpiSaved] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [intData, viewData, capData, logData] = await Promise.all([
        fetchIntegrationStatuses(),
        fetchViewRefreshLogs(),
        fetchRestaurantCapacity(),
        fetchRecentSyncLogs(),
      ])
      setIntegrations(intData)
      setViewLogs(viewData)
      setCapacity(capData)
      setSyncLogs(logData)
    } catch (e) {
      console.error("[SettingsPage] Error loading data:", e)
    }
  }, [])

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("nua-theme") as "light" | "dark" | "system" | null
    if (savedTheme) setTheme(savedTheme)

    // Cargar objetivos KPI desde Supabase (con fallback a localStorage)
    loadKPITargets().then(setKpiTargets)

    loadData().then(() => setLoading(false))
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("nua-theme", newTheme)

    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  const handleKpiChange = (key: keyof KPITargets, value: string) => {
    const numValue = parseFloat(value) || 0
    setKpiTargets(prev => ({ ...prev, [key]: numValue }))
    setKpiSaved(false)
  }

  const handleKpiSave = async () => {
    await saveKPITargets(kpiTargets)
    setKpiSaved(true)
    setTimeout(() => setKpiSaved(false), 3000)
  }

  const handleKpiReset = async () => {
    setKpiTargets(DEFAULT_KPI_TARGETS)
    await saveKPITargets(DEFAULT_KPI_TARGETS)
    setKpiSaved(true)
    setTimeout(() => setKpiSaved(false), 3000)
  }

  // Get unique views (latest refresh per view)
  const uniqueViews = viewLogs.reduce((acc, log) => {
    if (!acc.find((v) => v.vista_nombre === log.vista_nombre)) {
      acc.push(log)
    }
    return acc
  }, [] as ViewRefreshLog[])

  const okCount = integrations.filter((i) => i.status === "ok").length
  const totalCount = integrations.length

  return (
    <>
      <PageHeader
        icon={Settings}
        title="Configuración"
        subtitle="Estado del sistema, integraciones y preferencias"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#02b1c4] text-white text-sm font-medium hover:bg-[#02a0b2] disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        }
      />

      <PageContent>
        {/* MenuBar centrado — mismo componente que el resto de la app */}
        <div className="flex justify-center">
          <MenuBar
            items={settingsMenuItems}
            activeItem={tabToLabel[activeTab] || "Estado del Sistema"}
            onItemClick={(label) => {
              const tabId = labelToTab[label]
              if (tabId) setActiveTab(tabId)
            }}
          />
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#02b1c4] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Cargando configuración...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ===================== TAB: ESTADO DEL SISTEMA ===================== */}
            {activeTab === "status" && (
              <div className="space-y-6">
                {/* Resumen rápido */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#364f6b]">Integraciones</h3>
                    <span className="text-sm text-slate-500">
                      {okCount}/{totalCount} activas
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrations.map((integ) => (
                      <div
                        key={integ.name}
                        className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            integ.status === "ok"
                              ? "bg-emerald-100"
                              : integ.status === "error"
                                ? "bg-red-100"
                                : integ.status === "warning"
                                  ? "bg-amber-100"
                                  : "bg-slate-200"
                          }`}
                        >
                          <StatusIcon status={integ.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-[#364f6b]">{integ.name}</span>
                            <StatusBadge status={integ.status} />
                          </div>
                          <p className="text-xs text-slate-500 mb-1">{integ.description}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {timeAgo(integ.lastSync)}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{integ.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capacidad del restaurante */}
                {capacity && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-[#364f6b] mb-4">Capacidad del Restaurante</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Table2 className="w-5 h-5 text-[#02b1c4] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#364f6b]">{capacity.totalMesas}</p>
                        <p className="text-xs text-slate-500">Mesas activas</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Armchair className="w-5 h-5 text-[#02b1c4] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#364f6b]">{capacity.totalPlazas}</p>
                        <p className="text-xs text-slate-500">Plazas por turno</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <UtensilsCrossed className="w-5 h-5 text-[#02b1c4] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#364f6b]">{capacity.turnos.length}</p>
                        <p className="text-xs text-slate-500">Turnos activos</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <Users className="w-5 h-5 text-[#02b1c4] mx-auto mb-1" />
                        <p className="text-2xl font-bold text-[#364f6b]">{capacity.plazasPorDia}</p>
                        <p className="text-xs text-slate-500">Plazas por día</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {capacity.turnos.map((t) => (
                        <div key={t.nombre} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 text-sm">
                          <span className="font-medium text-[#364f6b]">{t.nombre}</span>
                          <span className="text-slate-400">
                            {t.hora_inicio.slice(0, 5)} – {t.hora_fin.slice(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      Datos calculados desde la tabla <code className="bg-slate-100 px-1 rounded">tables</code> y{" "}
                      <code className="bg-slate-100 px-1 rounded">turnos</code> de Supabase.
                    </p>
                  </div>
                )}

                {/* Logs recientes */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-4">Últimas Sincronizaciones</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                          <th className="pb-2 font-medium">Fuente</th>
                          <th className="pb-2 font-medium">Tipo</th>
                          <th className="pb-2 font-medium">Estado</th>
                          <th className="pb-2 font-medium">Fecha</th>
                          <th className="pb-2 font-medium text-right">Registros</th>
                          <th className="pb-2 font-medium text-right">Errores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncLogs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2 font-medium text-[#364f6b]">{log.source}</td>
                            <td className="py-2 text-slate-500">{log.type}</td>
                            <td className="py-2">
                              <StatusBadge status={log.status} />
                            </td>
                            <td className="py-2 text-slate-500">{formatDateTime(log.timestamp)}</td>
                            <td className="py-2 text-right text-slate-600">{log.records}</td>
                            <td className="py-2 text-right">
                              <span className={log.errors > 0 ? "text-red-500 font-medium" : "text-slate-400"}>
                                {log.errors}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {syncLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No hay logs de sincronización
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: DATOS Y VISTAS ===================== */}
            {activeTab === "data" && (
              <div className="space-y-6">
                {/* Vistas materializadas */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#364f6b]">Vistas Materializadas</h3>
                    <span className="text-xs text-slate-400">Último refresh del cierre diario</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                          <th className="pb-2 font-medium">Vista</th>
                          <th className="pb-2 font-medium">Estado</th>
                          <th className="pb-2 font-medium">Último Refresh</th>
                          <th className="pb-2 font-medium text-right">Duración</th>
                          <th className="pb-2 font-medium">Trigger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueViews.map((view) => (
                          <tr key={view.vista_nombre} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-2">
                              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-[#364f6b]">
                                {view.vista_nombre}
                              </code>
                            </td>
                            <td className="py-2">
                              <StatusBadge status={view.estado} />
                            </td>
                            <td className="py-2 text-slate-500">{formatDateTime(view.refresh_iniciado_at)}</td>
                            <td className="py-2 text-right text-slate-600">
                              {view.duracion_ms != null ? `${view.duracion_ms} ms` : "-"}
                            </td>
                            <td className="py-2 text-xs text-slate-400">{view.trigger_source || "-"}</td>
                          </tr>
                        ))}
                        {uniqueViews.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              No hay datos de refresh
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Info BD */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-2">Información de la Base de Datos</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Datos obtenidos de las tablas de log del sistema. El tamaño detallado requiere permisos de administrador.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <HardDrive className="w-4 h-4 text-[#02b1c4]" />
                        <span className="text-sm font-medium text-slate-600">Motor</span>
                      </div>
                      <p className="text-lg font-bold text-[#364f6b]">PostgreSQL</p>
                      <p className="text-xs text-slate-400">Supabase (cloud)</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="w-4 h-4 text-[#02b1c4]" />
                        <span className="text-sm font-medium text-slate-600">Vistas monitorizadas</span>
                      </div>
                      <p className="text-lg font-bold text-[#364f6b]">{uniqueViews.length}</p>
                      <p className="text-xs text-slate-400">Con refresh automático</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-[#02b1c4]" />
                        <span className="text-sm font-medium text-slate-600">Refresh diario</span>
                      </div>
                      <p className="text-lg font-bold text-[#364f6b]">00:02</p>
                      <p className="text-xs text-slate-400">cron_cierre_dia_operativo</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: PERFIL ===================== */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-6">Tu Cuenta</h3>
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#02b1c4] to-[#227c9d] flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                      {(userName || userEmail?.split("@")[0] || "U")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</label>
                        <p className="text-lg font-semibold text-[#364f6b]">
                          {userName || userEmail?.split("@")[0] || "Sin nombre"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                        <p className="text-sm text-slate-600">{userEmail || "-"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dominio</label>
                        <p className="text-sm text-slate-600">@nuasmartrestaurant.com</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Autenticación</label>
                        <p className="text-sm text-slate-600">Email + contraseña (Supabase Auth)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-2">Seguridad</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Para cambiar tu contraseña, solicítalo a través de Supabase o contacta con el administrador.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[#364f6b]">Sesión activa</p>
                      <p className="text-xs text-slate-400">Conectado vía Supabase Auth con restricción de dominio</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: APARIENCIA ===================== */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-2">Tema</h3>
                  <p className="text-sm text-slate-500 mb-6">Elige el aspecto visual de la aplicación.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {([
                      { id: "light" as const, label: "Claro", icon: Sun, desc: "Fondo blanco, ideal para uso diario" },
                      { id: "dark" as const, label: "Oscuro", icon: Moon, desc: "Fondo oscuro, reduce fatiga visual" },
                      { id: "system" as const, label: "Sistema", icon: Monitor, desc: "Sigue la configuración del dispositivo" },
                    ]).map((opt) => {
                      const Icon = opt.icon
                      const isActive = theme === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleThemeChange(opt.id)}
                          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all text-center ${
                            isActive
                              ? "border-[#02b1c4] bg-[#02b1c4]/5"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isActive ? "bg-[#02b1c4] text-white" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className={`font-semibold ${isActive ? "text-[#02b1c4]" : "text-[#364f6b]"}`}>{opt.label}</p>
                            <p className="text-xs text-slate-400 mt-1">{opt.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    El modo oscuro es experimental. Algunas secciones pueden no estar completamente adaptadas.
                  </p>
                </div>
              </div>
            )}

            {/* ===================== TAB: ACERCA DE ===================== */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <img src="/images/logo-smart-app.png" alt="NÜA Smart App" className="h-10 object-contain" />
                    <div>
                      <h3 className="text-lg font-bold text-[#364f6b]">NÜA Smart App</h3>
                      <p className="text-sm text-slate-500">Panel de control inteligente para restauración</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Versión", value: "1.0.0" },
                      { label: "Framework", value: "Next.js 16 + React 19" },
                      { label: "Backend", value: "Supabase (PostgreSQL)" },
                      { label: "Automatización", value: "n8n (workflows)" },
                      { label: "Hosting", value: "Vercel" },
                      { label: "Restaurante", value: "NÜA Smart Restaurant" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-sm text-slate-500">{item.label}</span>
                        <span className="text-sm font-medium text-[#364f6b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[#364f6b] mb-4">Stack Tecnológico</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Next.js",
                      "React",
                      "TypeScript",
                      "Tailwind CSS",
                      "Supabase",
                      "Recharts",
                      "Tremor",
                      "Lucide Icons",
                      "n8n",
                      "Vercel",
                      "GStock API",
                      "GoCardless",
                      "AEMET API",
                      "Cuentica",
                      "Billin",
                    ].map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: OBJETIVOS KPI ===================== */}
            {activeTab === "kpi-targets" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#364f6b]">Objetivos KPI</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Configura los objetivos para comparar el rendimiento real del restaurante.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleKpiReset}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurar
                      </button>
                      <button
                        onClick={handleKpiSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#02b1c4] text-white text-sm font-medium hover:bg-[#02a0b2] transition-all"
                      >
                        <Save className="w-4 h-4" />
                        {kpiSaved ? "Guardado" : "Guardar"}
                      </button>
                    </div>
                  </div>

                  {kpiSaved && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700">Objetivos guardados correctamente</span>
                    </div>
                  )}

                  {/* Ingresos */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-[#364f6b] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#17c3b2]" />
                      Ingresos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Facturación semanal <span className="text-slate-300">(auto)</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={`${Math.round(kpiTargets.breakEvenTarget / 4.33).toLocaleString("es-ES")} €`}
                            className="w-full px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-400 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">= Costes fijos ÷ semanas/mes</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ticket medio comensal</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.ticketComensalTarget}
                            onChange={(e) => handleKpiChange("ticketComensalTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ingresos mensuales</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.monthlyRevenueTarget}
                            onChange={(e) => handleKpiChange("monthlyRevenueTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Costes y Rentabilidad */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-[#364f6b] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#fe6d73]" />
                      Costes y Rentabilidad
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Food cost</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.foodCostTarget}
                            onChange={(e) => handleKpiChange("foodCostTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Coste laboral</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.laborCostTarget}
                            onChange={(e) => handleKpiChange("laborCostTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Costes fijos mensuales</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.breakEvenTarget}
                            onChange={(e) => handleKpiChange("breakEvenTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ocupación */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-[#364f6b] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ffcb77]" />
                      Ocupación
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ocupación comida</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.lunchOccupancyTarget}
                            onChange={(e) => handleKpiChange("lunchOccupancyTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ocupación cena</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.dinnerOccupancyTarget}
                            onChange={(e) => handleKpiChange("dinnerOccupancyTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operaciones y Reservas */}
                  <div>
                    <h4 className="text-sm font-bold text-[#364f6b] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#02b1c4]" />
                      Operaciones y Reservas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Valoración media</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={kpiTargets.averageRatingTarget}
                            onChange={(e) => handleKpiChange("averageRatingTarget", e.target.value)}
                            className="w-full px-3 py-2 pr-12 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ 5</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Reservas diarias</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={kpiTargets.dailyReservationsTarget}
                            onChange={(e) => handleKpiChange("dailyReservationsTarget", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#364f6b] focus:outline-none focus:border-[#02b1c4] focus:ring-1 focus:ring-[#02b1c4]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB: DOCUMENTACIÓN ===================== */}
            {activeTab === "docs" && <DocumentationTab />}
          </>
        )}
      </PageContent>
    </>
  )
}
