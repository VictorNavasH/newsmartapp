# Vistas — NÜA Smart App

Documentación detallada de las 15 vistas principales. Cada vista se renderiza desde `app/page.tsx` mediante un `switch(currentPath)`.

---

## Índice

1. [Dashboard (`/`)](#1-dashboard)
2. [Reservas (`/reservations`)](#2-reservas)
3. [Ingresos (`/revenue`)](#3-ingresos)
4. [Gastos (`/expenses`)](#4-gastos)
5. [Costes (`/costs`)](#5-costes)
6. [Compras (`/purchases`)](#6-compras)
7. [Operaciones (`/operations`)](#7-operaciones)
8. [Productos (`/products`)](#8-productos)
9. [Facturación (`/invoices`)](#9-facturación)
10. [Tesorería (`/treasury`)](#10-tesorería)
11. [Forecasting (`/forecasting`)](#11-forecasting)
12. [What-If (`/what-if`)](#12-what-if)
13. [Asistente IA (`/ai-assistant`)](#13-asistente-ia)
14. [Conexiones Bancarias (`/bank-connections`)](#14-conexiones-bancarias)
15. [Uso de Mesas (`/tablet-usage`)](#15-uso-de-mesas)
16. [Configuración (`/settings`)](#16-configuración)

---

## 1. Dashboard

| Campo | Valor |
|-------|-------|
| **Ruta** | `/` |
| **Componente** | `DashboardPage.tsx` |
| **Archivo** | `components/views/DashboardPage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Named export `DashboardPage` |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchRealTimeData()` | Vista `vw_dashboard_ventas_facturas_live` | `RealTimeData` |
| `fetchFinancialKPIs()` | Vista `vw_dashboard_financiero` | `FinancialKPIs[]` |
| `fetchLaborCostAnalysis(start, end)` | Vista `vw_labor_cost_analysis` | `LaborCostDay[]` |
| `fetchWeekRevenue(weekOffset)` | RPC `rpc_facturacion_semana` | `WeekRevenueDay[]` |

### Secciones

1. **Cabecera con estado en tiempo real** — Indicador de conexión a DB, última actualización, botón de refresco
2. **Tarjetas de métricas en vivo** — Facturación total del día, comensales, ticket medio, desglose comida/cena con porcentajes
3. **KPIs financieros** — Períodos: mes, trimestre, año. Métricas: ingresos, gastos, beneficio, margen
4. **Gráfico de facturación semanal** — BarChart con navegación por semana (weekOffset), muestra facturación diaria
5. **Coste laboral** — Gráfico de coste laboral últimos N días (configurable: 15/30/60), línea de tendencia
6. **Previsión meteorológica** — Componente `<WeatherCard />` con datos de AEMET
7. **Ocupación semanal** — Componente `<WeekReservationsCard />` con reservas de la semana

### Filtros

- Período financiero: `mes | trimestre | año`
- Días de coste laboral: `15 | 30 | 60`
- Semana de facturación: navegación con `weekOffset`

### Auto-refresh

- Intervalo de 60 segundos para datos en tiempo real
- Botón manual de refresco

---

## 2. Reservas

| Campo | Valor |
|-------|-------|
| **Ruta** | `/reservations` |
| **Componente** | `ReservationsPage` |
| **Archivo** | `components/views/ReservationsPage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchReservationsFromDB(start, end)` | Vista `vw_metricas_diarias_base` | `DailyCompleteMetrics[]` |
| `fetchYearlyComparison()` | Tabla `reservas_agregadas_diarias` | `YearlyComparisonData[]` |
| `fetchPeriodComparison(...)` | Tabla `reservas_agregadas_diarias` | `{yearA, yearB}` |

### Secciones

1. **Tarjetas KPI** — Reservas totales, comensales, ocupación (%), ratio comensales/reserva
2. **Gráfico diario** — ComposedChart con barras de comensales + línea de reservas
3. **Comparación interanual** — Gráfico de líneas superpuestas por año (2021-2027), filtrable por métrica y turno
4. **Comparación de períodos** — Selección de dos años para comparar el mismo rango de fechas

### Filtros

- Período rápido: `hoy | ayer | semana | mes | trimestre | custom`
- DateRangePicker para rango personalizado
- Comparación interanual: métrica (`comensales | reservas`), turno (`total | comida | cena`)

### Cálculos frontend

- Ocupación: `(comensales / capacidad) × 100`
- Ratio comensales/reserva: `total_comensales / total_reservas`
- Agregación de datos con `useMemo` + hook `useComparison` para delta vs período anterior

---

## 3. Ingresos

| Campo | Valor |
|-------|-------|
| **Ruta** | `/revenue` |
| **Componente** | `IncomePage` |
| **Archivo** | `components/views/IncomePage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchIncomeFromDB(start, end)` | Vista `vw_metricas_diarias_base` | `DailyCompleteMetrics[]` |
| `fetchTableBillingFromDB(start, end)` | Vista `vw_facturacion_mesas` | `TableBillingMetrics[]` |
| `aggregateMetrics(data)` | — (cálculo en memoria) | `DailyCompleteMetrics` |
| `aggregateTableMetrics(data)` | — (cálculo en memoria) | `TableAggregatedMetrics[]` |

### Secciones

1. **Tarjetas KPI** — Facturación total, ticket medio comida, ticket medio cena, comensales
2. **Gráfico de tendencia** — ComposedChart con línea de facturación diaria
3. **Ranking de mesas** — Tabla con facturación por mesa, selectable para ver detalle individual
4. **Comparación vs período anterior** — Delta automático con `calculatePreviousPeriod`

### Filtros

- Período rápido: `hoy | ayer | semana | mes | trimestre | custom`
- Selector de mesa individual para detalle

### Cálculos frontend

- Ticket medio: `facturacion / comensales`
- Agregación de métricas diarias a total del período
- Rankings de mesa por facturación total

---

## 4. Gastos

| Campo | Valor |
|-------|-------|
| **Ruta** | `/expenses` |
| **Componente** | `ExpensesPage` |
| **Archivo** | `components/views/ExpensesPage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchExpenseTags()` | RPC `get_expense_tags` | `ExpenseTag[]` |
| `fetchExpensesByTags(tags, start, end, status)` | RPC `get_gastos_by_tags` | `Expense[]` |
| `fetchExpenseSummaryByTags(tags, start, end)` | RPC `get_gastos_resumen_by_tags` | `ExpenseTagSummary[]` |
| `fetchExpensesByDueDate(start, end, status)` | RPC `get_gastos_by_due_date` | `Expense[]` |

### Secciones

1. **KPIs de gastos** — Total gastado, facturas pendientes, facturas vencidas, promedio por factura
2. **Gráfico de categorías** — PieChart con distribución por etiqueta/categoría
3. **Listado de facturas** — Tabla paginada con estado, proveedor, importe, fecha de vencimiento
4. **Detalle lateral** — Sheet/drawer con detalle completo de cada factura

### Filtros

- Estado: `todos | pagado | pendiente | vencido`
- Etiquetas de gasto (multi-select)
- DateRangePicker con calendario visual integrado
- Fecha de emisión o fecha de vencimiento

### Cálculos frontend

- Totales por estado
- Distribución porcentual por categoría
- Facturas vencidas (fecha vencimiento < hoy)

---

## 5. Costes

| Campo | Valor |
|-------|-------|
| **Ruta** | `/costs` |
| **Componente** | `CostesPage` |
| **Archivo** | `components/views/CostesPage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Default export |

### Secciones (MenuBar con 4 tabs)

1. **Recetas** — iframe embebido de SmartFood (`smartfood.nuasmartrestaurant.com`)
2. **Food Cost** — Componente `<FoodCostTab />`
   - Consume `fetchFoodCostProducts()` → Vista `vw_food_cost`
   - Lista de productos con SKU, coste, PVP, margen, food cost %
   - Edición de precio manual con `updateManualPrice()` / `clearManualPrice()`
3. **Escandallos** — iframe embebido de SmartFood
4. **Benchmarks** — Componente `<BenchmarksTab />`
   - Consume `fetchBenchmarks(fechaInicio, fechaFin)` → RPC `get_benchmarks_resumen`
   - Comparación vs sector: food cost, labor cost, prime cost, ratio gastos

### Filtros

- Período cerrado: `mes | trimestre | semestre | año` con selector de período específico
- Filtros de food cost: búsqueda por producto, ordenación

### Datos externos

| Función | Fuente Supabase |
|---------|----------------|
| `fetchBenchmarks()` | RPC `get_benchmarks_resumen` |
| `fetchFoodCostProducts()` | Vista `vw_food_cost` |
| `updateManualPrice()` | RPC `update_manual_price` / `update_variant_manual_price` |
| `clearManualPrice()` | RPC `clear_manual_price` |

---

## 6. Compras

| Campo | Valor |
|-------|-------|
| **Ruta** | `/purchases` |
| **Componente** | `ComprasPage` |
| **Archivo** | `components/views/ComprasPage.tsx` |
| **Servicio(s)** | `comprasService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchPedidos(filters)` | Vista `vw_compras_pedidos` | `CompraPedido[]` |
| `fetchFacturasConciliacion(filters)` | Vista `vw_compras_conciliacion` | `CompraFacturaConciliacion[]` |
| `fetchAlbaranesDisponibles(proveedorId)` | Vista `vw_compras_albaranes_para_vincular` | `CompraAlbaranDisponible[]` |
| `fetchProveedores()` | Vista `vw_compras_proveedores` | `CompraProveedor[]` |
| `fetchKPIs()` | Vista `vw_compras_resumen` | `CompraKPIs` |
| `fetchComprasAnalisisKPIs(rango)` | RPC `compras_kpis` | `CompraAnalisisKPI` |
| `fetchComprasDistribucion(rango)` | RPC `compras_distribucion` | `CompraDistribucionCategoria[]` |
| `fetchComprasTopProductos(rango)` | RPC `compras_top_productos` | `CompraTopProducto[]` |
| `fetchComprasEvolucionMensual(meses)` | RPC `compras_evolucion_mensual` | `CompraEvolucionMensual[]` |
| `fetchComprasTablaJerarquica(rango)` | RPC `compras_tabla_jerarquica` | `CompraTablaJerarquica[]` |

### Acciones (escritura)

| Función | RPC | Descripción |
|---------|-----|-------------|
| `vincularAlbaranes(facturaId, albaranIds)` | `fn_conciliar_manual` | Vincular albaranes a factura |
| `confirmarConciliacion(id, notas)` | `fn_confirmar_conciliacion` | Confirmar conciliación |
| `descartarConciliacion(facturaId, motivo)` | `fn_descartar_conciliacion` | Descartar conciliación |

### Secciones (MenuBar con 3 tabs)

1. **Pedidos** — Listado de pedidos de compra con estado, proveedor, líneas, totales
2. **Conciliación** — Facturas vs albaranes, vinculación manual, confirmación/descarte
3. **Análisis** — KPIs de compras, distribución por categoría, top productos, evolución mensual, tabla jerárquica

### Filtros

- Proveedor (selector dinámico)
- Estado de pedido
- Rango de fechas
- Estado de conciliación
- Estado de pago

---

## 7. Operaciones

| Campo | Valor |
|-------|-------|
| **Ruta** | `/operations` |
| **Componente** | `OperationsPage` |
| **Archivo** | `components/views/OperationsPage.tsx` |
| **Servicio(s)** | `operativaService.ts`, `dataService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchOperativaKPIs(start, end, tipo, cat)` | RPC `get_operativa_kpis` | `OperativaKPI[]` |
| `fetchOperativaProductos(start, end, tipo, cat)` | RPC `get_operativa_productos` | `OperativaProducto[]` |
| `fetchOperativaCliente(start, end)` | RPC `get_operativa_cliente` | `OperativaCliente[]` |
| `fetchOperativaPorHora(start, end)` | RPC `get_operativa_por_hora` | `OperativaPorHora[]` |
| `fetchOperativaItems(start, end, tipo, cat)` | Vista `vw_operativa_items` | `OperativaItem[]` |
| `fetchOperativaCategorias(start, end)` | Vista `vw_operativa_items` (dedup) | `string[]` |

### Secciones

1. **KPIs de tiempos** — Tiempo medio de preparación, entrega, total. Semáforo: verde (<15min), amarillo (<25min), rojo (>25min)
2. **Rendimiento por producto** — Tabla con tiempos cocina/sala por producto, ordenable
3. **Experiencia del cliente** — Tiempos por mesa, satisfacción
4. **Distribución horaria** — BarChart con volumen de pedidos por hora

### Filtros

- Período: `hoy | ayer | semana | mes | trimestre | custom`
- Tipo: `todos | comida | bebida`
- Categoría (dinámico, cargado de `fetchOperativaCategorias`)

### Umbrales de tiempos (constantes)

```
Cocina: bueno ≤ 15min, advertencia ≤ 25min, alerta > 25min
Sala:   bueno ≤ 8min, advertencia ≤ 15min, alerta > 15min
```

---

## 8. Productos

| Campo | Valor |
|-------|-------|
| **Ruta** | `/products` |
| **Componente** | `ProductsPage` |
| **Archivo** | `components/views/ProductsPage.tsx` |
| **Servicio(s)** | `dataService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchProductMix(start, end, turno, cat)` | Vista `vw_mix_productos` | `ProductMixItem[]` |
| `fetchCategoryMix(start, end, turno)` | Vista `vw_mix_categorias` | `CategoryMixItem[]` |
| `fetchOptionMix(start, end, turno, extraPago)` | Vista `vw_mix_opciones` | `OptionMixItem[]` |

### Secciones (MenuBar con 3 tabs)

1. **Productos** — Tabla con ranking, nombre, unidades, facturado, % del total. BarChart top 10. Buscador
2. **Categorías** — PieChart + tabla de distribución por categoría
3. **Opciones/Modificadores** — Tabla con opciones extra (filtro de solo extras de pago)

### Filtros

- Período: `ayer | semana | mes | trimestre | custom`
- Turno: `todos | comida | cena`
- Categoría (selector)
- Búsqueda por nombre de producto
- Ordenación: `facturado | unidades | nombre` (asc/desc)

### Cálculos frontend

- Agregación de productos por nombre (suma unidades, facturado)
- % del total: `facturado_producto / facturado_total × 100`
- Ranking por facturación

---

## 9. Facturación

| Campo | Valor |
|-------|-------|
| **Ruta** | `/invoices` |
| **Componente** | `FacturacionPage` |
| **Archivo** | `components/views/FacturacionPage.tsx` |
| **Servicio(s)** | `facturacionService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchFacturacionListado(start, end, filters, page)` | Vista `v_facturas_listado` | `{data, count}` |
| `fetchFacturacionKPIs(start, end)` | Vista `v_facturas_listado` (agr.) | KPIs calculados |
| `fetchTiposIngreso()` | Vista `v_ingresos_por_categoria` | `FacturacionTipoIngreso[]` |
| `fetchFacturacionAlertas()` | Vista `v_facturas_alertas` | `FacturacionAlerta[]` |
| `fetchFacturacionMensual()` | Vista `v_facturacion_mensual` | `FacturacionMensual[]` |
| `fetchCuadreListado(start, end)` | RPC `rpc_get_cuadre_listado` | `CuadreListadoItem[]` |
| `fetchFacturasZReport(zReportId)` | RPC `rpc_get_facturas_zreport` | `FacturaZReport[]` |
| `fetchZReportsDisponibles(fecha)` | RPC `rpc_get_zreports_disponibles` | `ZReportDisponible[]` |
| `fetchFacturasHuerfanas(fecha)` | RPC `rpc_get_facturas_huerfanas` | `FacturaHuerfana[]` |
| `fetchFacturasAdyacentes(fecha, id)` | RPC `rpc_get_facturas_adyacentes` | `FacturaAdyacente[]` |

### Acciones (escritura)

| Función | RPC | Descripción |
|---------|-----|-------------|
| `moverFactura(facturaId, nuevoZReportId)` | `rpc_mover_factura` | Mover factura entre Z-reports |
| `crearAjuste(params)` | `rpc_crear_ajuste` | Crear ajuste de cuadre |
| `eliminarAjuste(ajusteId)` | `rpc_eliminar_ajuste` | Eliminar ajuste |
| `confirmarCuadre(fecha, zReportId)` | `rpc_confirmar_cuadre` | Confirmar cuadre diario |
| `marcarPendiente(fecha, zReportId, motivo)` | `rpc_marcar_pendiente` | Marcar cuadre como pendiente |

### Secciones (MenuBar)

1. **Listado de facturas** — Tabla paginada con filtros de estado, método de pago, VeriFact
2. **KPIs** — Total facturado, tarjeta, efectivo, IVA, base imponible
3. **Cuadre diario** — Listado de días con estado de cuadre (cuadrado/pendiente/descuadre)
   - Drill-down por día: Z-reports, facturas del Z-report, facturas huérfanas
   - Mover facturas entre Z-reports
   - Crear/eliminar ajustes
   - Confirmar o marcar pendiente
4. **Tipos de ingreso** — Distribución por categoría
5. **Alertas** — Alertas de facturación (gaps, inconsistencias)
6. **Evolución mensual** — Gráfico de facturación mes a mes

### Filtros

- Período: tabs rápidos + DateRangePicker
- Estado de cuadre: `todos | cuadrado | pendiente | descuadre`
- Método de pago
- Estado VeriFact

---

## 10. Tesorería

| Campo | Valor |
|-------|-------|
| **Ruta** | `/treasury` |
| **Componente** | `TreasuryPage` |
| **Archivo** | `components/views/TreasuryPage.tsx` |
| **Servicio(s)** | `treasuryService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchTreasuryKPIs(start, end)` | RPC `get_treasury_kpis` | `TreasuryKPIs` |
| `fetchTreasuryAccounts()` | RPC `get_treasury_accounts` | `TreasuryAccount[]` |
| `fetchTreasuryTransactions(...)` | RPC `get_treasury_transactions` | `TreasuryTransaction[]` |
| `fetchTreasuryTransactionsSummary(...)` | RPC `get_treasury_transactions_summary` | `TreasuryTransactionsSummary` |
| `fetchTreasuryCategories()` | RPC `get_treasury_categories` | `TreasuryCategory[]` |
| `fetchTreasuryByCategory(start, end)` | RPC `get_treasury_by_category` | `TreasuryCategoryBreakdown[]` |
| `fetchTreasuryMonthlySummary(start, end)` | RPC `get_treasury_monthly_summary` | `TreasuryMonthlySummary[]` |
| `fetchPoolBancarioResumen()` | Vista `v_pool_bancario_resumen` | `PoolBancarioResumen` |
| `fetchPoolBancarioPrestamos()` | Vista `v_pool_bancario_prestamos` | `PoolBancarioPrestamo[]` |
| `fetchPoolBancarioVencimientos(limit)` | Vista `v_pool_bancario_proximos_vencimientos` | `PoolBancarioVencimiento[]` |
| `fetchPoolBancarioPorBanco()` | Vista `v_pool_bancario_por_banco` | `PoolBancarioPorBanco[]` |
| `fetchPoolBancarioCalendario(meses)` | Vista `v_pool_bancario_calendario_mensual` | `PoolBancarioCalendarioMes[]` |

### Acciones (escritura)

| Función | RPC | Descripción |
|---------|-----|-------------|
| `updateTransactionCategory(txId, catId, subCatId)` | `update_transaction_category` | Categorizar transacción |

### Secciones (MenuBar)

1. **Resumen** — KPIs: saldo total, ingresos, gastos, balance neto
2. **Cuentas** — Tarjetas por cuenta bancaria con saldo y última sincronización
3. **Movimientos** — Tabla de transacciones con categorización inline
4. **Categorías** — Distribución de gastos/ingresos por categoría
5. **Evolución mensual** — Gráfico de ingresos vs gastos por mes
6. **Pool bancario** — Resumen de deuda, préstamos activos, próximos vencimientos, distribución por banco, calendario de amortización

### Filtros

- Rango de fechas
- Cuenta bancaria
- Categoría
- Tipo: `todos | ingresos | gastos`
- Búsqueda por texto
- Paginación (limit/offset)

---

## 11. Forecasting

| Campo | Valor |
|-------|-------|
| **Ruta** | `/forecasting` |
| **Componente** | `ForecastingPage` |
| **Archivo** | `components/views/ForecastingPage.tsx` |
| **Servicio(s)** | `dataService.ts`, `whatIfService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchForecastData()` | Vista `vw_forecasting_analysis` | `{kpis, proximos7dias, precision}` |
| `fetchForecastCalendar(year, month)` | Vista `vw_forecasting_analysis` | `ForecastDay[]` |
| `fetchWhatIfReferenceData()` | Vista `vw_forecasting_analysis` | `WhatIfReferenceData` |

### Secciones (MenuBar)

1. **Dashboard de forecast** — KPIs de previsión: comensales previstos, facturación prevista, precisión del modelo
2. **Próximos 7 días** — Tabla/cards con previsión diaria (comensales, facturación, nivel de lluvia)
3. **Calendario** — Vista calendario mensual con previsiones por día, código de colores por ocupación
4. **Precisión del modelo** — Métricas de error: MAPE, desviación media

### Filtros

- Mes/año para calendario
- Navegación de mes con flechas

### Iconos de clima

Función `getWeatherIcon()` mapea nivel de lluvia a icono:
- `sin_lluvia` → ☀️ Sol
- `llovizna` → 🌧️ Llovizna
- `lluvia_ligera/moderada` → 🌧️ Lluvia
- `lluvia_fuerte` → 💧 Fuerte

---

## 12. What-If

| Campo | Valor |
|-------|-------|
| **Ruta** | `/what-if` |
| **Componente** | `WhatIfPage` |
| **Archivo** | `components/views/WhatIfPage.tsx` |
| **Servicio(s)** | `whatIfService.ts` |
| **Export** | Default export |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchWhatIfReferenceData()` | Vista `vw_forecasting_analysis` (60 últimos días reales) | `WhatIfReferenceData` |

### Simulador

Dos sliders controlan:
- **Comensales** — Ajustable
- **Ticket medio** — Ajustable

### Cálculos en tiempo real (frontend)

```typescript
dailyRevenue = customers × avgTicket
difference = dailyRevenue - referenceData.facturacion_media_dia
percentDiff = (difference / avgDaily) × 100
monthlyProjection = dailyRevenue × referenceData.dias_operativos_mes
occupancy = (customers / referenceData.capacidad_dia) × 100
percentVsBest = (dailyRevenue / referenceData.mejor_dia_facturacion) × 100
```

### Secciones

1. **Banner de datos de referencia** — Media diaria, mejor día, capacidad día, ticket medio actual
2. **Sliders interactivos** — Comensales y ticket medio
3. **Resultados** — Facturación diaria simulada, diferencia vs media, proyección mensual, ocupación %, % vs mejor día
4. **Indicador de ocupación** — Color según %: rojo (<50%), amarillo (<80%), verde (≥80%)

---

## 13. Asistente IA

| Campo | Valor |
|-------|-------|
| **Ruta** | `/ai-assistant` |
| **Componente** | `SmartAssistantPage` |
| **Archivo** | `components/views/SmartAssistantPage.tsx` |
| **Servicio(s)** | API `/api/chat` → N8N webhook |
| **Export** | Default export |

### Flujo de datos

```
Usuario escribe mensaje
  → POST /api/chat { message, sessionId }
    → N8N webhook: https://n8n.nuasmartrestaurant.com/webhook/nua-assistant-api
      → Procesamiento con contexto del restaurante
    ← { response }
  ← Renderiza respuesta con ReactMarkdown
```

### Secciones

1. **Área de chat** — Mensajes con animación Framer Motion, scroll automático
2. **Input de texto** — Formulario con envío al presionar Enter o botón
3. **Chips sugeridos** — `ASSISTANT_CHIPS["/"]` con preguntas predefinidas
4. **Botón nueva conversación** — Genera nuevo `sessionId` y limpia mensajes

### Estado

- `messages: Message[]` — Historial de conversación local
- `sessionId: string` — ID de sesión para contexto en N8N
- `isLoading: boolean` — Indicador de envío

---

## 14. Conexiones Bancarias

| Campo | Valor |
|-------|-------|
| **Ruta** | `/bank-connections` |
| **Componente** | `BankConnectionsPage` |
| **Archivo** | `components/views/BankConnectionsPage.tsx` |
| **Servicio(s)** | — (datos estáticos/mock) |
| **Export** | Default export |

### Estado actual

Esta vista usa **datos estáticos hardcodeados** (no conectada a Supabase aún). Muestra dos cuentas de ejemplo:
- CaixaBank — Cuenta Principal
- BBVA — Cuenta Proveedores

### Secciones

1. **Botón conectar** — Simula conexión con GoCardless (timeout 2s)
2. **Lista de cuentas** — Tarjetas con nombre banco, cuenta, estado (connected/pending/error), última sincronización

### Futuro

Preparada para integración real con GoCardless Open Banking API.

---

## 15. Uso de Mesas

| Campo | Valor |
|-------|-------|
| **Ruta** | `/tablet-usage` |
| **Componente** | `TabletUsagePage` |
| **Archivo** | `components/views/TabletUsagePage.tsx` |
| **Servicio(s)** | — (iframes externos) |
| **Export** | Default export |

### Secciones (2 tabs)

1. **Uso de Mesas** — iframe de Power BI con dashboard de uso de tablets
   - URL: `https://app.powerbi.com/view?r=...`
2. **Configuración** — iframe de NÜA Smart Performance
   - URL: `https://performance.nuasmartrestaurant.com/?pin=9069`

### Sin datos de Supabase

Esta vista embebe dashboards externos. No consume servicios propios.

---

## 16. Configuración

| Campo | Valor |
|-------|-------|
| **Ruta** | `/settings` |
| **Componente** | `SettingsPage` |
| **Archivo** | `components/views/SettingsPage.tsx` |
| **Servicio(s)** | `settingsService.ts` |
| **Export** | Default export |
| **Props** | `userName?: string`, `userEmail?: string` |

### Datos que consume

| Función | Fuente Supabase | Tipo retorno |
|---------|----------------|--------------|
| `fetchIntegrationStatuses()` | Tablas: `gstock_sync_logs`, `gocardless_sync_logs`, `cuentica_logs`, `billin_logs` | `IntegrationStatus[]` |
| `fetchViewRefreshLogs()` | Tabla `business_views_refresh_log` | `ViewRefreshLog[]` |
| `fetchDatabaseInfo()` | RPCs `get_database_size`, `get_tables_size` | `{totalSize, tables}` |
| `fetchRestaurantCapacity()` | Tablas `tables`, `turnos` | `RestaurantCapacity` |
| `fetchRecentSyncLogs()` | Tablas `gstock_sync_logs`, `gocardless_sync_logs` | `SyncLogEntry[]` |

### Secciones (5 tabs)

1. **Integraciones** — Estado de cada integración (Supabase, GStock, GoCardless, Cuentica, Billin) con indicador semáforo
2. **Base de datos** — Tamaño total, tabla de tamaño por tabla, logs de refresh de vistas materializadas
3. **Restaurante** — Capacidad: mesas, plazas, turnos activos, plazas/día
4. **Perfil** — Nombre y email del usuario autenticado
5. **Apariencia** — Selector de tema: Claro / Oscuro / Sistema

### Helpers internos

- `timeAgo(dateStr)` — Formato relativo ("Hace 5 min", "Hace 2h", etc.)
- `formatDateTime(dateStr)` — Formato "dd MMM HH:mm"
- `StatusIcon` / `StatusBadge` — Componentes de indicador visual por estado

---

## Componente Compartido: SmartAssistant (Widget)

Además de la página completa del asistente, existe un **widget flotante** que aparece en todas las vistas:

| Campo | Valor |
|-------|-------|
| **Componente** | `SmartAssistant` |
| **Archivo** | `components/features/SmartAssistant.tsx` |
| **Props** | `currentPath: string` |
| **Posición** | Esquina inferior derecha, z-50 |

- Botón flotante que abre/cierra panel de chat
- Chips contextuales según la vista actual (`ASSISTANT_CHIPS[currentPath]`)
- Mismo flujo que SmartAssistantPage: POST `/api/chat`
- Se diferencia de la página completa en: tamaño reducido, overlay sobre contenido
