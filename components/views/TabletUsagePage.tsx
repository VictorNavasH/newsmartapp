"use client"

import { Tablet } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"

const POWERBI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMTExODYwMTktMDE3NS00MzI5LWI2NTMtZjFhMmY1YjJkYjYzIiwidCI6ImIxNjFiM2I0LTU0MDYtNGE4Yy1iNDhmLTQ5ODdjNmI4YmQzOSIsImMiOjl9&pageName=ReportSection6ad7c2c3089c0894342c&language=es"

export default function TabletUsagePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PageHeader
        icon={Tablet}
        title="Uso de Mesas"
        subtitle="Análisis de uso de tablets, apps y patrones de actividad por mesa"
      />
      <div className="flex-1 px-6 pb-6">
        <div className="w-full h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <iframe
            title="NÜA - Uso de Mesas"
            src={POWERBI_URL}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
