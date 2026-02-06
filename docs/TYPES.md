# Tipos TypeScript — NÜA Smart App

Referencia de todos los tipos exportados en `types.ts` (~1213 líneas), organizados por dominio.

---

## Índice

1. [Modelos de Dominio](#1-modelos-de-dominio)
2. [Dashboard](#2-dashboard)
3. [Gastos](#3-gastos)
4. [Operaciones en Tiempo Real](#4-operaciones-en-tiempo-real)
5. [Product Mix](#5-product-mix)
6. [Comparación Interanual](#6-comparación-interanual)
7. [Forecasting](#7-forecasting)
8. [Operativa Analítica](#8-operativa-analítica)
9. [Tesorería](#9-tesorería)
10. [What-If](#10-what-if)
11. [Pool Bancario](#11-pool-bancario)
12. [Labor Cost](#12-labor-cost)
13. [Facturación](#13-facturación)
14. [Costes y Benchmarks](#14-costes-y-benchmarks)
15. [Compras](#15-compras)
16. [Utilidades Recharts](#16-utilidades-recharts)
17. [Tipos en settingsService.ts](#17-tipos-en-settingsservicets)

---

## 1. Modelos de Dominio

### Tipos base

| Tipo | Descripción |
|------|-------------|
| `ShiftType` | `"LUNCH" \| "DINNER"` |
| `DateRange` | `{ from: Date, to: Date }` |
| `PeriodComparison` | `"prev_day" \| "prev_week" \| "prev_month" \| "prev_year"` |

### PaymentMethods
```typescript
{ card: number, cash: number, digital: number }
```

### SalesItem
```typescript
{ id, name, category: string; quantity, revenue: number }
```

### CategorySales
```typescript
{ name: string; quantity, revenue: number }
```

### ModifierStats
```typescript
{ with_options, without_options, total_items: number }
```

### SalesBreakdown
```typescript
{ categories: CategorySales[], top_products: SalesItem[], all_products: SalesItem[], modifiers: ModifierStats }
```

### ExpenseStats
```typescript
{ total, paid, overdue, pending: number; by_category: Record<string, number> }
```

### Invoice
```typescript
{ id, provider, category: string; amount: number; dueDate: string }
```

### IssuedInvoice
```typescript
{ id, ticketNumber, date: string; amount: number; table: string;
  paymentMethod: "Tarjeta"|"Efectivo"|"Otros";
  status: "paid"|"refunded";
  verifactuStatus: "success"|"error"|"pending";
  verifactuHash?: string }
```

### TableSales
```typescript
{ id, name: string; revenue: number }
```

### ShiftMetrics (tipo central)
```typescript
{
  reservations, pax, tables, occupancy_rate: number;
  avg_pax_per_res, avg_pax_per_table: number;
  tables_used, table_rotation, avg_pax_per_table_used: number;
  revenue, tips, tips_count, transactions: number;
  avg_ticket_transaction, avg_ticket_res, avg_ticket_pax, avg_ticket_table: number;
  verifactu_metrics: { success, error, pending: number };
  expenses: ExpenseStats;
  payment_methods: PaymentMethods;
  sales_data: SalesBreakdown;
  tables_breakdown: TableSales[];
}
```

### DailyCompleteMetrics
```typescript
{
  date: string;
  total: ShiftMetrics;
  lunch: ShiftMetrics;
  dinner: ShiftMetrics;
  capacity?: { plazas_turno, plazas_dia, mesas_turno, mesas_dia: number };
}
```

### ComparisonResult / MetricComparison
```typescript
ComparisonResult: { value, previous, delta: number; trend: "up"|"down"|"neutral" }
MetricComparison: { current: number; comparison: ComparisonResult }
```

### InsightResponse
```typescript
{ insight: string; actionableTip: string }
```

---

## 2. Dashboard

### WeatherDay
```typescript
{ date: string; maxTemp, minTemp: number; lunchCode, dinnerCode: number }
```

### WeekReservationDay
```typescript
{ date, dayOfWeek: string; pax, reservations: number;
  reservationsLunch, reservationsDinner: number;
  occupancyTotal, occupancyLunch, occupancyDinner: number;
  status: "low"|"medium"|"high"|"full"|"tranquilo"|"normal"|"fuerte"|"pico";
  isToday: boolean }
```

### TableBillingMetrics
```typescript
{ table_id: string; numero_mesa: number; nombre_mesa: string;
  fecha: string; turno: "Comida"|"Cena";
  total_facturado, total_propinas: number;
  num_facturas, ranking_dia, ranking_turno: number }
```

### TableAggregatedMetrics
```typescript
{ table_id: string; numero_mesa: number; nombre_mesa: string;
  total_facturado, total_propinas, num_facturas, avg_factura, avg_ranking: number }
```

### FinancialKPIs
```typescript
{ periodo: string; ingresos, gastos, margen, margen_pct: number;
  num_facturas, comensales, ticket_medio: number;
  ingresos_ant, gastos_ant, ticket_medio_ant: number;
  fecha_inicio, fecha_fin: string }
```

### OcupacionDia
```typescript
{ fecha, dia_semana: string;
  comensales_comida, comensales_cena, total_comensales: number;
  ocupacion_total_pct: number;
  nivel_ocupacion: "tranquilo"|"normal"|"fuerte"|"pico";
  es_hoy: boolean }
```

### WeekRevenueDay
```typescript
{ fecha, diaSemanaCorto, diaMes: string;
  tipoDia: "pasado"|"hoy"|"futuro"; esHoy: boolean;
  facturadoReal, prevision: number;
  porcentajeAlcanzado: number;
  margenErrorPct: number|null; diferenciaEuros: number|null;
  comensalesReservados: number }
```

---

## 3. Gastos

### ExpenseTag
```typescript
{ tag_name: string; num_gastos: number }
```

### ExpenseTagInfo
```typescript
{ name, normalized_name: string }
```

### Expense
```typescript
{ id: string; cuentica_id: number; fecha, mes, document_number: string;
  status: "partial"|"pending"|"overdue";
  total_amount, base_amount, tax_amount: number;
  due_date: string|null;
  categoria_codigo, categoria_nombre, grupo_categoria, proveedor: string;
  tags: ExpenseTagInfo[] }
```

### ExpenseTagSummary
```typescript
{ tag_name: string; num_facturas: number; total, pagado, pendiente: number }
```

### ExpenseProviderSummary
```typescript
{ proveedor: string; num_facturas: number; total, pagado, pendiente, vencido: number }
```

---

## 4. Operaciones en Tiempo Real

### OperacionesResumen
```typescript
{ mesas_activas, total_pedidos, total_items, total_unidades: number;
  items_sin_confirmar, items_en_preparacion, items_listos_servir, items_entregados: number;
  importe_entregado, importe_total_pedido: number;
  tiempo_medio_preparacion, tiempo_max_preparacion: number|null;
  tiempo_medio_espera_servir, tiempo_max_espera: number|null;
  items_criticos, items_bebida, items_comida, items_postre: number;
  turno_actual: "comida"|"cena"|null }
```

### OperacionesMesa
```typescript
{ mesa: string; num_pedidos, total_items: number;
  sin_confirmar, en_preparacion, listos, entregados: number;
  importe_total: number; max_espera_min: number|null;
  primer_pedido, ultimo_pedido: string; items_criticos: number }
```

### OperacionesItemCola
```typescript
{ item_id, mesa, producto, categoria: string;
  unidades: number;
  estado: "sin_confirmar"|"en_preparacion"|"listo_servir";
  minutos_espera: number }
```

### OperacionesData
```typescript
{ fecha: string; resumen: OperacionesResumen;
  mesas: OperacionesMesa[]; cola_cocina: OperacionesItemCola[]|null;
  actualizado_at: string }
```

---

## 5. Product Mix

### ProductMixItem
```typescript
{ fecha, mes: string; dia_semana, turno_id: number; turno_nombre: string;
  product_sku, producto_nombre, category_sku, categoria_nombre: string;
  precio_carta: number; coste_unitario: number|null;
  unidades, facturado: number; precio_medio_real, diferencia_precio: number;
  pct_unidades_dia, pct_facturado_dia, pct_unidades_global, pct_facturado_global: number;
  ranking_dia_facturado, ranking_dia_unidades: number;
  unidades_void, facturado_void: number;
  pct_void_producto, pct_unidades_void_dia, pct_facturado_void_dia: number;
  ranking_dia_void: number }
```

### CategoryMixItem
```typescript
{ fecha, mes: string; dia_semana, turno_id: number; turno_nombre: string;
  category_sku, categoria_nombre: string;
  productos_distintos, unidades, facturado: number; ticket_medio_item: number;
  pct_unidades_dia, pct_facturado_dia, pct_unidades_global, pct_facturado_global: number;
  ranking_dia: number;
  unidades_void, facturado_void: number;
  pct_void_categoria, pct_unidades_void_dia, pct_facturado_void_dia: number;
  ranking_dia_void: number }
```

### OptionMixItem
```typescript
{ fecha, mes: string; turno_id: number; turno_nombre: string;
  option_sku, option_name: string; precio_opcion: number;
  producto_sku, producto_nombre, category_sku, categoria_nombre: string;
  veces_seleccionada: number; facturado_extra: number;
  penetracion_pct: number; es_extra_pago: boolean;
  ranking_dia_facturado: number;
  veces_void, facturado_void: number;
  pct_void_opcion: number; ranking_dia_void: number }
```

### Tipos agregados (cálculo frontend)

| Tipo | Campos principales |
|------|-------------------|
| `ProductAggregated` | `product_sku, producto_nombre, categoria_nombre, precio_carta, unidades, facturado, precio_medio_real, diferencia_precio, pct_facturado, pct_unidades, unidades_void, facturado_void, pct_void` |
| `CategoryAggregated` | `category_sku, categoria_nombre, productos_distintos, unidades, facturado, ticket_medio_item, pct_facturado, pct_unidades, unidades_void, facturado_void, pct_void` |
| `OptionAggregated` | `option_sku, option_name, precio_opcion, producto_nombre, categoria_nombre, veces_seleccionada, facturado_extra, penetracion_pct, es_extra_pago, veces_void, facturado_void, pct_void` |

---

## 6. Comparación Interanual

### MonthlyReservationData
```typescript
{ mes: number; mes_nombre: string;
  total_reservas, total_comensales: number;
  reservas_comida, reservas_cena, comensales_comida, comensales_cena: number;
  dias_operativos: number }
```

### YearlyComparisonData
```typescript
{ año: number; meses: MonthlyReservationData[];
  totals: { reservas, comensales, comensales_comida, comensales_cena: number } }
```

### YearlyTrendInsight
```typescript
{ currentYear, previousYear: number;
  currentYearTotal, previousYearTotal, percentageChange: number;
  trend: "up"|"down"|"neutral";
  bestMonth: { mes: string; valor: number };
  worstMonth: { mes: string; valor: number } }
```

---

## 7. Forecasting

### ForecastDay (tipo más extenso)
```typescript
{ fecha, nombre_dia: string; mes: number;
  comensales_real, comensales_comida_real, comensales_cena_real: number;
  comensales_prediccion, comensales_comida_pred, comensales_cena_pred: number;
  ventas_prediccion, confianza_prediccion: number;
  capacidad_turno, capacidad_dia, capacidad_mesas: number;
  ocupacion_pct_prediccion, ocupacion_pct_comida_pred, ocupacion_pct_cena_pred: number;
  ocupacion_pct_real, ocupacion_pct_comida_real, ocupacion_pct_cena_real: number;
  nivel_ocupacion: "tranquilo"|"normal"|"fuerte"|"pico";
  error_prediccion, error_porcentaje: number|null;
  nivel_lluvia: string|null; temp_max: number|null;
  es_festivo: boolean; evento_principal: string|null;
  comensales_semana_ant, comensales_año_ant: number|null;
  tipo_fecha: "pasado"|"hoy"|"futuro" }
```

### ForecastKPIs
```typescript
{ prediccion_hoy, reservas_hoy, ocupacion_semana, precision_modelo: number }
```

### ForecastHistorico / ForecastPrecision
```typescript
ForecastHistorico: { fecha: string; prediccion, real, diferencia, error_pct: number }
ForecastPrecision: { semanas: ForecastHistorico[]; precision_media: number;
  mejor_dia, peor_dia: { fecha: string; error: number } }
```

---

## 8. Operativa Analítica

### OperativaItem
```typescript
{ item_id, order_id, mesa, seat, product_sku, producto: string;
  category_sku, categoria: string;
  tipo: "comida"|"bebida"|"postre";
  price_total: number;
  confirmed_at, ready_at, delivered_at: string;
  minutos_cocina, minutos_sala, minutos_total, minutos_operativo: number;
  fecha: string; hora, dia_semana: number;
  analizar: boolean }
```

### OperativaKPI
```typescript
{ fecha: string; items_servidos, items_comida, items_bebida: number;
  tiempo_medio_cocina, tiempo_medio_sala: number;
  alertas_30min, alertas_45min: number }
```

### OperativaProducto
```typescript
{ producto, categoria: string; tipo: "comida"|"bebida";
  total_pedidos: number; tiempo_medio, mediana, tiempo_min, tiempo_max: number }
```

### OperativaCliente
```typescript
{ order_id, mesa, seat, fecha: string;
  primer_pedido, ultima_entrega: string;
  minutos_experiencia_cliente: number;
  total_items, items_comida, items_bebida: number;
  total_pagado: number }
```

### OperativaPorHora
```typescript
{ hora: number; items_servidos: number;
  tiempo_medio_cocina, tiempo_medio_sala: number }
```

---

## 9. Tesorería

### TreasuryKPIs
```typescript
{ saldo_total, ingresos_periodo, gastos_periodo: number;
  ingresos_anterior, gastos_anterior: number;
  transacciones_sin_categorizar, num_cuentas: number }
```

### TreasuryAccount
```typescript
{ id, bank_name, account_name, iban: string;
  balance: number; currency: string;
  last_sync: string|null; is_active: boolean; bank_logo: string|null }
```

### TreasuryTransaction
```typescript
{ id, account_id, account_name, bank_name: string;
  bank_logo: string|null;
  booking_date, value_date: string;
  amount: number; currency, description: string;
  category_id, category_name, category_type: string|null;
  subcategory_id, subcategory_name: string|null;
  counterparty_name, reference: string|null;
  categorization_method?: "manual"|"rule"|"ai"|"imported"|null }
```

### TreasuryTransactionsSummary
```typescript
{ total_ingresos, total_gastos, num_transacciones, num_sin_categorizar: number }
```

### TreasuryCategory / TreasurySubcategory
```typescript
Subcategory: { id, name: string }
Category: { id, name, type: string; icon: string|null; subcategories: TreasurySubcategory[] }
```

### TreasuryCategoryBreakdown
```typescript
{ category_id, category_name: string;
  category_color, category_icon: string|null;
  total_ingresos, total_gastos, num_transacciones, porcentaje_gastos: number }
```

### TreasuryMonthlySummary
```typescript
{ mes: string; mes_label: string;
  ingresos, gastos, balance: number; num_transacciones: number }
```

---

## 10. What-If

### WhatIfReferenceData
```typescript
{ facturacion_media_dia, ticket_medio_historico, comensales_media: number;
  capacidad_turno, capacidad_dia, total_mesas: number;
  mejor_dia_facturacion, dias_operativos_mes: number }
```

---

## 11. Pool Bancario

### PoolBancarioResumen
```typescript
{ total_prestamos_activos, prestamos_pagados: number;
  capital_total_original, saldo_pendiente_total, capital_total_amortizado: number;
  porcentaje_amortizado, cuota_mensual_total: number;
  total_intereses_pagados, total_intereses_pendientes: number;
  proxima_finalizacion, ultima_finalizacion: string }
```

### PoolBancarioPrestamo
```typescript
{ prestamo_id, nombre_prestamo, banco: string; banco_logo: string|null;
  capital_inicial, saldo_pendiente, capital_amortizado: number;
  porcentaje_amortizado, cuota_mensual, tasa_interes: number;
  tipo_interes_texto: string; dia_cobro: number;
  fecha_inicio, fecha_fin: string;
  estado: "activo"|"liquidado"|string;
  cuotas_pagadas, cuotas_pendientes, cuotas_totales: number;
  proxima_cuota_fecha: string|null; proxima_cuota_importe: number|null;
  intereses_pagados, intereses_pendientes: number }
```

### PoolBancarioVencimiento
```typescript
{ prestamo_id, nombre_prestamo, banco: string; banco_logo: string|null;
  dia_cobro, numero_cuota: number;
  fecha_vencimiento: string;
  importe_cuota, capital, intereses, saldo_tras_pago: number;
  dias_hasta_vencimiento: number;
  estado_vencimiento: "vencido"|"hoy"|"proximo"|"este_mes"|"futuro" }
```

### PoolBancarioPorBanco
```typescript
{ banco: string; banco_logo: string|null;
  num_prestamos: number;
  capital_total, saldo_pendiente, capital_amortizado: number;
  porcentaje_amortizado, cuota_mensual, porcentaje_del_total: number;
  proxima_finalizacion, ultima_finalizacion: string }
```

### PoolBancarioCalendarioMes
```typescript
{ mes_id, mes: string; año: number;
  num_cuotas: number;
  total_cuota, total_capital, total_intereses: number;
  detalle: string }
```

---

## 12. Labor Cost

### LaborCostDay
```typescript
{ fecha: string;
  ventas_netas, coste_laboral: number;
  horas_trabajadas, trabajadores: number;
  porcentaje_laboral: number }
```

---

## 13. Facturación

### FacturacionResumenGlobal
```typescript
{ total_facturas: number; total_facturado, base_total, propinas_total: number;
  verifactu_ok, verifactu_error, verifactu_pendiente: number;
  total_tarjeta, total_efectivo: number;
  total_ingresos_consolidados, total_ingresos, pendiente_cobro: number;
  alertas_error, alertas_warning: number }
```

### FacturacionListadoItem
```typescript
{ id: number; transaction_id, fecha: string;
  cuentica_identifier, cuentica_serie: string|null;
  numero_factura: number; numero_completo: string;
  importe_total, base_imponible, iva, propinas: number;
  metodo_pago, metodo_pago_nombre: string;
  mesa: string|null; estado_cuentica: string|null;
  verifactu_codigo: number|null;
  verifactu_estado, verifactu_estado_nombre, verifactu_estado_color: string;
  verifactu_url, verifactu_qr: string|null;
  error_mensaje: string|null;
  cliente_nombre, cliente_cif: string|null;
  created_at, updated_at: string;
  table_id: string|null; order_numbers, webhook_payload: string|null }
```

### CuadreListadoItem
```typescript
{ fecha, zreport_id, zreport_documento: string;
  estado: "cuadrado_auto"|"cuadrado_manual"|"propuesta"|"descuadre"|"pendiente";
  total_facturas, total_zreport, total_ajustes, diferencia: string;
  num_facturas: number; motivo_pendiente: string|null }
```

### FacturaZReport
```typescript
{ factura_id: number; transaction_id, cuentica_identifier, table_name: string;
  total_amount, payment_method, invoice_date, hora: string;
  tipo_asociacion: "auto"|"propuesta"|"manual"; confirmado: boolean }
```

### ZReportDisponible / FacturaHuerfana / FacturaAdyacente
```typescript
ZReportDisponible: { zreport_id, document_number, fecha_real, total_amount,
  total_facturas_asociadas, diferencia_actual: string }

FacturaHuerfana: { factura_id, transaction_id, cuentica_identifier,
  total_amount, invoice_date, table_name: string }

FacturaAdyacente: { factura_id, transaction_id, cuentica_identifier,
  total_amount, invoice_date, table_name: string;
  zreport_actual_id, zreport_actual_doc: string }
```

### AjusteCuadre
```typescript
{ id: number; tipo: "ajuste_positivo"|"ajuste_negativo"|"comentario";
  importe: number; descripcion, created_at: string }
```

### CuadreEstadoFilter
```typescript
"todos" | "pendientes" | "cuadrados" | "descuadres"
```

### FacturacionCuadreDiario
```typescript
{ fecha: string; num_facturas: number; total_facturas, base_facturas: number;
  num_zreports: number; total_zreports, base_zreports, cobrado_zreports: number;
  zreports_documentos: string|null; diferencia: number;
  estado_cuadre, estado_cuadre_color: string;
  facturas_verifactu_ok, facturas_verifactu_error: number }
```

### FacturacionTipoIngreso
```typescript
{ categoria, categoria_nombre: string;
  num_documentos: number; total, base, iva, cobrado, pendiente: number;
  pct_total: number }
```

### FacturacionAlerta
```typescript
{ tipo_alerta, severidad, fecha, mensaje: string;
  importe: number; referencia, detalle: string|null; fecha_alerta: string }
```

### FacturacionMensual
```typescript
{ mes, mes_texto, mes_nombre: string;
  num_facturas: number; total_facturado, base_total, iva_total, propinas_total: number;
  ticket_medio: number; verifactu_ok, verifactu_error: number;
  pagos_tarjeta, pagos_efectivo: number;
  total_tarjeta, total_efectivo: number }
```

---

## 14. Costes y Benchmarks

### BenchmarkItem
```typescript
{ etiqueta: string; gasto, pagado, pendiente, ventas: number;
  porcentaje, porcentaje_gastos: number;
  min_sector, max_sector: number|null }
```

### BenchmarkResumen
```typescript
{ benchmarks: BenchmarkItem[];
  totales: { margen_operativo, margen_operativo_euros: number;
    margen_neto, margen_neto_euros: number;
    total_gastos, total_ventas: number } }
```

### FoodCostProduct
```typescript
{ sku: string; variantId: number|null;
  producto, categoria, tipo: string;
  pvp, pvp_neto, coste, food_cost_pct, food_cost_peor_pct: number;
  tiene_patatas, tiene_helado, tiene_ensalada, precioManual: boolean }
```

### FoodCostSummary
```typescript
{ productos: FoodCostProduct[];
  kpis: { food_cost_promedio, total_productos, productos_criticos,
    productos_warning, productos_ok: number };
  por_categoria: { categoria: string; productos: number;
    food_cost_promedio: number }[] }
```

---

## 15. Compras

### CompraPedidoItem
```typescript
{ name: string; quantityOrdered, quantityReceived: number;
  formatOrderedId: number|null }
```

### CompraPedido
```typescript
{ id, gstock_supplier_id, proveedor, numero_pedido, fecha_pedido: string;
  pedido_subtotal, pedido_iva, pedido_total: number;
  pedido_observaciones: string|null;
  pedido_items: CompraPedidoItem[]|null;
  estado: "pendiente"|"enviado"|"autorizado"|"recepcionado";
  estado_label, estado_color: string;
  albaran_id, albaran_ref, albaran_fecha: string|null;
  albaran_total: number|null;
  importe_coincide: boolean|null; diferencia_importe: number|null;
  albaran_incidencias: string|null }
```

### CompraFacturaConciliacion
```typescript
{ id, factura_id: string; conciliacion_id, gstock_supplier_id: string|null;
  factura_numero: string; proveedor, proveedor_nif: string|null;
  factura_fecha: string; factura_vencimiento: string|null;
  factura_base, factura_iva, factura_total: number;
  factura_concepto: string|null; ia_confianza_pct: number|null;
  tipo_conciliacion, motivo_revision: string|null;
  requiere_revision: boolean; estado_conciliacion: string|null;
  estado_pago: "pagada"|"pendiente"|"parcial"|"abono";
  albaranes_vinculados: string[]|null }
```

### CompraKPIs
```typescript
{ pedidos_pendientes, importe_pedidos_pendientes: number;
  albaranes_sin_facturar, importe_sin_facturar: number;
  facturas_pendientes_revision, facturas_conciliadas: number }
```

### CompraAlbaranDisponible / CompraProveedor / ProductFormat
```typescript
CompraAlbaranDisponible: { id, numero_albaran, proveedor, fecha: string;
  importe_total: number; gstock_supplier_id: string|null }

CompraProveedor: { gstock_supplier_id, nombre: string;
  nif: string|null; num_pedidos, num_albaranes: number }

ProductFormat: { id: number; name: string }
```

### Tipos de análisis de compras

| Tipo | Campos principales |
|------|-------------------|
| `CompraAnalisisKPI` | `total_compras, num_albaranes, ticket_medio, variacion_vs_anterior` |
| `CompraEvolucionMensual` | `mes, mes_label, total, num_albaranes` |
| `CompraDistribucionCategoria` | `categoria, familia, tipo, total, porcentaje, num_albaranes` |
| `CompraTopProducto` | `producto, formato, categoria, familia, total, cantidad, num_albaranes` |
| `CompraTablaJerarquica` | `categoria, familia, tipo, subtipo, total_con_iva, total_sin_iva, num_lineas` |

---

## 16. Utilidades Recharts

### RechartsPayloadEntry
```typescript
{ name: string; value: number; color?: string;
  dataKey?: string; payload?: Record<string, unknown> }
```

### RechartsTooltipProps
```typescript
{ active?: boolean; payload?: RechartsPayloadEntry[]; label?: string }
```

---

## 17. Tipos en settingsService.ts

Estos tipos están definidos directamente en `lib/settingsService.ts` (no en `types.ts`):

| Tipo | Campos |
|------|--------|
| `IntegrationStatus` | `name, description: string; status: "ok"\|"error"\|"warning"\|"unknown"; lastSync: string\|null; details: string` |
| `ViewRefreshLog` | `vista_nombre, refresh_iniciado_at: string; refresh_completado_at: string\|null; duracion_ms: number\|null; estado, trigger_source: string\|null` |
| `TableSize` | `table_name, total_size: string; row_count: number` |
| `RestaurantCapacity` | `totalMesas, totalPlazas: number; turnos: {nombre, hora_inicio, hora_fin}[]; plazasPorDia, mesasPorDia: number` |
| `SyncLogEntry` | `id, source, type, status, timestamp: string; records, errors: number; message: string\|null` |
