import type React from "react"
import { TremorCard } from "./TremorCard"
import type { ComparisonResult } from "../../types"
import { ArrowUpRight, ArrowDownRight, Minus, Sun, Moon, Info } from "lucide-react"
import { UI_COLORS } from "../../constants"
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip"

interface MetricGroupCardProps {
  title: string
  total: ComparisonResult
  lunch?: ComparisonResult
  dinner?: ComparisonResult
  icon?: React.ReactNode
  loading?: boolean
  decimals?: number
  suffix?: string
  live?: boolean
  secondaryMetric?: {
    label: string
    value: string | number
  }
  children?: React.ReactNode
  tooltip?: string
}

const DeltaBadge: React.FC<{ delta: number; trend: string }> = ({ delta, trend }) => {
  const colorClass = trend === "up" ? "text-[#17c3b2]" : trend === "down" ? "text-[#fe6d73]" : "text-[#364f6b]"
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus

  return (
    <div className={`flex items-center text-xs font-bold ${colorClass}`}>
      <Icon size={14} className="mr-0.5" />
      {Math.abs(delta)}%
    </div>
  )
}

export const MetricGroupCard: React.FC<MetricGroupCardProps> = ({
  title,
  total,
  lunch,
  dinner,
  icon,
  loading,
  decimals = 0,
  suffix = "",
  live,
  secondaryMetric,
  children,
  tooltip,
}) => {
  if (loading) {
    return (
      <TremorCard>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="h-10 bg-slate-100 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="h-12 bg-slate-100 rounded"></div>
            <div className="h-12 bg-slate-100 rounded"></div>
          </div>
        </div>
      </TremorCard>
    )
  }

  const totalVal = total.value || 1
  const lunchShare = lunch ? ((lunch.value / totalVal) * 100).toFixed(0) : "0"
  const dinnerShare = dinner ? ((dinner.value / totalVal) * 100).toFixed(0) : "0"

  const formatValue = (val: number) => {
    return val.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return (
    <TremorCard className="flex flex-col h-full overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-[#02b1c4]">{icon}</div>}
          <h3 className="font-bold text-[#364f6b] text-base">{title}</h3>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="focus:outline-none ml-1">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="start"
                sideOffset={5}
                className="max-w-xs bg-white border border-slate-200 text-slate-700 shadow-lg"
              >
                <p className="text-xs leading-relaxed">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {live ? (
          <span className="text-xs bg-[#227c9d]/10 text-[#227c9d] px-2 py-1 rounded-full font-bold live-badge">
            Live
          </span>
        ) : secondaryMetric ? (
          <div
            className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap"
            style={{
              backgroundColor: `${UI_COLORS.infoBadge}30`,
              color: UI_COLORS.infoBadge,
              borderColor: `${UI_COLORS.infoBadge}60`,
            }}
          >
            {secondaryMetric.label}{" "}
            {secondaryMetric.value && <span className="text-[10px]">{secondaryMetric.value}</span>}
          </div>
        ) : (
          <div className="invisible px-2 py-1 text-[10px]">Spacer</div>
        )}
      </div>

      {/* Main Metric */}
      <div className="mb-6">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold text-[#364f6b] leading-none">
            {formatValue(total.value)}
            <span className="text-2xl ml-1">{suffix}</span>
          </span>
          <div className="mb-1.5 pb-0.5">
            <DeltaBadge delta={total.delta} trend={total.trend} />
          </div>
        </div>
      </div>

      {children ? (
        <div className="mt-auto">{children}</div>
      ) : lunch && dinner ? (
        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Lunch Card */}
            <div className="p-2 rounded-lg bg-[#ffcb77]/20 border border-slate-100/50 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-[#ffcb77]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Comida</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{lunchShare}%</span>
              </div>
              <p className="text-base font-bold text-[#364f6b] text-right">
                {formatValue(lunch.value)}
                {suffix}
              </p>
            </div>

            {/* Dinner Card */}
            <div className="p-2 rounded-lg bg-[#227c9d]/15 border border-slate-100/50 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Moon className="w-3 h-3 text-[#227c9d]" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cena</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{dinnerShare}%</span>
              </div>
              <p className="text-base font-bold text-[#364f6b] text-right">
                {formatValue(dinner.value)}
                {suffix}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </TremorCard>
  )
}
