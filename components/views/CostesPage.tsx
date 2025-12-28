"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuBar } from "@/components/ui/menu-bar"
import { Calculator, UtensilsCrossed, FileSpreadsheet, TrendingDown, Target } from "lucide-react"
import { BenchmarksTab } from "@/components/features/BenchmarksTab"

const costesMenuItems = [
  {
    icon: TrendingDown,
    label: "Food Cost",
    href: "#food-cost",
    gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, transparent 70%)",
    iconColor: "text-[#02b1c4]",
  },
  {
    icon: FileSpreadsheet,
    label: "Escandallos",
    href: "#escandallos",
    gradient: "radial-gradient(circle, rgba(255,203,119,0.15) 0%, transparent 70%)",
    iconColor: "text-[#ffcb77]",
  },
  {
    icon: Target,
    label: "Benchmarks",
    href: "#benchmarks",
    gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, transparent 70%)",
    iconColor: "text-[#17c3b2]",
  },
]

export default function CostesPage() {
  const [activeTab, setActiveTab] = useState("Food Cost")

  // Fechas para benchmarks (mes actual)
  const now = new Date()
  const fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const fechaFin = now.toISOString().split("T")[0]

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader icon={Calculator} title="Costes" subtitle="Food Cost, Escandallos y Benchmarks" />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* MenuBar centrado */}
        <div className="flex justify-center">
          <MenuBar items={costesMenuItems} activeItem={activeTab} onItemClick={setActiveTab} />
        </div>

        {/* Tab Food Cost */}
        {activeTab === "Food Cost" && (
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#364f6b]">
                <Calculator className="h-5 w-5 text-[#02b1c4]" />
                Food Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <TrendingDown className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Próximamente</h3>
                <p className="text-center max-w-md">
                  Aquí podrás analizar el food cost de tu restaurante, comparar costes teóricos vs reales y optimizar tu
                  rentabilidad.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Escandallos */}
        {activeTab === "Escandallos" && (
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#364f6b]">
                <UtensilsCrossed className="h-5 w-5 text-[#02b1c4]" />
                Escandallos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileSpreadsheet className="h-16 w-16 mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Próximamente</h3>
                <p className="text-center max-w-md">
                  Gestiona los escandallos de tus platos, controla los ingredientes y calcula el coste de cada receta
                  automáticamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Benchmarks */}
        {activeTab === "Benchmarks" && <BenchmarksTab fechaInicio={fechaInicio} fechaFin={fechaFin} />}
      </div>
    </div>
  )
}
