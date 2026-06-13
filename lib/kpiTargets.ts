import type { KPITargets, KPIProgress } from "@/types/kpiTargets"
import { DEFAULT_KPI_TARGETS } from "@/types/kpiTargets"
import { supabase } from "@/lib/supabase"

// ID del restaurante NÜA
const RESTAURANT_ID = "df67d9fb-9583-4184-b349-a8ec287ff68a"

// Clave de localStorage para fallback/caché
const STORAGE_KEY = "nua-kpi-targets"

// ─── Mapeo entre formato TypeScript (camelCase) y Supabase (snake_case) ───

interface SupabaseKPIRow {
  id: string
  restaurant_id: string
  daily_revenue_target: number
  weekly_revenue_target?: number
  monthly_revenue_target: number
  ticket_medio_target: number
  ticket_comensal_target?: number
  food_cost_target: number
  labor_cost_target: number
  break_even_target?: number
  other_variable_cost_pct?: number
  lunch_occupancy_target: number
  dinner_occupancy_target: number
  average_rating_target: number
  daily_reservations_target: number
  updated_by: string | null
  updated_at: string
  created_at: string
}

function rowToKPITargets(row: SupabaseKPIRow): KPITargets {
  return {
    dailyRevenueTarget: Number(row.daily_revenue_target),
    weeklyRevenueTarget: Number(row.weekly_revenue_target ?? DEFAULT_KPI_TARGETS.weeklyRevenueTarget),
    monthlyRevenueTarget: Number(row.monthly_revenue_target),
    ticketMedioTarget: Number(row.ticket_medio_target),
    ticketComensalTarget: Number(row.ticket_comensal_target ?? DEFAULT_KPI_TARGETS.ticketComensalTarget),
    foodCostTarget: Number(row.food_cost_target),
    laborCostTarget: Number(row.labor_cost_target),
    breakEvenTarget: Number(row.break_even_target ?? DEFAULT_KPI_TARGETS.breakEvenTarget),
    otherVariableCostPct: Number(row.other_variable_cost_pct ?? DEFAULT_KPI_TARGETS.otherVariableCostPct),
    lunchOccupancyTarget: Number(row.lunch_occupancy_target),
    dinnerOccupancyTarget: Number(row.dinner_occupancy_target),
    averageRatingTarget: Number(row.average_rating_target),
    dailyReservationsTarget: Number(row.daily_reservations_target),
  }
}

function kpiTargetsToRow(targets: KPITargets) {
  return {
    daily_revenue_target: targets.dailyRevenueTarget,
    weekly_revenue_target: targets.weeklyRevenueTarget,
    monthly_revenue_target: targets.monthlyRevenueTarget,
    ticket_medio_target: targets.ticketMedioTarget,
    ticket_comensal_target: targets.ticketComensalTarget,
    food_cost_target: targets.foodCostTarget,
    labor_cost_target: targets.laborCostTarget,
    break_even_target: targets.breakEvenTarget,
    other_variable_cost_pct: targets.otherVariableCostPct,
    lunch_occupancy_target: targets.lunchOccupancyTarget,
    dinner_occupancy_target: targets.dinnerOccupancyTarget,
    average_rating_target: targets.averageRatingTarget,
    daily_reservations_target: targets.dailyReservationsTarget,
    updated_at: new Date().toISOString(),
  }
}

// ─── Funciones principales ─────────────────────────────────────────

/**
 * Carga los objetivos KPI desde Supabase.
 * Fallback a localStorage si la tabla no existe o hay error.
 */
export async function loadKPITargets(): Promise<KPITargets> {
  try {
    const { data, error } = await supabase
      .from("kpi_targets")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .single()

    if (error || !data) {
      // Fallback a localStorage
      return loadKPITargetsLocal()
    }

    const targets = rowToKPITargets(data as SupabaseKPIRow)
    // Sincronizar con localStorage como caché
    saveKPITargetsLocal(targets)
    return targets
  } catch {
    // Si Supabase no responde, usar localStorage
    return loadKPITargetsLocal()
  }
}

/**
 * Guarda los objetivos KPI en Supabase.
 * También guarda en localStorage como caché.
 */
export async function saveKPITargets(targets: KPITargets): Promise<void> {
  // Siempre guardar en localStorage como caché
  saveKPITargetsLocal(targets)

  try {
    // Obtener user_id del usuario actual
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("kpi_targets")
      .upsert({
        restaurant_id: RESTAURANT_ID,
        ...kpiTargetsToRow(targets),
        updated_by: user?.id || null,
      }, {
        onConflict: "restaurant_id",
      })

    if (error) {
      console.warn("[KPI Targets] Error guardando en Supabase, datos guardados en localStorage:", error.message)
    }
  } catch {
    console.warn("[KPI Targets] Supabase no disponible, datos guardados en localStorage")
  }
}

// ─── Funciones de localStorage (fallback/caché) ────────────────────

/**
 * Carga los objetivos KPI desde localStorage (fallback).
 */
export function loadKPITargetsLocal(): KPITargets {
  if (typeof window === "undefined") return DEFAULT_KPI_TARGETS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_KPI_TARGETS

    const parsed = JSON.parse(stored) as Partial<KPITargets>
    return { ...DEFAULT_KPI_TARGETS, ...parsed }
  } catch {
    return DEFAULT_KPI_TARGETS
  }
}

/**
 * Guarda los objetivos KPI en localStorage (caché)
 */
function saveKPITargetsLocal(targets: KPITargets): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
}

// ─── Cálculos de progreso (sin cambios) ────────────────────────────

/**
 * Calcula el progreso de un KPI vs su objetivo
 * @param isLowerBetter - true para métricas donde menor es mejor (food cost, labor cost)
 */
export function calculateProgress(
  current: number,
  target: number,
  isLowerBetter = false,
  paceFraction?: number, // 0-1: fracción del periodo transcurrida. Si se pasa, el estado se mide vs ritmo esperado
): KPIProgress {
  if (target === 0) {
    return { current, target, percentage: 0, status: 'behind', delta: current, deltaPercentage: 0 }
  }

  let percentage: number
  let delta: number
  let deltaPercentage: number

  if (isLowerBetter) {
    // Para food cost: estar por debajo del target es bueno
    percentage = target > 0 ? Math.max(0, ((2 * target - current) / target) * 100) : 0
    delta = target - current  // Positivo = bien (estamos por debajo)
    deltaPercentage = (delta / target) * 100
  } else {
    percentage = (current / target) * 100
    delta = current - target
    deltaPercentage = (delta / target) * 100
  }

  // ─── Estado por RITMO (métricas acumuladas de un periodo en curso) ───
  // En vez de comparar el acumulado vs el total del periodo (que siempre da bajo
  // a principio de mes), se compara vs lo que se debería llevar a estas alturas.
  let status: KPIProgress['status']
  let pacePercentage: number | undefined
  let expectedToDate: number | undefined

  if (paceFraction !== undefined && !isLowerBetter) {
    const pace = Math.min(1, Math.max(0, paceFraction))
    pacePercentage = Math.round(pace * 1000) / 10
    expectedToDate = Math.round(target * pace)
    const ratioVsPace = expectedToDate > 0 ? current / expectedToDate : (current > 0 ? 1 : 0)
    status =
      ratioVsPace >= 1 ? 'on-track' :
      ratioVsPace >= 0.85 ? 'at-risk' :
      'behind'
  } else {
    status =
      percentage >= 90 ? 'on-track' :
      percentage >= 70 ? 'at-risk' :
      'behind'
  }

  return {
    current,
    target,
    percentage: Math.round(percentage * 10) / 10,
    status,
    delta,
    deltaPercentage: Math.round(deltaPercentage * 10) / 10,
    pacePercentage,
    expectedToDate,
  }
}

/** Fracción del mes en curso ya transcurrida (0-1), según el último día con datos. */
export function monthPaceFraction(lastDataDate?: Date | string | null): number {
  const ref = lastDataDate ? new Date(lastDataDate) : new Date()
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  return Math.min(1, ref.getDate() / daysInMonth)
}

/** Resultado del cálculo de punto de equilibrio real. */
export interface BreakEvenResult {
  fixedCosts: number            // Costes fijos mensuales (€)
  variableCostPct: number       // % de costes variables sobre ventas (food cost + otros)
  contributionMarginPct: number // % de margen de contribución (100 - variableCostPct)
  breakEvenRevenue: number      // Facturación mensual necesaria para cubrir costes (€)
}

/**
 * Punto de equilibrio REAL en hostelería:
 *   Punto de equilibrio (€) = Costes fijos / Margen de contribución
 *   Margen de contribución % = 100 − Costes variables %
 *   Costes variables % = food cost (real, ponderado) + otros variables (comisiones, consumibles…)
 *
 * A diferencia de comparar ventas vs costes fijos directamente (que asume margen 100%),
 * esto refleja que cada euro facturado tiene un coste asociado.
 */
export function calculateBreakEven(
  fixedCosts: number,
  foodCostPct: number,
  otherVariableCostPct: number,
): BreakEvenResult {
  const variableCostPct = Math.max(0, foodCostPct + otherVariableCostPct)
  const contributionMarginPct = Math.max(1, 100 - variableCostPct) // mínimo 1% para evitar /0
  const breakEvenRevenue = Math.round(fixedCosts / (contributionMarginPct / 100))
  return {
    fixedCosts,
    variableCostPct: Math.round(variableCostPct * 10) / 10,
    contributionMarginPct: Math.round(contributionMarginPct * 10) / 10,
    breakEvenRevenue,
  }
}
