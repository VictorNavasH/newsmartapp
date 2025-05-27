"use client"
import { Save, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { EstructuraCostes } from "@/app/actions/datos-base-actions"

interface Props {
  costes: EstructuraCostes[]
  onUpdate: (costes: EstructuraCostes[]) => void
  onSave: () => void
  saving: boolean
}

export function EstructuraCostesConfig({ costes, onUpdate, onSave, saving }: Props) {
  const updateCoste = (id: number, field: "pct_min" | "pct_max", value: number) => {
    const newCostes = costes.map((coste) =>
      coste.id === id ? { ...coste, [field]: Math.max(0, Math.min(100, value)) } : coste,
    )
    onUpdate(newCostes)
  }

  const getTotalRange = () => {
    const totalMin = costes.reduce((sum, coste) => sum + coste.pct_min, 0)
    const totalMax = costes.reduce((sum, coste) => sum + coste.pct_max, 0)
    return { totalMin, totalMax }
  }

  const { totalMin, totalMax } = getTotalRange()

  const getStatusColor = (min: number, max: number) => {
    if (min >= 95 && max <= 105) return "text-green-600 bg-green-50"
    if (min >= 90 && max <= 110) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-nua-title">Estructura de Costes</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(totalMin, totalMax)}`}>
          Total: {totalMin.toFixed(1)}% - {totalMax.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-3">
        {costes.map((coste, index) => (
          <div key={coste.id} className="group hover:bg-gray-50 rounded-lg p-4 transition-colors">
            <div className="flex items-center justify-between">
              {/* Nombre de la categoría */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-nua-title truncate">{coste.nombre}</h4>
                <div className="text-sm text-gray-500">
                  Rango: {coste.pct_min}% - {coste.pct_max}%
                </div>
              </div>

              {/* Controles de porcentajes */}
              <div className="flex items-center gap-4 ml-4">
                {/* Porcentaje Mínimo */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">Min</span>
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateCoste(coste.id, "pct_min", coste.pct_min - 0.5)}
                      className="p-1 hover:bg-gray-200 rounded-l-lg transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={coste.pct_min}
                      onChange={(e) => updateCoste(coste.id, "pct_min", Number.parseFloat(e.target.value) || 0)}
                      className="w-16 text-center bg-transparent border-0 focus:ring-0 text-sm font-medium"
                      step="0.5"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => updateCoste(coste.id, "pct_min", coste.pct_min + 0.5)}
                      className="p-1 hover:bg-gray-200 rounded-r-lg transition-colors"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Separador visual */}
                <div className="w-px h-6 bg-gray-300"></div>

                {/* Porcentaje Máximo */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8">Max</span>
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateCoste(coste.id, "pct_max", coste.pct_max - 0.5)}
                      className="p-1 hover:bg-gray-200 rounded-l-lg transition-colors"
                    >
                      <TrendingDown className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={coste.pct_max}
                      onChange={(e) => updateCoste(coste.id, "pct_max", Number.parseFloat(e.target.value) || 0)}
                      className="w-16 text-center bg-transparent border-0 focus:ring-0 text-sm font-medium"
                      step="0.5"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => updateCoste(coste.id, "pct_max", coste.pct_max + 0.5)}
                      className="p-1 hover:bg-gray-200 rounded-r-lg transition-colors"
                    >
                      <TrendingUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra visual del rango */}
              <div className="w-24 ml-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-nua-primary to-nua-accent rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (coste.pct_max / 50) * 100)}%`,
                      marginLeft: `${(coste.pct_min / 50) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  {((coste.pct_min + coste.pct_max) / 2).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen y botón de guardado */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Validación:</span>
              {totalMin >= 95 && totalMax <= 105 ? (
                <span className="text-green-600 ml-2">✓ Rangos correctos</span>
              ) : (
                <span className="text-red-600 ml-2">⚠ Revisar totales</span>
              )}
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-nua-primary text-white rounded-lg hover:bg-nua-accent disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Costes"}
          </button>
        </div>
      </div>
    </div>
  )
}
