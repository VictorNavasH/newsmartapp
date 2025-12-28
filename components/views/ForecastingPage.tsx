"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Users,
  CalendarDays,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Crosshair,
  Calculator,
  Receipt,
  Calendar,
  Zap,
  Moon,
  Sun,
  CloudRain,
  CloudDrizzle,
  Droplets,
  RefreshCw,
  LineChart,
  AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { TremorCard, TremorTitle, TremorText } from "@/components/ui/TremorCard"
import { MenuBar } from "@/components/ui/menu-bar"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { BRAND_COLORS } from "@/constants"
import { fetchForecastData, fetchForecastCalendar } from "@/lib/dataService"
import { fetchWhatIfReferenceData } from "@/lib/whatIfService"
import type { ForecastDay, ForecastKPIs, ForecastPrecision, WhatIfReferenceData } from "@/types"
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

  const [activeView, setActiveView] = useState("Vista General")

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Vista General",
      href: "#",
      gradient: "radial-gradient(circle, rgba(2,177,196,0.15) 0%, transparent 70%)",
      iconColor: "text-[#02b1c4]",
    },
    {
      icon: CalendarDays,
      label: "Calendario",
      href: "#",
      gradient: "radial-gradient(circle, rgba(34,124,157,0.15) 0%, transparent 70%)",
      iconColor: "text-[#227c9d]",
    },
    {
      icon: Crosshair,
      label: "Precisión",
      href: "#",
      gradient: "radial-gradient(circle, rgba(254,201,79,0.15) 0%, transparent 70%)",
      iconColor: "text-[#fec94f]",
    },
    {
      icon: Calculator,
      label: "What-If",
      href: "#",
      gradient: "radial-gradient(circle, rgba(23,195,178,0.15) 0%, transparent 70%)",
      iconColor: "text-[#17c3b2]",
    },
  ]

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
  const WALK_IN_RATES: Record<number, number> = {
    0: 0.15, // Domingo: +15% walk-ins
    1: 0.1, // Lunes: +10%
    2: 0.2, // Martes: +20%
    3: 0.2, // Miércoles: +20%
    4: 0.15, // Jueves: +15%
    5: 0.25, // Viernes: +25%
    6: 0.3, // Sábado: +30%
  }

  const CAPACIDAD_DIA = 132
  const CAPACIDAD_TURNO = 66

  const chartData = useMemo(() => {
    return proximos7dias.map((d) => {
      const fecha = new Date(d.fecha)
      const diaSemana = fecha.getDay()
      const walkInRate = WALK_IN_RATES[diaSemana] || 0.15

      const confirmados = d.comensales_real || 0
      const estimado = Math.min(Math.round(confirmados * (1 + walkInRate)), CAPACIDAD_DIA)
      const ocupacion_pct = Math.round((estimado / CAPACIDAD_DIA) * 100)

      // Calcular nivel basado en ocupación del estimado
      let nivel = "tranquilo"
      if (ocupacion_pct >= 75) nivel = "pico"
      else if (ocupacion_pct >= 50) nivel = "fuerte"
      else if (ocupacion_pct >= 25) nivel = "normal"

      return {
        dia: `${d.nombre_dia.substring(0, 3)} ${fecha.getDate()}`,
        fecha: d.fecha,
        confirmados,
        estimado,
        ocupacion_pct,
        nivel,
        walkInRate: Math.round(walkInRate * 100),
      }
    })
  }, [proximos7dias])

  const chartDataTurno = useMemo(() => {
    return proximos7dias.map((d) => {
      const fecha = new Date(d.fecha)
      const diaSemana = fecha.getDay()
      const walkInRate = WALK_IN_RATES[diaSemana] || 0.15

      // Usar datos reales de reservas por turno
      const comida_confirmados = d.comensales_comida_real || 0
      const cena_confirmados = d.comensales_cena_real || 0

      // Si no hay datos por turno, estimar 50/50 del total
      let comida_final: number
      let cena_final: number

      if (comida_confirmados > 0 || cena_confirmados > 0) {
        comida_final = Math.min(comida_confirmados, CAPACIDAD_TURNO)
        cena_final = Math.min(cena_confirmados, CAPACIDAD_TURNO)
      } else {
        const total = d.comensales_real || 0
        comida_final = Math.min(Math.round(total * 0.5), CAPACIDAD_TURNO)
        cena_final = Math.min(Math.round(total * 0.5), CAPACIDAD_TURNO)
      }

      // Calcular ocupación
      const ocupacion_comida = Math.round((comida_final / CAPACIDAD_TURNO) * 100)
      const ocupacion_cena = Math.round((cena_final / CAPACIDAD_TURNO) * 100)

      return {
        dia: d.nombre_dia.substring(0, 3),
        comida: comida_final,
        cena: cena_final,
        ocupacion_comida,
        ocupacion_cena,
      }
    })
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

  const getActiveMenuLabel = () => {
    const activeItem = menuItems.find((item) => item.label === activeView)
    return activeItem ? activeItem.label : ""
  }

  const [whatIfData, setWhatIfData] = useState<WhatIfReferenceData | null>(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [customers, setCustomers] = useState(45)
  const [avgTicket, setAvgTicket] = useState(25)

  useEffect(() => {
    if (activeView === "What-If" && !whatIfData) {
      const loadWhatIfData = async () => {
        setWhatIfLoading(true)
        try {
          const data = await fetchWhatIfReferenceData()
          setWhatIfData(data)
          setCustomers(Math.round(data.comensales_media))
          setAvgTicket(Math.round(data.ticket_medio_historico))
        } catch (error) {
          console.error("Error loading what-if data:", error)
        } finally {
          setWhatIfLoading(false)
        }
      }
      loadWhatIfData()
    }
  }, [activeView, whatIfData])

  const whatIfCalculations = useMemo(() => {
    if (!whatIfData) return null

    const dailyRevenue = customers * avgTicket
    const avgDaily = whatIfData.facturacion_media_dia
    const difference = dailyRevenue - avgDaily
    const percentDiff = avgDaily > 0 ? (difference / avgDaily) * 100 : 0
    const monthlyProjection = dailyRevenue * whatIfData.dias_operativos_mes
    const occupancy = (customers / whatIfData.capacidad_dia) * 100
    const percentVsBest =
      whatIfData.mejor_dia_facturacion > 0 ? (dailyRevenue / whatIfData.mejor_dia_facturacion) * 100 : 0

    return {
      dailyRevenue,
      difference,
      percentDiff,
      monthlyProjection,
      occupancy,
      percentVsBest,
    }
  }, [customers, avgTicket, whatIfData])

  const getOccupancyColor = (occupancy: number): string => {
    if (occupancy < 50) return BRAND_COLORS.error
    if (occupancy < 80) return BRAND_COLORS.lunch
    return BRAND_COLORS.success
  }

  const formatWhatIfCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Predicción Hoy */}
          <TremorCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}>
                <Users className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Predicción Hoy</p>
                <p className="text-2xl font-bold" style={{ color: "#364f6b" }}>
                  {kpis?.prediccion_hoy ?? 0} <span className="text-sm font-normal">pax</span>
                </p>
              </div>
            </div>
          </TremorCard>

          {/* Reservas Hoy */}
          <TremorCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.accent}20` }}>
                <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.accent }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reservas Hoy</p>
                <p className="text-2xl font-bold" style={{ color: "#364f6b" }}>
                  {kpis?.reservas_hoy ?? 0} <span className="text-sm font-normal">pax</span>
                </p>
              </div>
            </div>
          </TremorCard>

          {/* Ocupación Semana */}
          <TremorCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.warning}20` }}>
                <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.warning }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ocupación Semana</p>
                <p className="text-2xl font-bold" style={{ color: "#364f6b" }}>
                  {kpis?.ocupacion_semana?.toFixed(0) ?? 0}
                  <span className="text-sm font-normal">%</span>
                </p>
              </div>
            </div>
          </TremorCard>

          {/* Precisión Modelo */}
          <TremorCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.success}20` }}>
                <Target className="w-5 h-5" style={{ color: BRAND_COLORS.success }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precisión Modelo</p>
                <p className="text-2xl font-bold" style={{ color: "#364f6b" }}>
                  {kpis?.precision_modelo?.toFixed(0) ?? 0}
                  <span className="text-sm font-normal">%</span>
                </p>
              </div>
            </div>
          </TremorCard>
        </div>

        {/* MenuBar */}
        <div className="flex justify-center mb-6">
          <MenuBar items={menuItems} activeItem={activeView} onItemClick={setActiveView} />
        </div>

        {/* Vista General */}
        {activeView === "Vista General" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico principal */}
              <TremorCard>
                <TremorTitle>Confirmados vs Estimado</TremorTitle>
                <p className="text-xs text-muted-foreground mb-2">
                  Estimado = Confirmados + walk-ins históricos del día
                </p>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, CAPACIDAD_DIA]} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === "confirmados") return [`${value} pax`, "Confirmados"]
                          if (name === "estimado")
                            return [`${value} pax (+${props.payload.walkInRate}% walk-ins)`, "Estimado"]
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Bar dataKey="confirmados" name="Confirmados" fill={BRAND_COLORS.primary} radius={[4, 4, 0, 0]} />
                      <Line
                        type="monotone"
                        dataKey="estimado"
                        name="Estimado"
                        stroke={BRAND_COLORS.warning}
                        strokeWidth={3}
                        dot={{ fill: BRAND_COLORS.warning, strokeWidth: 2, r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TremorCard>

              {/* Gráfico por turno */}
              <TremorCard>
                <TremorTitle>Reservas por Turno</TremorTitle>
                <p className="text-xs text-muted-foreground mb-2">Basado en reservas confirmadas por turno</p>
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
                      <th className="text-right py-2 px-3">Confirmados</th>
                      <th className="text-right py-2 px-3">Estimado</th>
                      <th className="text-right py-2 px-3">Ocup. %</th>
                      <th className="text-center py-2 px-3">Nivel</th>
                      <th className="text-center py-2 px-3">Clima</th>
                      <th className="text-right py-2 px-3">vs Sem. Ant.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximos7dias.map((d, idx) => {
                      const chartItem = chartData[idx]
                      const numeroDia = new Date(d.fecha).getDate()
                      return (
                        <tr key={d.fecha} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">
                            {d.nombre_dia} {numeroDia}
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
                          <td className="text-right py-2 px-3">{chartItem?.confirmados || 0} pax</td>
                          <td className="text-right py-2 px-3">
                            <span className="flex items-center justify-end gap-1">
                              {chartItem?.estimado || 0} pax
                              <span className="text-xs text-muted-foreground">(+{chartItem?.walkInRate || 0}%)</span>
                            </span>
                          </td>
                          <td
                            className="text-right py-2 px-3 font-medium"
                            style={{ color: getOccupancyColorFromLevel(chartItem?.nivel || "tranquilo") }}
                          >
                            {chartItem?.ocupacion_pct || 0}%
                          </td>
                          <td className="text-center py-2 px-3">
                            <Badge
                              style={{
                                backgroundColor: getOccupancyColorFromLevel(chartItem?.nivel || "tranquilo"),
                                color:
                                  chartItem?.nivel === "tranquilo" || chartItem?.nivel === "normal"
                                    ? "#223143"
                                    : "white",
                              }}
                            >
                              {getOccupancyLabelFromLevel(chartItem?.nivel || "tranquilo")}
                            </Badge>
                          </td>
                          <td className="text-center py-2 px-3">{getWeatherIcon(d.nivel_lluvia)}</td>
                          <td className="text-right py-2 px-3">
                            {d.comensales_semana_ant !== null && d.comensales_semana_ant !== undefined ? (
                              <span
                                style={{
                                  color:
                                    (chartItem?.confirmados || 0) > d.comensales_semana_ant
                                      ? BRAND_COLORS.success
                                      : (chartItem?.confirmados || 0) < d.comensales_semana_ant
                                        ? BRAND_COLORS.error
                                        : "inherit",
                                }}
                              >
                                {(chartItem?.confirmados || 0) > d.comensales_semana_ant ? "+" : ""}
                                {(chartItem?.confirmados || 0) - d.comensales_semana_ant}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TremorCard>

            {/* Grafico Comida/Cena */}
            <TremorCard>
              <TremorTitle>Distribucion por Turno</TremorTitle>
              {/* Placeholder for additional code */}
            </TremorCard>
          </div>
        )}

        {/* Calendario */}
        {activeView === "Calendario" && (
          <div className="space-y-4">
            {/* Selector de mes */}
            <div className="flex items-center justify-between">
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
          </div>
        )}

        {/* Precisión */}
        {activeView === "Precisión" && (
          <div className="space-y-4">
            {/* KPIs de Precision */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TremorCard>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                  <TremorText className="text-muted-foreground text-sm">Precision Global</TremorText>
                </div>
                <TremorTitle className="text-2xl">
                  {precision ? `${Math.round(100 - (precision.media_error_pct || 0))}%` : "-"}
                </TremorTitle>
                <TremorText className="text-xs text-muted-foreground">
                  Error medio: {precision?.media_error_pct?.toFixed(1) || 0}%
                </TremorText>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: BRAND_COLORS.success }} />
                  <TremorText className="text-muted-foreground text-sm">Mejor Semana</TremorText>
                </div>
                <TremorTitle className="text-2xl">
                  {precision?.semanas?.length
                    ? `${Math.round(100 - Math.min(...precision.semanas.map((s) => s.error_pct)))}%`
                    : "-"}
                </TremorTitle>
                <TremorText className="text-xs text-muted-foreground">precision alcanzada</TremorText>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4" style={{ color: BRAND_COLORS.error }} />
                  <TremorText className="text-muted-foreground text-sm">Peor Semana</TremorText>
                </div>
                <TremorTitle className="text-2xl">
                  {precision?.semanas?.length
                    ? `${Math.round(100 - Math.max(...precision.semanas.map((s) => s.error_pct)))}%`
                    : "-"}
                </TremorTitle>
                <TremorText className="text-xs text-muted-foreground">precision minima</TremorText>
              </TremorCard>

              <TremorCard>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
                  <TremorText className="text-muted-foreground text-sm">Semanas Analizadas</TremorText>
                </div>
                <TremorTitle className="text-2xl">{precision?.semanas?.length || 0}</TremorTitle>
                <TremorText className="text-xs text-muted-foreground">ultimas semanas</TremorText>
              </TremorCard>
            </div>

            {/* Grafico de Precision */}
            <TremorCard>
              <div className="flex items-center justify-between mb-4">
                <TremorTitle>Evolucion de Precision por Semana</TremorTitle>
              </div>
              {precisionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={precisionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="prediccion"
                      name="Prediccion"
                      fill={BRAND_COLORS.primary}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar yAxisId="left" dataKey="real" name="Real" fill={BRAND_COLORS.success} radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="error"
                      name="Error %"
                      stroke={BRAND_COLORS.error}
                      strokeWidth={2}
                      dot={{ fill: BRAND_COLORS.error }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay datos de precision disponibles</p>
                    <p className="text-xs">Los datos aparecen tras acumular historial</p>
                  </div>
                </div>
              )}
            </TremorCard>

            {/* Tabla detalle */}
            <TremorCard>
              <TremorTitle className="mb-4">Detalle por Semana</TremorTitle>
              {precision?.semanas?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Semana</th>
                        <th className="text-right py-2 px-3">Prediccion</th>
                        <th className="text-right py-2 px-3">Real</th>
                        <th className="text-right py-2 px-3">Diferencia</th>
                        <th className="text-right py-2 px-3">Error %</th>
                        <th className="text-right py-2 px-3">Precision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {precision.semanas.map((semana, idx) => {
                        const diff = semana.real - semana.prediccion
                        const precisionPct = 100 - semana.error_pct
                        return (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3">
                              {new Date(semana.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                            </td>
                            <td className="text-right py-2 px-3">{semana.prediccion}</td>
                            <td className="text-right py-2 px-3 font-medium">{semana.real}</td>
                            <td className="text-right py-2 px-3">
                              <span style={{ color: diff >= 0 ? BRAND_COLORS.success : BRAND_COLORS.error }}>
                                {diff >= 0 ? "+" : ""}
                                {diff}
                              </span>
                            </td>
                            <td className="text-right py-2 px-3">
                              <span
                                style={{ color: semana.error_pct > 20 ? BRAND_COLORS.error : BRAND_COLORS.success }}
                              >
                                {semana.error_pct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right py-2 px-3">
                              <Badge
                                style={{
                                  backgroundColor:
                                    precisionPct >= 80
                                      ? BRAND_COLORS.success
                                      : precisionPct >= 60
                                        ? BRAND_COLORS.warning
                                        : BRAND_COLORS.error,
                                  color: precisionPct >= 60 ? "#223143" : "white",
                                }}
                              >
                                {precisionPct.toFixed(0)}%
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay datos de semanas anteriores</p>
                </div>
              )}
            </TremorCard>
          </div>
        )}

        {activeView === "What-If" && (
          <div className="space-y-4">
            {whatIfLoading || !whatIfData || !whatIfCalculations ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-slate-400">Cargando datos de referencia...</div>
              </div>
            ) : (
              <>
                {/* Reference Data Banner */}
                <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Media Diaria
                        </div>
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                          <span className="text-lg font-bold text-[#364f6b]">
                            {formatWhatIfCurrency(whatIfData.facturacion_media_dia)}
                          </span>
                        </div>
                      </div>

                      <div className="h-12 w-px bg-slate-200" />

                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Ticket Medio
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                          <span className="text-lg font-bold text-[#364f6b]">
                            {formatWhatIfCurrency(whatIfData.ticket_medio_historico)}
                          </span>
                        </div>
                      </div>

                      <div className="h-12 w-px bg-slate-200" />

                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Capacidad</div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                          <span className="text-lg font-bold text-[#364f6b]">{whatIfData.capacidad_dia} pax/día</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 italic">
                      Mejor día histórico: {formatWhatIfCurrency(whatIfData.mejor_dia_facturacion)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Input Section */}
                  <TremorCard>
                    <div className="flex items-center gap-2 mb-6">
                      <Zap className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                      <TremorTitle>Parámetros de Simulación</TremorTitle>
                    </div>

                    {/* Customers Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" style={{ color: BRAND_COLORS.accent }} />
                          <span className="font-medium text-slate-700">Comensales / día</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                          {customers}
                        </span>
                      </div>
                      <Slider
                        value={[customers]}
                        onValueChange={(value) => setCustomers(value[0])}
                        min={10}
                        max={260}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>10</span>
                        <span className="text-slate-500 font-medium">Media: {whatIfData.comensales_media}</span>
                        <span>260</span>
                      </div>
                    </div>

                    {/* Average Ticket Slider */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-5 h-5" style={{ color: BRAND_COLORS.lunch }} />
                          <span className="font-medium text-slate-700">Ticket medio</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: BRAND_COLORS.primary }}>
                          {formatWhatIfCurrency(avgTicket)}
                        </span>
                      </div>
                      <Slider
                        value={[avgTicket]}
                        onValueChange={(value) => setAvgTicket(value[0])}
                        min={15}
                        max={50}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>15€</span>
                        <span className="text-slate-500 font-medium">
                          Media: {formatWhatIfCurrency(whatIfData.ticket_medio_historico)}
                        </span>
                        <span>50€</span>
                      </div>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-700">% Ocupación</span>
                        <span
                          className="text-lg font-bold"
                          style={{ color: getOccupancyColor(whatIfCalculations.occupancy) }}
                        >
                          {whatIfCalculations.occupancy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(whatIfCalculations.occupancy, 100)}%`,
                            backgroundColor: getOccupancyColor(whatIfCalculations.occupancy),
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </TremorCard>

                  {/* Results Section */}
                  <div className="space-y-6">
                    {/* Daily Revenue - Main Result */}
                    <TremorCard>
                      <div className="text-center py-6">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                          Facturación día simulada
                        </p>
                        <p className="text-5xl font-bold text-[#364f6b]">
                          {formatWhatIfCurrency(whatIfCalculations.dailyRevenue)}
                        </p>

                        <div
                          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold uppercase tracking-wide"
                          style={{
                            borderColor: "#227c9d",
                            color: "#227c9d",
                            backgroundColor: "transparent",
                          }}
                        >
                          {whatIfCalculations.difference >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {whatIfCalculations.difference >= 0 ? "+" : ""}
                            {formatWhatIfCurrency(whatIfCalculations.difference)} vs media
                          </span>
                          <span>
                            ({whatIfCalculations.percentDiff >= 0 ? "+" : ""}
                            {whatIfCalculations.percentDiff.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </TremorCard>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Monthly Projection */}
                      <TremorCard>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}>
                            <Calendar className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Proyección mensual
                            </p>
                            <p className="text-xl font-bold text-[#364f6b] mt-1">
                              {formatWhatIfCurrency(whatIfCalculations.monthlyProjection)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {whatIfData.dias_operativos_mes} días operativos
                            </p>
                          </div>
                        </div>
                      </TremorCard>

                      {/* vs Best Day */}
                      <TremorCard>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${BRAND_COLORS.lunch}20` }}>
                            <Target className="w-5 h-5" style={{ color: BRAND_COLORS.lunch }} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">vs Mejor día</p>
                            <p className="text-xl font-bold text-[#364f6b] mt-1">
                              {whatIfCalculations.percentVsBest.toFixed(0)}%
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Récord: {formatWhatIfCurrency(whatIfData.mejor_dia_facturacion)}
                            </p>
                          </div>
                        </div>
                      </TremorCard>
                    </div>

                    {/* Quick Scenarios */}
                    <TremorCard>
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5" style={{ color: BRAND_COLORS.primary }} />
                        <TremorTitle>Escenarios rápidos</TremorTitle>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            setCustomers(Math.round(whatIfData.comensales_media * 0.7))
                            setAvgTicket(Math.round(whatIfData.ticket_medio_historico))
                          }}
                          className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center group"
                        >
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día flojo</p>
                          <p className="text-lg font-bold text-[#364f6b] mt-1 group-hover:text-[#02b1c4]">-30% pax</p>
                        </button>
                        <button
                          onClick={() => {
                            setCustomers(Math.round(whatIfData.comensales_media))
                            setAvgTicket(Math.round(whatIfData.ticket_medio_historico))
                          }}
                          className="p-4 rounded-lg border-2 transition-all text-center"
                          style={{ borderColor: BRAND_COLORS.primary, backgroundColor: `${BRAND_COLORS.primary}10` }}
                        >
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día normal</p>
                          <p className="text-lg font-bold mt-1" style={{ color: BRAND_COLORS.primary }}>
                            Media
                          </p>
                        </button>
                        <button
                          onClick={() => {
                            setCustomers(Math.round(whatIfData.capacidad_dia * 0.85))
                            setAvgTicket(Math.round(whatIfData.ticket_medio_historico * 1.15))
                          }}
                          className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center group"
                        >
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Día top</p>
                          <p className="text-lg font-bold text-[#364f6b] mt-1 group-hover:text-[#02b1c4]">85% + 15%</p>
                        </button>
                      </div>
                    </TremorCard>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
                  {selectedDay.comensales_comida_pred} pax ({selectedDay.ocupacion_pct_comida_pred?.toFixed(0) || 0}%)
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
          </TremorCard>
        )}
      </PageContent>
    </>
  )
}
