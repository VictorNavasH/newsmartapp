"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRAND_COLORS } from "@/constants"
import { fetchForecastData, fetchForecastCalendar } from "@/lib/dataService"
import type { ForecastDay, ForecastKPIs, ForecastPrecision } from "@/types"
import { AIInsightCard } from "@/components/features/AIInsightCard"
import {
  TrendingUp,
  Users,
  Calendar,
  Target,
  Sun,
  Moon,
  CloudRain,
  CloudDrizzle,
  Droplets,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LineChart,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const activeTabStyle = {
  backgroundColor: BRAND_COLORS.primary,
  color: "white",
}

const getWeatherIcon = (nivelLluvia: string | null) => {
  switch (nivelLluvia) {
    case "sin_lluvia":
      return <Sun className="w-4 h-4 text-[#ffcb77]" />
    case "llovizna":
      return <CloudDrizzle className="w-4 h-4 text-slate-400" />
    case "lluvia_ligera":
      return <CloudRain className="w-4 h-4 text-[#227c9d]" />
    case "lluvia_moderada":
      return <CloudRain className="w-4 h-4 text-[#227c9d]" />
    case "lluvia_fuerte":
      return <Droplets className="w-4 h-4 text-[#364f6b]" />
    default:
      return <Sun className="w-4 h-4 text-[#ffcb77]" />
  }
}

const getOccupancyColorFromLevel = (nivel: string) => {
  switch (nivel) {
    case "tranquilo":
      return BRAND_COLORS.success // #49eada
    case "normal":
      return BRAND_COLORS.warning // #ffcb77
    case "fuerte":
      return BRAND_COLORS.accent // #227c9d
    case "pico":
      return BRAND_COLORS.error // #fe6d73
    default:
      return BRAND_COLORS.success
  }
}

const getOccupancyLabelFromLevel = (nivel: string) => {
  switch (nivel) {
    case "tranquilo":
      return "Tranquilo"
    case "normal":
      return "Normal"
    case "fuerte":
      return "Fuerte"
    case "pico":
      return "Pico"
    default:
      return "Tranquilo"
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [kpis, setKpis] = useState<ForecastKPIs | null>(null)
  const [proximos7dias, setProximos7dias] = useState<ForecastDay[]>([])
  const [precision, setPrecision] = useState<ForecastPrecision | null>(null)
  const [calendarData, setCalendarData] = useState<ForecastDay[]>([])
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null)

  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1)

  const loadData = async () => {
    try {
      const data = await fetchForecastData()
      setKpis(data.kpis)
      setProximos7dias(data.proximos7dias)
      setPrecision(data.precision)
    } catch (error) {
      console.error("Error loading forecast data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendar = async () => {
    try {
      const data = await fetchForecastCalendar(calendarYear, calendarMonth)
      setCalendarData(data)
    } catch (error) {
      console.error("Error loading calendar data:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadCalendar()
  }, [calendarYear, calendarMonth])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await loadCalendar()
    setRefreshing(false)
  }

  const ocupacionSemana = useMemo(() => {
    if (proximos7dias.length === 0) return 0
    const sum = proximos7dias.reduce((acc, d) => acc + (Number.parseFloat(String(d.ocupacion_pct_prediccion)) || 0), 0)
    return Math.round(sum / proximos7dias.length)
  }, [proximos7dias])

  // Chart data for 7-day forecast
  const chartData = useMemo(() => {
    return proximos7dias.map((d) => ({
      dia: d.nombre_dia.substring(0, 3),
      fecha: d.fecha,
      prediccion: d.comensales_prediccion,
      reservados: d.comensales_real,
      confianza: Math.round(d.confianza_prediccion * 100),
      ocupacion_pct: Number.parseFloat(String(d.ocupacion_pct_prediccion)) || 0,
      nivel: d.nivel_ocupacion,
    }))
  }, [proximos7dias])

  // Chart data by shift
  const chartDataTurno = useMemo(() => {
    return proximos7dias.map((d) => ({
      dia: d.nombre_dia.substring(0, 3),
      comida: d.comensales_comida_pred,
      cena: d.comensales_cena_pred,
      ocupacion_comida: d.ocupacion_pct_comida_pred,
      ocupacion_cena: d.ocupacion_pct_cena_pred,
    }))
  }, [proximos7dias])

  // Precision chart data
  const precisionChartData = useMemo(() => {
    if (!precision) return []
    return precision.semanas.map((s) => ({
      fecha: new Date(s.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      prediccion: s.prediccion,
      real: s.real,
      error: s.error_pct,
    }))
  }, [precision])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1)
    const lastDay = new Date(calendarYear, calendarMonth, 0)
    const days: (ForecastDay | null)[] = []

    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const dayData = calendarData.find((cd) => {
        const cdDateStr =
          typeof cd.fecha === "string" ? cd.fecha.substring(0, 10) : new Date(cd.fecha).toISOString().substring(0, 10)
        return cdDateStr === dateStr
      })
      if (dayData) {
        days.push(dayData)
      } else {
        days.push({
          fecha: dateStr,
          nombre_dia: "",
          mes: calendarMonth,
          comensales_real: 0,
          comensales_comida_real: 0,
          comensales_cena_real: 0,
          comensales_prediccion: 0,
          comensales_comida_pred: 0,
          comensales_cena_pred: 0,
          ventas_prediccion: 0,
          confianza_prediccion: 0,
          capacidad_turno: 66,
          capacidad_dia: 132,
          capacidad_mesas: 19,
          ocupacion_pct_prediccion: 0,
          ocupacion_pct_comida_pred: 0,
          ocupacion_pct_cena_pred: 0,
          ocupacion_pct_real: 0,
          ocupacion_pct_comida_real: 0,
          ocupacion_pct_cena_real: 0,
          nivel_ocupacion: "tranquilo",
          error_prediccion: null,
          error_porcentaje: null,
          nivel_lluvia: null,
          temp_max: null,
          es_festivo: false,
          evento_principal: null,
          comensales_semana_ant: null,
          comensales_año_ant: null,
          tipo_fecha: "futuro",
        })
      }
    }

    return days
  }, [calendarData, calendarYear, calendarMonth])

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

  const changeMonth = (delta: number) => {
    let newMonth = calendarMonth + delta
    let newYear = calendarYear
    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }
    setCalendarMonth(newMonth)
    setCalendarYear(newYear)
  }

  // AI Insight prompt
  const aiInsightPrompt = useMemo(() => {
    if (proximos7dias.length === 0) return ""
    const resumen = proximos7dias
      .map(
        (d) =>
          `${d.nombre_dia}: ${d.comensales_prediccion} pax (${d.ocupacion_pct_prediccion?.toFixed(0) || 0}% ocupación, nivel ${d.nivel_ocupacion})`,
      )
      .join(", ")
    return `Analiza la predicción de demanda del restaurante NÜA para los próximos 7 días: ${resumen}. Capacidad: 132 pax/día, 66 pax/turno. Genera insights sobre preparación de personal y stock.`
  }, [proximos7dias])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-[#02b1c4]" />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Forecasting"
        subtitle="Predicción de demanda y ocupación"
        icon={LineChart}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        }
      />
      <PageContent>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <TremorCard>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
              <span className="text-sm text-muted-foreground">Predicción Hoy</span>
            </div>
            <p className="text-2xl font-bold">{kpis?.prediccion_hoy || 0} pax</p>
          </TremorCard>
          <TremorCard>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
              <span className="text-sm text-muted-foreground">Reservas Hoy</span>
            </div>
            <p className="text-2xl font-bold">{kpis?.reservas_hoy || 0} pax</p>
          </TremorCard>
          <TremorCard>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
              <span className="text-sm text-muted-foreground">Ocupación Semana</span>
            </div>
            <p className="text-2xl font-bold">{ocupacionSemana}%</p>
          </TremorCard>
          <TremorCard>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
              <span className="text-sm text-muted-foreground">Precisión Modelo</span>
            </div>
            <p className="text-2xl font-bold">{kpis?.precision_modelo || 0}%</p>
          </TremorCard>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger
              value="general"
              className="data-[state=active]:text-white"
              style={{ "--tw-bg-opacity": 1 } as React.CSSProperties}
              data-state-active-style={activeTabStyle}
            >
              Vista General
            </TabsTrigger>
            <TabsTrigger value="calendario" className="data-[state=active]:text-white">
              Calendario
            </TabsTrigger>
            <TabsTrigger value="precision" className="data-[state=active]:text-white">
              Precisión
            </TabsTrigger>
          </TabsList>

          {/* Tab Vista General */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico principal */}
              <TremorCard>
                <TremorTitle>Próximos 7 días - Predicción vs Reservados</TremorTitle>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === "prediccion")
                            return [`${value} pax (${props.payload.ocupacion_pct?.toFixed(0) || 0}%)`, "Predicción"]
                          if (name === "reservados") return [`${value} pax`, "Reservados"]
                          if (name === "confianza") return [`${value}%`, "Confianza"]
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Bar dataKey="prediccion" name="Predicción" fill={BRAND_COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reservados" name="Reservados" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="confianza"
                        name="Confianza %"
                        stroke={BRAND_COLORS.success}
                        strokeWidth={2}
                        dot={{ fill: BRAND_COLORS.success }}
                        yAxisId={0}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TremorCard>

              {/* Gráfico por turno */}
              <TremorCard>
                <TremorTitle>Predicción por Turno</TremorTitle>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartDataTurno}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === "comida")
                            return [`${value} pax (${props.payload.ocupacion_comida?.toFixed(0) || 0}%)`, "Comida"]
                          if (name === "cena")
                            return [`${value} pax (${props.payload.ocupacion_cena?.toFixed(0) || 0}%)`, "Cena"]
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="comida"
                        name="Comida"
                        stackId="a"
                        fill={BRAND_COLORS.warning}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="cena" name="Cena" stackId="a" fill={BRAND_COLORS.accent} radius={[0, 0, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TremorCard>
            </div>

            {/* Tabla detalle semanal */}
            <TremorCard>
              <TremorTitle>Detalle Semanal</TremorTitle>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Día</th>
                      <th className="text-right py-2 px-3">Predicción</th>
                      <th className="text-right py-2 px-3">Reservados</th>
                      <th className="text-right py-2 px-3">Ocup. %</th>
                      <th className="text-center py-2 px-3">Nivel</th>
                      <th className="text-center py-2 px-3">Clima</th>
                      <th className="text-right py-2 px-3">Confianza</th>
                      <th className="text-right py-2 px-3">vs Sem. Ant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximos7dias.map((d) => (
                      <tr key={d.fecha} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">
                          {d.nombre_dia}
                          {d.es_festivo && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs"
                              style={{ borderColor: BRAND_COLORS.error, color: BRAND_COLORS.error }}
                            >
                              Festivo
                            </Badge>
                          )}
                        </td>
                        <td className="text-right py-2 px-3">{d.comensales_prediccion} pax</td>
                        <td className="text-right py-2 px-3">{d.comensales_real} pax</td>
                        <td
                          className="text-right py-2 px-3 font-medium"
                          style={{ color: getOccupancyColorFromLevel(d.nivel_ocupacion) }}
                        >
                          {d.ocupacion_pct_prediccion?.toFixed(0) || 0}%
                        </td>
                        <td className="text-center py-2 px-3">
                          <Badge
                            style={{
                              backgroundColor: getOccupancyColorFromLevel(d.nivel_ocupacion),
                              color:
                                d.nivel_ocupacion === "tranquilo" || d.nivel_ocupacion === "normal"
                                  ? "#223143"
                                  : "white",
                            }}
                          >
                            {getOccupancyLabelFromLevel(d.nivel_ocupacion)}
                          </Badge>
                        </td>
                        <td className="text-center py-2 px-3">{getWeatherIcon(d.nivel_lluvia)}</td>
                        <td className="text-right py-2 px-3">{Math.round(d.confianza_prediccion * 100)}%</td>
                        <td className="text-right py-2 px-3">
                          {d.comensales_semana_ant !== null ? (
                            <span
                              style={{
                                color:
                                  d.comensales_prediccion > d.comensales_semana_ant
                                    ? BRAND_COLORS.success
                                    : d.comensales_prediccion < d.comensales_semana_ant
                                      ? BRAND_COLORS.error
                                      : "inherit",
                              }}
                            >
                              {d.comensales_prediccion > d.comensales_semana_ant ? "+" : ""}
                              {d.comensales_prediccion - d.comensales_semana_ant}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TremorCard>

            {/* AI Insights */}
            <AIInsightCard
              title="Insights de Predicción"
              description="Recomendaciones basadas en la predicción de demanda"
              prompt={aiInsightPrompt}
            />
          </TabsContent>

          {/* Tab Calendario */}
          <TabsContent value="calendario" className="space-y-4">
            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <TremorTitle>
                  {monthNames[calendarMonth - 1]} {calendarYear}
                </TremorTitle>
                <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-4 justify-center mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.success }} />
                  <span>Tranquilo (&lt;25%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.warning }} />
                  <span>Normal (25-50%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.accent }} />
                  <span>Fuerte (50-75%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: BRAND_COLORS.error }} />
                  <span>Pico (&gt;75%)</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium py-2 text-muted-foreground">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[60px] p-1 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      day ? "hover:border-[#02b1c4]" : ""
                    }`}
                    style={{
                      backgroundColor: day ? `${getOccupancyColorFromLevel(day.nivel_ocupacion)}20` : "transparent",
                      borderColor: day?.tipo_fecha === "hoy" ? BRAND_COLORS.primary : "#e5e7eb",
                      borderWidth: day?.tipo_fecha === "hoy" ? 2 : 1,
                    }}
                    onClick={() => day && setSelectedDay(day)}
                  >
                    {day && (
                      <>
                        <div className="text-xs font-medium">{Number.parseInt(day.fecha.substring(8, 10))}</div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: getOccupancyColorFromLevel(day.nivel_ocupacion) }}
                        >
                          {Math.round(Number.parseFloat(String(day.ocupacion_pct_prediccion)) || 0)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">{day.comensales_prediccion} pax</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TremorCard>

            {/* Modal detalle día */}
            {selectedDay && (
              <TremorCard>
                <div className="flex items-center justify-between mb-4">
                  <TremorTitle>
                    {selectedDay.nombre_dia} - {new Date(selectedDay.fecha).toLocaleDateString("es-ES")}
                  </TremorTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
                    ✕
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Predicción Total</p>
                    <p className="text-xl font-bold">{selectedDay.comensales_prediccion} pax</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ocupación Predicha</p>
                    <p
                      className="text-xl font-bold"
                      style={{ color: getOccupancyColorFromLevel(selectedDay.nivel_ocupacion) }}
                    >
                      {selectedDay.ocupacion_pct_prediccion?.toFixed(0) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nivel</p>
                    <Badge
                      style={{
                        backgroundColor: getOccupancyColorFromLevel(selectedDay.nivel_ocupacion),
                        color:
                          selectedDay.nivel_ocupacion === "tranquilo" || selectedDay.nivel_ocupacion === "normal"
                            ? "#223143"
                            : "white",
                      }}
                    >
                      {getOccupancyLabelFromLevel(selectedDay.nivel_ocupacion)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confianza</p>
                    <p className="text-xl font-bold">{Math.round(selectedDay.confianza_prediccion * 100)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sun className="w-3 h-3" style={{ color: BRAND_COLORS.warning }} /> Comida
                    </p>
                    <p className="font-semibold">
                      {selectedDay.comensales_comida_pred} pax ({selectedDay.ocupacion_pct_comida_pred?.toFixed(0) || 0}
                      %)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Moon className="w-3 h-3" style={{ color: BRAND_COLORS.accent }} /> Cena
                    </p>
                    <p className="font-semibold">
                      {selectedDay.comensales_cena_pred} pax ({selectedDay.ocupacion_pct_cena_pred?.toFixed(0) || 0}%)
                    </p>
                  </div>
                </div>
                {(selectedDay.comensales_semana_ant || selectedDay.comensales_año_ant) && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    {selectedDay.comensales_semana_ant && (
                      <div>
                        <p className="text-xs text-muted-foreground">vs Semana Anterior</p>
                        <p className="font-semibold">{selectedDay.comensales_semana_ant} pax</p>
                      </div>
                    )}
                    {selectedDay.comensales_año_ant && (
                      <div>
                        <p className="text-xs text-muted-foreground">vs Año Anterior</p>
                        <p className="font-semibold">{selectedDay.comensales_año_ant} pax</p>
                      </div>
                    )}
                  </div>
                )}
              </TremorCard>
            )}
          </TabsContent>

          {/* Tab Precisión */}
          <TabsContent value="precision" className="space-y-4">
            {precision && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TremorCard>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                      <span className="text-sm text-muted-foreground">Precisión Media</span>
                    </div>
                    <p className="text-2xl font-bold">{precision.precision_media.toFixed(1)}%</p>
                  </TremorCard>
                  <TremorCard>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
                      <span className="text-sm text-muted-foreground">Mejor Predicción</span>
                    </div>
                    <p className="text-lg font-bold">{precision.mejor_dia.fecha}</p>
                    <p className="text-sm text-muted-foreground">Error: {precision.mejor_dia.error.toFixed(1)}%</p>
                  </TremorCard>
                  <TremorCard>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" style={{ color: BRAND_COLORS.error }} />
                      <span className="text-sm text-muted-foreground">Peor Predicción</span>
                    </div>
                    <p className="text-lg font-bold">{precision.peor_dia.fecha}</p>
                    <p className="text-sm text-muted-foreground">Error: {precision.peor_dia.error.toFixed(1)}%</p>
                  </TremorCard>
                </div>

                <TremorCard>
                  <TremorTitle>Comparativa Real vs Predicción (Últimas 4 semanas)</TremorTitle>
                  <div className="h-[300px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={precisionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 8 }} />
                        <Legend />
                        <Bar dataKey="prediccion" name="Predicción" fill={BRAND_COLORS.primary} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="real" name="Real" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="error"
                          name="Error %"
                          stroke={BRAND_COLORS.error}
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </TremorCard>

                <TremorCard>
                  <TremorTitle>Histórico de Precisión</TremorTitle>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Fecha</th>
                          <th className="text-right py-2 px-3">Predicción</th>
                          <th className="text-right py-2 px-3">Real</th>
                          <th className="text-right py-2 px-3">Diferencia</th>
                          <th className="text-right py-2 px-3">Error %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {precision.semanas.map((s) => (
                          <tr key={s.fecha} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3">{new Date(s.fecha).toLocaleDateString("es-ES")}</td>
                            <td className="text-right py-2 px-3">{s.prediccion} pax</td>
                            <td className="text-right py-2 px-3">{s.real} pax</td>
                            <td
                              className="text-right py-2 px-3"
                              style={{ color: s.diferencia > 0 ? BRAND_COLORS.error : BRAND_COLORS.success }}
                            >
                              {s.diferencia > 0 ? "+" : ""}
                              {s.diferencia}
                            </td>
                            <td
                              className="text-right py-2 px-3 font-medium"
                              style={{ color: s.error_pct > 15 ? BRAND_COLORS.error : BRAND_COLORS.success }}
                            >
                              {s.error_pct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TremorCard>
              </>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </>
  )
}
