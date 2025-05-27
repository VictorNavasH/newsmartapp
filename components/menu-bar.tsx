"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Package,
  Star,
  ChromeIcon as Google,
  ClipboardList,
  Settings,
  Database,
  Table,
  Link,
  DollarSign,
  BarChart2,
  ChefHat,
  Users,
  LayoutDashboard,
  TrendingUp,
  Receipt,
  GitBranch,
  Lightbulb,
  Building2,
  Layers,
} from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  gradient: string
  iconColor: string
  color: string
}

// Menú para la página de Ventas
const ventasMenuItems: MenuItem[] = [
  {
    id: "resumen",
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: "Resumen",
    gradient: "radial-gradient(circle, rgba(71,176,215,0.15) 0%, rgba(71,176,215,0.06) 50%, rgba(71,176,215,0) 100%)",
    iconColor: "text-[#47b0d7]",
    color: "#47b0d7",
  },
  {
    id: "evolucion",
    icon: <TrendingUp className="h-4 w-4" />,
    label: "Evolución",
    gradient: "radial-gradient(circle, rgba(73,234,218,0.15) 0%, rgba(73,234,218,0.06) 50%, rgba(73,234,218,0) 100%)",
    iconColor: "text-[#49eada]",
    color: "#49eada",
  },
  {
    id: "productos",
    icon: <Package className="h-4 w-4" />,
    label: "Productos",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(34,197,94,0) 100%)",
    iconColor: "text-green-500",
    color: "#22c55e",
  },
  {
    id: "tickets",
    icon: <Receipt className="h-4 w-4" />,
    label: "Tickets",
    gradient:
      "radial-gradient(circle, rgba(255,206,133,0.15) 0%, rgba(255,206,133,0.06) 50%, rgba(255,206,133,0) 100%)",
    iconColor: "text-[#ffce85]",
    color: "#ffce85",
  },
  {
    id: "patrones",
    icon: <GitBranch className="h-4 w-4" />,
    label: "Patrones",
    gradient:
      "radial-gradient(circle, rgba(237,173,255,0.15) 0%, rgba(237,173,255,0.06) 50%, rgba(237,173,255,0) 100%)",
    iconColor: "text-[#edadff]",
    color: "#edadff",
  },
]

// Menú para la página de Satisfacción
const satisfaccionMenuItems: MenuItem[] = [
  {
    id: "general",
    icon: <Star className="h-4 w-4" />,
    label: "Satisfacción General",
    gradient:
      "radial-gradient(circle, rgba(255,203,119,0.15) 0%, rgba(255,203,119,0.06) 50%, rgba(255,203,119,0) 100%)",
    iconColor: "text-[#ffcb77]",
    color: "#ffcb77",
  },
  {
    id: "google",
    icon: <Google className="h-4 w-4" />,
    label: "Reviews Google",
    gradient: "radial-gradient(circle, rgba(66,133,244,0.15) 0%, rgba(66,133,244,0.06) 50%, rgba(66,133,244,0) 100%)",
    iconColor: "text-[#4285f4]",
    color: "#4285f4",
  },
  {
    id: "encuesta",
    icon: <ClipboardList className="h-4 w-4" />,
    label: "Encuesta Interna",
    gradient: "radial-gradient(circle, rgba(52,168,83,0.15) 0%, rgba(52,168,83,0.06) 50%, rgba(52,168,83,0) 100%)",
    iconColor: "text-[#34a853]",
    color: "#34a853",
  },
]

// Menú para la página de Configuración
const configuracionMenuItems: MenuItem[] = [
  {
    id: "general",
    icon: <Settings className="h-4 w-4" />,
    label: "General",
    gradient:
      "radial-gradient(circle, rgba(255,206,133,0.15) 0%, rgba(255,206,133,0.06) 50%, rgba(255,206,133,0) 100%)",
    iconColor: "text-[#ffce85]",
    color: "#ffce85",
  },
  {
    id: "operativos",
    icon: <Database className="h-4 w-4" />,
    label: "Datos Operativos",
    gradient: "radial-gradient(circle, rgba(71,176,215,0.15) 0%, rgba(71,176,215,0.06) 50%, rgba(71,176,215,0) 100%)",
    iconColor: "text-[#47b0d7]",
    color: "#47b0d7",
  },
  {
    id: "base",
    icon: <Table className="h-4 w-4" />,
    label: "Datos Base",
    gradient:
      "radial-gradient(circle, rgba(237,173,255,0.15) 0%, rgba(237,173,255,0.06) 50%, rgba(237,173,255,0) 100%)",
    iconColor: "text-[#edadff]",
    color: "#edadff",
  },
  {
    id: "conexiones",
    icon: <Link className="h-4 w-4" />,
    label: "Conexiones",
    gradient: "radial-gradient(circle, rgba(255,71,151,0.15) 0%, rgba(255,71,151,0.06) 50%, rgba(255,71,151,0) 100%)",
    iconColor: "text-[#ff4797]",
    color: "#ff4797",
  },
]

// Menú para la página de KPIs
const kpisMenuItems: MenuItem[] = [
  {
    id: "economicos",
    icon: <DollarSign className="h-4 w-4" />,
    label: "Económicos",
    gradient: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.06) 50%, rgba(234,179,8,0) 100%)",
    iconColor: "text-[#eab308]",
    color: "#eab308",
  },
  {
    id: "operativos",
    icon: <BarChart2 className="h-4 w-4" />,
    label: "Operativos",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.06) 50%, rgba(249,115,22,0) 100%)",
    iconColor: "text-[#f97316]",
    color: "#f97316",
  },
  {
    id: "kitchen",
    icon: <ChefHat className="h-4 w-4" />,
    label: "Smart Kitchen",
    gradient: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(220,38,38,0) 100%)",
    iconColor: "text-[#dc2626]",
    color: "#dc2626",
  },
  {
    id: "sala",
    icon: <Users className="h-4 w-4" />,
    label: "Sala",
    gradient:
      "radial-gradient(circle, rgba(237,173,255,0.15) 0%, rgba(237,173,255,0.06) 50%, rgba(237,173,255,0) 100%)",
    iconColor: "text-[#edadff]",
    color: "#edadff",
  },
]

// Menú para la página de Análisis Bancario
const analisisBancarioMenuItems: MenuItem[] = [
  {
    id: "insights",
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Insights",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.06) 50%, rgba(34,197,94,0) 100%)",
    iconColor: "text-[#22c55e]",
    color: "#22c55e",
  },
  {
    id: "caixabank",
    icon: <Building2 className="h-4 w-4" />,
    label: "CaixaBank",
    gradient: "radial-gradient(circle, rgba(0,115,230,0.15) 0%, rgba(0,115,230,0.06) 50%, rgba(0,115,230,0) 100%)",
    iconColor: "text-[#0073e6]",
    color: "#0073e6",
  },
  {
    id: "bbva",
    icon: <Building2 className="h-4 w-4" />,
    label: "BBVA",
    gradient: "radial-gradient(circle, rgba(0,68,129,0.15) 0%, rgba(0,68,129,0.06) 50%, rgba(0,68,129,0) 100%)",
    iconColor: "text-[#004481]",
    color: "#004481",
  },
  {
    id: "sabadell",
    icon: <Building2 className="h-4 w-4" />,
    label: "Banc Sabadell",
    gradient: "radial-gradient(circle, rgba(0,160,176,0.15) 0%, rgba(0,160,176,0.06) 50%, rgba(0,160,176,0) 100%)",
    iconColor: "text-[#00a0b0]",
    color: "#00a0b0",
  },
  {
    id: "pool",
    icon: <Layers className="h-4 w-4" />,
    label: "Pool Bancario",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.06) 50%, rgba(139,92,246,0) 100%)",
    iconColor: "text-[#8b5cf6]",
    color: "#8b5cf6",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

interface MenuBarProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function MenuBar({ activeTab, onTabChange }: MenuBarProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Determinar qué menú mostrar según la ruta actual
  const getMenuItems = () => {
    if (pathname.includes("/ventas")) {
      return ventasMenuItems
    } else if (pathname.includes("/satisfaccion")) {
      return satisfaccionMenuItems
    } else if (pathname.includes("/configuracion")) {
      return configuracionMenuItems
    } else if (pathname.includes("/kpis")) {
      return kpisMenuItems
    } else if (pathname.includes("/analisis-bancario")) {
      return analisisBancarioMenuItems
    }
    // Por defecto, mostrar el menú de ventas
    return ventasMenuItems
  }

  // Evitar errores de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const menuItems = getMenuItems()

  return (
    <motion.nav className="py-1 px-2 rounded-xl relative overflow-hidden" initial="initial" whileHover="hover">
      <ul className="flex items-center gap-1 relative z-10">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id

          return (
            <motion.li key={item.label} className="relative">
              <motion.div
                className="block rounded-lg overflow-visible group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                {/* Fondo con degradado animado para hover */}
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: 0,
                    borderRadius: "0.5rem",
                  }}
                />

                <motion.button
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 relative z-10 bg-transparent transition-colors rounded-lg ${
                    isActive ? "text-nua-title" : "text-gray-500 group-hover:text-gray-900"
                  }`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
                >
                  <span
                    style={{ color: isActive ? item.color : undefined }}
                    className={`transition-colors duration-300 ${!isActive && `group-hover:${item.iconColor}`}`}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-sm ${isActive ? "font-bold" : "font-normal"}`}>{item.label}</span>
                </motion.button>

                <motion.button
                  onClick={() => onTabChange(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1 absolute inset-0 z-10 bg-transparent text-gray-500 group-hover:text-gray-900 transition-colors rounded-lg"
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
                >
                  <span className={`transition-colors duration-300 group-hover:${item.iconColor}`}>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              </motion.div>
            </motion.li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
