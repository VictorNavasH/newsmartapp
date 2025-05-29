"use client"
import { ArrowUp, ArrowDown, Target, AlertTriangle, Calendar } from "lucide-react"
import StarBorder from "@/components/ui/star-border"
import { ReviewsLineChart } from "@/components/charts/reviews-line-chart"
import { ReviewsDistributionChart } from "@/components/charts/reviews-distribution-chart"
import { useReviewsGoogle } from "@/hooks/use-reviews-google"

export default function ReviewsGoogleContent() {
  const { data, loading, error } = useReviewsGoogle()
  // const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("meses")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nua-primary"></div>
        <span className="ml-2 text-sm text-nua-dark">Cargando métricas de reseñas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">Error al cargar los datos: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const { estadisticas, resumenEstrellas, evolucion } = data

  // Colores para estados según las reglas de KPI de la app
  const colors = {
    positive: "#17c3b2",
    negative: "#fe6d73",
    neutral: "#364f6b",
    warning: "#ffcb77",
  }

  // Función para determinar el estado de un KPI según las reglas de la app
  const getKPIStatus = (value: number, type: "rating" | "growth" | "volume" | "weekly") => {
    switch (type) {
      case "rating":
        if (value >= 4.5) return "positive"
        if (value >= 4.0) return "neutral"
        return "negative"
      case "growth":
        if (value > 5) return "positive"
        if (value > -5) return "neutral"
        return "negative"
      case "volume":
        if (value >= 1000) return "positive"
        if (value >= 500) return "neutral"
        return "negative"
      case "weekly":
        if (value >= 10) return "positive"
        if (value >= 5) return "neutral"
        return "negative"
      default:
        return "neutral"
    }
  }

  // Estados de KPIs aplicando las reglas correctas
  const notaGlobalStatus = getKPIStatus(estadisticas?.nota_global || 0, "rating")
  const cambioStatus = getKPIStatus(estadisticas?.cambio_porcentual || 0, "growth")
  const volumenStatus = getKPIStatus(estadisticas?.total_reseñas || 0, "volume")
  const semanaStatus = getKPIStatus(estadisticas?.reseñas_ultima_semana || 0, "weekly")

  // Filtrar datos de evolución según el período seleccionado
  // const getFilteredEvolution = () => {
  //   if (!evolucion.length) return evolucion

  //   const now = new Date()
  //   let daysToShow = 30

  //   switch (selectedPeriod) {
  //     case "dias":
  //       daysToShow = 30
  //       break
  //     case "semanas":
  //       daysToShow = 84
  //       break
  //     case "meses":
  //       daysToShow = 365
  //       break
  //     case "años":
  //       daysToShow = 1095
  //       break
  //   }

  //   const cutoffDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000)
  //   return evolucion.filter((item) => new Date(item.fecha) >= cutoffDate)
  // }

  // const filteredEvolution = getFilteredEvolution()

  // const getPeriodLabel = () => {
  //   switch (selectedPeriod) {
  //     case "dias":
  //       return "últimos 30 días"
  //     case "semanas":
  //       return "últimas 12 semanas"
  //     case "meses":
  //       return "últimos 12 meses"
  //     case "años":
  //       return "últimos 3 años"
  //   }
  // }

  // const filteredEvolution = getFilteredEvolution()

  // const getPeriodLabel = () => {
  //   switch (selectedPeriod) {
  //     case "dias":
  //       return "últimos 30 días"
  //     case "semanas":
  //       return "últimas 12 semanas"
  //     case "meses":
  //       return "últimos 12 meses"
  //     case "años":
  //       return "últimos 3 años"
  //   }
  // }

  return (
    <div className="space-y-6">
      {/* 1. MÉTRICAS PRINCIPALES - SIGUIENDO README EXACTAMENTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Nota Global */}
        <StarBorder status={notaGlobalStatus}>
          <h3 className="text-[14px] font-medium text-nua-title">Nota Global</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors[notaGlobalStatus] }}>
              {estadisticas?.nota_global?.toFixed(1) || "N/A"}★
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors[cambioStatus] }}>
              {(estadisticas?.cambio_porcentual || 0) > 0 ? (
                <ArrowUp size={14} className="mr-0.5" />
              ) : (
                <ArrowDown size={14} className="mr-0.5" />
              )}
              {estadisticas?.cambio_porcentual > 0 ? "+" : ""}
              {estadisticas?.cambio_porcentual?.toFixed(1) || "0"}% vs mes anterior
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">
            Proyección: {((estadisticas?.nota_global || 0) + 0.1).toFixed(1)}★
          </p>
        </StarBorder>

        {/* Total Reseñas */}
        <StarBorder status={volumenStatus}>
          <h3 className="text-[14px] font-medium text-nua-title">Total Reseñas</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors[volumenStatus] }}>
              {estadisticas?.total_reseñas?.toLocaleString() || "N/A"}
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors[volumenStatus] }}>
              <Calendar size={14} className="mr-0.5" />+{Math.round((estadisticas?.total_reseñas || 0) * 0.05)} este mes
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Acumuladas</p>
        </StarBorder>

        {/* Reseñas Última Semana */}
        <StarBorder status={semanaStatus}>
          <h3 className="text-[14px] font-medium text-nua-title">Última Semana</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors[semanaStatus] }}>
              {estadisticas?.reseñas_ultima_semana || "0"}
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors[semanaStatus] }}>
              <ArrowUp size={14} className="mr-0.5" />
              +15% vs anterior
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Semana pasada</p>
        </StarBorder>

        {/* Para Subir de Tramo */}
        <StarBorder status="warning">
          <h3 className="text-[14px] font-medium text-nua-title">Para Subir Tramo</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors.warning }}>
              {estadisticas?.reseñas_para_subir || "N/A"}
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.warning }}>
              <Target size={14} className="mr-0.5" />
              de 5★ necesarias
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">
            Para llegar a {((estadisticas?.nota_global || 0) + 0.1).toFixed(1)}★
          </p>
        </StarBorder>

        {/* Riesgo de Bajada */}
        <StarBorder status="negative">
          <h3 className="text-[14px] font-medium text-nua-title">Riesgo de Bajada</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-xl font-bold" style={{ color: colors.negative }}>
              {estadisticas?.reseñas_para_bajar || "N/A"}
            </p>
            <span className="ml-2 text-[10px] flex items-center" style={{ color: colors.negative }}>
              <AlertTriangle size={14} className="mr-0.5" />
              de 1★ críticas
            </span>
          </div>
          <p className="text-[12px] text-[#227c9d] opacity-80 mt-1">Para bajar de tramo</p>
        </StarBorder>
      </div>

      {/* 2. DISTRIBUCIÓN POR ESTRELLAS */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-[14px] font-medium text-nua-title mb-4">Distribución por Estrellas</h3>
        <ReviewsDistributionChart data={resumenEstrellas} />
      </div>

      {/* 3. PROGRESO HACIA META */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-[14px] font-medium text-nua-title mb-4">Progreso hacia la Siguiente Meta</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-nua-dark">
              Objetivo: {((estadisticas?.nota_global || 0) + 0.1).toFixed(1)}★
            </span>
            <span className="text-sm text-nua-subtitle">{estadisticas?.reseñas_para_subir || 0} reseñas de 5★</span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="h-6 rounded-full transition-all duration-700 flex items-center justify-center"
              style={{
                width: `${Math.max(15, Math.min(85, 100 - ((estadisticas?.reseñas_para_subir || 0) / 100) * 100))}%`,
                background: `linear-gradient(90deg, #17c3b2 0%, #1EADB8 100%)`,
              }}
            >
              <span className="text-xs text-white font-medium">
                {Math.round(100 - ((estadisticas?.reseñas_para_subir || 0) / 100) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EVOLUCIÓN TEMPORAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-nua-title">Evolución de la Nota Media</h3>
          </div>
          <div className="h-64">
            <ReviewsLineChart data={evolucion} dataKey="nota_media" color="#3b82f6" title="Nota Media" />
          </div>
          <div className="mt-2 text-sm text-nua-subtitle">
            <span className="inline-flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Evolución
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-nua-title">Evolución del Volumen</h3>
          </div>
          <div className="h-64">
            <ReviewsLineChart data={evolucion} dataKey="numero_reseñas" color="#10b981" title="Nº Reseñas" />
          </div>
          <div className="mt-2 text-sm text-nua-subtitle">
            <span className="inline-flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Reseñas
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
