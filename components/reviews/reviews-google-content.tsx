"use client"

import { ArrowUp, ArrowDown, Star, ThumbsUp, MessageCircle, CheckCircle } from "lucide-react"
import StarBorder from "@/components/ui/star-border"
import { CustomLineChart } from "@/components/charts/line-chart"
import { CustomBarChart } from "@/components/charts/bar-chart"
import { useReviewsData } from "@/hooks/use-reviews-data"

export default function ReviewsGoogleContent() {
  const { data, loading, error } = useReviewsData()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nua-primary"></div>
        <span className="ml-2 text-gray-600">Cargando datos de reseñas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error al cargar los datos: {error}</p>
      </div>
    )
  }

  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
  }

  const { metrics, distribucion, evolucion, reseñasRecientes, diasSemana, palabrasClave, temas } = data

  // Calcular top 3 días de la semana
  const topDiasSemana = diasSemana.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* 1. MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title">Puntuación Promedio</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors.positive }}>
              {metrics?.puntuacion_promedio.toFixed(1)}★
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
              {metrics && metrics.cambio_porcentual_mensual > 0 ? (
                <ArrowUp size={14} className="mr-0.5" />
              ) : (
                <ArrowDown size={14} className="mr-0.5" />
              )}
              {metrics?.cambio_porcentual_mensual > 0 ? "+" : ""}
              {metrics?.cambio_porcentual_mensual.toFixed(1)}%
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">vs mes anterior</p>
        </StarBorder>

        <StarBorder status="neutral">
          <h3 className="text-[14px] font-medium text-nua-title">Total Reseñas</h3>
          <div className="mt-2">
            <p className="text-xl font-bold text-nua-title">{metrics?.total_reseñas}</p>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Acumuladas</p>
        </StarBorder>

        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title">Este Mes</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors.positive }}>
              {metrics?.reseñas_mes_actual}
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.positive }}>
              <ArrowUp size={14} className="mr-0.5" />+{metrics?.cambio_porcentual_mensual.toFixed(0)}%
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">
            {metrics && (metrics.reseñas_mes_actual / 4).toFixed(1)}/semana
          </p>
        </StarBorder>

        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title">Tiempo Respuesta</h3>
          <div className="mt-2">
            <p className="text-xl font-bold" style={{ color: colors.positive }}>
              {metrics?.tiempo_respuesta_promedio.toFixed(1)}h
            </p>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Promedio</p>
        </StarBorder>

        <StarBorder status="positive">
          <h3 className="text-[14px] font-medium text-nua-title">NPS Score</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors.positive }}>
              +{metrics?.nps_score}
            </p>
            <span className="ml-2 text-[10px] text-gray-500">Excelente</span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Top 10% sector</p>
        </StarBorder>
      </div>

      {/* 2. GRÁFICOS DE EVOLUCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Evolución de Puntuación</h3>
          <div className="h-64">
            <CustomLineChart data={evolucion} />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="inline-flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Puntuación mensual
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Volumen de Reseñas</h3>
          <div className="h-64">
            <CustomBarChart data={evolucion} />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="inline-flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Reseñas por mes
            </span>
          </div>
        </div>
      </div>

      {/* 3. DISTRIBUCIÓN Y ANÁLISIS TEMPORAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Distribución de Puntuaciones</h3>

          {distribucion.map((item) => (
            <div key={item.estrellas} className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm font-medium">{item.estrellas}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>

              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full transition-all duration-700 ${
                    item.estrellas >= 4
                      ? "bg-gradient-to-r from-green-400 to-green-500"
                      : item.estrellas === 3
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                        : "bg-gradient-to-r from-red-400 to-red-500"
                  }`}
                  style={{ width: `${item.porcentaje}%` }}
                />
                {item.porcentaje > 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {item.cantidad}
                  </span>
                )}
              </div>

              <div className="text-right w-24">
                <span className="text-sm font-medium text-nua-title">{item.porcentaje}%</span>
                <span className="text-xs text-gray-500 block">({item.cantidad})</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Días con Más Actividad</h3>

          <div className="space-y-3 mb-4">
            {topDiasSemana.map((dia, index) => (
              <div key={dia.dia_semana} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : index === 1
                        ? "bg-gray-100 text-gray-700"
                        : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{dia.dia_semana}</p>
                  <p className="text-xs text-gray-500">{dia.promedio_diario.toFixed(1)} reseñas/día promedio</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">📈 Tendencia:</span>
              <span className="font-medium text-green-600">
                +{metrics?.cambio_porcentual_mensual.toFixed(0)}% vs mes anterior
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ANÁLISIS DE SENTIMIENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Palabras Más Mencionadas</h3>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">😊 POSITIVAS</h4>
            <div className="space-y-1">
              {palabrasClave?.positivas.map((palabra) => (
                <div key={palabra.palabra} className="flex justify-between text-sm">
                  <span>• {palabra.palabra}</span>
                  <span className="text-green-600 font-medium">({palabra.frecuencia})</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center">😟 A MEJORAR</h4>
            <div className="space-y-1">
              {palabrasClave?.negativas.map((palabra) => (
                <div key={palabra.palabra} className="flex justify-between text-sm">
                  <span>• {palabra.palabra}</span>
                  <span className="text-orange-600 font-medium">({palabra.frecuencia})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-nua-title mb-4">Temas Principales</h3>

          <div className="space-y-3 mb-4">
            {temas.map((tema) => (
              <div key={tema.tema} className="flex items-center gap-3">
                <span className="text-lg">{tema.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{tema.tema}</span>
                    <span className="text-sm font-bold text-nua-title">{tema.puntuacion_promedio.toFixed(1)}★</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full"
                        style={{ width: `${tema.porcentaje_menciones}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{tema.porcentaje_menciones.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. RESEÑAS RECIENTES */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-nua-title">Reseñas Recientes</h3>
          <button className="text-sm text-nua-primary hover:text-nua-accent">Ver todas →</button>
        </div>

        <div className="space-y-4">
          {reseñasRecientes.map((reseña) => (
            <div
              key={reseña.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                reseña.sentimiento === "negativo"
                  ? "border-red-200 bg-red-50"
                  : reseña.sentimiento === "positivo"
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-nua-accent text-white rounded-full flex items-center justify-center font-medium">
                    {reseña.autor.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-nua-title">{reseña.autor}</p>
                    <p className="text-xs text-gray-500">{reseña.fecha_relativa}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= reseña.puntuacion ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reseña.sentimiento === "positivo"
                        ? "bg-green-100 text-green-700"
                        : reseña.sentimiento === "negativo"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {reseña.sentimiento === "positivo"
                      ? "😊 Muy Positiva"
                      : reseña.sentimiento === "negativo"
                        ? "😟 Negativa"
                        : "😐 Neutral"}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{reseña.comentario}</p>

              {reseña.temas.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="text-xs text-gray-500">🏷️ Temas:</span>
                  {reseña.temas.map((tema) => (
                    <span key={tema} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {tema}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-nua-primary">
                    <ThumbsUp className="w-3 h-3" />
                    Útil ({reseña.util_votos})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {reseña.respondida ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Respondida
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {reseña.sentimiento === "negativo" && (
                        <span className="text-red-600 text-xs font-medium">🚨 Requiere atención</span>
                      )}
                      <button className="flex items-center gap-1 text-nua-primary hover:text-nua-accent text-xs">
                        <MessageCircle className="w-3 h-3" />
                        {reseña.sentimiento === "negativo" ? "Responder urgente" : "Responder"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
