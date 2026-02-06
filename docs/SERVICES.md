# Servicios de Datos — NÜA Smart App

Documentación de los 9 servicios en `lib/`. Cada servicio encapsula las queries a Supabase y la lógica de acceso a datos.

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

---

## Resumen de Fuentes de Datos

### Vistas materializadas de Supabase (29)

| Prefijo | Vistas |
|---------|--------|
| `vw_` | `vw_dashboard_ventas_facturas_live`, `vw_dashboard_financiero`, `vw_dashboard_ocupacion`, `vw_metricas_diarias_base`, `vw_facturacion_mesas`, `vw_operaciones_tiempo_real`, `vw_mix_productos`, `vw_mix_categorias`, `vw_mix_opciones`, `vw_forecasting_analysis`, `vw_labor_cost_analysis`, `vw_food_cost`, `vw_operativa_items`, `vw_compras_pedidos`, `vw_compras_conciliacion`, `vw_compras_albaranes_para_vincular`, `vw_compras_proveedores`, `vw_compras_resumen` |
| `v_` | `v_facturacion_resumen_global`, `v_facturas_listado`, `v_facturas_cuadre_diario`, `v_ingresos_por_categoria`, `v_facturas_alertas`, `v_facturacion_mensual`, `v_pool_bancario_resumen`, `v_pool_bancario_prestamos`, `v_pool_bancario_proximos_vencimientos`, `v_pool_bancario_por_banco`, `v_pool_bancario_calendario_mensual` |

### Tablas directas (11)

`reservas_agregadas_diarias`, `forecasting_weather_history`, `gstock_product_formats`, `facturacion_alertas`, `tables`, `turnos`, `gstock_sync_logs`, `gocardless_sync_logs`, `cuentica_logs`, `billin_logs`, `business_views_refresh_log`

### RPCs (43)

`rpc_facturacion_semana`, `get_expense_tags`, `get_gastos_by_tags`, `get_gastos_by_due_date`, `get_gastos_resumen_by_tags`, `get_gastos_resumen_by_provider`, `get_benchmarks_resumen`, `update_manual_price`, `update_variant_manual_price`, `clear_manual_price`, `get_operativa_kpis`, `get_operativa_productos`, `get_operativa_cliente`, `get_operativa_por_hora`, `get_treasury_kpis`, `get_treasury_accounts`, `get_treasury_transactions`, `get_treasury_transactions_summary`, `get_treasury_categories`, `update_transaction_category`, `get_treasury_by_category`, `get_treasury_monthly_summary`, `get_database_size`, `get_tables_size`, `fn_conciliar_manual`, `fn_confirmar_conciliacion`, `fn_descartar_conciliacion`, `compras_kpis`, `compras_evolucion_mensual`, `compras_distribucion`, `compras_top_productos`, `compras_tabla_jerarquica`, `rpc_get_cuadre_listado`, `rpc_get_facturas_zreport`, `rpc_get_zreports_disponibles`, `rpc_get_facturas_huerfanas`, `rpc_get_facturas_adyacentes`, `rpc_mover_factura`, `rpc_crear_ajuste`, `rpc_get_ajustes`, `rpc_eliminar_ajuste`, `rpc_confirmar_cuadre`, `rpc_marcar_pendiente`

---

## 1. dataService.ts

**Archivo:** `lib/dataService.ts` (~2574 líneas)
**Consumido por:** DashboardPage, ReservationsPage, IncomePage, ExpensesPage, CostesPage, ProductsPage, ForecastingPage, OperationsPage

Servicio principal y más extenso. Contiene funciones para dashboard en tiempo real, reservas, ingresos, gastos, operaciones, productos, forecasting, costes y benchmarks.

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
| `fetchFoodCostProducts()` | — | `Promise<FoodCostSummary>` | Vista `vw_food_cost` → `.select("*").order("food_cost_pct", desc)` |
| `updateManualPrice(sku, variantId, price)` | `sku: string, variantId?: string, newPrice: number` | `Promise<{success, error?}>` | RPC `update_manual_price` o `update_variant_manual_price` |
| `clearManualPrice(sku, variantId)` | `sku: string, variantId?: string` | `Promise<{success, error?}>` | RPC `clear_manual_price` o update con null |

### Mock (datos generados localmente)

| Función | Descripción |
|---------|-------------|
| `fetchHistoryRange(start, end)` | Genera `DailyCompleteMetrics[]` desde array `mockHistory` (400 días) |
| `fetchFinancialHistory(period)` | Genera datos financieros mock agrupados por mes |
| `fetchUpcomingInvoices(days)` | Genera facturas de proveedor aleatorias |

---

## 2. comprasService.ts

**Archivo:** `lib/comprasService.ts` (~321 líneas)
**Consumido por:** ComprasPage

> **Nota:** `fetchPedidos()` mapea el campo `items` (nombre en la vista Supabase) a `pedido_items` (nombre en el tipo TypeScript `CompraPedido`). Este mapeo es necesario porque la vista `vw_compras_pedidos` usa `items` como nombre de columna JSONB.

> **Nota:** `fetchFacturasConciliacion()` lee de `vw_compras_facturas_pendientes` (no de `vw_compras_conciliacion` que depende de tabla vacía). Mapea campos al tipo `CompraFacturaConciliacion`.

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
| `fetchIntegrationStatuses()` | — | `Promise<IntegrationStatus[]>` | Tablas: `gstock_sync_logs` (último), `gocardless_sync_logs` (último), `cuentica_logs` (último), `billin_logs` (último) + Supabase siempre "ok" |
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

## Archivo auxiliar: supabase.ts

**Archivo:** `lib/supabase.ts`
**Consumido por:** Todos los servicios

```typescript
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Cliente singleton compartido por todos los servicios.
