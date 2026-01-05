"use client"

import { useState, useMemo } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuBar } from "@/components/ui/menu-bar"
import { Calculator, UtensilsCrossed, FileSpreadsheet, TrendingDown, Target, Calendar } from "lucide-react"
import { BenchmarksTab } from "@/components/features/BenchmarksTab"
import { FoodCostTab } from "@/components/features/FoodCostTab"

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

type PeriodType = "mes" | "trimestre" | "semestre" | "año"

function getClosedPeriodOptions(type: PeriodType): { label: string; fechaInicio: string; fechaFin: string }[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11
  const options: { label: string; fechaInicio: string; fechaFin: string }[] = []

  if (type === "mes") {
    // Últimos 12 meses cerrados
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      const lastDay = new Date(year, month + 1, 0).getDate()
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      options.push({
        label: `${monthNames[month]} ${year}`,
        fechaInicio: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        fechaFin: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      })
    }
  } else if (type === "trimestre") {
    // Últimos 8 trimestres cerrados
    const currentQuarter = Math.floor(currentMonth / 3) // 0-3
    for (let i = 0; i < 8; i++) {
      let quarter = currentQuarter - 1 - i
      let year = currentYear
      while (quarter < 0) {
        quarter += 4
        year -= 1
      }
      const startMonth = quarter * 3
      const endMonth = startMonth + 2
      const lastDay = new Date(year, endMonth + 1, 0).getDate()
      options.push({
        label: `Q${quarter + 1} ${year}`,
        fechaInicio: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
        fechaFin: `${year}-${String(endMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      })
    }
  } else if (type === "semestre") {
    // Últimos 4 semestres cerrados
    const currentSemester = currentMonth < 6 ? 0 : 1
    for (let i = 0; i < 4; i++) {
      let semester = currentSemester - 1 - i
      let year = currentYear
      while (semester < 0) {
        semester += 2
        year -= 1
      }
      const startMonth = semester * 6
      const endMonth = startMonth + 5
      const lastDay = new Date(year, endMonth + 1, 0).getDate()
      options.push({
        label: `${semester === 0 ? "1er" : "2do"} Semestre ${year}`,
        fechaInicio: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
        fechaFin: `${year}-${String(endMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
      })
    }
  } else if (type === "año") {
    // Últimos 5 años cerrados
    for (let i = 1; i <= 5; i++) {
      const year = currentYear - i
      options.push({
        label: `${year}`,
        fechaInicio: `${year}-01-01`,
        fechaFin: `${year}-12-31`,
      })
    }
  }

  return options
}

export default function CostesPage() {
  const [activeTab, setActiveTab] = useState("Food Cost")

  const [periodType, setPeriodType] = useState<PeriodType>("mes")
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0)

  const periodOptions = useMemo(() => getClosedPeriodOptions(periodType), [periodType])

  const selectedPeriod = periodOptions[selectedPeriodIndex] || periodOptions[0]
  const fechaInicio = selectedPeriod?.fechaInicio || ""
  const fechaFin = selectedPeriod?.fechaFin || ""

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type)
    setSelectedPeriodIndex(0)
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader icon={Calculator} title="Costes" subtitle="Food Cost, Escandallos y Benchmarks" />

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* MenuBar centrado */}
        <div className="flex justify-center">
          <MenuBar items={costesMenuItems} activeItem={activeTab} onItemClick={setActiveTab} />
        </div>

        {/* Tab Food Cost */}
        {activeTab === "Food Cost" && <FoodCostTab />}

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
        {activeTab === "Benchmarks" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#02b1c4]" />
                <span className="text-sm font-medium text-[#364f6b]">Periodo de análisis</span>
                <span className="text-xs text-slate-500">(solo periodos cerrados)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Tipo de periodo */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {(["mes", "trimestre", "semestre", "año"] as PeriodType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handlePeriodTypeChange(type)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        periodType === type
                          ? "bg-white text-[#02b1c4] shadow-sm"
                          : "text-slate-600 hover:text-[#02b1c4]"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Selector de periodo específico */}
                <select
                  value={selectedPeriodIndex}
                  onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-[#364f6b] focus:outline-none focus:ring-2 focus:ring-[#02b1c4]/20 focus:border-[#02b1c4]"
                >
                  {periodOptions.map((option, index) => (
                    <option key={option.label} value={index}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Benchmarks Tab con las fechas del periodo seleccionado */}
            <BenchmarksTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
          </div>
        )}
      </div>
    </div>
  )
}
