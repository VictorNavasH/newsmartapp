"use client"

import type React from "react"
import { useMemo, useState } from "react"
import {
  Bot,
  RefreshCw,
  LayoutDashboard,
  Brain,
  Puzzle,
  Clock,
  MessageSquare,
  Cpu,
  Server,
  Coins,
  Wallet,
  Zap,
  Send,
  Terminal,
  CalendarClock,
  CheckCircle2,
  XCircle,
  CircleDashed,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard } from "@/components/ui/TremorCard"
import { MenuBar } from "@/components/ui/menu-bar"
import { Button } from "@/components/ui/button"
import { BRAND_COLORS, CHART_CONFIG } from "@/constants"
import { formatNumber } from "@/lib/utils"
import {
  useHermesStatus,
  useHermesMemory,
  useHermesSessions,
  useHermesCronJobs,
  useHermesSkills,
  useHermesAnalytics,
} from "@/hooks/queries"
import type { HermesStatus, HermesSession } from "@/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// ============================================================
// Helpers
// ============================================================
const RAM_TOTAL_FALLBACK = 5120 // MB (brief)

function minutesSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Number.POSITIVE_INFINITY
  const t = new Date(dateStr).getTime()
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  return (Date.now() - t) / 60000
}

function isOnline(status: HermesStatus | null | undefined): boolean {
  if (!status) return false
  if (status.gateway_state === "stopped") return false
  return minutesSince(status.updated_at) < 10
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Nunca"
  const m = minutesSince(dateStr)
  if (!Number.isFinite(m)) return "Nunca"
  if (m < 1) return "Ahora mismo"
  if (m < 60) return `Hace ${Math.floor(m)} min`
  const h = m / 60
  if (h < 24) return `Hace ${Math.floor(h)} h`
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function dateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const usd = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)

const num = (v: number | null | undefined) => (v == null ? "—" : formatNumber(v))

function usageColor(pct: number): string {
  if (pct >= 80) return BRAND_COLORS.error
  if (pct >= 60) return BRAND_COLORS.lunch
  return BRAND_COLORS.success
}

const sourceIcon = (source: string | null) => {
  switch ((source || "").toLowerCase()) {
    case "telegram":
      return <Send className="w-3.5 h-3.5 text-[#229ED9]" />
    case "cli":
      return <Terminal className="w-3.5 h-3.5 text-[#364f6b]" />
    case "cron":
      return <CalendarClock className="w-3.5 h-3.5 text-[#227c9d]" />
    default:
      return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
  }
}

// ============================================================
// Page
// ============================================================
const TABS = [
  { icon: LayoutDashboard, label: "Vista General", color: "text-[#02b1c4]", rgb: "2,177,196" },
  { icon: Brain, label: "Memoria", color: "text-[#227c9d]", rgb: "34,124,157" },
  { icon: Puzzle, label: "Skills", color: "text-[#17c3b2]", rgb: "23,195,178" },
  { icon: Clock, label: "Cron", color: "text-[#ffcb77]", rgb: "255,203,119" },
  { icon: MessageSquare, label: "Sesiones", color: "text-[#fe6d73]", rgb: "254,109,115" },
]

const menuItems = TABS.map((t) => ({
  icon: t.icon,
  label: t.label,
  href: "#",
  gradient: `radial-gradient(circle, rgba(${t.rgb},0.15) 0%, transparent 70%)`,
  iconColor: t.color,
}))

export default function AgentPage() {
  const [tab, setTab] = useState("Vista General")

  const statusQ = useHermesStatus()
  const memoryQ = useHermesMemory()
  const sessionsQ = useHermesSessions()
  const cronQ = useHermesCronJobs()
  const skillsQ = useHermesSkills()
  const analyticsQ = useHermesAnalytics(30)

  const status = statusQ.data ?? null
  const online = isOnline(status)
  const refreshing =
    statusQ.isFetching || memoryQ.isFetching || sessionsQ.isFetching || cronQ.isFetching || skillsQ.isFetching

  const handleRefresh = () => {
    statusQ.refetch()
    memoryQ.refetch()
    sessionsQ.refetch()
    cronQ.refetch()
    skillsQ.refetch()
    analyticsQ.refetch()
  }

  return (
    <>
      <PageHeader
        icon={Bot}
        title="NÜA Agent"
        subtitle="Panel de control del asistente NÜA (Hermes Agent)"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2 bg-transparent">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        }
      />
      <PageContent>
        <StatusHero status={status} online={online} loading={statusQ.isLoading} />

        <div className="flex justify-center">
          <MenuBar items={menuItems} activeItem={tab} onItemClick={setTab} />
        </div>

        {tab === "Vista General" && (
          <GeneralTab status={status} analytics={analyticsQ.data ?? []} analyticsLoading={analyticsQ.isLoading} />
        )}
        {tab === "Memoria" && <MemoryTab notes={memoryQ.data ?? []} loading={memoryQ.isLoading} />}
        {tab === "Skills" && <SkillsTab skills={skillsQ.data ?? []} loading={skillsQ.isLoading} />}
        {tab === "Cron" && <CronTab jobs={cronQ.data ?? []} loading={cronQ.isLoading} />}
        {tab === "Sesiones" && <SessionsTab sessions={sessionsQ.data ?? []} loading={sessionsQ.isLoading} />}
      </PageContent>
    </>
  )
}

// ============================================================
// Status hero
// ============================================================
function StatusHero({ status, online, loading }: { status: HermesStatus | null; online: boolean; loading: boolean }) {
  if (loading) return <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />

  return (
    <TremorCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: online ? `${BRAND_COLORS.success}1a` : `${BRAND_COLORS.error}1a` }}
          >
            <Bot className="w-6 h-6" style={{ color: online ? BRAND_COLORS.success : BRAND_COLORS.error }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: online ? `${BRAND_COLORS.success}1a` : `${BRAND_COLORS.error}1a`,
                  color: online ? BRAND_COLORS.success : BRAND_COLORS.error,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: online ? BRAND_COLORS.success : BRAND_COLORS.error }} />
                {online ? "Online" : "Offline"}
              </span>
              {status?.gateway_state && (
                <span className="text-xs text-slate-400">gateway: {status.gateway_state}</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Última sincronización: {timeAgo(status?.updated_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <HeroStat label="Versión" value={status?.version ?? "—"} />
          <div className="h-10 w-px bg-slate-200" />
          <HeroStat label="Modelo" value={status?.model_name ?? "—"} />
          <div className="h-10 w-px bg-slate-200" />
          <HeroStat label="Sesiones activas" value={status?.active_sessions_count != null ? String(status.active_sessions_count) : "—"} />
        </div>
      </div>
    </TremorCard>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-[#364f6b] leading-tight">{value}</p>
    </div>
  )
}

// ============================================================
// Vista General — recursos + consumo + analítica
// ============================================================
function GeneralTab({
  status,
  analytics,
  analyticsLoading,
}: {
  status: HermesStatus | null
  analytics: import("@/types").HermesAnalyticsDay[]
  analyticsLoading: boolean
}) {
  const ramTotal = status?.ram_total_mb || RAM_TOTAL_FALLBACK
  const ramUsed = status?.ram_usage_mb ?? null
  const ramPct = ramUsed != null && ramTotal > 0 ? (ramUsed / ramTotal) * 100 : null
  const cpuPct = status?.cpu_usage_pct ?? null

  const spend = status?.monthly_spend_usd ?? null
  const balance = status?.api_balance_usd ?? null
  const consumedPct = spend != null && balance != null && spend + balance > 0 ? (spend / (spend + balance)) * 100 : null

  const chartData = useMemo(
    () =>
      analytics.map((d) => ({
        dia: new Date(d.date + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
        input: d.tokens_input ?? 0,
        output: d.tokens_output ?? 0,
        cost: d.cost_usd ?? 0,
      })),
    [analytics],
  )

  return (
    <div className="space-y-4">
      {/* Recursos VPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TremorCard title="Recursos del VPS" icon={<Server className="w-5 h-5 text-[#02b1c4]" />}>
          <div className="space-y-5 mt-2">
            <UsageBar
              icon={<Server className="w-4 h-4" />}
              label="RAM"
              pct={ramPct}
              detail={ramUsed != null ? `${num(ramUsed)} / ${num(ramTotal)} MB` : "Sin datos"}
            />
            <UsageBar
              icon={<Cpu className="w-4 h-4" />}
              label="CPU"
              pct={cpuPct}
              detail={cpuPct != null ? `${cpuPct.toFixed(0)}%` : "Sin datos"}
            />
          </div>
        </TremorCard>

        {/* Consumo / gasto */}
        <TremorCard title="Consumo de API" icon={<Coins className="w-5 h-5 text-[#17c3b2]" />}>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <MetricBlock icon={<Coins className="w-4 h-4 text-[#fe6d73]" />} label="Gasto del mes" value={usd(spend)} />
            <MetricBlock icon={<Wallet className="w-4 h-4 text-[#17c3b2]" />} label="Saldo API" value={usd(balance)} />
            <MetricBlock icon={<Zap className="w-4 h-4 text-[#ffcb77]" />} label="Cache hit" value={status?.cache_hit_pct != null ? `${status.cache_hit_pct.toFixed(0)}%` : "—"} />
            <MetricBlock icon={<Brain className="w-4 h-4 text-[#227c9d]" />} label="Tokens 30d" value={status?.tokens_input_30d != null || status?.tokens_output_30d != null ? num((status?.tokens_input_30d ?? 0) + (status?.tokens_output_30d ?? 0)) : "—"} />
          </div>
          {consumedPct != null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Saldo consumido</span>
                <span className="font-bold text-[#364f6b]">{consumedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(consumedPct, 100)}%`, backgroundColor: usageColor(consumedPct) }} />
              </div>
            </div>
          )}
        </TremorCard>
      </div>

      {/* Analítica de tokens */}
      <TremorCard title="Consumo de tokens · últimos 30 días" icon={<Zap className="w-5 h-5 text-[#02b1c4]" />}>
        {analyticsLoading ? (
          <div className="h-[300px] bg-slate-50 rounded-lg animate-pulse" />
        ) : chartData.length === 0 ? (
          <EmptyState text="Sin datos de analítica todavía. Aparecerán cuando el agente registre actividad diaria." />
        ) : (
          <div className="h-[300px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.grid.stroke} />
                <XAxis dataKey="dia" tick={CHART_CONFIG.axis.tick} />
                <YAxis tick={CHART_CONFIG.axis.tick} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)} />
                <Tooltip
                  contentStyle={CHART_CONFIG.tooltip.contentStyle}
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === "input" ? "Tokens entrada" : "Tokens salida",
                  ]}
                />
                <Legend formatter={(v) => (v === "input" ? "Entrada" : "Salida")} />
                <Bar dataKey="input" stackId="t" fill={BRAND_COLORS.primary} radius={[0, 0, 0, 0]} />
                <Bar dataKey="output" stackId="t" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </TremorCard>
    </div>
  )
}

function UsageBar({ icon, label, pct, detail }: { icon: React.ReactNode; label: string; pct: number | null; detail: string }) {
  const color = pct != null ? usageColor(pct) : "#cbd5e1"
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
          {icon}
          {label}
        </span>
        <span className="text-sm font-bold" style={{ color: pct != null ? color : "#94a3b8" }}>
          {pct != null ? `${pct.toFixed(0)}%` : "—"}
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct != null ? Math.min(pct, 100) : 0}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">{detail}</p>
    </div>
  )
}

function MetricBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold text-[#364f6b] mt-1">{value}</p>
    </div>
  )
}

// ============================================================
// Memoria
// ============================================================
function MemoryTab({ notes, loading }: { notes: import("@/types").HermesMemory[]; loading: boolean }) {
  const [sub, setSub] = useState<"user" | "system">("user")
  const filtered = notes.filter((n) => (sub === "user" ? n.target === "user" : n.target !== "user"))

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["user", "system"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sub === s ? "bg-[#02b1c4] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {s === "user" ? "Perfil" : "Sistema"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      ) : filtered.length === 0 ? (
        <EmptyState text={`Sin notas de ${sub === "user" ? "perfil" : "sistema"} todavía.`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((n) => (
            <TremorCard key={n.id}>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
              <p className="text-[11px] text-slate-400 mt-3">Actualizado: {timeAgo(n.updated_at)}</p>
            </TremorCard>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Skills
// ============================================================
function SkillsTab({ skills, loading }: { skills: import("@/types").HermesSkill[]; loading: boolean }) {
  if (loading) return <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
  if (skills.length === 0) return <EmptyState text="Sin skills registradas todavía." />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((s) => (
        <TremorCard key={s.name} className={s.is_custom ? "ring-1 ring-[#02b1c4]/40" : ""}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-[#17c3b2] shrink-0" />
                <h4 className="font-bold text-[#364f6b] truncate">{s.name}</h4>
              </div>
              {s.category && <p className="text-[11px] text-slate-400 mt-0.5">{s.category}</p>}
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
              style={{
                backgroundColor: s.enabled ? `${BRAND_COLORS.success}1a` : "#f1f5f9",
                color: s.enabled ? BRAND_COLORS.success : "#94a3b8",
              }}
            >
              {s.enabled ? "Activa" : "Inactiva"}
            </span>
          </div>
          {s.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{s.description}</p>}
          {s.is_custom && (
            <span className="inline-block mt-3 text-[10px] font-bold text-[#02b1c4] bg-[#02b1c4]/10 px-2 py-0.5 rounded-full">
              Custom
            </span>
          )}
        </TremorCard>
      ))}
    </div>
  )
}

// ============================================================
// Cron
// ============================================================
function CronTab({ jobs, loading }: { jobs: import("@/types").HermesCronJob[]; loading: boolean }) {
  if (loading) return <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
  if (jobs.length === 0) return <EmptyState text="Sin tareas programadas todavía." />

  const statusColor = (s: string | null) =>
    s === "active" ? BRAND_COLORS.success : s === "error" ? BRAND_COLORS.error : BRAND_COLORS.lunch

  return (
    <TremorCard className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
              <th className="py-3 px-4">Tarea</th>
              <th className="py-3 px-4">Schedule</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Próxima</th>
              <th className="py-3 px-4">Última</th>
              <th className="py-3 px-4 text-center">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.job_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="py-3 px-4 font-medium text-[#364f6b]">{j.name || j.job_id}</td>
                <td className="py-3 px-4">
                  <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">{j.schedule || "—"}</code>
                </td>
                <td className="py-3 px-4">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: `${statusColor(j.status)}1a`, color: statusColor(j.status) }}
                  >
                    {j.status || "—"}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500">{dateTime(j.next_run)}</td>
                <td className="py-3 px-4 text-slate-500">{dateTime(j.last_run_at)}</td>
                <td className="py-3 px-4 text-center">
                  {j.last_run_status === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#17c3b2] inline" />
                  ) : j.last_run_status === "error" ? (
                    <XCircle className="w-4 h-4 text-[#fe6d73] inline" />
                  ) : (
                    <CircleDashed className="w-4 h-4 text-slate-300 inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TremorCard>
  )
}

// ============================================================
// Sesiones
// ============================================================
function SessionsTab({ sessions, loading }: { sessions: HermesSession[]; loading: boolean }) {
  if (loading) return <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
  if (sessions.length === 0) return <EmptyState text="Sin sesiones registradas todavía." />

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <TremorCard key={s.session_id} className="py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {sourceIcon(s.source)}
                <h4 className="font-semibold text-[#364f6b] truncate">{s.title || s.session_id}</h4>
                {s.is_active && (
                  <span className="text-[10px] font-bold text-[#17c3b2] bg-[#17c3b2]/10 px-1.5 py-0.5 rounded-full">activa</span>
                )}
              </div>
              {s.preview && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{s.preview}</p>}
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                <span>{timeAgo(s.last_active)}</span>
                {s.model && <span>· {s.model}</span>}
                {s.message_count != null && <span>· {s.message_count} msg</span>}
                {s.token_count != null && <span>· {num(s.token_count)} tokens</span>}
              </div>
            </div>
          </div>
        </TremorCard>
      ))}
    </div>
  )
}

// ============================================================
// Empty state
// ============================================================
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CircleDashed className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-sm text-slate-400 max-w-sm">{text}</p>
    </div>
  )
}
