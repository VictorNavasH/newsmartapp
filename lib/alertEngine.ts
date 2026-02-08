import { toast } from "sonner"

// ─── Tipos ──────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical"
export type AlertCategory = "financial" | "operations" | "inventory" | "reservations" | "system"

export interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  severity: AlertSeverity
  /** Función que evalúa si la alerta debe dispararse */
  condition: (data: AlertContext) => boolean
  /** Mensaje a mostrar cuando se dispara */
  message: (data: AlertContext) => string
  /** Cooldown en minutos (evitar spam de la misma alerta) */
  cooldownMinutes: number
}

export interface AlertContext {
  // Datos financieros
  ticketMedio?: number
  ticketMedioTarget?: number
  occupancyRate?: number
  foodCostPercentage?: number
  foodCostTarget?: number
  laborCostPercentage?: number
  laborCostTarget?: number
  // Reservas
  reservationsToday?: number
  cancellationsToday?: number
  // Operaciones
  pendingInvoices?: number
  overdueInvoices?: number
  // Inventario
  lowStockItems?: number
  // Revenue
  dailyRevenue?: number
  dailyRevenueTarget?: number
  monthlyRevenue?: number
  monthlyRevenueTarget?: number
  // Conciliación
  invoicesNeedingReview?: number
  invoicesAutoReconciled?: number
}

// ─── Reglas predefinidas ────────────────────────────────────────

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "low-occupancy",
    name: "Baja ocupación",
    category: "reservations",
    severity: "warning",
    condition: (d) => (d.occupancyRate ?? 100) < 40,
    message: (d) => `Ocupación baja: ${d.occupancyRate?.toFixed(0)}%. Considera promociones o acciones de marketing.`,
    cooldownMinutes: 60,
  },
  {
    id: "high-food-cost",
    name: "Food cost elevado",
    category: "financial",
    severity: "critical",
    condition: (d) => (d.foodCostPercentage ?? 0) > (d.foodCostTarget ?? 32),
    message: (d) => `Food cost al ${d.foodCostPercentage?.toFixed(1)}% — por encima del objetivo (${d.foodCostTarget ?? 32}%). Revisa proveedores y mermas.`,
    cooldownMinutes: 120,
  },
  {
    id: "high-labor-cost",
    name: "Coste laboral elevado",
    category: "financial",
    severity: "warning",
    condition: (d) => (d.laborCostPercentage ?? 0) > (d.laborCostTarget ?? 35),
    message: (d) => `Coste laboral al ${d.laborCostPercentage?.toFixed(1)}% — supera el objetivo (${d.laborCostTarget ?? 35}%).`,
    cooldownMinutes: 120,
  },
  {
    id: "overdue-invoices",
    name: "Facturas vencidas",
    category: "financial",
    severity: "critical",
    condition: (d) => (d.overdueInvoices ?? 0) > 0,
    message: (d) => `Tienes ${d.overdueInvoices} factura(s) vencida(s). Revisa la sección de tesorería.`,
    cooldownMinutes: 240,
  },
  {
    id: "low-ticket",
    name: "Ticket medio bajo",
    category: "financial",
    severity: "info",
    condition: (d) => d.ticketMedio !== undefined && d.ticketMedioTarget !== undefined && d.ticketMedio < d.ticketMedioTarget * 0.85,
    message: (d) => `Ticket medio (${d.ticketMedio?.toFixed(2)}€) un 15% por debajo del objetivo (${d.ticketMedioTarget?.toFixed(2)}€).`,
    cooldownMinutes: 60,
  },
  {
    id: "daily-revenue-below-target",
    name: "Ingresos diarios bajo objetivo",
    category: "financial",
    severity: "warning",
    condition: (d) => d.dailyRevenue !== undefined && d.dailyRevenueTarget !== undefined && d.dailyRevenue < d.dailyRevenueTarget * 0.8,
    message: (d) => `Ingresos del día (${d.dailyRevenue?.toFixed(0)}€) un 20%+ por debajo del objetivo (${d.dailyRevenueTarget?.toFixed(0)}€).`,
    cooldownMinutes: 120,
  },
  {
    id: "high-cancellations",
    name: "Cancelaciones elevadas",
    category: "reservations",
    severity: "warning",
    condition: (d) => (d.cancellationsToday ?? 0) > 5,
    message: (d) => `${d.cancellationsToday} cancelaciones hoy. Podría indicar un problema.`,
    cooldownMinutes: 180,
  },
  {
    id: "facturas-requieren-revision",
    name: "Facturas pendientes de revisión",
    category: "financial",
    severity: "warning",
    condition: (d) => (d.invoicesNeedingReview ?? 0) > 0,
    message: (d) => `${d.invoicesNeedingReview} factura(s) de proveedor requieren revisión manual.`,
    cooldownMinutes: 240,
  },
  {
    id: "facturas-auto-confirmar",
    name: "Facturas auto-conciliadas sin confirmar",
    category: "financial",
    severity: "info",
    condition: (d) => (d.invoicesAutoReconciled ?? 0) >= 3,
    message: (d) => `${d.invoicesAutoReconciled} factura(s) auto-conciliadas listas para confirmar en Compras → Conciliación.`,
    cooldownMinutes: 480,
  },
]

// ─── Motor de alertas ───────────────────────────────────────────

const alertCooldowns = new Map<string, number>()

/** Lista de listeners para el NotificationCenter */
type AlertListener = (message: string, severity: AlertSeverity) => void
const alertListeners: AlertListener[] = []

/**
 * Suscribirse a alertas disparadas (usado por NotificationCenter)
 */
export function onAlertFired(listener: AlertListener): () => void {
  alertListeners.push(listener)
  return () => {
    const index = alertListeners.indexOf(listener)
    if (index > -1) alertListeners.splice(index, 1)
  }
}

/**
 * Evalúa las reglas de alertas y dispara notificaciones toast para las que se cumplan.
 * Respeta cooldowns para no spam.
 */
export function evaluateAlerts(
  context: AlertContext,
  rules: AlertRule[] = DEFAULT_ALERT_RULES
): void {
  const now = Date.now()

  for (const rule of rules) {
    try {
      if (!rule.condition(context)) continue

      // Verificar cooldown
      const lastFired = alertCooldowns.get(rule.id) ?? 0
      if (now - lastFired < rule.cooldownMinutes * 60 * 1000) continue

      // Disparar alerta
      const message = rule.message(context)

      switch (rule.severity) {
        case "critical":
          toast.error(message, { duration: 10000, id: rule.id })
          break
        case "warning":
          toast.warning(message, { duration: 7000, id: rule.id })
          break
        case "info":
          toast.info(message, { duration: 5000, id: rule.id })
          break
      }

      // Notificar a listeners (NotificationCenter)
      alertListeners.forEach((l) => l(message, rule.severity))

      // Registrar cooldown
      alertCooldowns.set(rule.id, now)
    } catch {
      // No romper si una regla falla
      console.warn(`[AlertEngine] Error evaluando regla '${rule.id}'`)
    }
  }
}

/**
 * Resetea los cooldowns (útil para testing)
 */
export function resetAlertCooldowns(): void {
  alertCooldowns.clear()
}
