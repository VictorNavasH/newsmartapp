"use client"

import type { KPIProgress } from "@/types/kpiTargets"
import type { ReactNode } from "react"

interface KPIProgressBarProps {
  label: string
  progress: KPIProgress
  /** Formato del valor (ej: "€", "%") */
  suffix?: string
  /** Para métricas inversas (food cost, coste laboral) */
  isLowerBetter?: boolean
  /** Icono lucide-react para identificar visualmente el KPI */
  icon?: ReactNode
}

export function KPIProgressBar({
  label,
  progress,
  suffix = "",
  isLowerBetter = false,
  icon,
}: KPIProgressBarProps) {
  const statusColors = {
    'on-track': { bar: 'bg-[#17c3b2]', text: 'text-[#17c3b2]', bg: 'bg-[#17c3b2]/10' },
    'at-risk': { bar: 'bg-[#ffcb77]', text: 'text-[#ffcb77]', bg: 'bg-[#ffcb77]/10' },
    'behind': { bar: 'bg-[#fe6d73]', text: 'text-[#fe6d73]', bg: 'bg-[#fe6d73]/10' },
  }

  const statusLabel = {
    'on-track': 'En objetivo',
    'at-risk': 'En riesgo',
    'behind': 'Por debajo',
  }

  const colors = statusColors[progress.status]
  const cappedPercentage = Math.min(100, progress.percentage)
  const deltaColor = progress.delta > 0 ? 'text-[#17c3b2]' : 'text-[#fe6d73]'

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white">
      {/* Fila 1: icono + label + badge estado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`p-1.5 rounded-lg ${colors.bg}`}>
              <div className={colors.text}>{icon}</div>
            </div>
          )}
          <span className="text-sm font-bold text-[#364f6b]">{label}</span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${colors.bg} ${colors.text}`}>
          {statusLabel[progress.status]}
        </span>
      </div>

      {/* Fila 2: valor actual grande + target */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-[#364f6b]">
          {progress.current.toLocaleString('es-ES')}{suffix}
        </span>
        <span className="text-sm text-slate-400 font-medium">
          / {progress.target.toLocaleString('es-ES')}{suffix}
        </span>
      </div>

      {/* Fila 3: barra de progreso */}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>

      {/* Fila 4: porcentaje + delta */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {progress.percentage}% del objetivo
        </span>
        {progress.delta !== 0 && (
          <span className={`text-xs font-bold ${deltaColor}`}>
            {progress.delta > 0 ? '+' : ''}{progress.delta.toLocaleString('es-ES')}{suffix}
          </span>
        )}
      </div>
    </div>
  )
}
