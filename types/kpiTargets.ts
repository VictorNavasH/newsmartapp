/** Objetivos configurables para métricas del restaurante */
export interface KPITargets {
  // Revenue
  dailyRevenueTarget: number        // Objetivo de ingresos diarios (€) — legacy, usado como referencia
  weeklyRevenueTarget: number       // Objetivo de facturación semanal (€)
  monthlyRevenueTarget: number      // Objetivo de ingresos mensuales (€)
  ticketMedioTarget: number         // Objetivo de ticket medio mesa (€) — legacy
  ticketComensalTarget: number      // Objetivo de ticket medio comensal (€)

  // Costs
  foodCostTarget: number            // Objetivo food cost (%)
  laborCostTarget: number           // Objetivo coste laboral (%)
  breakEvenTarget: number           // Costes fijos mensuales (€) — alquiler, personal fijo, suministros base, seguros, préstamos…
  otherVariableCostPct: number      // Otros costes variables sobre ventas (%) aparte del food cost: comisiones TPV/delivery, consumibles…

  // Occupancy
  lunchOccupancyTarget: number      // Objetivo ocupación comida (%)
  dinnerOccupancyTarget: number     // Objetivo ocupación cena (%)

  // Operations
  averageRatingTarget: number       // Objetivo valoración media (1-5)

  // Reservations
  dailyReservationsTarget: number   // Objetivo reservas diarias
}

/** Valores por defecto para un restaurante tipo */
export const DEFAULT_KPI_TARGETS: KPITargets = {
  dailyRevenueTarget: 4000,
  weeklyRevenueTarget: 25000,
  monthlyRevenueTarget: 100000,
  ticketMedioTarget: 45,
  ticketComensalTarget: 27,
  foodCostTarget: 30,
  laborCostTarget: 33,
  breakEvenTarget: 33500,
  otherVariableCostPct: 3,
  lunchOccupancyTarget: 75,
  dinnerOccupancyTarget: 85,
  averageRatingTarget: 4.5,
  dailyReservationsTarget: 40,
}

/** Resultado de comparar un valor real vs objetivo */
export interface KPIProgress {
  current: number
  target: number
  percentage: number          // 0-100+ (avance sobre el objetivo del periodo completo)
  status: 'on-track' | 'at-risk' | 'behind'
  delta: number              // Diferencia absoluta
  deltaPercentage: number    // Diferencia en %
  // ─── Ritmo (pace): solo para métricas acumuladas de un periodo en curso (mes) ───
  pacePercentage?: number    // % del periodo ya transcurrido (0-100). Marca dónde "deberías ir"
  expectedToDate?: number    // Valor que deberías llevar a estas alturas del periodo
}
