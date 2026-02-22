// --- YEARLY COMPARISON TYPES ---

export interface MonthlyReservationData {
  mes: number // 1-12
  mes_nombre: string
  total_reservas: number
  total_comensales: number
  reservas_comida: number
  reservas_cena: number
  comensales_comida: number
  comensales_cena: number
  dias_operativos: number // Dias con datos reales (no calendario)
}

export interface YearlyComparisonData {
  año: number
  meses: MonthlyReservationData[]
  totals: {
    reservas: number
    comensales: number
    comensales_comida: number
    comensales_cena: number
  }
}

export interface YearlyTrendInsight {
  currentYear: number
  previousYear: number
  currentYearTotal: number
  previousYearTotal: number
  percentageChange: number
  trend: "up" | "down" | "neutral"
  bestMonth: { mes: string; valor: number }
  worstMonth: { mes: string; valor: number }
  currentDailyAvg?: number
  previousDailyAvg?: number
  currentYearDays?: number
  dayOfYear?: number
}

export interface PeriodComparisonAggregate {
  total_reservas: number
  total_comensales: number
  reservas_comida: number
  reservas_cena: number
  comensales_comida: number
  comensales_cena: number
  dias_operativos: number
}
