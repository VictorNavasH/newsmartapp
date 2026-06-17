# Diccionario de datos — NÜA Smart Restaurant

Catálogo de las vistas y tablas clave de Supabase, con **qué responde cada una** y sus
columnas principales. Úsalo para ir DIRECTO a la fuente correcta sin explorar a ciegas
(hay 150+ tablas). Si una vista no encaja, entonces explora — pero empieza siempre aquí.

**Convenciones:** zona horaria **Europe/Madrid**. "Hoy" = `CURRENT_DATE`, "ayer" = `CURRENT_DATE - 1`.
Las vistas `vw_`/`v_` ya traen lo importante calculado; prefiérelas a las tablas crudas.

---

## 💶 VENTAS / FACTURACIÓN

- **`vw_facturacion_semana`** — Facturación REAL por día de la **semana actual**. ← para *"¿cuánto facturamos ayer / esta semana?"*. Columnas: `fecha`, `facturado_real` (€ del día), `prevision`, `porcentaje_alcanzado`, `comensales_reales`, `es_hoy`, `es_futuro`, `dia_semana_corto`.
- **`vw_dashboard_ventas_facturas_live`** — Venta de **HOY en vivo** (puede estar vacía de madrugada). Columnas: `fecha`, `venta_neta_total`, `ticket_medio`, `total_tickets`, `venta_comida`/`venta_cena`, `ticket_medio_comida`/`_cena`, `pago_tarjeta`/`pago_efectivo`/`pago_apps`, `categoria_top_nombre`, `productos_ranking` (json), `prevision_facturacion`.
- **`v_facturacion_mensual`** — Facturación agregada por **mes**: `mes`, `mes_nombre`, `num_facturas`, `total_facturado`, `base_total`, `iva_total`, `propinas_total`, `ticket_medio`, `total_tarjeta`/`total_efectivo`.
- **`v_facturas_listado`** — Listado de **facturas formales** (Cuentica/VeriFactu, las que pide el cliente con NIF — NO son todas las ventas). `fecha`, `numero_completo`, `importe_total`, `base_imponible`, `iva`, `propinas`, `metodo_pago`, `cliente_nombre`/`cliente_cif`, `verifactu_estado`. Ojo: para "facturación del día" usa `vw_facturacion_semana`, no esto.
- **`v_facturas_verifactu_resumen`** — Estado VeriFactu (aceptadas/pendientes/rechazadas) con importes y %.
- **`v_facturas_alertas`** — Alertas de facturación: `tipo_alerta`, `severidad`, `fecha`, `mensaje`, `importe`.
- **`vw_dashboard_financiero`** — Resumen financiero por **periodo** con comparativa vs periodo anterior: `ingresos`, `gastos`, `margen`, `margen_pct`, `comensales`, `ticket_medio`, `*_ant`.

## 🥗 FOOD COST / COSTE DE MERCANCÍA

- **`vw_food_cost_real`** — **Food cost REAL ponderado** (lo que de verdad costó lo vendido). Columnas: `tipo` (Comida/Bebida/Global), `food_cost_pct`, `venta_neta`, `coste_mercancia`, `unidades`. ← úsala para *"¿cuál es mi food cost?"*.
- **`vw_food_cost`** — Food cost **teórico por producto** (escandallo de catálogo): `sku`, `nombre_producto`, `categoria`, `pvp`, `pvp_neto`, `coste_escandallo`, `food_cost_pct`.
- **`vw_coste_ticket`** — Coste y margen **por ticket/factura**: `transaction_id`, `fecha`, `importe_total`, `coste_mercancia`, `food_cost_pct`, `margen_bruto`.
- **`vw_taquitos_baos_combos`** — Coste/PVP/receta real de los **combos combinatorios** (taquitos/baos por cantidad+sabor): `sku`, `pvp`, `coste`, `food_cost_pct`, `recipe_name`.

## 🍔 PRODUCTOS / MIX / RECETAS

- **`vw_productos_vendidos_60d`** — SKUs vendidos en los últimos 60 días (`product_sku`).
- **`v_cook_recipes`** / **`vw_recetas_con_elaboracion`** — Recetas (escandallos): nombre, categoría, porciones, coste, tiempos, alérgenos, instrucciones, días de caducidad.
- **`v_cook_ingredients`** / **`vw_recetas_ingredientes`** / **`v_ingredients_with_products`** — Ingredientes de cada receta (cantidad, unidad, producto GStock o subreceta).
- **`vw_recetas_alergenos`** — Alérgenos por receta (`receta_id`, `alergenos`, `iconos`).
- **`vw_simulador_referencias`** — Referencias para simulaciones: `facturacion_media_dia`, `ticket_medio_historico`, `comensales_media`, `capacidad_dia`, `mejor_dia_facturacion`.

## ⏱️ OPERATIVA (tiempo real)

- **`vw_operaciones_tiempo_real`** — Estado operativo **ahora**: `turno_actual`, `resumen`, `mesas`, `cola_cocina`, `items_criticos`.
- **`vw_operativa_items`** — Cada ítem servido con tiempos de cocina/sala: `producto`, `categoria`, `mesa`, `minutos_cocina`, `minutos_sala`, `minutos_total`, `fecha`, `hora`.

## 👥 PERSONAL / RRHH (Connecteam)

- **`vw_scheduled_shifts_with_workers`** — **Quién trabaja y qué turno** (horario con nombre del trabajador). ← para *"¿quién trabaja hoy/mañana?"*. Columnas: `shift_date`, `nombre_completo`, `puesto`, `equipos`, `turno_tipo`, `horas_programadas`, y las horas. ⚠️ **Para mostrar horas usa SIEMPRE `hora_entrada` / `hora_salida`** (ya en hora de Madrid, ej. "19:30"). **NUNCA uses `start_time` / `end_time`: están en UTC** (2h menos en verano) y darías horas equivocadas.
- **`connecteam_workers`** (tabla) — **Plantilla** (maestro de trabajadores). Para *"¿cuántos trabajadores hay?"*.
- **`v_connecteam_puntualidad`** — Puntualidad por fichaje: `first_name`, `shift_date`, `retraso_min`, `llego_tarde`.
- **`v_connecteam_ausencias`** / **`v_connecteam_ausencias_dia`** — Ausencias (vacaciones, bajas…): `first_name`, `tipo`, `start_date`/`end_date`, `duration_days`/`horas`.
- **`v_connecteam_horas_extra_semana`** — Horas extra por semana: `horas_trabajadas`, `horas_contrato`, `horas_extra`, `dias_trabajados`.
- **`v_connecteam_horas_nocturnas`** — Horas nocturnas por turno: `shift_date`, `worked_hours`, `horas_nocturnas`.
- **`vw_labor_cost_analysis`** — **Coste laboral vs ventas** por día: `fecha`, `ventas_netas`, `coste_laboral`, `horas_trabajadas`, `trabajadores`, `porcentaje_laboral`.

## 🪑 RESERVAS / OCUPACIÓN

- **`vw_dashboard_ocupacion`** — Ocupación por día: `fecha`, `comensales_comida`/`comensales_cena`, `total_comensales`, `ocupacion_*_pct`, `nivel_ocupacion`, `es_hoy`.
- **`reservas_agregadas_diarias`** (tabla) — Reservas agregadas por día.

## 🛒 COMPRAS / PROVEEDORES (GStock)

- **`vw_compras_resumen`** — Totales de compras del mes (albaranes/pedidos).
- **`vw_compras_por_proveedor`** — Compras por proveedor y mes: `supplier_name`, `mes`, `num_albaranes`, `total_albaranes`.
- **`vw_compras_gastos_categoria`** — Gasto de compras por categoría/familia y mes.
- **`vw_compras_items_detalle`** — Líneas de compra (producto, cantidad, precio, categoría).
- **`vw_compras_albaranes_todos`** / **`vw_compras_pedidos`** — Albaranes / pedidos con estado.
- **`vw_compras_facturas_pendientes`** / **`vw_compras_conciliacion`** — Conciliación factura↔albarán.
- **`vw_compras_proveedores`** — Maestro simple de proveedores (`id`, `nombre`).

## 🏦 TESORERÍA / PRÉSTAMOS (Pool bancario)

- **`v_pool_bancario_resumen`** — Resumen de préstamos: `saldo_pendiente_total`, `cuota_mensual_total`, `porcentaje_amortizado`, intereses pagados/pendientes.
- **`v_pool_bancario_prestamos`** — Detalle por préstamo (capital, saldo, cuota, tasa, próxima cuota).
- **`v_pool_bancario_proximos_vencimientos`** — Próximas cuotas a pagar (fecha, importe, días hasta vencimiento).
- **`v_pool_bancario_por_banco`** / **`v_pool_bancario_calendario_mensual`** / **`v_pool_bancario_cuadro_amortizacion`** — Por banco / calendario mensual / cuadro de amortización.
- **`gocardless_transactions`** (tabla) — Movimientos bancarios (Open Banking).

## 🧾 INGRESOS / GASTOS (contabilidad Cuentica)

- **`v_ingresos_listado`** / **`v_ingresos_por_categoria`** / **`v_ingresos_por_tag`** — Documentos de ingreso de Cuentica (importe, base, iva, cobrado, pendiente, categoría/tag).
- **`cuentica_expenses`** (tabla) / **`cuentica_expenses_windsor`** — Gastos contabilizados (proveedor, importe, categoría, fecha).
- **`cuentica_transactions`** (tabla) — Transacciones contables (ingresos y gastos).

## 🎯 OBJETIVOS / KPIs

- **`kpi_targets`** (tabla) — Objetivos del negocio (break-even, food cost objetivo, etc.) usados en la vista de Objetivos.

---

## ⚠️ Notas y gotchas importantes (aprendidos en auditorías)

- **Facturación del día** = `vw_facturacion_semana.facturado_real` (semana actual) o `vw_dashboard_ventas_facturas_live.venta_neta_total` (hoy). Las **facturas formales** (`v_facturas_listado`) son solo las emitidas con NIF, NO todas las ventas → no las uses para "cuánto facturamos".
- **`cancelled_at`** en las ventas NO es una anulación: es una **marca automática de cocina/curso** que se pone a casi todos los platos de comida. Lo realmente cobrado es **`is_paid = true`** (así lo usan `vw_coste_ticket` y `vw_food_cost_real`).
- **Combos taquitos/baos**: su coste/PVP/receta real está en `vw_taquitos_baos_combos` (cada combo se resuelve por sus 2 opciones cantidad+sabor); no uses el coste base del SKU.
- **Tablas crudas útiles**: `sales_orders`, `sales_order_items`, `sales_item_options` (ventas TPV línea a línea), `products`/`product_options` (catálogo), `turnos` (definición de turnos comida/cena).
- **⏰ ZONA HORARIA (importante):** muchas columnas de tipo timestamp (`start_time`, `end_time`, `created_at`, `clock_in`, etc.) se guardan en **UTC**. El restaurante está en **Europe/Madrid (UTC+2 en verano)**. Para MOSTRAR una hora al usuario: usa la columna ya localizada si existe (p. ej. `hora_entrada`/`hora_salida` en los turnos), o convierte con `columna AT TIME ZONE 'Europe/Madrid'`. NUNCA muestres una hora UTC en crudo.
