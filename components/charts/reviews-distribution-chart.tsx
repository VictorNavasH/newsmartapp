"use client"

import { Star } from "lucide-react"

interface ReviewsDistributionChartProps {
  data: Array<{
    estrellas: number
    cantidad: number
    porcentaje: number
  }>
}

export function ReviewsDistributionChart({ data }: ReviewsDistributionChartProps) {
  const maxCantidad = Math.max(...data.map((item) => item.cantidad))

  // Calcular métricas
  const positivas = data.filter((item) => item.estrellas >= 4).reduce((sum, item) => sum + item.porcentaje, 0)

  const criticas = data.filter((item) => item.estrellas <= 2).reduce((sum, item) => sum + item.porcentaje, 0)

  // Calcular altura total de las barras: 5 filas × (altura fila + espaciado)
  // py-1 = 8px total, space-y-1.5 = 6px entre filas
  // Total aproximado: (8px × 5) + (6px × 4) = 64px
  const alturaBarras = "h-16" // 64px

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Gráfica de distribución - Lado izquierdo */}
      <div className="flex-1 min-w-0">
        <div className="space-y-1.5">
          {data.map((item) => (
            <div key={item.estrellas} className="flex items-center gap-3 py-1">
              {/* Estrellas visuales */}
              <div className="flex items-center gap-0.5 w-14">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2 h-2 ${i < item.estrellas ? "fill-[#fbbc04] text-[#fbbc04]" : "text-gray-200"}`}
                  />
                ))}
              </div>

              {/* Barra de progreso compacta */}
              <div className="flex-1 relative">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${item.porcentaje}%`,
                      background: `linear-gradient(90deg, #fbbc04 0%, #fdd835 100%)`,
                    }}
                  />

                  {/* Texto dentro solo si hay espacio suficiente */}
                  {item.porcentaje > 30 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-medium text-gray-800">{item.cantidad}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="text-right w-12">
                <div className="text-[11px] font-bold text-nua-title">{item.porcentaje.toFixed(1)}%</div>
                <div className="text-[8px] text-nua-subtitle">{item.cantidad}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas clave - Lado derecho con altura adaptada */}
      <div className="w-full lg:w-48 flex lg:flex-col gap-2">
        {/* Tarjeta Positivas - Altura adaptada */}
        <div
          className={`flex-1 lg:${alturaBarras} bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200/30 flex items-center justify-center`}
        >
          <div className="text-center px-3 py-2">
            <div className="text-[9px] text-green-700 font-medium mb-0.5">Positivas</div>
            <div className="text-lg font-bold text-[#17c3b2] mb-0.5">{positivas.toFixed(1)}%</div>
            <div className="text-[8px] text-green-600">4-5★</div>
          </div>
        </div>

        {/* Tarjeta Críticas - Altura adaptada */}
        <div
          className={`flex-1 lg:${alturaBarras} bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg border border-red-200/30 flex items-center justify-center`}
        >
          <div className="text-center px-3 py-2">
            <div className="text-[9px] text-red-700 font-medium mb-0.5">Críticas</div>
            <div className="text-lg font-bold text-[#fe6d73] mb-0.5">{criticas.toFixed(1)}%</div>
            <div className="text-[8px] text-red-600">1-2★</div>
          </div>
        </div>

        {/* Tarjeta Neutras - Solo en desktop, altura adaptada */}
        <div
          className={`hidden lg:flex ${alturaBarras} bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/30 items-center justify-center`}
        >
          <div className="text-center px-3 py-1.5">
            <div className="text-[8px] text-gray-700 font-medium mb-0.5">Neutras</div>
            <div className="text-sm font-bold text-[#364f6b] mb-0.5">{(100 - positivas - criticas).toFixed(1)}%</div>
            <div className="text-[7px] text-gray-600">3★</div>
          </div>
        </div>
      </div>
    </div>
  )
}
