import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Title + Subtitle */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <Icon className="w-6 h-6 text-[#02b1c4]" />
              <h1 className="text-2xl font-bold text-[#364f6b]">{title}</h1>
            </div>
            {subtitle && <p className="text-sm text-slate-500 ml-9">{subtitle}</p>}
          </div>

          {/* Right: Custom Actions (Date Pickers, Tabs, etc.) */}
          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
