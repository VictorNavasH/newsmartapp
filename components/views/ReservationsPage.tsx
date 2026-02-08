"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useComparison } from "@/hooks/useComparison"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangePicker } from "@/components/ui/date-range-picker"
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
  PeriodComparisonAggregate,
} from "@/types"
import { CalendarCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageContent } from "@/components/layout/PageContent"
import { BRAND_COLORS } from "@/constants"
import { formatDateLong, formatDateShort } from "@/lib/utils"

import { ReservationsKPISection } from "./reservations/ReservationsKPISection"
import { ReservationsYearlyChart } from "./reservations/ReservationsYearlyChart"
import { ReservationsComparatorSection } from "./reservations/ReservationsComparatorSection"
import { type PeriodKey, type YearlyMetric, type YearlyTurno, MONTH_NAMES, activeTabStyle } from "./reservations/constants"

const ReservationsPage: React.FC = () => {
  // --- Estado ---
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
    yearA: PeriodComparisonAggregate
    yearB: PeriodComparisonAggregate
  } | null>(null)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [shouldLoadComparison, setShouldLoadComparison] = useState(true)

  const { current, previous, loading, calculateDelta } = useComparison(dateRange)

  useEffect(() => {}, [current, previous, dateRange])

  // --- Funciones auxiliares ---
  const setPeriod = (period: PeriodKey) => {
    const businessToday = getBusinessDate()
    businessToday.setHours(12, 0, 0, 0)
    const from = new Date(businessToday)
    const to = new Date(businessToday)

    switch (period) {
      case "hoy":
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

  // --- Effects ---
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
        const data = await fetchPeriodComparison(
          compareRange.startDay,
          compareRange.startMonth,
          compareRange.endDay,
          compareRange.endMonth,
          compareYearA,
          compareYearB,
        )

        setPeriodComparisonData(data)
      } catch (error) {
        console.error("[v0] Error loading period comparison:", error)
      }
      setLoadingComparison(false)
      setShouldLoadComparison(false)
    }
    loadComparison()
  }, [shouldLoadComparison, compareRange, compareYearA, compareYearB])

  // --- Memos ---
  const periodComparison = useMemo(() => {
    if (!yearlyData.length) return null

    const getMonthData = (month: number, year: number) => {
      const yearData = yearlyData.find((y) => y.año === year)
      if (!yearData) return null
      const monthData = yearData.meses.find((m) => m.mes === month + 1)
      return monthData || null
    }

    const startMonthIndex = compareRange.startMonth
    const endMonthIndex = compareRange.endMonth
    const startYear = compareYearA
    const endYear = compareYearB

    const dataA_start = getMonthData(startMonthIndex, startYear)
    const dataB_start = getMonthData(startMonthIndex, endYear)
    const dataA_end = getMonthData(endMonthIndex, startYear)
    const dataB_end = getMonthData(endMonthIndex, endYear)

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
  }, [yearlyData, compareRange, compareYearA, compareYearB, compareMetric, compareTurno])

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

    const currentYearDays = currentYearData.meses.reduce((acc, m) => acc + m.dias_operativos, 0)

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
      currentDailyAvg: Math.round(currentDailyAvg),
      previousDailyAvg: Math.round(previousDailyAvg),
      currentYearDays,
      dayOfYear,
    }
  }, [yearlyData, yearlyMetric, yearlyTurno])

  const availableYearsForCompare = useMemo(() => {
    if (yearlyData.length === 0) {
      const currentYear = new Date().getFullYear()
      return Array.from({ length: currentYear - 2020 }, (_, i) => currentYear - i)
    }
    return yearlyData.map((y) => y.año).sort((a, b) => b - a)
  }, [yearlyData])

  const availableYears = useMemo(() => yearlyData.map((y) => y.año), [yearlyData])

  // --- Render ---
  return (
    <div className="relative min-h-screen bg-slate-50 pb-20">
      <PageHeader
        icon={CalendarCheck}
        title="Reservas & Ocupacion"
        subtitle={`Vision unificada de demanda y eficiencia: ${getPeriodLabel()}`}
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
        <ReservationsKPISection
          loading={loading}
          capacity={capacity}
          historyData={historyData}
          getMetricDelta={getMetricDelta}
          current={current}
          previous={previous}
        />

        <ReservationsYearlyChart
          yearlyMetric={yearlyMetric}
          setYearlyMetric={setYearlyMetric}
          yearlyTurno={yearlyTurno}
          setYearlyTurno={setYearlyTurno}
          yearlyChartData={yearlyChartData}
          yearlyTrendInsight={yearlyTrendInsight}
          loadingYearly={loadingYearly}
          availableYears={availableYears}
        />

        <ReservationsComparatorSection
          compareMetric={compareMetric}
          setCompareMetric={setCompareMetric}
          compareTurno={compareTurno}
          setCompareTurno={setCompareTurno}
          compareRange={compareRange}
          setCompareRange={setCompareRange}
          compareYearA={compareYearA}
          setCompareYearA={setCompareYearA}
          compareYearB={compareYearB}
          setCompareYearB={setCompareYearB}
          availableYearsForCompare={availableYearsForCompare}
          comparisonResult={comparisonResult}
          loadingComparison={loadingComparison}
          setShouldLoadComparison={setShouldLoadComparison}
        />
      </PageContent>
    </div>
  )
}

export default ReservationsPage
