import {
  Calendar,
  BarChart3,
  DollarSign,
  PieChart,
  Settings,
  Sparkles,
  TrendingUp,
  FileText,
  Landmark,
  Clock,
  ShoppingBag,
  Calculator,
  Truck,
} from "lucide-react"

export const APP_NAME = "NÜA Smart Dashboard"

export const NAVIGATION_ITEMS = [
  { name: "Dashboard", icon: BarChart3, path: "/" },
  { name: "Reservas y Ocupación", icon: Calendar, path: "/reservations" },
  { name: "Ingresos", icon: DollarSign, path: "/revenue" },
  { name: "Gastos", icon: PieChart, path: "/expenses" },
  { name: "Costes", icon: Calculator, path: "/costs" },
  { name: "Compras", icon: Truck, path: "/purchases" },
  { name: "Productos", icon: ShoppingBag, path: "/products" },
  { name: "Operaciones", icon: Clock, path: "/operations" },
  { name: "Facturación", icon: FileText, path: "/invoices" },
  { name: "Tesorería", icon: Landmark, path: "/treasury" },
  { name: "Forecasting", icon: TrendingUp, path: "/forecasting" },
  { name: "Smart Assistant", icon: Sparkles, path: "/ai-assistant" },
  { name: "Configuración", icon: Settings, path: "/settings" },
]

export const RESTAURANT_LOCATION = {
  LAT: 41.4031,
  LON: 2.1524,
}

export const MOCK_DATA_DELAY = 600 // Simulate network latency

export const BRAND_COLORS = {
  primary: "#02b1c4", // Cyan - Primary brand color (tabs, selectors activos)
  dark: "#364f6b", // Dark blue-gray - Text and titles
  secondary: "#223143", // Darker blue-gray - Secondary text
  accent: "#227c9d", // Teal - Accent and night/dinner
  lunch: "#ffcb77", // Yellow - Lunch/day
  success: "#17c3b2", // Green - Success states (VeriFactu OK, positive trends, ingresos)
  error: "#fe6d73", // Red - Error states, negative trends, alerts
  warning: "#ffcb77", // Yellow - Warning states
} as const

export const CHART_CONFIG = {
  axis: {
    tick: { fill: "#64748b", fontSize: 12 },
    axisLine: { stroke: "#e2e8f0" },
  },
  grid: {
    stroke: "#f1f5f9",
    strokeDasharray: "3 3",
  },
  card: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },
  tooltip: {
    contentStyle: {
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    labelStyle: {
      color: "#1e293b",
      fontWeight: 600,
      marginBottom: "4px",
    },
  },
  avgTicketColors: {
    pax: "#49eada", // Por comensal - turquesa claro
    table: "#02b1c4", // Por mesa - turquesa principal
    transaction: "#227c9d", // Por transacción - teal oscuro
    reservation: "#ffcb77", // Por reserva - amarillo
  },
} as const

export const UI_COLORS = {
  infoBadge: "#227c9d",
} as const

export const CARD_TOOLTIPS = {
  reservations: "Número total de reservas registradas. Pax/Res indica el promedio de comensales por reserva.",
  pax: "Número total de comensales (personas) que han acudido al restaurante.",
  occupancy: "Porcentaje de ocupación respecto a la capacidad total. 100% = capacidad completa en ambos turnos.",
  tables: "Número de mesas físicas utilizadas durante el periodo. Se cuentan mesas diferentes, no usos.",
  rotation: "Cuántas veces se usó cada mesa en promedio. 1.0x = cada mesa se usó una vez. >1.0x = hubo rotación.",
  paxPerTable:
    "Promedio de comensales por mesa utilizada. Indica qué tan llenas están las mesas (eficiencia de ocupación).",
  totalRevenue: "Ingresos totales con IVA (lo que paga el cliente). Incluye base imponible + IVA + propinas.",
  tips: "Propinas recibidas (exentas de IVA). Porcentaje sobre facturación indica la satisfacción del cliente.",
  avgTicketPax: "Gasto medio por comensal. Ticket Total / Número de Comensales.",
  avgTicketTransaction: "Valor medio de cada factura emitida. Ticket Total / Número de Facturas.",
  avgTicketTable: "Facturación media generada por cada mesa ocupada. Ticket Total / Mesas Utilizadas.",
  avgTicketReservation: "Gasto medio por reserva. Ticket Total / Número de Reservas.",
  paymentMethods: "Distribución de métodos de pago. Porcentaje de ingresos cobrados por cada método.",
  tableRanking: "Top 10 mesas con mayor facturación en el periodo seleccionado",
  tableMetrics: "Métricas detalladas de facturación por mesa con histórico completo",
  tableTrend: "Evolución temporal de facturación para la mesa seleccionada",
  expenseTotal: "Total de gastos registrados en el periodo seleccionado, incluyendo pagados, pendientes y vencidos.",
  expensePaid: "Gastos ya abonados. Incluye facturas con estado 'pagado'.",
  expensePending: "Gastos pendientes de pago que aún no han vencido.",
  expenseOverdue: "Gastos vencidos sin pagar. Requieren atención inmediata.",
  expenseByTag: "Distribución de gastos agrupados por etiqueta/categoría.",
  purchases: "Resumen de compras realizadas en el periodo seleccionado.",
} as const
