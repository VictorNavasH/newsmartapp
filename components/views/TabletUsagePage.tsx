"use client"

import { useState } from "react"
import { Tablet, BarChart3, Settings } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTExODYwMTktMDE3NS00MzI5LWI2NTMtZjFhMmY1YjJkYjYzIiwidCI6ImIxNjFiM2I0LTU0MDYtNGE4Yy1iNDhmLTQ5ODdjNmI4YmQzOSIsImMiOjl9&pageName=ReportSection6ad7c2c3089c0894342c&language=es"

const PERFORMANCE_URL = "https://performance.nuasmartrestaurant.com"

type TabKey = "uso" | "config"

const tabs: { key: TabKey; label: string; icon: typeof Tablet }[] = [
  { key: "uso", label: "Uso de Mesas", icon: BarChart3 },
  { key: "config", label: "Configuración", icon: Settings },
]

export default function TabletUsagePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("uso")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PageHeader
        icon={Tablet}
        title="Uso de Mesas"
        subtitle="Análisis de uso de tablets y configuración de Smart Performance"
        actions={
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#02b1c4] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#364f6b] hover:bg-white"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        }
      />
      <div className="flex-1 px-6 pb-6">
        <div className="w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          {activeTab === "uso" && (
            <iframe
              title="NÜA - Uso de Mesas"
              src={POWERBI_URL}
              className="w-full h-full border-0"
              allowFullScreen
            />
          )}
          {activeTab === "config" && (
            <iframe
              title="NÜA Smart Performance"
              src={PERFORMANCE_URL}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  )
}
