---
name: nua-datos-supabase
description: "Mapa de datos de NÜA Smart Restaurant: qué vista o tabla de Supabase usar para cada pregunta de negocio (facturación, food cost, personal/turnos, reservas, compras, tesorería, gastos, productos). ÚSALA SIEMPRE antes de consultar la base de datos del restaurante (mcp_supabase_query) para ir DIRECTO a la fuente correcta y no perderte entre 150+ tablas."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [nua, datos, supabase, bi, facturacion, food-cost, personal, turnos, reservas, compras, tesoreria, vistas, sql]
    related_skills: []
---

# Mapa de datos de NÜA Smart Restaurant (Supabase)

Catálogo de las vistas y tablas clave de Supabase, con **qué responde cada una** y sus
columnas principales. Cuando te pregunten por datos del restaurante, **mira aquí primero**
y ve DIRECTO a la vista correcta con `mcp_supabase_query` (SELECT). No explores a ciegas
las 150+ tablas ni te rindas: la respuesta casi siempre está en una de estas vistas.

**Convenciones:** zona horaria **Europe/Madrid**. "Hoy" = `CURRENT_DATE`, "ayer" = `CURRENT_DATE - 1`.
Conexión de solo lectura (usuario `hermes_readonly`, puerto 5433 directo). Solo SELECT.

---

## 💶 VENTAS / FACTURACIÓN

- **`vw_facturacion_semana`** — Facturación REAL por día de la **semana actual**. ← para *"¿cuánto facturamos ayer / esta semana?"*. Columnas: `fecha`, `facturado_real` (€ del día), `prevision`, `porcentaje_alcanzado`, `comensales_reales`, `es_hoy`, `es_futuro`, `dia_semana_corto`.
- **`vw_dashboard_ventas_facturas_live`** — Venta de **HOY en vivo** (puede estar vacía de madrugada). Columnas: `fecha`, `venta_neta_total`, `ticket_medio`, `total_tickets`, `venta_comida`/`venta_cena`, `pago_tarjeta`/`pago_efectivo`/`pago_apps`, `categoria_top_nombre`, `productos_ranking` (json), `prevision_facturacion`.
- **`v_facturacion_mensual`** — Facturación agregada por **mes**: `mes`, `mes_nombre`, `num_facturas`, `total_facturado`, `base_total`, `iva_total`, `propinas_total`, `ticket_medio`.
- **`v_facturas_listado`** — Listado de **facturas formales** (Cuentica/VeriFactu, las que pide el cliente con NIF — NO son todas las ventas). `fecha`, `numero_completo`, `importe_total`, `metodo_pago`, `cliente_nombre`, `verifactu_estado`. Ojo: para "facturación del día" usa `vw_facturacion_semana`, NO esto (no sumes facturas a mano).
- **`v_facturas_verifactu_resumen`** — Estado VeriFactu (aceptadas/pendientes/rechazadas) con importes y %.
- **`vw_dashboard_financiero`** — Resumen financiero por **periodo** con comparativa vs anterior: `ingresos`, `gastos`, `margen`, `margen_pct`, `comensales`, `ticket_medio`, `*_ant`.

## 🥗 FOOD COST / COSTE DE MERCANCÍA

- **`vw_food_cost_real`** — **Food cost REAL ponderado**: `tipo` (Comida/Bebida/Global), `food_cost_pct`, `venta_neta`, `coste_mercancia`, `unidades`. ← *"¿cuál es mi food cost?"*.
- **`vw_food_cost`** — Food cost **teórico por producto**: `sku`, `nombre_producto`, `categoria`, `pvp`, `coste_escandallo`, `food_cost_pct`.
- **`vw_coste_ticket`** — Coste y margen **por ticket**: `transaction_id`, `fecha`, `importe_total`, `coste_mercancia`, `food_cost_pct`, `margen_bruto`.
- **`vw_taquitos_baos_combos`** — Coste/PVP/receta real de los **combos** (taquitos/baos por cantidad+sabor).

## 🍔 PRODUCTOS / MIX / RECETAS

- **`vw_productos_vendidos_60d`** — SKUs vendidos últimos 60 días.
- **`v_cook_recipes`** / **`vw_recetas_con_elaboracion`** — Recetas (nombre, categoría, porciones, coste, tiempos, alérgenos).
- **`v_cook_ingredients`** / **`vw_recetas_ingredientes`** — Ingredientes de cada receta.
- **`vw_recetas_alergenos`** — Alérgenos por receta.
- **`vw_simulador_referencias`** — `facturacion_media_dia`, `ticket_medio_historico`, `comensales_media`, `capacidad_dia`, `mejor_dia_facturacion`.

## ⏱️ OPERATIVA (tiempo real)

- **`vw_operaciones_tiempo_real`** — Estado **ahora**: `turno_actual`, `resumen`, `mesas`, `cola_cocina`, `items_criticos`.
- **`vw_operativa_items`** — Ítems servidos con tiempos: `producto`, `categoria`, `mesa`, `minutos_cocina`, `minutos_sala`, `fecha`, `hora`.

## 👥 PERSONAL / RRHH (Connecteam)

- **`vw_scheduled_shifts_with_workers`** — **Quién trabaja y qué turno**. ← *"¿quién trabaja hoy/mañana?"*. Columnas: `shift_date`, `nombre_completo`, `puesto`, `equipos`, `turno_tipo`, `horas_programadas`. ⚠️ **Para las horas usa SIEMPRE `hora_entrada` / `hora_salida`** (ya en hora Madrid, ej. "19:30"). **NUNCA `start_time` / `end_time`: están en UTC** y darías horas mal.
- **`connecteam_workers`** (tabla) — **Plantilla** (maestro de trabajadores). Para *"¿cuántos trabajadores hay?"*.
- **`v_connecteam_puntualidad`** — Puntualidad: `first_name`, `shift_date`, `retraso_min`, `llego_tarde`.
- **`v_connecteam_ausencias`** / **`_dia`** — Ausencias (vacaciones, bajas): `first_name`, `tipo`, `start_date`/`end_date`, `duration_days`.
- **`v_connecteam_horas_extra_semana`** — Horas extra por semana. **`v_connecteam_horas_nocturnas`** — Horas nocturnas.
- **`vw_labor_cost_analysis`** — **Coste laboral vs ventas** por día: `fecha`, `ventas_netas`, `coste_laboral`, `horas_trabajadas`, `trabajadores`, `porcentaje_laboral`.

## 🪑 RESERVAS / OCUPACIÓN

- **`vw_dashboard_ocupacion`** — Ocupación por día: `fecha`, `comensales_comida`/`_cena`, `total_comensales`, `ocupacion_*_pct`, `nivel_ocupacion`.
- **`reservas_agregadas_diarias`** (tabla) — Reservas agregadas por día.

## 🛒 COMPRAS / PROVEEDORES (GStock)

- **`vw_compras_resumen`** — Totales de compras del mes. **`vw_compras_por_proveedor`** — Por proveedor y mes.
- **`vw_compras_gastos_categoria`** — Gasto por categoría/familia. **`vw_compras_items_detalle`** — Líneas de compra.
- **`vw_compras_facturas_pendientes`** / **`vw_compras_conciliacion`** — Conciliación factura↔albarán.

## 🏦 TESORERÍA / PRÉSTAMOS (Pool bancario)

- **`v_pool_bancario_resumen`** — Resumen: `saldo_pendiente_total`, `cuota_mensual_total`, `porcentaje_amortizado`, intereses.
- **`v_pool_bancario_prestamos`** — Detalle por préstamo. **`v_pool_bancario_proximos_vencimientos`** — Próximas cuotas.
- **`gocardless_transactions`** (tabla) — Movimientos bancarios (Open Banking).

## 🧾 INGRESOS / GASTOS (Cuentica)

- **`v_ingresos_listado`** / **`v_ingresos_por_categoria`** / **`v_ingresos_por_tag`** — Documentos de ingreso.
- **`cuentica_expenses`** (tabla) — Gastos contabilizados (proveedor, importe, categoría, fecha).

## 🎯 OBJETIVOS / KPIs

- **`kpi_targets`** (tabla) — Objetivos del negocio (break-even, food cost objetivo, etc.).

---

## ⚠️ Gotchas importantes

- **Facturación del día** = `vw_facturacion_semana.facturado_real` o `vw_dashboard_ventas_facturas_live.venta_neta_total` (hoy). Las **facturas formales** (`v_facturas_listado`) son solo las emitidas con NIF, NO todas las ventas → **no las sumes a mano para "cuánto facturamos"**.
- **`cancelled_at`** en ventas NO es anulación: es una marca automática de cocina. Lo cobrado de verdad es **`is_paid = true`**.
- **Combos taquitos/baos**: coste/PVP real en `vw_taquitos_baos_combos`, no el coste base del SKU.
- **⏰ ZONA HORARIA:** columnas timestamp (`start_time`, `created_at`, `clock_in`…) están en **UTC**. El restaurante es **Europe/Madrid (UTC+2 en verano)**. Para mostrar horas usa la columna ya localizada (`hora_entrada`/`hora_salida`) o convierte con `columna AT TIME ZONE 'Europe/Madrid'`. NUNCA muestres una hora UTC en crudo.
- **Tablas crudas útiles**: `sales_orders`, `sales_order_items`, `sales_item_options` (ventas TPV línea a línea), `products`/`product_options` (catálogo), `turnos`.
