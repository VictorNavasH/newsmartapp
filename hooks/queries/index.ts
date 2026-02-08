// Barrel export de todos los query hooks
// Cada módulo agrupa hooks por dominio funcional

// Dashboard — datos en tiempo real, KPIs, ocupación
export {
  useRealTimeData,
  useWeekReservations,
  useFinancialKPIs,
  useLaborCostAnalysis,
  useWeekRevenue,
  useOcupacionSemanal,
} from "./useDashboardData"

// Reservas — métricas diarias, comparativas anuales
export {
  useReservationsFromDB,
  useYearlyComparison,
  usePeriodComparison,
} from "./useReservationsData"

// Ingresos — facturación por día y por mesa
export {
  useIncomeFromDB,
  useTableBillingFromDB,
} from "./useIncomeData"

// Gastos — tags, filtros por categoría/proveedor/calendario
export {
  useExpenseTags,
  useExpensesByTags,
  useExpensesByDueDate,
  useExpenseSummaryByTags,
  useExpenseSummaryByProvider,
} from "./useExpensesData"

// Tesorería — cuentas, movimientos, pool bancario
export {
  useTreasuryKPIs,
  useTreasuryAccounts,
  useTreasuryTransactions,
  useTreasuryTransactionsSummary,
  useTreasuryCategories,
  useTreasuryByCategory,
  useTreasuryMonthlySummary,
  usePoolBancarioResumen,
  usePoolBancarioPrestamos,
  usePoolBancarioVencimientos,
  usePoolBancarioPorBanco,
  usePoolBancarioCalendario,
} from "./useTreasuryData"

// Operaciones — tiempo real, KPIs, productos, horarios
export {
  useOperationsRealTime,
  useOperativaKPIs,
  useOperativaProductos,
  useOperativaCliente,
  useOperativaPorHora,
  useOperativaItems,
  useOperativaCategorias,
} from "./useOperationsData"

// Productos — mix de productos, categorías, opciones, food cost
export {
  useProductMix,
  useCategoryMix,
  useOptionMix,
  useFoodCostProducts,
} from "./useProductsData"

// Forecasting — predicciones, calendario, benchmarks
export {
  useForecastData,
  useForecastCalendar,
  useBenchmarks,
} from "./useForecastingData"
