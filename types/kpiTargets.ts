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
  breakEvenTarget: number           // Costes fijos mensuales para break-even (€)

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
  lunchOccupancyTarget: 75,
  dinnerOccupancyTarget: 85,
  averageRatingTarget: 4.5,
  dailyReservationsTarget: 40,
}

/** Resultado de comparar un valor real vs objetivo */
export interface KPIProgress {
  current: number
  target: number
  percentage: number          // 0-100+
  status: 'on-track' | 'at-risk' | 'behind'  // >90% = on-track, 70-90% = at-risk, <70% = behind
  delta: number              // Diferencia absoluta
  deltaPercentage: number    // Diferencia en %
}
