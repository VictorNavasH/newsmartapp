# Servicios de Datos — NÜA Smart App

Documentación de los 18 servicios/módulos en `lib/`. Cada servicio encapsula las queries a Supabase y la lógica de acceso a datos.

---

## Índice

1. [dataService.ts — Servicio Principal](#1-dataservicets)
2. [comprasService.ts — Compras](#2-comprasservicets)
3. [facturacionService.ts — Facturación](#3-facturacionservicets)
4. [operativaService.ts — Operativa](#4-operativaservicets)
5. [treasuryService.ts — Tesorería](#5-treasuryservicets)
6. [whatIfService.ts — What-If](#6-whatifservicets)
7. [settingsService.ts — Configuración](#7-settingsservicets)
8. [weather.ts — Meteorología](#8-weatherts)
9. [gemini.ts — IA (Gemini)](#9-geminits)
10. [env.ts — Variables de Entorno](#10-envts)
11. [errorLogger.ts — Logging de Errores](#11-errorloggerts)
12. [supabase.ts — Cliente Supabase](#12-supabasets)
13. [alertEngine.ts — Motor de Alertas](#13-alertenginets)
14. [exportUtils.ts — Exportación PDF/CSV](#14-exportutilsts)
15. [kpiTargets.ts — Objetivos KPI](#15-kpitargetsts)
16. [rateLimit.ts — Rate Limiting](#16-ratelimitts)
17. [apiAuth.ts — Autenticación API](#17-apiauthts)
18. [bankConnectionsService.ts — Conexiones Bancarias](#18-bankconnectionsservicets)

---

## Resumen de Fuentes de Datos

### Vistas materializadas de Supabase (29)

| Prefijo | Vistas |
|---------|--------|
| `vw_` | `vw_dashboard_ventas_facturas_live`, `vw_dashboard_financiero`, `vw_dashboard_ocupacion`, `vw_metricas_diarias_base`, `vw_facturacion_mesas`, `vw_operaciones_tiempo_real`, `vw_mix_productos`, `vw_mix_categorias`, `vw_mix_opciones`, `vw_forecasting_analysis`, `vw_labor_cost_analysis`, `vw_food_cost`, `vw_operativa_items`, `vw_compras_pedidos`, `vw_compras_conciliacion`, `vw_compras_albaranes_para_vincular`, `vw_compras_proveedores`, `vw_compras_resumen` |
| `v_` | `v_facturacion_resumen_global`, `v_facturas_listado`, `v_facturas_cuadre_diario`, `v_ingresos_por_categoria`, `v_facturas_alertas`, `v_facturacion_mensual`, `v_pool_bancario_resumen`, `v_pool_bancario_prestamos`, `v_pool_bancario_proximos_vencimientos`, `v_pool_bancario_por_banco`, `v_pool_bancario_calendario_mensual` |

### Tablas directas (12)

`reservas_agregadas_diarias`, `forecasting_weather_history`, `gstock_product_formats`, `facturacion_alertas`, `tables`, `turnos`, `gstock_sync_logs`, `gocardless_sync_logs`, `gocardless_accounts`, `gocardless_institutions`, `gocardless_transactions`, `gocardless_requisitions`, `cuentica_logs`, `billin_logs`, `business_views_refresh_log`, `kpi_targets`

### RPCs (43)

`rpc_facturacion_semana`, `get_expense_tags`, `get_gastos_by_tags`, `get_gastos_by_due_date`, `get_gastos_resumen_by_tags`, `get_gastos_resumen_by_provider`, `get_benchmarks_resumen`, `update_manual_price`, `update_variant_manual_price`, `clear_manual_price`, `get_operativa_kpis`, `get_operativa_productos`, `get_operativa_cliente`, `get_operativa_por_hora`, `get_treasury_kpis`, `get_treasury_accounts`, `get_treasury_transactions`, `get_treasury_transactions_summary`, `get_treasury_categories`, `update_transaction_category`, `get_treasury_by_category`, `get_treasury_monthly_summary`, `get_database_size`, `get_tables_size`, `fn_conciliar_manual`, `fn_confirmar_conciliacion`, `fn_descartar_conciliacion`, `compras_kpis`, `compras_evolucion_mensual`, `compras_distribucion`, `compras_top_productos`, `compras_tabla_jerarquica`, `rpc_get_cuadre_listado`, `rpc_get_facturas_zreport`, `rpc_get_zreports_disponibles`, `rpc_get_facturas_huerfanas`, `rpc_get_facturas_adyacentes`, `rpc_mover_factura`, `rpc_crear_ajuste`, `rpc_get_ajustes`, `rpc_eliminar_ajuste`, `rpc_confirmar_cuadre`, `rpc_marcar_pendiente`

---

## 1. dataService.ts

**Archivo:** `lib/dataService.ts` (~1500 líneas)
**Consumido por:** DashboardPage, ReservationsPage, IncomePage, ExpensesPage, CostesPage, ProductsPage, ForecastingPage, OperationsPage

Servicio principal. Contiene funciones para dashboard en tiempo real, reservas, ingresos, gastos, operaciones, productos, forecasting, costes y benchmarks. Los datos mock y generadores se han extraído a `lib/mockData.ts`; las funciones mock se re-exportan desde este módulo para compatibilidad.

### Utilidades

| Función | Retorna | Descripción |
|---------|---------|-------------|
| `getBusinessDate()` | `Date` | Calcula la "fecha de negocio" en zona horaria de España. El corte es a las 02:00 AM (actividad de cena hasta las 2:00 cuenta como día anterior) |

### Dashboard — Tiempo Real

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchRealTimeData()` | — | `Promise<RealTimeData>` | Vista `vw_dashboard_ventas_facturas_live` → `.select("*").eq("fecha", todayStr).maybeSingle()` |
| `fetchFinancialKPIs()` | — | `Promise<FinancialKPIs[]>` | Vista `vw_dashboard_financiero` → `.select("*").order("periodo", asc)` |
| `fetchOcupacionSemanal()` | — | `Promise<OcupacionDia[]>` | Vista `vw_dashboard_ocupacion` → `.select("*").order("fecha", asc).limit(7)` |
| `fetchWeekRevenue(weekOffset?)` | `weekOffset: number = 0` | `Promise<WeekRevenueDay[]>` | RPC `rpc_facturacion_semana` → `{p_week_offset}` |

### Reservas

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchWeekReservations(offsetWeeks?)` | `offsetWeeks: number = 0` | `Promise<WeekReservationDay[]>` | Tabla `reservas_agregadas_diarias` → `.select("*").gte/lte("fecha").order("fecha", asc)` |
| `fetchReservationsFromDB(start, end)` | `startDate: Date, endDate: Date` | `Promise<DailyCompleteMetrics[]>` | Vista `vw_metricas_diarias_base` → `.select("*").gte/lte("fecha").order("fecha", asc)` |
| `fetchYearlyComparison()` | — | `Promise<YearlyComparisonData[]>` | Tabla `reservas_agregadas_diarias` → `.select("fecha, total_reservas, total_comensales, ...").lte("fecha", yesterday).order("fecha", asc)` |
| `fetchPeriodComparison(...)` | `startDay, startMonth, endDay, endMonth, yearA, yearB` | `Promise<{yearA, yearB}>` | Tabla `reservas_agregadas_diarias` — 2 queries paralelas, una por año |

### Ingresos

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchIncomeFromDB(start, end)` | `startDate: Date, endDate: Date` | `Promise<DailyCompleteMetrics[]>` | Vista `vw_metricas_diarias_base` |

### Facturación por Mesas

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchTableBillingFromDB(start, end)` | `startDate: Date, endDate: Date` | `Promise<TableBillingMetrics[]>` | Vista `vw_facturacion_mesas` → `.select("*").gte/lte("fecha").order("fecha", asc).order("ranking_dia", asc)` |
| `aggregateTableMetrics(data)` | `data: TableBillingMetrics[]` | `TableAggregatedMetrics[]` | Cálculo en memoria — agrupa por mesa_id |
| `aggregateMetrics(data)` | `data: DailyCompleteMetrics[]` | `DailyCompleteMetrics` | Cálculo en memoria — suma/promedia |

### Gastos

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchExpenseTags()` | — | `Promise<ExpenseTag[]>` | RPC `get_expense_tags` |
| `fetchExpensesByTags(tags?, start?, end?, status?)` | opcionales | `Promise<Expense[]>` | RPC `get_gastos_by_tags` → `{p_tags, p_fecha_inicio, p_fecha_fin, p_status}` |
| `fetchExpensesByDueDate(start, end, status?)` | fechas y estado | `Promise<Expense[]>` | RPC `get_gastos_by_due_date` → `{p_due_date_inicio, p_due_date_fin, p_status}` |
| `fetchExpenseSummaryByTags(tags?, start?, end?)` | opcionales | `Promise<ExpenseTagSummary[]>` | RPC `get_gastos_resumen_by_tags` |
| `fetchExpenseSummaryByProvider(start?, end?)` | opcionales | `Promise<ExpenseProviderSummary[]>` | RPC `get_gastos_resumen_by_provider` |

### Operaciones (Tiempo Real)

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchOperationsRealTime()` | — | `Promise<OperacionesData \| null>` | Vista `vw_operaciones_tiempo_real` → `.select("*").single()` |

### Product Mix

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchProductMix(start, end, turno?, cat?)` | fechas + filtros opcionales | `Promise<ProductMixItem[]>` | Vista `vw_mix_productos` → `.select("*").gte/lte("fecha_texto")` + filtros opcionales |
| `fetchCategoryMix(start, end, turno?)` | fechas + turno opcional | `Promise<CategoryMixItem[]>` | Vista `vw_mix_categorias` |
| `fetchOptionMix(start, end, turno?, extraPago?)` | fechas + filtros opcionales | `Promise<OptionMixItem[]>` | Vista `vw_mix_opciones` |

### Forecasting

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchForecastData()` | — | `Promise<{kpis, proximos7dias, precision}>` | Vista `vw_forecasting_analysis` → `.select("*").gte("fecha", 4weeksAgo).lte("fecha", 7daysAhead)` — Fallback a mock si vacío |
| `fetchForecastCalendar(year, month)` | `year: number, month: number` | `Promise<ForecastDay[]>` | Vista `vw_forecasting_analysis` → `.select("*").gte/lte("fecha", monthRange)` — Fallback a mock |

### Costes y Benchmarks

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchBenchmarks(inicio, fin)` | `fechaInicio, fechaFin: string` | `Promise<BenchmarkResumen>` | RPC `get_benchmarks_resumen` → `{p_fecha_inicio, p_fecha_fin}` |
| `fetchLaborCostAnalysis(start, end)` | `startDate, endDate: string` | `Promise<LaborCostDay[]>` | Vista `vw_labor_cost_analysis` |
| `fetchFoodCostAverage()` | — | `Promise<number>` | Vista `vw_food_cost` → `.select("food_cost_pct")` → promedio redondeado a 1 decimal. Usado por Dashboard KPI. |
| `fetchFoodCostProducts()` | — | `Promise<FoodCostSummary>` | Vista `vw_food_cost` → `.select("*").order("food_cost_pct", desc)` |
| `updateManualPrice(sku, variantId, price)` | `sku: string, variantId?: string, newPrice: number` | `Promise<{success, error?}>` | RPC `update_manual_price` o `update_variant_manual_price` |
| `clearManualPrice(sku, variantId)` | `sku: string, variantId?: string` | `Promise<{success, error?}>` | RPC `clear_manual_price` o update con null |
| `fetchConciliacionResumen()` | — | `Promise<{totalPendientes, autoSinConfirmar, requierenRevision}>` | Vista `vw_compras_facturas_pendientes` → agrega conteos por estado. Usado por alertas Dashboard. |

### Mock (re-exportados desde `lib/mockData.ts`)

| Función | Descripción |
|---------|-------------|
| `fetchHistoryRange(start, end)` | Genera `DailyCompleteMetrics[]` desde array `mockHistory` (400 días) |
| `fetchFinancialHistory(period)` | Genera datos financieros mock agrupados por mes |
| `fetchUpcomingInvoices(days)` | Genera facturas de proveedor aleatorias |

> **Nota:** Estas funciones viven en `lib/mockData.ts` y se re-exportan desde `dataService.ts` para compatibilidad.

---

## 1b. mockData.ts

**Archivo:** `lib/mockData.ts` (~470 líneas)
**Consumido por:** dataService.ts (re-exports y fallbacks de forecasting)

Módulo que contiene todos los datos mock, constantes de demo y generadores de datos simulados. Extraído de `dataService.ts` para separar las responsabilidades de datos reales (Supabase) y datos ficticios.

### Constantes

| Constante | Descripción |
|-----------|-------------|
| `SMART_TABLES` | Lista de 19 nombres de Smart Tables |
| `CATEGORIES` | 6 categorías de productos (Entrantes, Principales, Postres, Bebidas, Vinos, Cócteles) |
| `PRODUCTS_DB` | 22 productos mock con nombre, categoría y precio |
| `PROVIDERS_DB` | 9 proveedores mock con nombre y categoría de gasto |

### Generadores

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `generateSalesData(revenueTarget)` | `revenueTarget: number` | `SalesBreakdown` | Genera ventas aleatorias hasta alcanzar ~90% del objetivo |
| `generateExpenses(revenue)` | `revenue: number` | `ExpenseStats` | Genera gastos con ratios típicos de restaurante (COGS ~30%, Personal ~32%) |
| `generateTableSales(revenue)` | `revenue: number` | `TableSales[]` | Distribuye ingresos entre mesas con pesos aleatorios |
| `generateShift(basePax, type)` | `basePax: number, type: "LUNCH"\|"DINNER"` | `ShiftMetrics` | Genera métricas completas de un turno |
| `generateMockHistory(days)` | `days: number` | `DailyCompleteMetrics[]` | Genera historial diario completo (comida + cena) |
| `generateMockForecastData(today, todayStr)` | `today: Date, todayStr: string` | `{kpis, proximos7dias, precision}` | Mock de 7 días de forecast + 28 días históricos de precisión |
| `generateMockForecastCalendar(year, month, today)` | `year, month: number, today: Date` | `ForecastDay[]` | Mock de calendario mensual de forecast |

### Datos pre-generados

| Variable | Descripción |
|----------|-------------|
| `mockHistory` | Array de 400 días de `DailyCompleteMetrics` generados al importar el módulo |

### Funciones exportadas

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `fetchHistoryRange(start, end)` | `startDate, endDate: Date` | `Promise<DailyCompleteMetrics[]>` | Filtra `mockHistory` por rango de fechas |
| `fetchFinancialHistory(period)` | `period: "week"\|"month"\|"quarter"\|"year"` | `Promise<{date, income, expenses}[]>` | Datos financieros mock, agregados por mes para quarter/year |
| `fetchUpcomingInvoices(days)` | `days: number` | `Promise<Invoice[]>` | Genera facturas futuras aleatorias |

---

## 2. comprasService.ts

**Archivo:** `lib/comprasService.ts` (~321 líneas)
**Consumido por:** ComprasPage

> **Nota:** `fetchPedidos()` mapea el campo `items` (nombre en la vista Supabase) a `pedido_items` (nombre en el tipo TypeScript `CompraPedido`). Este mapeo es necesario porque la vista `vw_compras_pedidos` usa `items` como nombre de columna JSONB.

> **Nota:** `fetchFacturasConciliacion()` lee de `vw_compras_facturas_pendientes` (no de `vw_compras_conciliacion` que depende de tabla vacía). Mapea campos al tipo `CompraFacturaConciliacion`. Desde feb-2026, la vista incluye columnas IA (`ia_confianza`, `motivo_revision`, `tipo_referencia`) generadas por el workflow n8n de conciliación con Gemini. `ia_confianza` se convierte de 0.0-1.0 a 0-100 para la UI.

> **Nota:** `fetchAlbaranesDisponibles()` mapea `fecha_albaran` → `fecha` y `total` → `importe_total` desde `vw_compras_albaranes_para_vincular`.

> **Nota:** `fetchKPIs()` consulta 4 fuentes en paralelo: `vw_compras_resumen` + `vw_compras_pedidos` + `vw_compras_albaranes_para_vincular` + `vw_compras_facturas_pendientes`.

### Lectura

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchPedidos(filters?)` | `{proveedor, estado, fechaDesde, fechaHasta}` | `Promise<CompraPedido[]>` | Vista `vw_compras_pedidos` → `.select("*").order("fecha_pedido", desc)` + filtros |
| `fetchFacturasConciliacion(filters?)` | `{estadoConciliacion, proveedor, soloRevision}` | `Promise<CompraFacturaConciliacion[]>` | Vista `vw_compras_facturas_pendientes` → mapeo a `CompraFacturaConciliacion` |
| `fetchAlbaranesDisponibles(proveedorId?)` | `proveedorId?: string` | `Promise<CompraAlbaranDisponible[]>` | Vista `vw_compras_albaranes_para_vincular` → mapeo `fecha_albaran`→`fecha`, `total`→`importe_total` |
| `fetchProveedores()` | — | `Promise<CompraProveedor[]>` | Vista `vw_compras_proveedores` → `.order("nombre")` |
| `fetchKPIs()` | — | `Promise<CompraKPIs \| null>` | 4 fuentes: `vw_compras_resumen` + `vw_compras_pedidos` + `vw_compras_albaranes_para_vincular` + `vw_compras_facturas_pendientes` |
| `fetchProductFormats()` | — | `Promise<ProductFormat[]>` | Tabla `gstock_product_formats` → `.select("id, name").order("name")` |
| `fetchComprasAnalisisKPIs({desde, hasta})` | fechas | `Promise<CompraAnalisisKPI \| null>` | RPC `compras_kpis` |
| `fetchComprasEvolucionMensual(meses?)` | `meses: number = 12` | `Promise<CompraEvolucionMensual[]>` | RPC `compras_evolucion_mensual` |
| `fetchComprasDistribucion({desde, hasta})` | fechas | `Promise<CompraDistribucionCategoria[]>` | RPC `compras_distribucion` |
| `fetchComprasTopProductos({desde, hasta, limite?})` | fechas + límite | `Promise<CompraTopProducto[]>` | RPC `compras_top_productos` |
| `fetchComprasTablaJerarquica({desde, hasta})` | fechas | `Promise<CompraTablaJerarquica[]>` | RPC `compras_tabla_jerarquica` |

### Escritura

| Función | Parámetros | Retorna | RPC |
|---------|-----------|---------|-----|
| `vincularAlbaranes(facturaId, albaranIds)` | `facturaId: string, albaranIds: string[]` | `Promise<{success, error?}>` | `fn_conciliar_manual` → `{p_factura_id, p_albaran_ids, p_usuario: "webapp"}` |
| `confirmarConciliacion(id, notas?)` | `conciliacionId: string, notas?: string` | `Promise<{success, error?}>` | `fn_confirmar_conciliacion` |
| `descartarConciliacion(facturaId, motivo?)` | `facturaId: string, motivo?: string` | `Promise<{success, error?}>` | `fn_descartar_conciliacion` |

---

## 3. facturacionService.ts

**Archivo:** `lib/facturacionService.ts` (~405 líneas)
**Consumido por:** FacturacionPage

### Lectura

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchFacturacionResumen()` | — | `Promise<FacturacionResumenGlobal \| null>` | Vista `v_facturacion_resumen_global` → `.single()` |
| `fetchFacturacionListado(start?, end?, filters?, page?)` | opcionales | `Promise<{data, count}>` | Vista `v_facturas_listado` → `.select("*", {count: "exact"}).order("fecha", desc)` + paginación |
| `fetchFacturacionKPIs(start, end)` | `startDate, endDate: string` | `Promise<KPIs calculados>` | Vista `v_facturas_listado` — selección parcial → agregación client-side |
| `fetchCuadreDiario(start?, end?)` | opcionales | `Promise<FacturacionCuadreDiario[]>` | Vista `v_facturas_cuadre_diario` |
| `fetchTiposIngreso()` | — | `Promise<FacturacionTipoIngreso[]>` | Vista `v_ingresos_por_categoria` → `.order("total", desc)` |
| `fetchFacturacionAlertas()` | — | `Promise<FacturacionAlerta[]>` | Vista `v_facturas_alertas` |
| `fetchFacturacionMensual()` | — | `Promise<FacturacionMensual[]>` | Vista `v_facturacion_mensual` → `.order("mes", desc).limit(12)` |
| `fetchCuadreListado(inicio, fin)` | fechas | `Promise<CuadreListadoItem[]>` | RPC `rpc_get_cuadre_listado` |
| `fetchFacturasZReport(zReportId)` | `zReportId: string` | `Promise<FacturaZReport[]>` | RPC `rpc_get_facturas_zreport` |
| `fetchZReportsDisponibles(fecha)` | `fecha: string` | `Promise<ZReportDisponible[]>` | RPC `rpc_get_zreports_disponibles` |
| `fetchFacturasHuerfanas(fecha)` | `fecha: string` | `Promise<FacturaHuerfana[]>` | RPC `rpc_get_facturas_huerfanas` |
| `fetchFacturasAdyacentes(fecha, id)` | `fecha: string, zReportIdExcluir: string` | `Promise<FacturaAdyacente[]>` | RPC `rpc_get_facturas_adyacentes` |
| `fetchAjustes(fecha, zReportId)` | `fecha, zReportId: string` | `Promise<AjusteCuadre[]>` | RPC `rpc_get_ajustes` |

### Escritura

| Función | Parámetros | Retorna | RPC |
|---------|-----------|---------|-----|
| `resolverAlerta(alertaId, usuario)` | `alertaId, usuario: string` | `Promise<boolean>` | Tabla `facturacion_alertas` → `.update({resuelta: true, ...}).eq("alerta_id")` |
| `moverFactura(facturaId, nuevoZReportId)` | IDs | `Promise<{success, zreport_anterior?, zreport_nuevo?, error?}>` | RPC `rpc_mover_factura` |
| `crearAjuste(params)` | `CrearAjusteParams` | `Promise<{success, ajuste_id?, error?}>` | RPC `rpc_crear_ajuste` → `{p_zreport_id, p_fecha, p_tipo, p_importe, p_descripcion}` |
| `eliminarAjuste(ajusteId)` | `ajusteId: string` | `Promise<{success, error?}>` | RPC `rpc_eliminar_ajuste` |
| `confirmarCuadre(fecha, zReportId)` | `fecha, zReportId: string` | `Promise<{success, error?}>` | RPC `rpc_confirmar_cuadre` |
| `marcarPendiente(fecha, zReportId, motivo)` | `fecha, zReportId, motivo: string` | `Promise<{success, error?}>` | RPC `rpc_marcar_pendiente` |

---

## 4. operativaService.ts

**Archivo:** `lib/operativaService.ts` (~181 líneas)
**Consumido por:** OperationsPage

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchOperativaKPIs(start, end, tipo?, cat?)` | fechas + filtros opcionales | `Promise<OperativaKPI[]>` | RPC `get_operativa_kpis` → `{fecha_inicio, fecha_fin, filtro_tipo, filtro_categoria}` |
| `fetchOperativaProductos(start, end, tipo?, cat?)` | fechas + filtros opcionales | `Promise<OperativaProducto[]>` | RPC `get_operativa_productos` |
| `fetchOperativaCliente(start, end)` | fechas | `Promise<OperativaCliente[]>` | RPC `get_operativa_cliente` |
| `fetchOperativaPorHora(start, end)` | fechas | `Promise<OperativaPorHora[]>` | RPC `get_operativa_por_hora` |
| `fetchOperativaItems(start, end, tipo?, cat?)` | fechas + filtros opcionales | `Promise<OperativaItem[]>` | Vista `vw_operativa_items` → `.select("*").gte/lte("fecha")` + filtros `.eq()` |
| `fetchOperativaCategorias(start, end)` | fechas | `Promise<string[]>` | Vista `vw_operativa_items` → `.select("categoria")` — deduplicación client-side |

---

## 5. treasuryService.ts

**Archivo:** `lib/treasuryService.ts` (~313 líneas)
**Consumido por:** TreasuryPage

### Tesorería General

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchTreasuryKPIs(start?, end?)` | fechas opcionales | `Promise<TreasuryKPIs \| null>` | RPC `get_treasury_kpis` → `data[0]` |
| `fetchTreasuryAccounts()` | — | `Promise<TreasuryAccount[]>` | RPC `get_treasury_accounts` |
| `fetchTreasuryTransactions(...)` | `start?, end?, accountId?, categoryId?, tipo?, search?, limit=100, offset=0` | `Promise<TreasuryTransaction[]>` | RPC `get_treasury_transactions` |
| `fetchTreasuryTransactionsSummary(...)` | mismos filtros sin paginación | `Promise<TreasuryTransactionsSummary \| null>` | RPC `get_treasury_transactions_summary` |
| `fetchTreasuryCategories()` | — | `Promise<TreasuryCategory[]>` | RPC `get_treasury_categories` |
| `updateTransactionCategory(txId, catId, subCatId?)` | IDs | `Promise<boolean>` | RPC `update_transaction_category` |
| `fetchTreasuryByCategory(start?, end?)` | fechas opcionales | `Promise<TreasuryCategoryBreakdown[]>` | RPC `get_treasury_by_category` |
| `fetchTreasuryMonthlySummary(start?, end?)` | fechas opcionales | `Promise<TreasuryMonthlySummary[]>` | RPC `get_treasury_monthly_summary` |

### Pool Bancario (Préstamos)

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchPoolBancarioResumen()` | — | `Promise<PoolBancarioResumen \| null>` | Vista `v_pool_bancario_resumen` → `.single()` |
| `fetchPoolBancarioPrestamos()` | — | `Promise<PoolBancarioPrestamo[]>` | Vista `v_pool_bancario_prestamos` → `.order("saldo_pendiente", desc)` |
| `fetchPoolBancarioVencimientos(limit?)` | `limit: number = 10` | `Promise<PoolBancarioVencimiento[]>` | Vista `v_pool_bancario_proximos_vencimientos` → `.gte("fecha_vencimiento", today).lte(today+30d).order("fecha_vencimiento", asc)` |
| `fetchPoolBancarioPorBanco()` | — | `Promise<PoolBancarioPorBanco[]>` | Vista `v_pool_bancario_por_banco` |
| `fetchPoolBancarioCalendario(meses?)` | `meses: number = 12` | `Promise<PoolBancarioCalendarioMes[]>` | Vista `v_pool_bancario_calendario_mensual` → `.order("mes_id", asc).limit(meses)` |

---

## 6. whatIfService.ts

**Archivo:** `lib/whatIfService.ts` (~52 líneas)
**Consumido por:** WhatIfPage

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchWhatIfReferenceData()` | — | `Promise<WhatIfReferenceData>` | Vista `vw_forecasting_analysis` → `.select("facturacion_real, comensales_real, ticket_medio, capacidad_turno, capacidad_dia, capacidad_mesas").eq("tipo_fecha", "pasado").not("facturacion_real", "is", null).order("fecha", desc).limit(60)` |

**Fallback:** Si no hay datos, retorna `DEFAULT_DATA` con valores hardcodeados:
```typescript
{
  facturacion_media_dia: 3500,
  ticket_medio_actual: 32,
  capacidad_dia: 132,
  dias_operativos_mes: 26,
  mejor_dia_facturacion: 6500
}
```

**Cálculos:** Promedia los últimos 60 días reales para obtener `facturacion_media_dia`, `ticket_medio_actual`, y obtiene `mejor_dia_facturacion` del máximo.

---

## 7. settingsService.ts

**Archivo:** `lib/settingsService.ts` (~301 líneas)
**Consumido por:** SettingsPage

### Interfaces locales (no en types.ts)

- `IntegrationStatus` — `{name, description, status, lastSync, details}`
- `ViewRefreshLog` — `{vista_nombre, refresh_iniciado_at, refresh_completado_at, duracion_ms, estado, trigger_source}`
- `TableSize` — `{table_name, total_size, row_count}`
- `RestaurantCapacity` — `{totalMesas, totalPlazas, turnos[], plazasPorDia, mesasPorDia}`
- `SyncLogEntry` — `{id, source, type, status, timestamp, records, errors, message}`

### Funciones

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchIntegrationStatuses()` | — | `Promise<IntegrationStatus[]>` | Tablas: `gstock_sync_logs` (último), `gocardless_accounts` (last_sync_at + conteo), `cuentica_logs` (último), `billin_logs` (último) + Supabase siempre "ok" |
| `fetchViewRefreshLogs()` | — | `Promise<ViewRefreshLog[]>` | Tabla `business_views_refresh_log` → `.order("refresh_iniciado_at", desc).limit(30)` |
| `fetchDatabaseInfo()` | — | `Promise<{totalSize, tables}>` | RPC `get_database_size` + RPC `get_tables_size` |
| `fetchRestaurantCapacity()` | — | `Promise<RestaurantCapacity>` | Tablas `tables` (activas) + `turnos` (activos, excluyendo "Otros") → calcula totalMesas, totalPlazas, plazasPorDia |
| `fetchRecentSyncLogs()` | — | `Promise<SyncLogEntry[]>` | Tablas `gstock_sync_logs` (10 últimos) + `gocardless_sync_logs` (10 últimos) → merge + sort + limit 20 |

---

## 8. weather.ts

**Archivo:** `lib/weather.ts` (~146 líneas)
**Consumido por:** WeatherCard (Dashboard), ForecastingPage

| Función | Parámetros | Retorna | Fuente Supabase |
|---------|-----------|---------|----------------|
| `fetchWeatherForecast()` | — | `Promise<WeatherDay[]>` | Tabla `forecasting_weather_history` → `.select("fecha, temp_max, temp_min, codigo_tiempo_comida, codigo_tiempo_cena").gte("fecha", today).order("fecha", asc).limit(7)` |
| `getWeatherIconName(code)` | `code: number` (código AEMET) | `"sun" \| "cloud" \| "rain" \| "storm" \| "snow"` | Mapeo puro (sin DB) — convierte códigos AEMET a nombres de icono |

### Mapeo de códigos meteorológicos

Los códigos AEMET se convierten internamente a formato WMO para usar un conjunto estándar de iconos:
- Códigos 1-3 → ☀️ Sol
- Códigos 40-50 → ☁️ Nublado
- Códigos 60-70 → 🌧️ Lluvia
- Códigos 80-90 → ⛈️ Tormenta
- Códigos 70-79 → ❄️ Nieve

---

## 9. gemini.ts

**Archivo:** `lib/gemini.ts` (~57 líneas)
**Consumido por:** AIInsightCard (componente de insights)

| Función | Parámetros | Retorna | Servicio Externo |
|---------|-----------|---------|-----------------|
| `generateInsight(contextName, data)` | `contextName: string, data: any` | `Promise<string>` | Google Gemini API (modelo `gemini-2.5-flash`) |

### Configuración

- **SDK:** `@google/genai`
- **Variable de entorno:** `IA_ASSISTANT_SMART_APP` (API Key)
- **Modelo:** `gemini-2.5-flash`
- **Prompt:** System prompt en español pidiendo un insight breve sobre los datos del restaurante
- **Manejo de errores:** Si recibe status 429 (rate limit), retorna mensaje específico. Otros errores retornan mensaje genérico.

### No confundir con

- El **Smart Assistant** (chat) usa una ruta diferente: `POST /api/chat` → webhook N8N → procesamiento externo.
- `gemini.ts` se usa para **insights automáticos** en tarjetas del dashboard, no para conversación.

---

## 10. env.ts

**Archivo:** `lib/env.ts` (~25 líneas)
**Consumido por:** `supabase.ts`, `gemini.ts`, `apiAuth.ts`, `sentry.*.config.ts`

Módulo centralizado de variables de entorno con validación en tiempo de ejecución. Las variables `NEXT_PUBLIC_*` se acceden directamente (estáticas en Next.js), las demás usan acceso dinámico.

### Exports

| Export | Tipo | Variable de entorno | Requerida | Descripción |
|--------|------|-------------------|-----------|-------------|
| `SUPABASE_URL` | `string` | `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del backend Supabase |
| `SUPABASE_ANON_KEY` | `string` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima de Supabase |
| `AI_API_KEY` | `string \| null` | `IA_ASSISTANT_SMART_APP` | No | API key de Google Gemini para insights |
| `N8N_WEBHOOK_URL` | `string \| null` | `N8N_WEBHOOK_URL` | No | URL del webhook n8n para Smart Assistant |
| `SENTRY_DSN` | `string \| null` | `NEXT_PUBLIC_SENTRY_DSN` | No | DSN de Sentry para monitoreo de errores |

> **Nota técnica:** Las variables `NEXT_PUBLIC_*` se acceden con `process.env.NEXT_PUBLIC_X` (acceso estático) porque Next.js las reemplaza en tiempo de build. Las demás usan `process.env[name]` (acceso dinámico) y se resuelven en runtime.

---

## 11. errorLogger.ts

**Archivo:** `lib/errorLogger.ts` (~55 líneas)
**Consumido por:** `ErrorBoundary` (componente), servicios de datos
**Dependencia:** `@sentry/nextjs`

Sistema de logging estructurado con severidades, integrado con Sentry para monitoreo en producción.

### Tipos

- `ErrorSeverity` — `'info' | 'warning' | 'error' | 'critical'`
- `ErrorLogEntry` — `{timestamp, severity, source, message, stack?, context?}`

### Funciones

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `logError(source, error, context?, severity?)` | `source: string, error: unknown, context?: Record<string, unknown>, severity?: ErrorSeverity` | `void` | Loguea con `console.error` (error/critical) o `console.warn` (warning). Envía a Sentry: errores error/critical van a `Sentry.captureException()`, warnings a `Sentry.captureMessage()` con tags de source y severity |
| `logWarning(source, message, context?)` | `source: string, message: string, context?: Record<string, unknown>` | `void` | Shortcut para `logError` con severity `'warning'` |

### Integración con Sentry

- **error / critical:** → `Sentry.captureException()` con tags `{source, severity}` y extra context
- **warning:** → `Sentry.captureMessage()` con level `'warning'`, tags `{source}`, y extra context
- **info:** Solo console.log, no se envía a Sentry

---

## 12. supabase.ts

**Archivo:** `lib/supabase.ts` (~4 líneas)
**Consumido por:** Todos los servicios

```typescript
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

Cliente singleton compartido por todos los servicios. Usa `env.ts` para validación de variables de entorno.

---

## 13. alertEngine.ts

**Archivo:** `lib/alertEngine.ts` (~160 líneas)
**Consumido por:** DashboardPage (via hook `useAlerts`), NotificationCenter (via listener `onAlertFired`)

Motor de alertas basado en reglas que evalúa métricas del negocio y dispara notificaciones toast (Sonner) cuando se cumplen condiciones predefinidas. Incluye sistema de cooldown para evitar spam y patrón pub/sub para comunicar alertas al NotificationCenter.

### Tipos

| Tipo | Descripción |
|------|-------------|
| `AlertSeverity` | `"info" \| "warning" \| "critical"` |
| `AlertCategory` | `"financial" \| "operations" \| "inventory" \| "reservations" \| "system"` |
| `AlertRule` | Regla con id, nombre, categoría, severidad, condición, mensaje y cooldown |
| `AlertContext` | Datos de métricas para evaluación (financieros, reservas, operaciones, inventario, revenue) |

### Reglas predefinidas (7)

| ID | Categoría | Severidad | Condición | Cooldown |
|----|-----------|-----------|-----------|----------|
| `low-occupancy` | reservations | warning | Ocupación < 40% | 60 min |
| `high-food-cost` | financial | critical | Food cost > objetivo (32%) | 120 min |
| `high-labor-cost` | financial | warning | Coste laboral > objetivo (35%) | 120 min |
| `overdue-invoices` | financial | critical | Facturas vencidas > 0 | 240 min |
| `low-ticket` | financial | info | Ticket medio < 85% del objetivo | 60 min |
| `daily-revenue-below-target` | financial | warning | Ingresos diarios < 80% del objetivo | 120 min |
| `high-cancellations` | reservations | warning | Cancelaciones > 5 | 180 min |

### Funciones

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `evaluateAlerts(context, rules?)` | `AlertContext, AlertRule[]` | `void` | Evalúa todas las reglas contra el contexto. Dispara toasts (Sonner) y notifica listeners. Respeta cooldowns |
| `onAlertFired(listener)` | `(message, severity) => void` | `() => void` | Suscribe un listener a alertas disparadas. Retorna función de unsuscribe |
| `resetAlertCooldowns()` | — | `void` | Limpia todos los cooldowns (para testing) |

### Hook asociado: `hooks/useAlerts.ts`

| Hook | Parámetros | Descripción |
|------|-----------|-------------|
| `useAlerts(context, enabled?)` | `AlertContext \| null, boolean` | Evalúa alertas cuando cambian los datos. Throttle de 30 segundos entre evaluaciones |

---

## 14. Query Hooks (`hooks/queries/`)

**Directorio:** `hooks/queries/` (8 módulos + barrel index)
**Dependencia:** `@tanstack/react-query` v5
**Proveedor:** `components/providers/QueryProvider.tsx` (integrado en `app/layout.tsx`)

Hooks reutilizables que envuelven las funciones de fetching existentes con TanStack React Query. Proporcionan caching automático, deduplicación de requests, invalidación por queryKey, y refetch on window focus.

### Configuración global del QueryClient

| Opción | Valor | Descripción |
|--------|-------|-------------|
| `staleTime` | 5 min | Tiempo antes de considerar datos obsoletos |
| `gcTime` | 30 min | Tiempo que se mantiene el cache en memoria |
| `refetchOnWindowFocus` | `true` | Refresca al volver a la pestaña |
| `retry` | 2 reintentos (0 en 401) | No reintenta errores de autenticación |

### staleTime por tipo de dato

| Categoría de datos | staleTime | Ejemplos |
|-------------------|-----------|----------|
| Tiempo real | 1-2 min | Ventas live, operaciones |
| Reservas | 10 min | Ocupación semanal |
| Financieros / Gastos | 15 min | KPIs, gastos, tesorería |
| Históricos | 30 min | Benchmarks, comparativas anuales, food cost |

### Módulos de hooks

| Módulo | Hooks | Fuente de datos |
|--------|-------|----------------|
| `useDashboardData.ts` | 6 | `lib/dataService.ts` |
| `useReservationsData.ts` | 3 | `lib/dataService.ts` |
| `useIncomeData.ts` | 2 | `lib/dataService.ts` |
| `useExpensesData.ts` | 5 | `lib/dataService.ts` |
| `useTreasuryData.ts` | 13 | `lib/treasuryService.ts` |
| `useOperationsData.ts` | 7 | `lib/dataService.ts` + `lib/operativaService.ts` |
| `useProductsData.ts` | 4 | `lib/dataService.ts` |
| `useForecastingData.ts` | 3 | `lib/dataService.ts` |
| **Total** | **43** | |

### Hooks del Dashboard

| Hook | Parámetros | queryKey | staleTime | refetchInterval |
|------|-----------|----------|-----------|-----------------|
| `useRealTimeData()` | — | `["realTimeData"]` | 1 min | 2 min |
| `useWeekReservations(offset?)` | `offsetWeeks: number` | `["weekReservations", offset]` | 10 min | — |
| `useFinancialKPIs()` | — | `["financialKPIs"]` | 15 min | — |
| `useLaborCostAnalysis(start, end)` | `startDate, endDate: string` | `["laborCost", start, end]` | 15 min | — |
| `useWeekRevenue(offset?)` | `weekOffset: number` | `["weekRevenue", offset]` | 5 min | — |
| `useOcupacionSemanal()` | — | `["ocupacionSemanal"]` | 10 min | — |

### Hooks de Reservas

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useReservationsFromDB(start, end)` | `Date \| null, Date \| null` | `["reservationsDB", start, end]` |
| `useYearlyComparison()` | — | `["yearlyComparison"]` |
| `usePeriodComparison(...)` | `startDay, startMonth, endDay, endMonth, yearA, yearB, enabled` | `["periodComparison", ...]` |

### Hooks de Ingresos

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useIncomeFromDB(start, end)` | `Date \| null, Date \| null` | `["incomeDB", start, end]` |
| `useTableBillingFromDB(start, end)` | `Date \| null, Date \| null` | `["tableBillingDB", start, end]` |

### Hooks de Gastos

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useExpenseTags()` | — | `["expenseTags"]` |
| `useExpensesByTags(tags?, start?, end?, status?)` | opcionales | `["expensesByTags", ...]` |
| `useExpensesByDueDate(start, end, status?)` | fechas + estado | `["expensesByDueDate", ...]` |
| `useExpenseSummaryByTags(tags?, start?, end?)` | opcionales | `["expenseSummaryByTags", ...]` |
| `useExpenseSummaryByProvider(start?, end?)` | opcionales | `["expenseSummaryByProvider", ...]` |

### Hooks de Tesorería

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useTreasuryKPIs(start?, end?)` | fechas opcionales | `["treasuryKPIs", ...]` |
| `useTreasuryAccounts()` | — | `["treasuryAccounts"]` |
| `useTreasuryTransactions(...)` | 8 parámetros con paginación | `["treasuryTransactions", ...]` |
| `useTreasuryTransactionsSummary(...)` | 6 parámetros de filtro | `["treasuryTransactionsSummary", ...]` |
| `useTreasuryCategories()` | — | `["treasuryCategories"]` |
| `useTreasuryByCategory(start?, end?)` | fechas opcionales | `["treasuryByCategory", ...]` |
| `useTreasuryMonthlySummary(start?, end?)` | fechas opcionales | `["treasuryMonthlySummary", ...]` |
| `usePoolBancarioResumen()` | — | `["poolBancarioResumen"]` |
| `usePoolBancarioPrestamos()` | — | `["poolBancarioPrestamos"]` |
| `usePoolBancarioVencimientos(limit?)` | `limit: number` | `["poolBancarioVencimientos", limit]` |
| `usePoolBancarioPorBanco()` | — | `["poolBancarioPorBanco"]` |
| `usePoolBancarioCalendario(meses?)` | `meses: number` | `["poolBancarioCalendario", meses]` |

### Hooks de Operaciones

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useOperationsRealTime()` | — | `["operationsRealTime"]` |
| `useOperativaKPIs(start, end, tipo?, cat?)` | `Date` + filtros | `["operativaKPIs", ...]` |
| `useOperativaProductos(start, end, tipo?, cat?)` | `Date` + filtros | `["operativaProductos", ...]` |
| `useOperativaCliente(start, end)` | `Date \| null` | `["operativaCliente", ...]` |
| `useOperativaPorHora(start, end)` | `Date \| null` | `["operativaPorHora", ...]` |
| `useOperativaItems(start, end, tipo?, cat?)` | `Date` + filtros | `["operativaItems", ...]` |
| `useOperativaCategorias(start, end)` | `Date \| null` | `["operativaCategorias", ...]` |

### Hooks de Productos

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useProductMix(start, end, turno?, cat?)` | fechas string + filtros | `["productMix", ...]` |
| `useCategoryMix(start, end, turno?)` | fechas string + turno | `["categoryMix", ...]` |
| `useOptionMix(start, end, turno?, extraPago?)` | fechas string + filtros | `["optionMix", ...]` |
| `useFoodCostProducts()` | — | `["foodCostProducts"]` |

### Hooks de Forecasting

| Hook | Parámetros | queryKey |
|------|-----------|----------|
| `useForecastData()` | — | `["forecastData"]` |
| `useForecastCalendar(year, month)` | `year, month: number` | `["forecastCalendar", year, month]` |
| `useBenchmarks(inicio, fin)` | `fechaInicio, fechaFin: string` | `["benchmarks", inicio, fin]` |

### Uso típico

```typescript
// Antes (patrón manual)
const [data, setData] = useState<Type[]>([])
const [loading, setLoading] = useState(true)
const loadData = useCallback(async () => {
  setLoading(true)
  const result = await fetchData(params)
  setData(result)
  setLoading(false)
}, [params])
useEffect(() => { loadData() }, [loadData])

// Después (con React Query hook)
const { data, isLoading, error } = useFinancialKPIs()
```

---

## 14. exportUtils.ts

**Archivo:** `lib/exportUtils.ts` (~140 líneas)
**Consumido por:** DashboardPage, TreasuryPage, ExpensesPage, ReservationsPage (vía `ExportButton`)
**Dependencias externas:** `jspdf`, `jspdf-autotable`, `file-saver`

Utilidades de exportación de datos a CSV y PDF con formato español y branding NÜA.

### Funciones

| Función | Parámetros | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `exportToCSV(options)` | `CSVExportOptions` | `void` | Genera archivo CSV con separador `;` (compatibilidad Excel español), BOM UTF-8, y separador decimal coma |
| `exportToPDF(options)` | `PDFExportOptions` | `Promise<void>` | Genera PDF con tabla autoTable, colores NÜA (#02b1c4), header/footer con paginación, y resumen de KPIs opcional. Import dinámico de jsPDF |

### Interfaces

| Tipo | Campos principales |
|------|-------------------|
| `CSVExportOptions` | `filename`, `headers`, `rows`, `decimalSeparator?` |
| `PDFExportOptions` | `filename`, `title`, `subtitle?`, `headers`, `rows`, `orientation?`, `summary?` |

### Componente asociado: `components/ui/ExportButton.tsx`

Botón dropdown reutilizable con opciones "Exportar CSV" y "Exportar PDF". Recibe callbacks `onExportCSV` y `onExportPDF`. Soporta tamaños `sm` y `md`.

---

## 18. bankConnectionsService.ts

**Archivo:** `lib/bankConnectionsService.ts`
**Consumido por:** `TreasuryPage`, `TreasuryDashboardTab`, `TreasuryConexionesTab`

Lee datos bancarios directamente de Supabase y delega acciones (sync, conexión, renovación) a las **API routes internas** (`/api/gocardless/*`). Ya no depende de una subapp externa.

### Funciones

| Función | Retorna | Descripción |
|---------|---------|-------------|
| `fetchBankAccounts()` | `BankAccount[]` | Cuentas activas con saldo, IBAN, institución (logo+nombre). Queries paralelas a `gocardless_accounts` + `gocardless_institutions` con JOIN manual vía Map |
| `fetchConsolidatedBalance()` | `BankConsolidatedBalance` | Saldo total agregado, nº cuentas, nº bancos, lista de cuentas |
| `fetchBankTransactions(filters)` | `BankTransactionsResult` | Transacciones con filtros (búsqueda, cuenta, fechas, tipo), paginación server-side, stats del período |
| `fetchConsentStatus()` | `BankConsentInfo` | Días hasta renovación del consentimiento más próximo a expirar |
| `triggerAccountSync(accountId)` | `BankSyncResult` | Llama `POST /api/gocardless/accounts/{id}/full-sync` — acepta UUID o gocardless_id |
| `getGoCardlessAppUrl()` | `string` | Devuelve `/api/gocardless` (hardcoded, ya no usa env var) |
| `fetchInstitutions(country?)` | `BankInstitution[]` | GET `/api/gocardless/institutions?country=ES` — Lee de Supabase `gocardless_institutions` filtrado por país |
| `createRequisition(institutionId, redirectUrl, reference)` | `BankRequisitionCreateResult` | POST `/api/gocardless/requisitions/create` — Crea requisition en GoCardless API y guarda en Supabase |
| `pollRequisitionStatus(reference)` | `BankRequisitionStatus \| null` | GET `/api/gocardless/requisitions/{id}/status` — Consulta estado en GoCardless API |
| `fetchRequisitionAccounts(reference)` | `BankConnectedAccount[]` | GET `/api/gocardless/requisitions/{id}/accounts` — Cuentas conectadas tras autorización |
| `triggerInitialSync(accounts[])` | `BankInitialSyncResult \| null` | POST `/api/gocardless/sync/initial` — Sincronización inicial de cuentas recién conectadas |
| `fetchSyncStatus()` | `SyncStatus \| null` | GET `/api/gocardless/sync/status` — Estado centralizado de sync: rate limits del día, último sync, días de consentimiento |

### Helpers internos

| Helper | Descripción |
|--------|-------------|
| `tryParseJson(raw)` | Intenta `JSON.parse` sobre strings — necesario porque Supabase devuelve columnas `text` como strings aunque contengan JSON |
| `parseBalance(raw)` | Parsea saldos que pueden ser JSON `{amount, currency}` o número directo. Usa `tryParseJson` |
| `parseAmount(raw)` | Parsea amounts de transacciones (JSON o string). Usa `tryParseJson` |
| `parseCurrency(raw)` | Extrae currency de JSON o devuelve fallback "EUR". Usa `tryParseJson` |

### Tablas consultadas

| Tabla | Campos principales |
|-------|-------------------|
| `gocardless_accounts` | `id`, `gocardless_id`, `name`, `display_name`, `iban`, `current_balance`, `currency`, `status`, `last_sync_at` |
| `gocardless_institutions` | `name`, `logo_url` |
| `gocardless_transactions` | `amount`, `booking_date`, `remittance_information_unstructured`, `creditor_name`, `debtor_name`, `balance_after_transaction` |
| `gocardless_requisitions` | `expires_at`, `created_at`, `status`, `institution_id` |

---

## 19. gocardless.ts (GoCardless API Client)

**Archivo:** `lib/gocardless.ts`
**Consumido por:** API routes en `app/api/gocardless/*`

Cliente singleton para la API de GoCardless Open Banking (`https://bankaccountdata.gocardless.com/api/v2/`). Solo se ejecuta en el servidor (API routes).

### Credenciales

| Variable de entorno | Descripción |
|---------------------|-------------|
| `GOCARDLESS_SECRET_ID` | ID del secreto GoCardless |
| `GOCARDLESS_SECRET_KEY` | Clave del secreto GoCardless |

### Clase `GoCardlessClient`

| Método | Descripción |
|--------|-------------|
| `getAccessToken()` | Obtiene token de acceso. Auto-refresh si el token actual ha expirado. Lanza error descriptivo si faltan credenciales |
| `makeRequest(endpoint, options)` | Ejecuta request autenticada contra la API. Retry automático en 401 (re-obtiene token) |
| `getInstitutions(country)` | Lista instituciones bancarias por país |
| `createRequisition(institutionId, redirectUrl, options)` | Crea solicitud de conexión bancaria (OAuth) |
| `getRequisition(requisitionId)` | Consulta estado de una requisición |
| `getAccountBalances(accountId)` | Obtiene saldos de una cuenta (usa `gocardless_id`) |
| `getAccountTransactions(accountId)` | Obtiene transacciones booked + pending (usa `gocardless_id`) |
| `getAccountDetails(accountId)` | Obtiene detalles de una cuenta |
| `getRateLimitInfo()` | Devuelve info de rate limits de la última respuesta |

**Exportado como singleton:** `export const gocardless = new GoCardlessClient()`

---

## 20. gocardlessRateLimit.ts

**Archivo:** `lib/gocardlessRateLimit.ts`
**Consumido por:** `app/api/gocardless/accounts/[id]/full-sync/route.ts`

Gestiona rate limits de la API de GoCardless: máximo 4 requests/día por cuenta por scope (balances, transactions, details).

### Clase `GoCardlessRateLimitManager`

| Método | Descripción |
|--------|-------------|
| `canMakeRequest(accountId, scope)` | Verifica si se puede hacer una request para un scope dado |
| `checkMultipleScopes(accountId, scopes[])` | Verifica múltiples scopes en paralelo |
| `updateRateLimit(accountId, scope, remaining)` | Actualiza el contador de rate limit tras una request exitosa |

### Características

- **4 requests/día** por cuenta por scope (balances, transactions, details)
- **Cache en memoria** de 5 minutos (`Map<string, { canRequest, cachedAt }>`)
- **Tabla Supabase:** `gocardless_rate_limits` (`account_id`, `scope`, `remaining_requests`, `last_request_at`, `reset_at`)

**Exportado como singleton:** `export const gocardlessRateLimit = new GoCardlessRateLimitManager()`

---

## 21. API Route: sync/status

**Archivo:** `app/api/gocardless/sync/status/route.ts`
**Consumido por:** `bankConnectionsService.ts` → `fetchSyncStatus()`

Endpoint `GET` que agrega el estado actual de sincronización desde 3 tablas de Supabase. Diseñado para alimentar el panel centralizado de sync en el Dashboard de Treasury.

### Respuesta (`SyncStatus`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lastSyncAt` | `string \| null` | Timestamp del sync más reciente de todas las cuentas |
| `rateLimits.transactions` | `{ remaining, limit }` | Requests restantes para scope "transactions" (mínimo entre todas las cuentas) |
| `rateLimits.balances` | `{ remaining, limit }` | Requests restantes para scope "balances" (mínimo entre todas las cuentas) |
| `consentDaysRemaining` | `number \| null` | Días restantes del consentimiento (90 días desde creación de requisition "LN") |
| `consentInstitutionId` | `string \| null` | ID de la institución del consentimiento más reciente |

### Tablas consultadas

| Tabla | Datos extraídos |
|-------|----------------|
| `gocardless_rate_limits` | `remaining_calls` y `limit_per_day` por scope para el día actual |
| `gocardless_accounts` | `last_sync_at` más reciente |
| `gocardless_requisitions` | `created_at` y `institution_id` de la requisition activa ("LN") más reciente |
