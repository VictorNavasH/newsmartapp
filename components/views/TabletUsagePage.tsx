"use client"

import { useState } from "react"
import { Tablet, BarChart3, Settings } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { MenuBar } from "@/components/ui/menu-bar"

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTExODYwMTktMDE3NS00MzI5LWI2NTMtZjFhMmY1YjJkYjYzIiwidCI6ImIxNjFiM2I0LTU0MDYtNGE4Yy1iNDhmLTQ5ODdjNmI4YmQzOSIsImMiOjl9&pageName=ReportSection6ad7c2c3089c0894342c&language=es"

const PERFORMANCE_URL = "https://performance.nuasmartrestaurant.com/?pin=9069"

type TabKey = "uso" | "config"

const menuItems = [
  {
    icon: BarChart3,
    label: "Uso de Mesas",
    href: "#",
    gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, rgba(2,177,196,0) 70%)",
    iconColor: "text-[#02b1c4]",
  },
  {
    icon: Settings,
    label: "Configuración",
    href: "#",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, rgba(23,195,178,0) 70%)",
    iconColor: "text-[#17c3b2]",
  },
]

export default function TabletUsagePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("uso")

  const handleTabChange = (label: string) => {
    if (label === "Uso de Mesas") setActiveTab("uso")
    else if (label === "Configuración") setActiveTab("config")
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      <PageHeader
        icon={Tablet}
        title="Smart Tables"
        subtitle="Análisis de uso de tablets y configuración de Smart Performance"
      />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6 flex-1 w-full flex flex-col">
        <div className="flex justify-center">
          <MenuBar
            items={menuItems}
            activeItem={activeTab === "uso" ? "Uso de Mesas" : "Configuración"}
            onItemClick={handleTabChange}
          />
        </div>

        <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white" style={{ minHeight: "calc(100vh - 240px)" }}>
          {activeTab === "uso" && (
            <iframe
              title="NÜA - Smart Tables"
              src={POWERBI_URL}
              className="w-full h-full border-0"
              style={{ minHeight: "calc(100vh - 240px)" }}
              allowFullScreen
            />
          )}
          {activeTab === "config" && (
            <iframe
              title="NÜA Smart Performance"
              src={PERFORMANCE_URL}
              className="w-full h-full border-0"
              style={{ minHeight: "calc(100vh - 240px)" }}
              allow="autoplay; fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  )
}
