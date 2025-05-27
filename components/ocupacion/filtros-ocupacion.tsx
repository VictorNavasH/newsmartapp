"use client"

import { Filter } from "lucide-react"
import type { FiltrosOcupacionType } from "@/app/actions/ocupacion-actions"

interface FiltrosOcupacionProps {
  filtros: FiltrosOcupacionType
  onFiltrosChange: (filtros: FiltrosOcupacionType) => void
}

export function FiltrosOcupacionComponent({ filtros, onFiltrosChange }: FiltrosOcupacionProps) {
  const presets = [
    { label: "Hoy", dias: 0 },
    { label: "Ayer", dias: 1 },
    { label: "Últimos 7 días", dias: 7 },
    { label: "Últimos 30 días", dias: 30 },
    { label: "Semana actual", dias: "semana" },
    { label: "Mes actual", dias: "mes" },
  ]

  const aplicarPreset = (preset: any) => {
    const hoy = new Date()
    let fechaInicio: string
    let fechaFin: string

    if (preset.dias === 0) {
      fechaInicio = fechaFin = hoy.toISOString().split("T")[0]
    } else if (preset.dias === 1) {
      const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000)
      fechaInicio = fechaFin = ayer.toISOString().split("T")[0]
    } else if (preset.dias === "semana") {
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 1))
      fechaInicio = inicioSemana.toISOString().split("T")[0]
      fechaFin = new Date().toISOString().split("T")[0]
    } else if (preset.dias === "mes") {
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0]
      fechaFin = new Date().toISOString().split("T")[0]
    } else {
      const inicio = new Date(hoy.getTime() - preset.dias * 24 * 60 * 60 * 1000)
      fechaInicio = inicio.toISOString().split("T")[0]
      fechaFin = new Date().toISOString().split("T")[0]
    }

    onFiltrosChange({ ...filtros, fechaInicio, fechaFin })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-nua-primary" />
        <h3 className="text-sm font-medium text-nua-title">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Presets de Período */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Período</label>
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => aplicarPreset(preset)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-nua-primary hover:text-white rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fechas Personalizadas */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Fecha Inicio</label>
          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => onFiltrosChange({ ...filtros, fechaInicio: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Fecha Fin</label>
          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => onFiltrosChange({ ...filtros, fechaFin: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>

        {/* Turno */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Turno</label>
          <select
            value={filtros.turno}
            onChange={(e) => onFiltrosChange({ ...filtros, turno: e.target.value as any })}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
          >
            <option value="todos">Todos</option>
            <option value="medio_dia">Mediodía</option>
            <option value="noche">Noche</option>
          </select>
        </div>
      </div>
    </div>
  )
}
