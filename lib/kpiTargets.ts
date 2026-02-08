import type { KPITargets, KPIProgress } from "@/types/kpiTargets"
import { DEFAULT_KPI_TARGETS } from "@/types/kpiTargets"

const STORAGE_KEY = "nua-kpi-targets"

/**
 * Carga los objetivos KPI desde localStorage.
 * Si no hay guardados, devuelve los valores por defecto.
 */
export function loadKPITargets(): KPITargets {
  if (typeof window === "undefined") return DEFAULT_KPI_TARGETS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_KPI_TARGETS

    const parsed = JSON.parse(stored) as Partial<KPITargets>
    // Merge con defaults para garantizar que todas las keys existen
    return { ...DEFAULT_KPI_TARGETS, ...parsed }
  } catch {
    return DEFAULT_KPI_TARGETS
  }
}

/**
 * Guarda los objetivos KPI en localStorage
 */
export function saveKPITargets(targets: KPITargets): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets))
}

/**
 * Calcula el progreso de un KPI vs su objetivo
 * @param isLowerBetter - true para métricas donde menor es mejor (food cost, labor cost)
 */
export function calculateProgress(
  current: number,
  target: number,
  isLowerBetter = false
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

  const status: KPIProgress['status'] =
    percentage >= 90 ? 'on-track' :
    percentage >= 70 ? 'at-risk' :
    'behind'

  return {
    current,
    target,
    percentage: Math.round(percentage * 10) / 10,
    status,
    delta,
    deltaPercentage: Math.round(deltaPercentage * 10) / 10,
  }
}
