"use client"

import { useState, useEffect } from "react"
import { Save, Calendar, Clock, Users, DollarSign, Plus, Minus } from "lucide-react"
import {
  getConfiguracionBase,
  updateConfiguracionBase,
  getEstructuraCostes,
  updateEstructuraCostes,
  type ConfiguracionBase,
  type EstructuraCostes,
} from "@/app/actions/datos-base-actions"

const diasSemana = [
  { key: "lunes", label: "L", full: "Lunes" },
  { key: "martes", label: "M", full: "Martes" },
  { key: "miercoles", label: "X", full: "Miércoles" },
  { key: "jueves", label: "J", full: "Jueves" },
  { key: "viernes", label: "V", full: "Viernes" },
  { key: "sabado", label: "S", full: "Sábado" },
  { key: "domingo", label: "D", full: "Domingo" },
]

export function DatosBaseContent() {
  const [config, setConfig] = useState<ConfiguracionBase | null>(null)
  const [costes, setCostes] = useState<EstructuraCostes[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [configResult, costesResult] = await Promise.all([getConfiguracionBase(), getEstructuraCostes()])

    if (configResult.success) setConfig(configResult.data!)
    if (costesResult.success) setCostes(costesResult.data!)
    setLoading(false)
  }

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    await updateConfiguracionBase(config)
    setSaving(false)
  }

  const saveCostes = async () => {
    setSaving(true)
    await updateEstructuraCostes(costes)
    setSaving(false)
  }

  const updateDiaApertura = (dia: string, servicio: "medio_dia" | "noche", value: boolean) => {
    if (!config) return
    setConfig({
      ...config,
      dias_apertura: {
        ...config.dias_apertura,
        [dia]: {
          ...config.dias_apertura[dia],
          [servicio]: value,
        },
      },
    })
  }

  const updateTurnosServicio = (dia: string, servicio: "medio_dia" | "noche", value: number) => {
    if (!config) return
    setConfig({
      ...config,
      turnos_servicios: {
        ...config.turnos_servicios,
        [dia]: {
          ...config.turnos_servicios[dia],
          [servicio]: Math.max(0, value),
        },
      },
    })
  }

  const updateOcupacionMaxima = (value: number) => {
    if (!config) return
    setConfig({
      ...config,
      ocupacion_maxima_turno: Math.max(1, value),
    })
  }

  const updateCoste = (id: number, field: "pct_min" | "pct_max", value: number) => {
    setCostes(
      costes.map((coste) => (coste.id === id ? { ...coste, [field]: Math.max(0, Math.min(100, value)) } : coste)),
    )
  }

  const calcularResumenes = () => {
    if (!config) return { serviciosSemana: 0, turnosSemana: 0, ocupacionSemanal: 0 }

    let serviciosSemana = 0
    let turnosSemana = 0

    diasSemana.forEach(({ key }) => {
      const dia = config.dias_apertura[key]
      const turnos = config.turnos_servicios[key]

      if (dia.medio_dia) {
        serviciosSemana++
        turnosSemana += turnos.medio_dia
      }
      if (dia.noche) {
        serviciosSemana++
        turnosSemana += turnos.noche
      }
    })

    const ocupacionSemanal = turnosSemana * config.ocupacion_maxima_turno

    return { serviciosSemana, turnosSemana, ocupacionSemanal }
  }

  const resumenes = calcularResumenes()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-nua-primary border-t-transparent"></div>
        <span className="ml-2 text-xs text-gray-500">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* DÍAS DE APERTURA */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-nua-primary" />
          <h3 className="text-sm font-medium text-nua-title">Días de Apertura</h3>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {diasSemana.map(({ key, label, full }) => (
            <div key={key} className="group">
              <div className="text-center mb-2">
                <div className="w-8 h-8 mx-auto bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-nua-dark">{label}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-1.5 cursor-pointer group-hover:bg-gray-50 rounded p-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={config?.dias_apertura[key]?.medio_dia || false}
                    onChange={(e) => updateDiaApertura(key, "medio_dia", e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300 text-nua-primary focus:ring-1 focus:ring-nua-primary"
                  />
                  <span className="text-xs text-gray-600">MD</span>
                </label>
                <label className="flex items-center justify-center gap-1.5 cursor-pointer group-hover:bg-gray-50 rounded p-1 transition-colors">
                  <input
                    type="checkbox"
                    checked={config?.dias_apertura[key]?.noche || false}
                    onChange={(e) => updateDiaApertura(key, "noche", e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300 text-nua-primary focus:ring-1 focus:ring-nua-primary"
                  />
                  <span className="text-xs text-gray-600">NO</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nua-primary text-white text-xs font-medium rounded-lg hover:bg-nua-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            Guardar
          </button>
        </div>
      </div>

      {/* TURNOS POR SERVICIO */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-nua-primary" />
          <h3 className="text-sm font-medium text-nua-title">Turnos por Servicio</h3>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {diasSemana.map(({ key, label }) => (
            <div key={key} className="group">
              <div className="text-center mb-2">
                <div className="w-8 h-8 mx-auto bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-nua-dark">{label}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 text-center mb-1">MD</div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() =>
                        updateTurnosServicio(key, "medio_dia", (config?.turnos_servicios[key]?.medio_dia || 0) - 1)
                      }
                      className="w-5 h-5 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                    <span className="w-6 text-center text-xs font-medium text-nua-title">
                      {config?.turnos_servicios[key]?.medio_dia || 0}
                    </span>
                    <button
                      onClick={() =>
                        updateTurnosServicio(key, "medio_dia", (config?.turnos_servicios[key]?.medio_dia || 0) + 1)
                      }
                      className="w-5 h-5 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 text-center mb-1">NO</div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() =>
                        updateTurnosServicio(key, "noche", (config?.turnos_servicios[key]?.noche || 0) - 1)
                      }
                      className="w-5 h-5 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                    <span className="w-6 text-center text-xs font-medium text-nua-title">
                      {config?.turnos_servicios[key]?.noche || 0}
                    </span>
                    <button
                      onClick={() =>
                        updateTurnosServicio(key, "noche", (config?.turnos_servicios[key]?.noche || 0) + 1)
                      }
                      className="w-5 h-5 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nua-primary text-white text-xs font-medium rounded-lg hover:bg-nua-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            Guardar
          </button>
        </div>
      </div>

      {/* OCUPACIÓN Y RESÚMENES */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-nua-primary" />
          <h3 className="text-sm font-medium text-nua-title">Ocupación y Resúmenes</h3>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-2">Pax por Turno</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <button
                onClick={() => updateOcupacionMaxima((config?.ocupacion_maxima_turno || 70) - 1)}
                className="w-6 h-6 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3 text-gray-500" />
              </button>
              <input
                type="number"
                value={config?.ocupacion_maxima_turno || 70}
                onChange={(e) => updateOcupacionMaxima(Number.parseInt(e.target.value) || 70)}
                className="w-12 text-center border border-gray-200 rounded text-xs font-medium py-1"
              />
              <button
                onClick={() => updateOcupacionMaxima((config?.ocupacion_maxima_turno || 70) + 1)}
                className="w-6 h-6 bg-white rounded border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-nua-title">{resumenes.serviciosSemana}</div>
            <div className="text-xs text-gray-500">Servicios/sem</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-nua-title">{resumenes.turnosSemana}</div>
            <div className="text-xs text-gray-500">Turnos/sem</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-nua-title">{resumenes.ocupacionSemanal.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Pax máx/sem</div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nua-primary text-white text-xs font-medium rounded-lg hover:bg-nua-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            Guardar
          </button>
        </div>
      </div>

      {/* ESTRUCTURA DE COSTES */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-nua-primary" />
          <h3 className="text-sm font-medium text-nua-title">Estructura de Costes</h3>
          <span className="text-xs text-gray-500">Base para cálculos</span>
        </div>

        <div className="space-y-2">
          {costes.map((coste) => (
            <div key={coste.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-nua-title flex-1">{coste.nombre}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">Min</span>
                  <input
                    type="number"
                    value={coste.pct_min}
                    onChange={(e) => updateCoste(coste.id, "pct_min", Number.parseFloat(e.target.value) || 0)}
                    className="w-14 text-center border border-gray-200 rounded text-xs py-1"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">Max</span>
                  <input
                    type="number"
                    value={coste.pct_max}
                    onChange={(e) => updateCoste(coste.id, "pct_max", Number.parseFloat(e.target.value) || 0)}
                    className="w-14 text-center border border-gray-200 rounded text-xs py-1"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={saveCostes}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nua-primary text-white text-xs font-medium rounded-lg hover:bg-nua-accent transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
