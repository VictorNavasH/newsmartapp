import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { NotificationCenter } from "@/components/features/NotificationCenter"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 md:py-4">
        {/* En móvil el header apila título y acciones; en >= md vuelven a una fila */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          {/* Left: Icon + Title + Subtitle (ancho natural, no se trunca; subtítulo oculto en móvil) */}
          <div className="shrink-0 max-w-full">
            <div className="flex items-center gap-2.5 md:gap-3 md:mb-1">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#02b1c4] shrink-0" />
              <h1 className="text-lg md:text-2xl font-bold text-[#364f6b]">{title}</h1>
            </div>
            {subtitle && <p className="hidden md:block text-sm text-slate-500 ml-9">{subtitle}</p>}
          </div>

          {/* Right: Custom Actions + Notifications (envuelven si no caben) */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 md:gap-4 md:justify-end min-w-0">
            {actions}
            <NotificationCenter />
          </div>
        </div>
      </div>
    </div>
  )
}
