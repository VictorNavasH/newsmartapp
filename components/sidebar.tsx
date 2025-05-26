"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  BarChart2,
  Megaphone,
  Calculator,
  CreditCard,
  Users,
  ThumbsUp,
  LineChart,
  Settings,
  HelpCircle,
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Análisis de Ventas", path: "/ventas", icon: TrendingUp },
  { name: "Análisis de Costes", path: "/costes", icon: DollarSign },
  { name: "Análisis de KPI's", path: "/kpis", icon: BarChart2 },
  { name: "Marketing Digital", path: "/marketing-digital", icon: Megaphone },
  { name: "Análisis Hipotético", path: "/analisis-hipotetico", icon: Calculator },
  { name: "Análisis Bancario", path: "/analisis-bancario", icon: CreditCard },
  { name: "Análisis de Ocupación", path: "/ocupacion", icon: Users },
  { name: "Análisis de Satisfacción", path: "/satisfaccion", icon: ThumbsUp },
  { name: "Forecast", path: "/forecast", icon: LineChart },
  { name: "Configuración", path: "/configuracion", icon: Settings },
  { name: "Ayuda", path: "/ayuda", icon: HelpCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 h-[73px] flex items-center justify-center">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/El%20texto%20del%20pa%CC%81rrafo%20%28320%20x%2060%20px%29%20%281990%20x%20278%20px%29-zl5tziLOe4hN9fAORZGhPI59Xinqe8.png"
          alt="NÜA SMART RESTAURANT"
          className="w-full max-h-full object-contain"
        />
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon

            return (
              <li key={item.path}>
                <Link href={item.path} className={`sidebar-item ${isActive ? "active" : ""}`}>
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
