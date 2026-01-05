"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useComparison } from "@/hooks/useComparison"
import { TremorCard, TremorTitle } from "@/components/ui/TremorCard"
import { MetricGroupCard } from "@/components/ui/MetricGroupCard"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchReservationsFromDB,
  getBusinessDate,
  fetchYearlyComparison,
  fetchPeriodComparison,
} from "@/lib/dataService"
import type {
  DailyCompleteMetrics,
  DateRange,
  YearlyComparisonData,
  YearlyTrendInsight,
  MonthlyReservationData,
} from "@/types"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, LineChart } from "recharts"
import {
  CalendarCheck,
  Users,
  PieChart,
  Grid3x3,
  RotateCw,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
  ArrowRight,
  Trophy,
} from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { CHART_CONFIG, CARD_TOOLTIPS, BRAND_COLORS } from "@/constants"
import { ResponsiveContainer } from "recharts"
import { formatDateLong, formatDateShort } from "@/lib/utils"

type PeriodKey = "hoy" | "ayer" | "semana" | "mes" | "trimestre" | "custom"
type YearlyMetric = "comensales" | "reservas"
type YearlyTurno = "total" | "comida" | "cena"

const YEAR_COLORS: Record<number, string> = {
  2021: "#94a3b8",
  2022: BRAND_COLORS.lunch,
  2023: BRAND_COLORS.error,
  2024: BRAND_COLORS.accent,
  2025: BRAND_COLORS.primary,
  2026: "#edadff",
  2027: "#f59e0b",
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const activeTabStyle = `data-[state=active]:bg-[${BRAND_COLORS.primary}] data-[state=active]:text-white`

const ReservationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PeriodKey>("ayer")
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: yesterday, to: yesterday }
  })

  const [historyData, setHistoryData] = useState<DailyCompleteMetrics[]>([])

  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([])
  const [yearlyMetric, setYearlyMetric] = useState<YearlyMetric>("comensales")
  const [yearlyTurno, setYearlyTurno] = useState<YearlyTurno>("total")
  const [loadingYearly, setLoadingYearly] = useState(true)

  const [compareRange, setCompareRange] = useState<{
    startDay: number
    startMonth: number
    endDay: number
    endMonth: number
  }>(() => {
    const now = new Date()
    return {
      startDay: 1,
      startMonth: now.getMonth(),
      endDay: now.getDate(),
      endMonth: now.getMonth(),
    }
  })
  const [compareYearA, setCompareYearA] = useState<number>(() => new Date().getFullYear())
  const [compareYearB, setCompareYearB] = useState<number>(() => new Date().getFullYear() - 1)
  const [compareMetric, setCompareMetric] = useState<"comensales" | "reservas">("comensales")
  const [compareTurno, setCompareTurno] = useState<"total" | "comida" | "cena">("total")
  const [periodComparisonData, setPeriodComparisonData] = useState<{
    yearA: {
      total_reservas: number
      total_comensales: number
      reservas_comida: number
      reservas_cena: number
      comensales_comida: number
      comensales_cena: number
      dias_operativos: number
    }
    yearB: {
      total_reservas: number
      total_comensales: number
      reservas_comida: number
      reservas_cena: number
      comensales_comida: number
      comensales_cena: number
      dias_operativos: number
    }
  } | null>(null)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [shouldLoadComparison, setShouldLoadComparison] = useState(true)

  const { current, previous, loading, calculateDelta } = useComparison(dateRange)

  useEffect(() => {}, [current, previous, dateRange])

  const setPeriod = (period: PeriodKey) => {
    const businessToday = getBusinessDate()
    businessToday.setHours(12, 0, 0, 0)
    const from = new Date(businessToday)
    const to = new Date(businessToday)

    console.log(
      "[v0] ReservationsPage setPeriod called with:",
      period,
      "today:",
      businessToday.toISOString().split("T")[0],
    )

    switch (period) {
      case "hoy":
        // businessToday ya está configurado
        break
      case "ayer":
        from.setDate(businessToday.getDate() - 1)
        to.setDate(businessToday.getDate() - 1)
        break
      case "semana":
        const day = businessToday.getDay() || 7
        if (day !== 1) from.setDate(businessToday.getDate() - (day - 1))
        to.setDate(businessToday.getDate() - 1)
        break
      case "mes":
        from.setDate(1)
        to.setDate(businessToday.getDate() - 1)
        break
      case "trimestre":
        const currentQuarter = Math.floor(businessToday.getMonth() / 3)
        from.setMonth(currentQuarter * 3, 1)
        to.setDate(businessToday.getDate() - 1)
        break
      default:
        return
    }

    setActiveTab(period)
    setDateRange({ from, to })
  }

  const handleDateChange = (newRange: DateRange) => {
    const normalizedFrom = new Date(newRange.from)
    normalizedFrom.setHours(12, 0, 0, 0)
    const normalizedTo = new Date(newRange.to)
    normalizedTo.setHours(12, 0, 0, 0)

    setActiveTab("custom")
    setDateRange({ from: normalizedFrom, to: normalizedTo })
  }

  useEffect(() => {
    const loadHistory = async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const data = await fetchReservationsFromDB(thirtyDaysAgo, today)
      setHistoryData(data)
    }
    loadHistory()
  }, [])

  useEffect(() => {
    const loadYearlyData = async () => {
      setLoadingYearly(true)
      const data = await fetchYearlyComparison()
      setYearlyData(data)
      setLoadingYearly(false)
    }
    loadYearlyData()
  }, [])

  useEffect(() => {
    if (!shouldLoadComparison) return

    const loadComparison = async () => {
      setLoadingComparison(true)
      try {
        console.log("[v0] loadComparison called with:", {
          startDay: compareRange.startDay,
          startMonth: compareRange.startMonth,
          endDay: compareRange.endDay,
          endMonth: compareRange.endMonth,
          yearA: compareYearA,
          yearB: compareYearB,
        })

        const data = await fetchPeriodComparison(
          compareRange.startDay,
          compareRange.startMonth,
          compareRange.endDay,
          compareRange.endMonth,
          compareYearA,
          compareYearB,
        )

        console.log("[v0] fetchPeriodComparison result:", data)

        setPeriodComparisonData(data)
      } catch (error) {
        console.error("[v0] Error loading period comparison:", error)
      }
      setLoadingComparison(false)
      setShouldLoadComparison(false)
    }
    loadComparison()
  }, [shouldLoadComparison, compareRange, compareYearA, compareYearB])

  const periodComparison = useMemo(() => {
    if (!yearlyData.length) return null

    const getMonthData = (month: number, year: number) => {
      const yearData = yearlyData.find((y) => y.año === year)
      if (!yearData) return null
      const monthData = yearData.meses.find((m) => m.mes === month + 1) // month es 0-indexed
      return monthData || null
    }

    // FIX: comparePeriodA and comparePeriodB were undeclared variables.
    // They are now replaced with the state variables compareRange and compareYearA/B to reflect the intended comparison.
    // The logic to extract month and year from compareRange has been added.
    const startMonthIndex = compareRange.startMonth
    const endMonthIndex = compareRange.endMonth
    const startYear = compareYearA
    const endYear = compareYearB

    // Assuming we are comparing the same month range across years, we need to adapt the getMonthData logic.
    // For simplicity in this fix, we'll assume the comparison is for the *entire* range defined by compareRange,
    // and fetch data for the specific months within that range for the selected years.
    // A more complex implementation might iterate through months or consider full year comparisons.

    // Fetching data for the start month of the range for each year
    const dataA_start = getMonthData(startMonthIndex, startYear)
    const dataB_start = getMonthData(startMonthIndex, endYear)

    // Fetching data for the end month of the range for each year
    const dataA_end = getMonthData(endMonthIndex, startYear)
    const dataB_end = getMonthData(endMonthIndex, endYear)

    // This part of the logic seems to be intended for a single month comparison, not a date range.
    // The original code had `comparePeriodA` and `comparePeriodB` which were not defined.
    // The actual comparison logic is handled by `periodComparisonData` which is fetched via `fetchPeriodComparison`.
    // The `periodComparison` memo is likely for a different comparison scenario (monthly).
    // Given the context, this `periodComparison` memo seems redundant or misaligned with the `periodComparisonData` fetched.
    // However, to fix the undeclared variable error, we need to define `comparePeriodA` and `comparePeriodB`.
    // Since `fetchPeriodComparison` uses `compareRange`, `compareYearA`, `compareYearB`, we will assume this `periodComparison` memo
    // is intended to also use these values to generate a monthly comparison insight if needed, or it's an oversight.

    // For the purpose of fixing the undeclared variable error, we'll define dummy structures if `periodComparisonData` is not used,
    // or attempt to use existing state variables if a monthly comparison is indeed intended here.
    // Given that `periodComparisonData` is fetched and used below, this `periodComparison` memo might be for a specific monthly comparison use case.
    // Let's assume `comparePeriodA` and `comparePeriodB` were meant to be derived from `compareRange` and `compareYearA/B`.

    // This part of the logic seems to be for comparing specific months.
    // The state variables `compareRange` and `compareYearA`/`compareYearB` are used for `fetchPeriodComparison`.
    // The `periodComparison` memo might be intended for a different kind of comparison, perhaps monthly.
    // Let's try to infer what `comparePeriodA` and `comparePeriodB` could have been. They likely held `month` and `year`.
    // Since the state for comparison is `compareRange` (start/end day/month) and `compareYearA/B`,
    // we will use these to derive the comparison logic.

    // If the intention was to compare specific months for which data exists in `yearlyData`:
    // Let's use the first month of `compareRange` and `compareYearA` for `dataA`.
    // And the first month of `compareRange` and `compareYearB` for `dataB`.

    const dummyComparePeriodA = {
      month: compareRange.startMonth,
      year: compareYearA,
    }
    const dummyComparePeriodB = {
      month: compareRange.startMonth,
      year: compareYearB,
    }

    const dataA = getMonthData(dummyComparePeriodA.month, dummyComparePeriodA.year)
    const dataB = getMonthData(dummyComparePeriodB.month, dummyComparePeriodB.year)

    const getValue = (data: MonthlyReservationData | null) => {
      if (!data) return 0
      if (compareMetric === "comensales") {
        if (compareTurno === "comida") return data.comensales_comida
        if (compareTurno === "cena") return data.comensales_cena
        return data.total_comensales
      } else {
        if (compareTurno === "comida") return data.reservas_comida
        if (compareTurno === "cena") return data.reservas_cena
        return data.total_reservas
      }
    }

    const valueA = getValue(dataA)
    const valueB = getValue(dataB)
    const variation = valueB > 0 ? ((valueA - valueB) / valueB) * 100 : 0
    const dailyAvgA = dataA && dataA.dias_operativos > 0 ? valueA / dataA.dias_operativos : 0
    const dailyAvgB = dataB && dataB.dias_operativos > 0 ? valueB / dataB.dias_operativos : 0

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

    return {
      periodA: {
        label: `${monthNames[dummyComparePeriodA.month]} ${dummyComparePeriodA.year}`,
        value: valueA,
        days: dataA?.dias_operativos || 0,
        dailyAvg: dailyAvgA,
      },
      periodB: {
        label: `${monthNames[dummyComparePeriodB.month]} ${dummyComparePeriodB.year}`,
        value: valueB,
        days: dataB?.dias_operativos || 0,
        dailyAvg: dailyAvgB,
      },
      variation,
      dailyVariation: dailyAvgB > 0 ? ((dailyAvgA - dailyAvgB) / dailyAvgB) * 100 : 0,
    }
  }, [yearlyData, compareRange, compareYearA, compareYearB, compareMetric, compareTurno]) // Added dependencies

  const comparisonResult = useMemo(() => {
    if (!periodComparisonData) return null

    const getValue = (data: typeof periodComparisonData.yearA | null) => {
      if (!data) return 0
      if (compareMetric === "comensales") {
        if (compareTurno === "comida") return data.comensales_comida || 0
        if (compareTurno === "cena") return data.comensales_cena || 0
        return data.total_comensales || 0
      } else {
        if (compareTurno === "comida") return data.reservas_comida || 0
        if (compareTurno === "cena") return data.reservas_cena || 0
        return data.total_reservas || 0
      }
    }

    const valueA = getValue(periodComparisonData.yearA)
    const valueB = getValue(periodComparisonData.yearB)
    const daysA = periodComparisonData.yearA?.dias_operativos || 0
    const daysB = periodComparisonData.yearB?.dias_operativos || 0
    const avgA = daysA > 0 ? valueA / daysA : 0
    const avgB = daysB > 0 ? valueB / daysB : 0
    const variation = valueB > 0 ? ((valueA - valueB) / valueB) * 100 : 0
    const avgVariation = avgB > 0 ? ((avgA - avgB) / avgB) * 100 : 0

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const formatRange = (year: number) => {
      if (
        compareRange.startMonth === compareRange.endMonth &&
        compareRange.startDay === 1 &&
        compareRange.endDay >= 28
      ) {
        return `${monthNames[compareRange.startMonth]} ${year}`
      }
      return `${compareRange.startDay} ${monthNames[compareRange.startMonth]} - ${compareRange.endDay} ${monthNames[compareRange.endMonth]} ${year}`
    }

    return {
      labelA: formatRange(compareYearA),
      labelB: formatRange(compareYearB),
      valueA,
      valueB,
      daysA,
      daysB,
      avgA,
      avgB,
      variation,
      avgVariation,
      winner: valueA > valueB ? "A" : valueA < valueB ? "B" : "tie",
    }
  }, [periodComparisonData, compareMetric, compareTurno, compareRange, compareYearA, compareYearB])

  const getMetricDelta = (
    getter: (m: DailyCompleteMetrics) => number,
    curr: DailyCompleteMetrics | null,
    prev: DailyCompleteMetrics | null,
  ) => {
    const c = curr ? getter(curr) : 0
    const p = prev ? getter(prev) : 0
    return calculateDelta(c, p)
  }

  const getPeriodLabel = () => {
    if (activeTab === "hoy" && dateRange.from.toDateString() === getBusinessDate().toDateString()) return "Hoy"
    if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
      return formatDateLong(dateRange.from)
    }
    return `${formatDateShort(dateRange.from)} - ${formatDateShort(dateRange.to)}`
  }

  const capacity = current?.capacity || {
    plazas_turno: 66,
    plazas_dia: 132,
    mesas_turno: 19,
    mesas_dia: 38,
  }

  const insightData = useMemo(() => {
    const getTrend = () => {
      if (!current || !previous) return "neutral"
      const currPax = current.total.pax
      const prevPax = previous.total.pax
      if (prevPax === 0) return "neutral"
      const d = ((currPax - prevPax) / prevPax) * 100
      return d > 0 ? "up" : d < 0 ? "down" : "neutral"
    }

    return {
      reservations: current?.total.reservations,
      occupancy: current?.total.occupancy_rate,
      pax_lunch: current?.lunch.pax,
      pax_dinner: current?.dinner.pax,
      trend: getTrend(),
    }
  }, [current, previous])

  const yearlyChartData = useMemo(() => {
    if (!yearlyData.length) return []

    const CAPACIDAD_TURNO = 66
    const CAPACIDAD_DIA = 132

    const chartData = MONTH_NAMES.map((mesNombre, index) => {
      const mes = index + 1
      const point: Record<string, any> = { mes: mesNombre }

      for (const yearData of yearlyData) {
        const monthData = yearData.meses.find((m) => m.mes === mes)

        let value = 0
        let ocupacionPct = 0
        let diasOp = 0

        if (monthData) {
          diasOp = monthData.dias_operativos || 0

          if (yearlyMetric === "comensales") {
            if (yearlyTurno === "total") {
              value = monthData.total_comensales
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_DIA * diasOp)) * 100 : 0
            } else if (yearlyTurno === "comida") {
              value = monthData.comensales_comida
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_TURNO * diasOp)) * 100 : 0
            } else {
              value = monthData.comensales_cena
              ocupacionPct = diasOp > 0 ? (value / (CAPACIDAD_TURNO * diasOp)) * 100 : 0
            }
          } else {
            if (yearlyTurno === "total") value = monthData.total_reservas
            else if (yearlyTurno === "comida") value = monthData.reservas_comida
            else value = monthData.reservas_cena
          }
        }

        point[`año_${yearData.año}`] = value || null
        point[`ocup_${yearData.año}`] = ocupacionPct > 0 ? ocupacionPct.toFixed(1) : null
        point[`dias_${yearData.año}`] = diasOp > 0 ? diasOp : null
      }

      return point
    })

    return chartData
  }, [yearlyData, yearlyMetric, yearlyTurno])

  const yearlyTrendInsight = useMemo((): YearlyTrendInsight | null => {
    if (yearlyData.length < 2) return null

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentYearData = yearlyData.find((y) => y.año === currentYear)
    const previousYearData = yearlyData.find((y) => y.año === currentYear - 1)

    if (!currentYearData || !previousYearData) return null

    // Calcular el día del año actual (para comparación justa)
    const startOfYear = new Date(currentYear, 0, 1)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))

    const getValue = (data: YearlyComparisonData) => {
      if (yearlyMetric === "comensales") {
        if (yearlyTurno === "total") return data.totals.comensales
        if (yearlyTurno === "comida") return data.totals.comensales_comida
        return data.totals.comensales_cena
      } else {
        return data.totals.reservas
      }
    }

    // Calcular días operativos del año actual
    const currentYearDays = currentYearData.meses.reduce((acc, m) => acc + m.dias_operativos, 0)

    // Calcular total del año anterior solo para el mismo periodo (mismo número de días)
    // Recorrer los meses del año anterior y sumar hasta alcanzar el mismo número de días
    let previousYearSamePeriodTotal = 0
    let previousYearSamePeriodDays = 0
    let daysCount = 0

    for (const mes of previousYearData.meses) {
      if (daysCount >= dayOfYear) break

      const daysToAdd = Math.min(mes.dias_operativos, dayOfYear - daysCount)
      const ratio = mes.dias_operativos > 0 ? daysToAdd / mes.dias_operativos : 0

      if (yearlyMetric === "comensales") {
        if (yearlyTurno === "total") {
          previousYearSamePeriodTotal += mes.total_comensales * ratio
        } else if (yearlyTurno === "comida") {
          previousYearSamePeriodTotal += mes.comensales_comida * ratio
        } else {
          previousYearSamePeriodTotal += mes.comensales_cena * ratio
        }
      } else {
        previousYearSamePeriodTotal += mes.total_reservas * ratio
      }

      daysCount += daysToAdd
      previousYearSamePeriodDays += daysToAdd
    }

    const currentTotal = getValue(currentYearData)
    const percentageChange =
      previousYearSamePeriodTotal > 0
        ? ((currentTotal - previousYearSamePeriodTotal) / previousYearSamePeriodTotal) * 100
        : 0

    // Mejor y Peor mes del AÑO ANTERIOR (tiene datos completos)
    const previousYearMeses = previousYearData.meses.filter((m) => {
      if (yearlyMetric === "comensales") {
        return yearlyTurno === "total"
          ? m.total_comensales > 0
          : yearlyTurno === "comida"
            ? m.comensales_comida > 0
            : m.comensales_cena > 0
      }
      return m.total_reservas > 0
    })

    const getMonthValue = (m: (typeof previousYearMeses)[0]) => {
      if (yearlyMetric === "comensales") {
        if (yearlyTurno === "total") return m.total_comensales
        if (yearlyTurno === "comida") return m.comensales_comida
        return m.comensales_cena
      }
      return m.total_reservas
    }

    const sortedMeses = [...previousYearMeses].sort((a, b) => getMonthValue(b) - getMonthValue(a))
    const bestMonth = sortedMeses[0]
    const worstMonth = sortedMeses[sortedMeses.length - 1]

    // Media diaria
    const currentDailyAvg = currentYearDays > 0 ? currentTotal / currentYearDays : 0
    const previousYearTotalDays = previousYearData.meses.reduce((acc, m) => acc + m.dias_operativos, 0)
    const previousDailyAvg = previousYearTotalDays > 0 ? getValue(previousYearData) / previousYearTotalDays : 0

    return {
      currentYear,
      previousYear: currentYear - 1,
      currentYearTotal: currentTotal,
      previousYearTotal: Math.round(previousYearSamePeriodTotal),
      percentageChange,
      trend: percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral",
      bestMonth: bestMonth ? { mes: bestMonth.mes_nombre, valor: getMonthValue(bestMonth) } : { mes: "-", valor: 0 },
      worstMonth: worstMonth
        ? { mes: worstMonth.mes_nombre, valor: getMonthValue(worstMonth) }
        : { mes: "-", valor: 0 },
      // Nuevos campos para media diaria
      currentDailyAvg: Math.round(currentDailyAvg),
      previousDailyAvg: Math.round(previousDailyAvg),
      currentYearDays,
      dayOfYear,
    }
  }, [yearlyData, yearlyMetric, yearlyTurno])

  const availableYearsForCompare = useMemo(() => {
    if (yearlyData.length === 0) {
      // Fallback: años desde 2021 hasta el actual
      const currentYear = new Date().getFullYear()
      return Array.from({ length: currentYear - 2020 }, (_, i) => currentYear - i)
    }
    return yearlyData.map((y) => y.año).sort((a, b) => b - a)
  }, [yearlyData])

  const availableYears = useMemo(() => yearlyData.map((y) => y.año), [yearlyData])

  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={CalendarCheck}
        title="Reservas & Ocupación"
        subtitle={`Visión unificada de demanda y eficiencia: ${getPeriodLabel()}`}
        actions={
          <>
            <Tabs value={activeTab} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <TabsList className="bg-white border border-slate-200 shadow-sm">
                <TabsTrigger value="ayer" className={activeTabStyle}>
                  Ayer
                </TabsTrigger>
                <TabsTrigger value="semana" className={activeTabStyle}>
                  Semana
                </TabsTrigger>
                <TabsTrigger value="mes" className={activeTabStyle}>
                  Mes
                </TabsTrigger>
                <TabsTrigger value="trimestre" className={activeTabStyle}>
                  Trimestre
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={handleDateChange} />
          </>
        }
      />

      <PageContent>
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Por Turno</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.plazas_turno} plazas</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" style={{ color: BRAND_COLORS.primary }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.mesas_turno} mesas</span>
                  </div>
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200" />

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Por Día</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.plazas_dia} plazas</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4" style={{ color: BRAND_COLORS.accent }} />
                    <span className="text-lg font-bold text-[#364f6b]">{capacity.mesas_dia} mesas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 italic">100% ocupación = {capacity.plazas_dia} comensales/día</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricGroupCard
            title="Reservas Totales"
            icon={<CalendarCheck className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.reservations, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.reservations, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.reservations, current, previous)}
            secondaryMetric={{
              label: "Pax/Res",
              value: current?.total.avg_pax_per_res.toFixed(1) || "0",
            }}
            tooltip={CARD_TOOLTIPS.reservations}
          />

          <MetricGroupCard
            title="Total Comensales"
            icon={<Users className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.pax, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.pax, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.pax, current, previous)}
            tooltip={CARD_TOOLTIPS.pax}
          />

          <MetricGroupCard
            title="Ocupación"
            icon={<PieChart className="w-5 h-5" />}
            loading={loading}
            suffix="%"
            decimals={1}
            total={getMetricDelta((d) => d.total.occupancy_rate, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.occupancy_rate, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.occupancy_rate, current, previous)}
            tooltip={CARD_TOOLTIPS.occupancy}
          />

          <MetricGroupCard
            title="Mesas Utilizadas"
            icon={<Grid3x3 className="w-5 h-5" />}
            loading={loading}
            total={getMetricDelta((d) => d.total.tables_used, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.tables_used, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.tables_used, current, previous)}
            secondaryMetric={{
              label: `de ${capacity.mesas_dia}`,
              value: "",
            }}
            tooltip={CARD_TOOLTIPS.tables}
          />

          <MetricGroupCard
            title="Rotación de Mesas"
            icon={<RotateCw className="w-5 h-5" />}
            loading={loading}
            suffix="x"
            decimals={1}
            total={getMetricDelta((d) => d.total.table_rotation, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.table_rotation, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.table_rotation, current, previous)}
            tooltip={CARD_TOOLTIPS.rotation}
          />

          <MetricGroupCard
            title="Media Pax por Mesa"
            icon={<UserCheck className="w-5 h-5" />}
            loading={loading}
            decimals={1}
            total={getMetricDelta((d) => d.total.avg_pax_per_table_used, current, previous)}
            lunch={getMetricDelta((d) => d.lunch.avg_pax_per_table_used, current, previous)}
            dinner={getMetricDelta((d) => d.dinner.avg_pax_per_table_used, current, previous)}
            tooltip={CARD_TOOLTIPS.paxPerTable}
          />
        </div>

        <TremorCard>
          <div className="flex items-center justify-between">
            <TremorTitle>Evolución de Reservas y Ocupación (Últimos 30 días)</TremorTitle>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
                <span>Reservas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.accent }} />
                <span>Comensales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.lunch }} />
                <span>Ocupación</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={historyData}>
                  <CartesianGrid {...CHART_CONFIG.grid} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    {...CHART_CONFIG.axis}
                  />
                  <YAxis yAxisId="left" {...CHART_CONFIG.axis} />
                  <YAxis yAxisId="right" orientation="right" {...CHART_CONFIG.axis} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const currentYear = new Date().getFullYear()
                      const currentMonth = new Date().getMonth() // 0-indexed
                      const monthIndex = [
                        "ene",
                        "feb",
                        "mar",
                        "abr",
                        "may",
                        "jun",
                        "jul",
                        "ago",
                        "sep",
                        "oct",
                        "nov",
                        "dic",
                      ].indexOf(label?.toLowerCase())
                      const isCurrentOrFutureMonth = monthIndex >= currentMonth

                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]">
                          <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                            {label}
                          </p>
                          {payload
                            .filter((entry: any) => entry.value !== null)
                            .map((entry: any, index: number) => {
                              const year = entry.dataKey.replace("año_", "")
                              const ocupacion = entry.payload[`ocup_${year}`]
                              const diasOp = entry.payload[`dias_${year}`]
                              const isCurrentYear = Number.parseInt(year) === currentYear

                              return (
                                <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-slate-500 font-medium w-12">{entry.name}</span>
                                  <span className="font-bold text-slate-700">
                                    {entry.value?.toLocaleString("es-ES")} {yearlyMetric}
                                  </span>
                                  {diasOp && (
                                    <span className="text-slate-400 text-[10px]">
                                      ({diasOp} días{ocupacion ? ` · ${ocupacion}%` : ""})
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          {(() => {
                            const currentYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                            const prevYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                            if (currentYearEntry?.value && prevYearEntry?.value && !isCurrentOrFutureMonth) {
                              const diff = (
                                ((currentYearEntry.value - prevYearEntry.value) / prevYearEntry.value) *
                                100
                              ).toFixed(1)
                              const isPositive = Number.parseFloat(diff) >= 0
                              return (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">vs {currentYear - 1}:</span>
                                    <span className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                                      {isPositive ? "+" : ""}
                                      {diff}%
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            // Si estamos en el mes actual o futuro, mostrar aviso
                            if (isCurrentOrFutureMonth && monthIndex === currentMonth) {
                              const currentYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                                ?.payload?.[`dias_${currentYear}`]
                              const prevYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                                ?.payload?.[`dias_${currentYear - 1}`]
                              if (currentYearDias && prevYearDias && currentYearDias < prevYearDias) {
                                return (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] text-amber-600">
                                      Mes en curso: {currentYearDias} días vs {prevYearDias} días
                                    </p>
                                  </div>
                                )
                              }
                            }
                            return null
                          })()}
                        </div>
                      )
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="total.reservations"
                    name="Reservas"
                    fill={BRAND_COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="total.pax"
                    name="Comensales"
                    fill={BRAND_COLORS.accent}
                    radius={[8, 8, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="total.occupancy_rate"
                    name="Ocupación"
                    stroke={BRAND_COLORS.lunch}
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-slate-400">Cargando datos...</div>
            )}
          </div>
        </TremorCard>

        <TremorCard>
          <div className="flex items-center justify-between mb-6">
            <TremorTitle>Comparativa Anual</TremorTitle>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Métrica:</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setYearlyMetric("comensales")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      yearlyMetric === "comensales" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: yearlyMetric === "comensales" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Comensales
                  </button>
                  <button
                    onClick={() => setYearlyMetric("reservas")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      yearlyMetric === "reservas" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: yearlyMetric === "reservas" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Reservas
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Turno:</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setYearlyTurno("total")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      yearlyTurno === "total" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: yearlyTurno === "total" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Total
                  </button>
                  <button
                    onClick={() => setYearlyTurno("comida")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      yearlyTurno === "comida" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: yearlyTurno === "comida" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Comida
                  </button>
                  <button
                    onClick={() => setYearlyTurno("cena")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      yearlyTurno === "cena" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: yearlyTurno === "cena" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Cena
                  </button>
                </div>
              </div>
            </div>
          </div>

          {yearlyTrendInsight && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {yearlyTrendInsight.trend === "up" ? (
                  <TrendingUp className="w-5 h-5" style={{ color: BRAND_COLORS.success }} />
                ) : yearlyTrendInsight.trend === "down" ? (
                  <TrendingDown className="w-5 h-5" style={{ color: BRAND_COLORS.error }} />
                ) : (
                  <Minus className="w-5 h-5 text-slate-400" />
                )}
                <span className="font-semibold text-slate-700">
                  Tendencia {yearlyTrendInsight.currentYear} vs {yearlyTrendInsight.previousYear}
                </span>
                <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                  mismo periodo: {yearlyTrendInsight.dayOfYear} días
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Variación mismo periodo */}
                <div>
                  <div className="text-xs text-slate-500 mb-1">Variación Mismo Periodo</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        yearlyTrendInsight.percentageChange > 0
                          ? BRAND_COLORS.success
                          : yearlyTrendInsight.percentageChange < 0
                            ? BRAND_COLORS.error
                            : "#64748b",
                    }}
                  >
                    {yearlyTrendInsight.percentageChange > 0 ? "+" : ""}
                    {yearlyTrendInsight.percentageChange.toFixed(1)}% vs {yearlyTrendInsight.previousYear}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {yearlyTrendInsight.currentYear}: {yearlyTrendInsight.currentYearTotal.toLocaleString("es-ES")} |{" "}
                    {yearlyTrendInsight.previousYear}: {yearlyTrendInsight.previousYearTotal.toLocaleString("es-ES")}
                  </div>
                </div>

                {/* Mejor mes del año anterior (datos completos) */}
                <div>
                  <div className="text-xs text-slate-500 mb-1">Mejor Mes ({yearlyTrendInsight.previousYear})</div>
                  <div className="text-lg font-bold" style={{ color: BRAND_COLORS.success }}>
                    {yearlyTrendInsight.bestMonth.mes}
                  </div>
                  <div className="text-xs text-slate-400">
                    {yearlyTrendInsight.bestMonth.valor.toLocaleString("es-ES")} {yearlyMetric}
                  </div>
                </div>

                {/* Media diaria comparativa */}
                <div>
                  <div className="text-xs text-slate-500 mb-1">Media Diaria {yearlyTrendInsight.currentYear}</div>
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        yearlyTrendInsight.currentDailyAvg >= yearlyTrendInsight.previousDailyAvg
                          ? BRAND_COLORS.success
                          : BRAND_COLORS.error,
                    }}
                  >
                    {yearlyTrendInsight.currentDailyAvg.toLocaleString("es-ES")} {yearlyMetric}/día
                  </div>
                  <div className="text-xs text-slate-400">
                    vs {yearlyTrendInsight.previousDailyAvg.toLocaleString("es-ES")}/día en{" "}
                    {yearlyTrendInsight.previousYear}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingYearly ? (
            <div className="flex items-center justify-center h-64">
              <p>Cargando datos históricos anuales...</p>
            </div>
          ) : yearlyChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={yearlyChartData}>
                  <CartesianGrid {...CHART_CONFIG.grid} />
                  <XAxis dataKey="mes" {...CHART_CONFIG.axis} />
                  <YAxis {...CHART_CONFIG.axis} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const currentYear = new Date().getFullYear()
                      const currentMonth = new Date().getMonth() // 0-indexed
                      const monthIndex = [
                        "ene",
                        "feb",
                        "mar",
                        "abr",
                        "may",
                        "jun",
                        "jul",
                        "ago",
                        "sep",
                        "oct",
                        "nov",
                        "dic",
                      ].indexOf(label?.toLowerCase())
                      const isCurrentOrFutureMonth = monthIndex >= currentMonth

                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl min-w-[200px]">
                          <p className="text-sm font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
                            {label}
                          </p>
                          {payload
                            .filter((entry: any) => entry.value !== null)
                            .map((entry: any, index: number) => {
                              const year = entry.dataKey.replace("año_", "")
                              const ocupacion = entry.payload[`ocup_${year}`]
                              const diasOp = entry.payload[`dias_${year}`]
                              const isCurrentYear = Number.parseInt(year) === currentYear

                              return (
                                <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-slate-500 font-medium w-12">{entry.name}</span>
                                  <span className="font-bold text-slate-700">
                                    {entry.value?.toLocaleString("es-ES")} {yearlyMetric}
                                  </span>
                                  {diasOp && (
                                    <span className="text-slate-400 text-[10px]">
                                      ({diasOp} días{ocupacion ? ` · ${ocupacion}%` : ""})
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          {(() => {
                            const currentYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                            const prevYearEntry = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                            if (currentYearEntry?.value && prevYearEntry?.value && !isCurrentOrFutureMonth) {
                              const diff = (
                                ((currentYearEntry.value - prevYearEntry.value) / prevYearEntry.value) *
                                100
                              ).toFixed(1)
                              const isPositive = Number.parseFloat(diff) >= 0
                              return (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">vs {currentYear - 1}:</span>
                                    <span className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                                      {isPositive ? "+" : ""}
                                      {diff}%
                                    </span>
                                  </div>
                                </div>
                              )
                            }
                            // Si estamos en el mes actual o futuro, mostrar aviso
                            if (isCurrentOrFutureMonth && monthIndex === currentMonth) {
                              const currentYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear}`)
                                ?.payload?.[`dias_${currentYear}`]
                              const prevYearDias = payload.find((e: any) => e.dataKey === `año_${currentYear - 1}`)
                                ?.payload?.[`dias_${currentYear - 1}`]
                              if (currentYearDias && prevYearDias && currentYearDias < prevYearDias) {
                                return (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] text-amber-600">
                                      Mes en curso: {currentYearDias} días vs {prevYearDias} días
                                    </p>
                                  </div>
                                )
                              }
                            }
                            return null
                          })()}
                        </div>
                      )
                    }}
                  />
                  {availableYears.map((year) => (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={`año_${year}`}
                      name={year.toString()}
                      stroke={YEAR_COLORS[year] || "#64748b"}
                      strokeWidth={year === new Date().getFullYear() ? 3 : 2}
                      dot={{ fill: YEAR_COLORS[year] || "#64748b", r: year === new Date().getFullYear() ? 5 : 3 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-4">
                {availableYears.map((year) => (
                  <div key={year} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: YEAR_COLORS[year] || "#64748b" }} />
                    <span
                      className={`text-sm ${year === new Date().getFullYear() ? "font-bold text-slate-700" : "text-slate-500"}`}
                    >
                      {year}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-slate-400">
              <p>No hay datos históricos disponibles</p>
            </div>
          )}
        </TremorCard>

        <TremorCard className="mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <TremorTitle>Comparador de Periodos</TremorTitle>
              <p className="text-sm text-slate-500 mt-1">Compara el mismo rango de fechas entre diferentes años</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Métrica:</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setCompareMetric("comensales")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      compareMetric === "comensales" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: compareMetric === "comensales" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Comensales
                  </button>
                  <button
                    onClick={() => setCompareMetric("reservas")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      compareMetric === "reservas" ? "text-white" : "text-slate-600 hover:text-slate-800"
                    }`}
                    style={{ backgroundColor: compareMetric === "reservas" ? BRAND_COLORS.primary : "transparent" }}
                  >
                    Reservas
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Turno:</span>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {["total", "comida", "cena"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setCompareTurno(t as "total" | "comida" | "cena")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        compareTurno === t ? "text-white" : "text-slate-600 hover:text-slate-800"
                      }`}
                      style={{ backgroundColor: compareTurno === t ? BRAND_COLORS.primary : "transparent" }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selectores de rango y años */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {/* Selector de rango */}
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Desde:</span>
                <select
                  value={compareRange.startDay}
                  onChange={(e) => setCompareRange((prev) => ({ ...prev, startDay: Number(e.target.value) }))}
                  className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={compareRange.startMonth}
                  onChange={(e) => setCompareRange((prev) => ({ ...prev, startMonth: Number(e.target.value) }))}
                  className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
                >
                  {[
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
                  ].map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />

              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-200">
                <span className="text-sm text-slate-600">Hasta:</span>
                <select
                  value={compareRange.endDay}
                  onChange={(e) => setCompareRange((prev) => ({ ...prev, endDay: Number(e.target.value) }))}
                  className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  value={compareRange.endMonth}
                  onChange={(e) => setCompareRange((prev) => ({ ...prev, endMonth: Number(e.target.value) }))}
                  className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0"
                >
                  {[
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
                  ].map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShouldLoadComparison(true)}
                disabled={loadingComparison}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                {loadingComparison ? "Cargando..." : "Comparar"}
              </button>
            </div>

            {/* Selectores de año */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
                <span className="text-sm font-medium text-slate-600">Año A:</span>
                <select
                  value={compareYearA}
                  onChange={(e) => setCompareYearA(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02b1c4]/20"
                  style={{ color: BRAND_COLORS.primary }}
                >
                  {availableYearsForCompare.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-lg font-bold text-slate-300">VS</span>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm font-medium text-slate-600">Año B:</span>
                <select
                  value={compareYearB}
                  onChange={(e) => setCompareYearB(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600"
                >
                  {availableYearsForCompare.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resultados visuales */}
          {loadingComparison ? (
            <div className="h-32 flex items-center justify-center">
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2"
                style={{ borderColor: BRAND_COLORS.primary }}
              />
            </div>
          ) : comparisonResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta Año A */}
              <div
                className="relative rounded-xl p-4 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_COLORS.primary}15 0%, ${BRAND_COLORS.primary}05 100%)`,
                  border: `1px solid ${BRAND_COLORS.primary}30`,
                }}
              >
                {comparisonResult.winner === "A" && (
                  <div className="absolute top-2 right-2">
                    <Trophy className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
                  </div>
                )}
                <div className="text-xs font-medium text-slate-500 mb-1">{comparisonResult.labelA}</div>
                <div className="text-2xl font-bold mb-2" style={{ color: BRAND_COLORS.primary }}>
                  {comparisonResult.valueA.toLocaleString("es-ES")}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Días</span>
                    <span className="font-medium text-slate-700">{comparisonResult.daysA}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Media/día</span>
                    <span className="font-medium" style={{ color: BRAND_COLORS.primary }}>
                      {comparisonResult.avgA.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variación central */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-xs text-slate-500 mb-1">Variación</div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{
                    color:
                      comparisonResult.variation > 0
                        ? BRAND_COLORS.success
                        : comparisonResult.variation < 0
                          ? BRAND_COLORS.error
                          : "#64748b",
                  }}
                >
                  {comparisonResult.variation > 0 ? "+" : ""}
                  {comparisonResult.variation.toFixed(1)}%
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.abs(comparisonResult.variation))}%`,
                      backgroundColor: comparisonResult.variation > 0 ? BRAND_COLORS.success : BRAND_COLORS.error,
                      marginLeft: comparisonResult.variation < 0 ? "auto" : 0,
                    }}
                  />
                </div>

                <div className="text-center">
                  <div className="text-[10px] text-slate-400">Media diaria</div>
                  <div
                    className="text-sm font-semibold"
                    style={{
                      color:
                        comparisonResult.avgVariation > 0
                          ? BRAND_COLORS.success
                          : comparisonResult.avgVariation < 0
                            ? BRAND_COLORS.error
                            : "#64748b",
                    }}
                  >
                    {comparisonResult.avgVariation > 0 ? "+" : ""}
                    {comparisonResult.avgVariation.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Tarjeta Año B */}
              <div
                className="relative rounded-xl p-4 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50"
                style={{ border: "1px solid #e2e8f0" }}
              >
                {comparisonResult.winner === "B" && (
                  <div className="absolute top-2 right-2">
                    <Trophy className="w-4 h-4" style={{ color: BRAND_COLORS.warning }} />
                  </div>
                )}
                <div className="text-xs font-medium text-slate-500 mb-1">{comparisonResult.labelB}</div>
                <div className="text-2xl font-bold text-slate-700 mb-2">
                  {comparisonResult.valueB.toLocaleString("es-ES")}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Días</span>
                    <span className="font-medium text-slate-700">{comparisonResult.daysB}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Media/día</span>
                    <span className="font-medium text-slate-600">{comparisonResult.avgB.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <p>Selecciona los periodos a comparar</p>
            </div>
          )}

          {/* Nota informativa */}
          {comparisonResult && comparisonResult.daysA !== comparisonResult.daysB && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Los periodos tienen diferente número de días operativos ({comparisonResult.daysA} vs{" "}
                {comparisonResult.daysB}). La <strong>media diaria</strong> ofrece una comparación más precisa.
              </p>
            </div>
          )}
        </TremorCard>
      </PageContent>
    </div>
  )
}

export default ReservationsPage
