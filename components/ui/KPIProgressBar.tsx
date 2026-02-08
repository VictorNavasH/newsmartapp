"use client"

import type { KPIProgress } from "@/types/kpiTargets"

interface KPIProgressBarProps {
  label: string
  progress: KPIProgress
  /** Formato del valor (ej: "€", "%") */
  suffix?: string
  /** Para métricas inversas (food cost) */
  isLowerBetter?: boolean
  /** Mostrar mini o completo */
  variant?: "compact" | "full"
}

export function KPIProgressBar({
  label,
  progress,
  suffix = "",
  isLowerBetter = false,
  variant = "compact",
}: KPIProgressBarProps) {
  const statusColors = {
    'on-track': { bar: 'bg-[#17c3b2]', text: 'text-[#17c3b2]', bg: 'bg-[#17c3b2]/10' },
    'at-risk': { bar: 'bg-[#ffcb77]', text: 'text-[#ffcb77]', bg: 'bg-[#ffcb77]/10' },
    'behind': { bar: 'bg-[#fe6d73]', text: 'text-[#fe6d73]', bg: 'bg-[#fe6d73]/10' },
  }

  const colors = statusColors[progress.status]
  const cappedPercentage = Math.min(100, progress.percentage)

  const statusLabel = {
    'on-track': 'En objetivo',
    'at-risk': 'En riesgo',
    'behind': 'Por debajo',
  }

  if (variant === "compact") {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">{label}</span>
          <span className={`font-medium ${colors.text}`}>
            {progress.current.toLocaleString('es-ES')}{suffix} / {progress.target.toLocaleString('es-ES')}{suffix}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${cappedPercentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Variant "full"
  return (
    <div className={`p-3 rounded-lg border ${colors.bg} border-slate-100`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {statusLabel[progress.status]}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-bold text-slate-800">
          {progress.current.toLocaleString('es-ES')}{suffix}
        </span>
        <span className="text-sm text-slate-400 mb-1">
          / {progress.target.toLocaleString('es-ES')}{suffix}
        </span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">
        {progress.percentage}% del objetivo
        {progress.delta !== 0 && (
          <span className={isLowerBetter ? (progress.delta > 0 ? ' text-[#17c3b2]' : ' text-[#fe6d73]') : (progress.delta > 0 ? ' text-[#17c3b2]' : ' text-[#fe6d73]')}>
            {' '}({progress.delta > 0 ? '+' : ''}{progress.delta.toLocaleString('es-ES')}{suffix})
          </span>
        )}
      </p>
    </div>
  )
}
