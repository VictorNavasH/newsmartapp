import type React from "react"

interface TremorCardProps {
  children: React.ReactNode
  className?: string
  decoration?: boolean
  decorationColor?: string
}

export const TremorCard: React.FC<TremorCardProps> = ({
  children,
  className = "",
  decoration = false,
  decorationColor = "blue-500",
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden ${className}`}>
      {decoration && <div className={`absolute top-0 left-0 w-full h-1 bg-${decorationColor}`}></div>}
      {children}
    </div>
  )
}

export const TremorTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <h3 className={`text-[#364f6b] text-base font-bold ${className}`}>{children}</h3>

export const TremorMetric: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <p className={`text-3xl font-bold text-slate-700 ${className}`}>{children}</p>

export const TremorBadge: React.FC<{ children: React.ReactNode; type?: "success" | "danger" | "neutral" }> = ({
  children,
  type = "neutral",
}) => {
  // Colors updated for New Palette
  // Neutral: Slate 100 / Slate Blue Text
  let colors = "bg-slate-100 text-[#364f6b]"
  // Success: Light Teal bg / Teal Text (#17c3b2)
  if (type === "success") colors = "bg-[#17c3b2]/10 text-[#17c3b2] border border-[#17c3b2]/20"
  // Danger: Light Salmon bg / Salmon Text (#fe6d73)
  if (type === "danger") colors = "bg-[#fe6d73]/10 text-[#fe6d73] border border-[#fe6d73]/20"

  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors}`}>{children}</span>
}
