# Changelog — NÜA Smart App

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased]

### Corregido
- **Auditoría food cost — cobertura (A1/A2)**: dos productos que vendían pero NO entraban en el food cost (gate `cost_price>0` + categoría no listada):
  - **Poke "Crea tu" (RST-SPK-CSP)** estaba a coste 0 (plato dinámico que arma el cliente) → invisible. Asignado **coste medio de los pokes (4,21 €)** como aproximación pactada (la exactitud por cliente no es manejable ni material). Aparece a ~24,5 % food cost.
  - **Smart Menús (RST-SM)** tenían coste correcto (criterio conservador del caso más caro) pero la categoría no estaba en `vw_food_cost` → añadida categoría "Menús" (Burger 30 %, Crea tu 26 %, **Poke 44 %**). Ver `scripts/create_vw_food_cost.sql`.
  - Efecto en el food cost ponderado 30d: Global 21,5 % → **22,1 %**, Comida 21,2 % → **22,0 %** (ambos productos tienen food cost > media).
- **Coste y receta de los taquitos/baos (platos combinatorios) en Food Cost**: `vw_food_cost` calculaba los 12 combos de taquitos con un CTE de números **cableados** que infravaloraba los premium (Solomillo 4ud: 6,41 € → **10,16 €** real; food cost 30% → **48%**), y la pestaña mostraba **siempre la receta "POLLO"** para todos (porque `product_recipe_map` está keyado por SKU y los combos comparten `RST-SFC-NST`). Nueva vista `vw_taquitos_baos_combos` que resuelve cada combo (cantidad + sabor, identificados por sus dos opciones `-C-{2T/3T/4T}` + `-C-{P/CP/CD/S}`) a su **receta GStock real** (coste en vivo de `gstock_recipes`, nada cableado) con la receta correcta por variante. `fetchFoodCostProducts()` sobrescribe coste/PVP/receta de esos combos. Ver `scripts/create_vw_taquitos_baos_combos.sql`.
- **Coste real POR TICKET de los combinatorios**: `vw_coste_ticket` y `vw_food_cost_real` resuelven ahora cada venta de taquitos/baos por sus **2 opciones** (cantidad + sabor de `sales_item_options`) → combo real, en vez de usar el coste base del SKU / el combo más barato. Impacto en el food cost ponderado 30d: Global 21,0 % → **21,5 %**, Comida 20,5 % → **21,2 %** (Bebida igual). Ver `scripts/create_vw_food_cost_real.sql` y `scripts/create_vw_coste_ticket.sql`.
- **PVP real de los combinatorios**: el PVP del catálogo (`vw_food_cost` cableaba base 10,90/17; `products.price` decía 11,50/16,50) **no coincidía con lo realmente cobrado** (`sales_order_items.price_total`). Corregido al precio real validado contra ventas: taquitos base **10,50** (+sabor/+cantidad), baos base **7,50/8,00** (el catálogo decía 17 → el food cost de los baos mentía ~7 %, real ~14-16 %). Pendiente (aparte): la fuente del PVP en el TPV (`products.price`) está desincronizada — revisar el sync.

### Añadido
- **Filtro de platos fuera de carta en Food Cost** (decisión Q2): la pestaña oculta por defecto los platos **sin ventas en los últimos 60 días** (retirados/standby que siguen `is_active=true` en el TPV). Toggle "Ver también sin ventas / fuera de carta" para mostrarlos (con chip "Sin ventas 60d") y contador discreto de cuántos hay ocultos. Señal automática vía nueva vista `vw_productos_vendidos_60d` (SKUs distintos vendidos 60d, anon-readable; ver `scripts/create_vw_productos_vendidos_60d.sql`); `fetchFoodCostProducts()` marca cada plato `soldRecently`. La cabecera real ponderada y los umbrales no cambian. Se auto-mantiene: un plato reaparece al volver a venderse (p. ej. el pulpo standby). Hoy oculta 7 platos (Burrata, Croquets Kids, Vegan Poke, Cervezas Artesanales, Combinado Vodka, NÜA Smart Beer, NÜA Smart Cava).
- **Pestaña Food Cost de Smart Food rehecha** (`components/features/FoodCostTab.tsx`) para reflejar el nuevo sistema de food cost:
  - **Cabecera con food cost REAL ponderado por ventas 30d** (Global / Comida / Bebida) de `vw_food_cost_real` vía nuevo hook `useFoodCostReal()`, en lugar de la media simple de la carta.
  - **Tabla por plato recoloreada** con los umbrales de marca (verde ≤30% / ámbar ≤35% / rojo >35%), coherente con Dashboard y Facturación.
  - **Receta GStock origen** por plato + chip de **estado de mapeo** (`Coste parcial` / `Sin receta` / `Sin revisar`) en lugar de 0 € engañoso. `fetchFoodCostProducts()` ahora compone `vw_food_cost` + `product_recipe_map` + `product_options` + `option_recipe_map`.
  - **Platos dinámicos** (poke "crea tu", hummus, vinos, kids): badge "Dinámico" + **desglose de opciones** con su coste y un **estimador** (marcas opciones → coste y food cost resultante); opciones sin coste mapeado marcadas "sin mapear".
  - Corrige el agrupado: las filas que comparten SKU en `vw_food_cost` (Taquitos 2/3/4 ud, Croquets…) son combos distintos → se deduplican por `sku+nombre`.

### Eliminado
- **Código muerto de la pestaña Food Cost**: campos inexistentes en `vw_food_cost` (`variant_id`, `precio_manual`, `food_cost_peor_pct`), el badge "PVP Manual" inerte, la edición de precio manual y las funciones `updateManualPrice()` / `clearManualPrice()` (RPCs `update_manual_price` / `clear_manual_price` / `update_variant_manual_price`).

### Añadido
- **Capa de coste de OPCIONES (food cost dinámico por modificador):** segundo puente `option_recipe_map` (opción → fuente de coste: receta GStock / producto de compra) + `fn_refresh_option_costs()` que rellena `product_options.cost_price_option` con guarda de plausibilidad. Como `vw_coste_ticket` ya suma las opciones, el coste por ticket se vuelve dinámico real (suma lo que eligió el cliente). Orquestador `fn_refresh_all_costs()` (base + opciones) en el cron diario 06:30. Primer mapeo: sabores de NÜA Smart Hummus a su receta de ración individual (no la del mix). Ver `scripts/create_option_recipe_map.sql`. Pendiente (necesita ración de cocina): pokes, bebidas y postres de menús kids.
- **Sincronización fiable de costes GStock → productos (puente receta↔SKU):** los costes base de la app (`products.cost_price`, que alimentan todo el food cost) estaban desincronizados con las recetas reales de GStock. Solución (DB, ver `scripts/create_product_recipe_map.sql`):
  - Tabla puente `product_recipe_map` (SKU ↔ receta GStock, con `confidence` y `reviewed` para bloqueo manual).
  - Función `fn_refresh_food_costs()` idempotente: refresca coste desde GStock, autodescubre recetas reactivadas/nuevas por nombre exacto, y aplica a `products.cost_price` **solo si es plausible** (>0 y ≤ PVP) — una receta con error de cantidades (p. ej. 299 €) nunca entra.
  - Cron diario `refresh-food-costs` a las 06:30 (tras el sync de recetas de GStock de las 06:00) → autocorrección continua.
  - 1ª pasada: 38 platos corregidos con su coste real (poke, menús, mangotella, pulpo, kids…). Reversible (el puente guarda el coste anterior).


- **Coste real y food cost por ticket en Facturación:** al abrir el detalle de una factura (drawer), nueva sección **"Coste y margen"** con coste de mercancía, food cost % (sobre base imponible, coloreado por umbral) y margen bruto. Si el ticket incluye productos sin coste base mapeado (p. ej. poke "crea tu"), muestra aviso **"coste parcial"**.
  - **Columna "Food Cost" en el listado de facturas** (tabla y cards móvil): % por ticket con color de marca (verde ≤30%, amarillo ≤35%, rojo >35%) y `*` si es coste parcial. Carga por lote vía `fetchCostesTickets()`.
  - **Barra de reparto coste vs margen** en la sección "Coste y margen" del detalle: visualiza qué % de la venta neta es coste de mercancía (coloreado por umbral) y qué % es margen bruto.
  - Nueva vista de BD `vw_coste_ticket` (coste real por ticket = `products.cost_price` + `SUM(product_options.cost_price_option)` sobre líneas `is_paid=true`, unidas por `linked_transaction_id`; food cost sobre base imponible; flags `coste_parcial` y `cuadra_factura`). Ver `scripts/create_vw_coste_ticket.sql`. Validado: 30 días → 405 tickets, coste medio 14,1€/ticket, food cost 19,4%.
  - Índices `ix_soi_linked_tx` y `ix_sio_item` para la búsqueda por ticket.
  - `lib/facturacionService.ts` → `fetchCosteTicket(transactionId)`; tipo `CosteTicket`.

### Corregido
- **Doble conteo en `vw_food_cost_real` (food cost del Dashboard):** `vw_food_cost` contiene filas duplicadas por SKU (variantes-fantasma: taquitos ×12, baos ×4, ~8 platos ×2). El JOIN por SKU multiplicaba cada venta → `venta_neta` y `unidades` infladas ~50-60% (49.346€ → 21.418€ reales; 3.827 → 2.177 unidades). Se deduplica a una fila por SKU (la base, menor coste). El food cost % apenas cambia (20,8% → 20,2%) porque numerador y denominador se inflaban a la par, pero los absolutos ya son correctos. Detectado por auditoría multi-agente del Plan de Food Cost Dinámico.

### Añadido
- **Punto de equilibrio REAL con margen de contribución (gastos variables):**
  - Antes el "Punto de Equilibrio" comparaba las ventas del mes directamente contra los costes fijos, asumiendo margen del 100% (cada euro facturado = beneficio). Indicaba rentabilidad mucho antes de lo real.
  - Nueva fórmula correcta: `Punto de equilibrio (€) = Costes fijos ÷ Margen de contribución`, donde `Margen de contribución % = 100 − (food cost real + otros costes variables)`.
  - `lib/kpiTargets.ts` → `calculateBreakEven()` y tipo `BreakEvenResult`.
  - Nuevo campo configurable `otherVariableCostPct` (comisiones TPV/delivery, consumibles…) en Objetivos KPI. Columna `kpi_targets.other_variable_cost_pct` (default 3).
  - El Dashboard y Ajustes muestran el desglose del cálculo de forma transparente.
- **Food cost REAL y DINÁMICO ponderado por mix de ventas (vista `vw_food_cost_real`):**
  - Antes el food cost era la media simple del food_cost_pct de toda la carta (un plato que se vende 500 veces pesaba igual que uno que se vende 2). Ahora se pondera por unidades vendidas reales (últimos 30 días), con desglose comida/bebida/global.
  - **Dinámico**: suma el coste de los modificadores/opciones que eligió el cliente (`sales_item_options` → `product_options.cost_price_option`): destilados premium en combinados, suplementos, ingredientes de pokes. Numerador = escandallo base + coste de opciones.
  - Limitación conocida (data upstream): los costes de las opciones de los pokes "crea tu" y algunos suplementos aún no están mapeados en GStock/n8n, por lo que el % mostrado es provisional-bajo hasta completarse (Hermes usa 25% como asunción de trabajo). El denominador aún no suma la venta de opción para no infravalorar; se añadirá cuando los costes estén mapeados.
  - Nueva vista de BD `vw_food_cost_real` (`sales_order_items` × `vw_food_cost` + opciones; ver `scripts/create_vw_food_cost_real.sql`).
  - `lib/dataService.ts` → `fetchFoodCostReal()`; tipos `FoodCostReal` y `FoodCostRealRow`.
- **Indicador de "ritmo" (pace) en objetivos del mes:**
  - "Ingresos del mes" y "Punto de Equilibrio" ya no salen siempre en rojo a principio de mes. El estado se mide vs lo que se debería llevar a estas alturas del periodo (no vs el total). `calculateProgress()` acepta `paceFraction`; helper `monthPaceFraction()`.
  - `KPIProgressBar` dibuja una marca vertical del ritmo esperado y muestra el valor esperado a fecha.

### Cambiado
- **Tarjeta "Progreso vs Objetivos" del Dashboard reorganizada por periodos** (antes mezclaba diario/semanal/mensual/30 días sin indicarlo):
  - Bloque **"Este mes"** (con ritmo): Ingresos del mes, Punto de Equilibrio, Coste Laboral.
  - Bloque **"Tendencia · últimos 30 días"**: Food Cost (real ponderado), Ticket Comensal, Facturación Semanal.
  - Cada barra etiquetada con su periodo y base de cálculo.
  - El objetivo de facturación semanal pasa a derivarse del punto de equilibrio real (÷ semanas/mes), no de los costes fijos.

### Corregido
- **Icono de la PWA en iOS mostraba el logo de V0 al añadir a pantalla de inicio:**
  - Causa: `public/apple-icon.png` seguía siendo el icono por defecto de V0 (nunca se actualizó al rebrand). Safari iOS usa ese archivo (`apple-touch-icon`) para la pantalla de inicio, no el `manifest` ni el `favicon` — por eso en Chrome sí salía el logo correcto.
  - Regenerado `public/apple-icon.png` (180×180) a partir de `public/icon-512.png` (logo NÜA), **aplanado sobre fondo blanco** porque las esquinas transparentes hacían que iOS pusiera fondo negro.
  - Nota: iOS cachea el icono; hay que **eliminar y volver a añadir** la app a la pantalla de inicio tras el deploy para verlo.
- **"Algo salió mal — Failed to load chunk" tras cada deploy:**
  - Causa: los clientes con una versión anterior abierta intentaban cargar chunks (`React.lazy`) que el nuevo deploy ya había sustituido en Vercel.
  - `ErrorBoundary` — detecta errores de chunk obsoleto y **recarga automáticamente** (máx. 1 vez/minuto para evitar bucles); si no puede, muestra "Hay una versión nueva de la app" con botón **Recargar** (antes "Volver al Dashboard", que no arreglaba nada).
  - `public/sw.js` — si un asset estático devuelve 404 (chunk de un deploy anterior), sirve la copia cacheada para que los clientes viejos sigan funcionando hasta que recarguen.

### Cambiado
- **Móvil — operatividad: menos cromo, más pantalla (feedback de iPhone):**
  - `ExportButton` — oculto en `< md` en todas las vistas (exportar archivos no es flujo de móvil).
  - `PageHeader` — campana de notificaciones solo en escritorio, y el header **deja de ser sticky en móvil**: se va con el scroll y libera pantalla (en escritorio sigue fijo).
  - `components/ui/ChartScroll.tsx` (nuevo) — envuelve gráficos densos: en móvil mantienen un ancho mínimo legible (560-600px) y se desplazan con el dedo dentro de la tarjeta. Aplicado a: Evolución Costes Laborales y Previsión Facturación Semanal (Dashboard), gráfico 30 días y Comparativa Anual (Reservas).
  - Leyenda de años de la Comparativa Anual con `flex-wrap`.

### Añadido
- **Adaptación móvil (fase 4): offline y pulido táctil:**
  - `public/sw.js` + `components/ServiceWorkerRegister.tsx` — service worker (solo producción): red primero con caché de assets estáticos del mismo origen como respaldo; nunca intercepta Supabase ni `/api/`. La PWA instalada carga el shell más rápido y resiste cortes breves de red.
  - `SmartAssistant` — botón flotante y panel respetan la safe-area inferior de iOS (home indicator) en PWA instalada.
  - `sheet.tsx` — botón de cierre de los drawers con área táctil ampliada (~36px, antes ~16px).
  - `globals.css` — sin flash gris al tocar (`-webkit-tap-highlight-color`) y sin auto-zoom de texto en iOS.

### Corregido
- **Móvil — scroll lateral con datos reales y header gigante (feedback de iPhone en producción):**
  - `app/page.tsx` — `overflow-x-hidden` en `<main>`: ningún elemento interno puede volver a desplazar lateralmente la app entera ("la app desaparecía" al hacer scroll lateral).
  - `DateRangePicker` (normal y expenses) — los pares Desde/Hasta envuelven (`flex-wrap`); eran más anchos que la pantalla y causaban el overflow en Reservas.
  - `ReservationsKPISection` (barra de capacidad) y `ReservationsYearlyChart` (selectores Métrica/Turno) — filas con `flex-wrap`.
  - `PageHeader` — compacto en móvil: menos padding, título `text-lg`, subtítulo oculto en `< md`.
  - `DashboardPage` — fecha y "Última actualización" ocultos en `< lg` (saturaban el header); leyendas de los gráficos con altura 60px en móvil (se solapaban con el plot) y ejes Y más estrechos (38px).
  - `WeekReservationsCard` — los 7 días pasan a scroll horizontal propio dentro de la tarjeta (min 120px/día, legibles) en vez de 7 columnas aplastadas; cabecera de la tarjeta con wrap.
  - Verificado a 430px (iPhone Pro Max): 14 rutas con `scrollWidth` exacto al viewport y sin elementos anchos fuera de contenedores con scroll propio.

### Añadido
- **Adaptación móvil (fase 3): card view en las tablas principales** (las entradas por vista están debajo):
  - `TreasuryMovimientosTab` — tabla de movimientos a `hidden md:block`; tarjetas en móvil con descripción + importe coloreado, fecha, cuenta con logo y el selector de categorización a ancho completo (extraído a `renderCategorySelect`, compartido tabla/tarjeta, conserva colores por método regla/IA/manual). Paginación apilada en móvil.
  - `FacturacionPage` — tabla de facturas a `hidden md:block`; tarjetas con nº de factura + importe, fecha y badge VeriFactu idéntico al de la tabla. La tarjeta abre el detalle (mismo Sheet). Se omiten Mesa y Método. Paginación apilada.
  - Resto de tablas convertidas: ver entradas de Gastos, Ingresos/Operativa, Compras y Conexiones bancarias a continuación. Quedan con scroll horizontal (uso menor en móvil): Dashboard, Agent, Settings y Cuadre de Facturación.
- **Gastos — vista de tarjetas para móvil en Categoría y Proveedor:**
  - `ExpensesCategoriaTab` — la tabla "Detalle de Gastos" pasa a `hidden md:block`; en `< md` se renderiza una lista de tarjetas (`md:hidden`) con proveedor + importe, fecha, badge de estado, vencimiento (rojo si vencido) y categoría. Se omiten las columnas Documento y Tags.
  - `ExpensesProveedorTab` — la tabla "Detalle por Proveedor" pasa a `hidden md:block`; tarjetas con ranking (medallas top 3) + proveedor + total, y pares facturas / pagado / pendiente / vencido con los mismos colores de estado. Se omite la columna % Total.
  - Mismos estados de loading/vacío que las tablas (ya compartidos fuera del contenedor `overflow-x-auto`).
- **Ingresos y Operativa — vista de tarjetas para móvil en sus tablas:**
  - `IncomePage` — la tabla "Métricas Detalladas por Mesa" pasa a `hidden md:block`; en `< md` se renderiza una lista de tarjetas (`md:hidden`) con medalla/ranking + nombre de mesa, total facturado, facturas, propinas y avg/factura. La tarjeta entera selecciona la mesa (mismo handler y resaltado que la fila).
  - `OperationsPage` — "Ranking Productos por Tiempo": tarjetas con producto + t. medio (semáforo `getTimeColor`), badge de categoría, pedidos y máximo; se omite la columna Mediana. "Items con Retraso (>30 min)": tarjetas con producto + tiempo, fecha · hora, mesa y badge de severidad, con el mismo scroll `max-h-[300px]` que la tabla.
- **Compras — vista de tarjetas para móvil en Pedidos y Análisis:**
  - `ComprasPedidosTab` — la tabla de pedidos pasa a `hidden md:block`; en `< md` se renderiza una lista de tarjetas (`md:hidden`) con proveedor + nº pedido, importe, fecha, estado (con aviso de pedido sin albarán) e icono de validación; línea extra con albarán (ref · fecha · importe) cuando existe. La tarjeta entera abre el detalle (`onViewDetail`).
  - `ComprasAnalisisTab` — tablas de Productos y Análisis de Proveedores con tarjetas en móvil: producto/proveedor + importe, cantidad y precio/unidad (productos), facturas/docs, badge de sin facturar y barra de fiabilidad (proveedores). Mismos estados de vacío que las tablas.
- **Conexiones bancarias — vista de tarjetas para móvil en Movimientos:**
  - `BankMovimientosTab` — la tabla de movimientos pasa a `hidden md:block`; en `< md` se renderiza una lista de tarjetas (`md:hidden`) con descripción + contraparte, importe coloreado, fecha y cuenta con logo del banco. Mismos estados de loading/vacío que la tabla. La columna Saldo se omite en la tarjeta.
  - Paginación apilada en móvil (`flex-col sm:flex-row`).
- **Adaptación móvil (fase 2): grids, headers y anchos fijos:**
  - `ProductsPage` — los 4 grids fijos colapsan en móvil: KPIs `grid-cols-1 md:2 xl:4`, gráficos+tabla `grid-cols-1 lg:3` (con `col-span` responsive), Categorías `grid-cols-1 lg:2`, totales del Buscador `grid-cols-1 sm:3`.
  - `PageHeader` — apila título y acciones en `< md`; el título ya no se trunca (ancho natural) y las acciones envuelven con `flex-wrap`. Padding `px-4 sm:px-6`.
  - `PageContent` — padding reducido en móvil (`px-4 sm:px-6 py-4 sm:py-6`).
  - Drawers `Sheet` a ancho completo en móvil: detalle de pedido (ComprasPage), detalle de factura (FacturacionPage) y albaranes sin facturar (`w-full sm:w-[450/500px]`).
  - `SmartAssistant` — el panel de chat ocupa el ancho de pantalla con márgenes en móvil (`inset-x-3`, `max-h-[70vh]`) y mantiene 400px en escritorio.
  - Contenedores de acciones de Expenses/Treasury/Facturación/Products con `flex-wrap`.
  - Verificado: las 14 vistas sin overflow horizontal a 375px.

- **Adaptación móvil (fase 1): PWA + navegación responsive:**
  - `app/manifest.ts` — manifest PWA (`/manifest.webmanifest`): la app ya se puede **instalar en la pantalla de inicio** del móvil (`display: standalone`). Iconos nuevos `public/icon-192.png` / `icon-512.png` generados desde `favicon.png`.
  - `app/layout.tsx` — export `viewport` (antes no existía: el móvil renderizaba sin `width=device-width`), `viewport-fit=cover` para safe-areas de iOS, y metadata `appleWebApp`.
  - `components/layout/Sidebar.tsx` — refactor: navegación y footer extraídos a `NavList`/`UserFooter` compartidos. El sidebar de escritorio se oculta en `< md`; nuevo `MobileHeader` (logo + hamburguesa) que abre la navegación en un drawer `Sheet` lateral y se cierra al navegar.
  - `app/page.tsx` — shell `flex flex-col md:flex-row`: cabecera arriba en móvil, sidebar a la izquierda en escritorio.
  - `hooks/useIsMobile.ts` — hook de detección de viewport móvil (< 768px, breakpoint `md`), para futuras vistas alternativas (card view en tablas).
  - Pendiente (fases siguientes): grids fijos de ProductsPage, drawers `w-[450px]`, card view para tablas, service worker.

### Corregido
- **Navegación — la pestaña "Agent" no abría al hacer clic:**
  - `useAppRouter` tenía `VALID_PATHS` **hardcodeada a mano** y le faltaba `/agent`, así que `navigate("/agent")` caía a `/` (el clic en el menú no hacía nada).
  - Ahora `VALID_PATHS` se **deriva de `NAVIGATION_ITEMS`** → cualquier vista del menú es navegable automáticamente y no se vuelve a desincronizar al añadir nuevas.

### Añadido
- **Nueva sección "Agent" (`/agent`) — panel de control del agente NÜA (Hermes):**
  - Vista nueva en el menú lateral que lee el estado del agente desde las tablas `hermes_*` de Supabase (el VPS sincroniza cada ~5 min; la app solo lee, rol `authenticated`).
  - Secciones (tabs `MenuBar`): **Vista General** (estado online/offline, recursos VPS RAM/CPU con colores de alerta, consumo de API: gasto mensual/saldo/cache hit/tokens 30d, y gráfico de tokens por día — `hermes_analytics_daily`), **Memoria** (Perfil/Sistema), **Skills** (grid con activa/inactiva + custom), **Cron** (tabla con estado, schedule, próxima/última ejecución y resultado), **Sesiones** (origen telegram/cli/cron, modelo, tokens, preview).
  - Online si `hermes_status.updated_at < 10 min`. Auto-refresh vía React Query (estado cada 60s). Maneja estados vacíos/null (las tablas se rellenan cuando el agente sincroniza).
  - Nuevos: `components/views/AgentPage.tsx`, `lib/hermesService.ts`, `hooks/queries/useHermesData.ts`, `types/hermes.ts`. Item de nav + `case "/agent"` en `app/page.tsx`.
  - Estilo: claro, mismos componentes que el resto (`TremorCard`, `PageHeader`, `PageContent`, `MenuBar`, recharts).
  - Migración SQL de referencia de las tablas en `supabase/migrations/20260602_create_hermes_tables.sql`.

### Eliminado
- **Dashboard — Mini-tarjetas "Pedidos Retrasados" y "Albaranes Antiguos":**
  - Eliminadas las dos health mini-cards que aparecían debajo de la previsión del tiempo
  - Limpieza: import `AlertTriangle` ya no se usa y se ha quitado de `DashboardPage.tsx`
  - El estado `conciliacionResumen` se mantiene porque sigue alimentando el sistema de alertas (`useAlerts`)

### Cambiado
- **Dashboard — Previsión 7 días ahora alinea altura con Reservas Semana:**
  - El grid `Weather + Reservas` pasa de `items-start` a `items-stretch`
  - `WeatherCard` (que ya tenía `h-full flex flex-col`) ahora ocupa toda la altura de la fila
  - Resultado: ambas tarjetas quedan visualmente a la misma altura

### Corregido
- **Mix de Producto — Buscador descuadraba con el Ranking por incluir anulaciones:**
  - El Buscador sumaba filas con `unidades = 0` / solo anulaciones, mientras que el Ranking las excluye (`unidades > 0 && facturado > 0`)
  - Añadido el mismo filtro en `searchResults` (`ProductsPage.tsx`) para que totales y filas cuadren entre ambas pestañas
  - Nota: los filtros propios del Buscador (Turno/Período/Fechas) siguen siendo independientes de la selección global de la cabecera por decisión de producto

- **Conexiones Bancarias — Error "Institution not found" al renovar consentimiento:**
  - `handleSelectInstitution` enviaba `gocardless_id` (ej: "BBVA_ES_BBVAESMM") pero la API esperaba el UUID local
  - Corregido en `TreasuryPage.tsx` y `BankConnectionsPage.tsx` para enviar `institution.id` (UUID)
  - API `requisitions/create` ahora también busca por ambos campos (`id` o `gocardless_id`) como fallback

### Añadido
- **Reservas — Horario de turnos y ocupación corregida:**
  - Lunes y martes mediodía se marcan como "Cerrado" por defecto en la tarjeta de reservas semanales
  - Ocupación se calcula solo sobre turnos abiertos (66 plazas si solo cena, 132 si ambos)
  - Media semanal excluye turnos cerrados del cálculo
  - UI muestra "Cerrado" en gris para turnos no operativos
  - Soporte para excepciones vía tabla `horario_excepciones` en Supabase
  - Nuevo campo `closedLunch`/`closedDinner` en tipo `WeekReservationDay`
  - Integración con CoverManager: workflow n8n semanal que sincroniza turnos abiertos desde `availability_calendar_total` a Supabase
  - Archivo: `scripts/n8n_workflow_covermanager_horarios.json`

### Corregido
- **Gastos — Colores pendiente/vencido en tab Categoría:**
  - Corregido bug donde facturas pendientes dentro de plazo se mostraban en rojo (color de vencido) en vez de amarillo (color de pendiente)
  - Root cause: RPC `get_gastos_resumen_by_tags` agrupa todo lo no pagado como "pendiente" sin distinguir vencido
  - Fix: Nuevo `tagStatusMap` (useMemo) calcula montos reales de `pending` vs `overdue` por tag desde el array `expenses` que tiene el status correcto
  - Tag filter badges: indicador rojo solo cuando hay gastos vencidos, amarillo para alto % pendiente en plazo
  - Category summary cards: fondo rojo solo con gastos vencidos, fondo amarillo para alto % pendiente en plazo
  - Ahora se muestran "Pendiente" (amarillo) y "Vencido" (rojo) como líneas separadas en el resumen por categoría
  - Fecha de vencimiento usa color contextual (rojo si hay vencidos, amarillo si solo pendientes)

### Eliminado
- **Dashboard — Resumen Ejecutivo NÜA desactivado:**
  - Eliminada la tarjeta "Resumen Ejecutivo NÜA" (Smart AI Summary) del dashboard — no era funcional ni navegaba a ningún sitio
  - Eliminados imports no usados (`Sparkles`, `ArrowRight`)

### Cambiado
- **Dashboard — Layout Weather + Reservas mejorado:**
  - Grid cambiado de `3 cols (1+2)` a `5 cols (2+3)` para dar más espacio al tiempo y mejor proporción
  - Mini-cards de alertas (Pedidos Retrasados, Albaranes Antiguos) ahora en grid horizontal 2 columnas en vez de vertical apilado
  - Mejor aprovechamiento del espacio sin gaps innecesarios

### Añadido
- **Compras — Albaranes sin facturar clicables (Item 1):**
  - KPI "Albaranes sin Facturar" ahora es clicable y abre un Sheet/Drawer lateral
  - Nuevo componente `UnbilledAlbaranesDrawer.tsx` — lista de albaranes sin factura ordenados por antigüedad
  - Columna "Días sin factura" con indicador rojo para albaranes con >30 días de antigüedad
  - Muestra proveedor, número de albarán, fecha, importe y días transcurridos
- **Compras — Fecha de vencimiento manual en conciliación (Item 2):**
  - Input de fecha de vencimiento en cada factura de la tab Conciliación
  - Al confirmar, la fecha se pasa a `confirmarConciliacion()` vía parámetro `vencimiento`
  - Estado local `manualDates` para gestionar fechas por factura
- **Compras — Precio unitario en ranking de productos (Item 4):**
  - Nueva columna "Precio/U" en la tabla de top productos del tab Análisis
  - Cálculo: `total / cantidad` formateado con `formatCurrency()`
- **Compras — Alerta de pedidos "Enviado" sin recepción (Item 5):**
  - Icono `AlertTriangle` rojo junto al estado "Enviado" si han pasado >3 días sin albarán
  - Tooltip con mensaje "Pedido sin albarán después de 3 días"
  - Usa `differenceInDays` + `parseISO` de `date-fns`
- **Compras — Ranking de proveedores con fiabilidad documental (Item 6):**
  - Nueva sección "Ranking de Proveedores" en tab Análisis con datos reales
  - Nueva función `computeProveedorRanking()` en `comprasService.ts` — cálculo client-side desde datos en memoria
  - Métricas: total compras, nº albaranes, nº facturas, albaranes sin facturar, fiabilidad documental (%)
  - Fiabilidad = % de facturas sin incidencias (ni `requiere_revision` ni estado "revision")
  - Código de color: verde ≥90%, amarillo ≥70%, rojo <70%
  - Nuevo tipo `CompraProveedorRanking` en `types/purchases.ts`
  - Nuevo tipo `CompraAlbaranVinculadoInfo` en `types/purchases.ts` para datos legibles de albarán

### Mejorado
- **Compras — UUID sustituido por datos legibles en conciliación (Item 3):**
  - Los albaranes vinculados en la tab Conciliación ahora muestran número, fecha e importe en vez del UUID
  - `ComprasPage.tsx` construye un `albaranesMap` (Map de ID → info legible) desde `unbilledList`
  - `ComprasConciliacionTab.tsx` recibe y usa el mapa para resolver los IDs
- **Compras — Mensaje claro sin datos para comparativa (Item 7):**
  - Cuando `variacion_vs_anterior` es 0, muestra "Sin datos suficientes para comparar" en vez de "+0.0%"
  - Aplicado al KPI de variación en el tab Análisis

### Corregido
- **Compras — Fix `require("react")` hack en ConciliacionTab:**
  - `ComprasConciliacionTab.tsx` usaba `(require("react") as any).useState(...)` para el state `manualDates`
  - Reemplazado por import estándar `useState` de React
- **Compras — Fix `handleConfirmar` no pasaba `vencimiento`:**
  - La función en `ComprasPage.tsx` aceptaba solo `factura` pero ignoraba el segundo argumento `vencimiento`
  - Corregido para aceptar y pasar `vencimiento?: string` a `confirmarConciliacion()`
- **Compras — Fix ranking de proveedores con datos mock:**
  - El ranking usaba `distribucionAgrupada` con cálculos ficticios (`Math.floor(prov.total / 150)`, `100 - (idx * 5)`)
  - Reemplazado por `computeProveedorRanking()` que calcula métricas reales desde proveedores + facturas + albaranes

### Mejorado
- **Gastos — KPIs clicables con tres estados de color:**
  - 3 tarjetas KPI (Total Gastos, Pagado, Vencido) ahora son clicables y filtran la tabla de detalle
  - Total Gastos muestra 3 mini-indicadores con % pagado (verde), % pendiente (amarillo), % vencido (rojo)
  - Click en KPI activa/desactiva filtro global sincronizado con el filtro de estado de cada tab
  - Indicador visual de filtro activo debajo de los KPIs con botón de reset
- **Gastos — % pendiente en Resumen por Categoría:**
  - Cards de categoría muestran % pendiente junto al importe pendiente
- **Gastos — Columnas de tabla reorganizadas:**
  - Columna "Estado" movida después de "Proveedor" para ser visible sin scroll horizontal
  - Orden: Fecha → Proveedor → Estado → Importe → Vencimiento → Categoría → Documento → Tags
- **Gastos — Fecha de vencimiento en cards de categoría:**
  - Cuando una categoría tiene 100% pendiente, muestra la fecha de vencimiento más próxima con icono CalendarClock
- **Gastos — Indicador visual en tags con alto % pendiente:**
  - Tags con ≥70% pendiente muestran icono AlertTriangle y badge rojo "XX% pdte"
- **Gastos — Tag "No operativo":**
  - Tags de gastos personales/desplazamiento (dietas, kilometraje, representación) se muestran con borde discontinuo, estilo italic y etiqueta "N/O"
  - Lista configurable de palabras clave en `NON_OPERATIONAL_TAGS`

### Eliminado
- **Forecasting y What-If eliminados por completo:**
  - Vistas: `ForecastingPage.tsx`, `WhatIfPage.tsx`
  - Tipos: `types/forecasting.ts`, `types/whatif.ts`
  - Servicio: `lib/whatIfService.ts`
  - Hooks: `hooks/queries/useForecastingData.ts`
  - Funciones: `fetchForecastData()`, `fetchForecastCalendar()`, mocks asociados
  - Rutas `/forecasting` y `/what-if` eliminadas de navegación y router
  - Vista materializada `vw_forecasting_analysis` eliminada de Supabase
  - Tipos compartidos (`YearlyTrendInsight`, `PeriodComparisonAggregate`, `MonthlyReservationData`, `YearlyComparisonData`) movidos a `types/reservations.ts`
  - Workflows n8n eliminados: "🔮 Forecasting - Gemini via HTTP" (activo, cron diario 8AM), "Forecasting - Sync Meteo Barcelona" (archivado)
  - RPCs de Supabase: `api_get_forecasting_context()`, `api_apply_gemini_adjustments()`
  - Tablas de Supabase: `forecasting_daily`, `forecasting_gemini_log`, `forecasting_calendar_events`, `forecasting_factores_lluvia`
  - Funciones de Supabase: `api_generar_forecasting_7dias()`, `fn_sync_weather_to_forecasting()`, `forecasting_clasificar_lluvia()`, `forecasting_multiplicador_lluvia()`
  - Vista: `vw_forecasting_analysis`
  - **Conservados:** `fetchBenchmarks()`, `BenchmarksTab`, `forecasting_weather_history`, `reservas_agregadas_diarias`, workflow AEMET

### Añadido
- **Panel de Estado de Sincronización Bancaria en Treasury Dashboard:**
  - Nuevo panel centralizado encima de las tarjetas de cuentas bancarias que muestra:
    - Última sincronización (fecha/hora del sync más reciente de todas las cuentas)
    - Requests restantes hoy (`X/4`) con código de color (verde >2, ámbar 1-2, rojo 0)
    - Días de consentimiento restantes con alerta y botón "Renovar" cuando ≤7 días
    - Botón "Sincronizar todo" centralizado (deshabilitado si no quedan requests)
    - Avisos de rate limit (ámbar cuando ≤2 restantes, rojo cuando 0)
  - **Nueva API route** `GET /api/gocardless/sync/status` — agrega datos de 3 tablas: `gocardless_rate_limits`, `gocardless_accounts`, `gocardless_requisitions`
  - **Nuevo tipo** `SyncStatus` en `types/bankConnections.ts`
  - **Nueva función** `fetchSyncStatus()` en `bankConnectionsService.ts`
  - Eliminados: botón sync del KPI "Saldo Total", botones individuales de sync en tarjetas de cuentas, info de consentimiento en tarjetas individuales
  - El estado de sync se refresca automáticamente tras cada sincronización exitosa

### Cambiado
- **Migración GoCardless: de subapp externa a API routes internas:**
  - Todo el backend de GoCardless ahora vive dentro de la Smart App en `app/api/gocardless/*` — ya no se necesita ejecutar la subapp `go-cardlessapp (1)/` por separado
  - 6 API routes internas: `institutions`, `requisitions/create`, `requisitions/[id]/status`, `requisitions/[id]/accounts`, `accounts/[id]/full-sync`, `sync/initial`
  - Nuevo cliente GoCardless (`lib/gocardless.ts`): token management con auto-refresh, retry en 401, singleton
  - Nuevo rate limiter (`lib/gocardlessRateLimit.ts`): 4 req/día por cuenta por scope, cache en memoria 5 min, tabla `gocardless_rate_limits`
  - `bankConnectionsService.ts` actualizado: todas las funciones llaman a `/api/gocardless/*` (ya no usa `NEXT_PUBLIC_GOCARDLESS_APP_URL`)
  - Variables de entorno: `GOCARDLESS_SECRET_ID` + `GOCARDLESS_SECRET_KEY` (server-only). Eliminada `NEXT_PUBLIC_GOCARDLESS_APP_URL`

### Corregido
- **Fix: tarjeta GoCardless en Configuración mostraba datos obsoletos ("07 feb"):**
  - `settingsService.ts` leía de `gocardless_sync_logs` (tabla de historial de la subapp antigua, ya no se actualiza)
  - Cambiado a leer directamente de `gocardless_accounts` con `last_sync_at` y conteo real de cuentas sincronizadas
- **Fix crítico: transacciones no se sincronizaban (faltaba `account_gocardless_id`):**
  - La columna `account_gocardless_id` en `gocardless_transactions` es NOT NULL sin default
  - Las rutas `full-sync` e `initial-sync` no incluían este campo en el upsert → violación de constraint → insert silenciosamente fallaba
  - Las transacciones existentes (insertadas por la subapp antigua) no se afectaban, pero nuevas transacciones nunca se guardaban
  - Fix: añadido `account_gocardless_id: gcAccountId` al mapping de transacciones en ambas rutas
  - También añadidos campos adicionales: `value_date`, `creditor_account_iban`, `debtor_account_iban`, `bank_transaction_code`, `transaction_id`, `end_to_end_id`
  - Añadido logging de errores de upsert para depuración futura
- **Fix: formato de `current_balance` — RPCs leían JSON pero API escribía número plano:**
  - Las API routes escribían `current_balance` como número ("80.56") pero las RPCs intentaban `::jsonb->>'amount'` → devolvía null → mostraba 0,00€
  - Fix en API: ahora escribe `JSON.stringify({amount, currency})` + actualiza `balance_last_updated_at`
  - Fix en RPCs: `get_treasury_accounts` y `get_treasury_kpis` ahora manejan ambos formatos con `jsonb_typeof()` check
  - `get_treasury_accounts` usa `GREATEST(last_sync_at, balance_last_updated_at)` para la fecha de sync
- **Fix: calendario mostraba "0d" — requisitions expiradas contaminaban el cálculo:**
  - 7 requisitions en BD, las más antiguas (dic 2025) ya expiradas → `Math.max(0, días_negativos) = 0`
  - Fix: agrupar por `institution_id` y quedarse solo con la requisition más reciente por banco
- **Fix crítico: mismatch UUID vs gocardless_id en sincronización de cuentas:**
  - La RPC `get_treasury_accounts` devuelve `a.id` (UUID de Supabase) como campo `id` en `TreasuryAccount`
  - La ruta `full-sync` buscaba solo por `.eq("gocardless_id", accountId)` — pero recibía el UUID → siempre 404
  - Fix: la ruta ahora busca primero por `gocardless_id`, luego por `id` (UUID) como fallback
  - Usa `account.gocardless_id` para todas las llamadas a la API de GoCardless
- **Fix: botón "Sincronizar Todo" enviaba literal "all" como ID de cuenta → 404:**
  - `handleSyncAccount` en TreasuryPage ahora detecta `accountId === "all"` y sincroniza todas las cuentas secuencialmente
  - Muestra toast con resultado agregado (cuentas sincronizadas, transacciones, errores)
- **Fix: tipo `consentInfo: any` en TreasuryDashboardTabProps:**
  - Cambiado a `BankConsentInfo | null` con import correcto desde `@/types`
- **Fix: `parseBalance`/`parseAmount`/`parseCurrency` no parseaban JSON strings:**
  - La columna `current_balance` en `gocardless_accounts` es tipo `text` en PostgreSQL — almacena JSON como `{"amount":"726.02","currency":"EUR",...}`
  - Supabase devuelve columnas `text` como strings, no como objetos JSON parseados
  - Los helpers solo verificaban `typeof raw === "object"` — las strings JSON caían al fallback `parseFloat(String(raw))` que retornaba `NaN` (mostrado como 0.00 EUR)
  - Solución: nuevo helper `tryParseJson()` que intenta `JSON.parse` sobre strings antes de la lógica de extracción de campos
  - Mismo fix aplicado a `parseAmount` y `parseCurrency` que tenían el mismo patrón
- **Fix: JOINs de PostgREST fallaban sin FKs definidas en Supabase:**
  - Las tablas `gocardless_accounts`, `gocardless_transactions` y `gocardless_requisitions` no tienen foreign keys hacia `gocardless_institutions`
  - Los JOINs implícitos de PostgREST (`gocardless_institutions(name, logo_url)`) requieren FKs — sin ellas retornaban error silencioso y las funciones devolvían arrays vacíos
  - Refactorizadas 3 funciones en `bankConnectionsService.ts` para usar queries paralelas + JOINs manuales en JavaScript:
    - `fetchBankAccounts()` — query accounts + institutions por separado, lookup por `institution_id`
    - `fetchBankTransactions()` — query transactions + accounts + institutions, lookup por `account_gocardless_id` → `institution_id`
    - `fetchConsentStatus()` — query requisitions + institutions, lookup por `institution_id`
  - Resultado: cuentas con saldos reales, nombres e instituciones con logos ahora se muestran correctamente

### Añadido
- **Rediseño de Tesorería:** Integración de conexiones bancarias (GoCardless) directamente en el Dashboard.
- **Acciones Rápidas:** Botón de "Actualizar" global y botones de "Sincronizar"/"Conectar" en tarjetas de cuenta.
- **Estado de Consentimiento:** Visualización de días restantes para renovación de autorización bancaria en el Dashboard.

### Eliminado
- **Tab de Conexiones:** Se elimina la pestaña independiente de conexiones bancarias dentro de Tesorería para reducir redundancia.
- **Conexiones Bancarias como tab en Tesorería:**
  - La funcionalidad de Conexiones Bancarias ya no es una página independiente (`/bank-connections`) — ahora es la tab **"Conexiones"** dentro de Tesorería (`/treasury`)
  - Nuevo componente `TreasuryConexionesTab.tsx` — wrapper auto-contenido que encapsula toda la lógica de BankConnectionsPage (estado, data loading, flujo de conexión GoCardless, polling, sync) sin recibir props del padre
  - TreasuryPage tiene ahora 6 tabs visibles: Dashboard, Movimientos, Por Categoría, Pool Bancario, Conexiones (+ tab oculta Por Cuenta)
  - Callback GoCardless actualizado: redirige a `/treasury` con señal `gocardless_activate_tab` en sessionStorage para auto-activar la tab Conexiones
  - Ruta `/bank-connections` eliminada de `useAppRouter` VALID_PATHS y del switch en `app/page.tsx`

- **Conexiones Bancarias con datos reales (GoCardless Open Banking):**
  - Reemplaza vista mock por datos reales de Supabase (tablas `gocardless_accounts`, `gocardless_transactions`, `gocardless_requisitions`)
  - Nuevo servicio `lib/bankConnectionsService.ts` con 6 funciones: `fetchBankAccounts`, `fetchConsolidatedBalance`, `fetchBankTransactions`, `fetchConsentStatus`, `triggerAccountSync`, `getGoCardlessAppUrl`
  - Nuevos tipos en `types/bankConnections.ts`: `BankAccount`, `BankTransaction`, `BankConsolidatedBalance`, `BankConsentInfo`, `BankTransactionFilters`, `BankTransactionsResult`, `BankSyncResult`
  - Tab **Resumen**: 4 KPIs (Saldo Total, Ingresos del Mes, Gastos del Mes, Balance Neto) + lista cuentas con logos bancarios + alerta renovación consentimiento (amber ≤15d, rojo ≤7d)
  - Tab **Movimientos**: tabla transacciones con filtros (búsqueda, cuenta, tipo ingreso/gasto) + paginación server-side (50/página)
  - Botón "Sincronizar" por cuenta → llama API subapp GoCardless (`/api/accounts/{id}/full-sync`)
  - Botón "Renovar ahora" → abre la subapp GoCardless en nueva pestaña con parámetro institución
  - Variable de entorno `NEXT_PUBLIC_GOCARDLESS_APP_URL` para configurar URL de la subapp
  - Sub-componentes: `BankResumenTab.tsx`, `BankMovimientosTab.tsx`, `constants.ts` (patrón TreasuryPage)

- **Flujo de Conectar/Renovar banco embebido en la Smart App:**
  - Los botones "Conectar banco" y "Renovar ahora" ya no abren la subapp GoCardless externamente — ahora todo el flujo se realiza dentro de la app
  - Nuevo componente `BankConnectSheet.tsx` — panel lateral (Sheet) con flujo multi-paso: seleccionar banco → crear requisition → autorizar en banco → polling → obtener cuentas → sync inicial → éxito
  - 5 nuevas funciones en `bankConnectionsService.ts`: `fetchInstitutions`, `createRequisition`, `pollRequisitionStatus`, `fetchRequisitionAccounts`, `triggerInitialSync`
  - 8 nuevos tipos en `types/bankConnections.ts`: `BankInstitution`, `BankConnectStep`, `BankConnectedAccount`, `BankConnectState`, `BankCallbackParams`, `BankRequisitionCreateResult`, `BankRequisitionStatus`, `BankInitialSyncResult`
  - Detección de callback GoCardless en `app/page.tsx` — detecta `?gocardless_callback=true&ref=xxx` y navega a `/bank-connections` para reanudar el polling
  - CORS configurado en la subapp (`go-cardlessapp (1)/next.config.mjs`) para requests cross-origin
  - Renovación de consentimiento pre-selecciona la institución bancaria que necesita renovación

- **Food Cost real en Dashboard KPI:**
  - Nueva función `fetchFoodCostAverage()` en `lib/dataService.ts` — consulta ligera a `vw_food_cost` que devuelve el % promedio global
  - `DashboardPage.tsx` ahora llama a `fetchFoodCostAverage()` en el `Promise.all` de carga de datos
  - KPI "Food Cost" muestra el valor real (~20.4%) en vez del `0` hardcodeado
  - Se carga en paralelo con los demás datos del dashboard (sin impacto en rendimiento)

- **Nuevos KPIs operativos en Dashboard:**
  - **Facturación Semanal** reemplaza Facturación Diaria — suma ventas de la semana en curso vs target semanal (refleja estacionalidad finde vs entre semana)
  - **Ticket Medio Comensal** reemplaza Ticket Medio Mesa — usa `ticket_comensal_30d` real de la vista (indicador de upselling)
  - **Break-even Mensual** (nuevo) — ingresos mensuales vs costes fijos configurables (~33.500€) para saber si se cubren gastos
  - Ocupación Comida/Cena eliminadas de la sección KPI (ya visible en tarjetas de reservas)
  - Layout final: 3 KPIs Ingresos + 3 KPIs Costes y Rentabilidad (simétrico)
- **Nuevos targets configurables en Ajustes → Objetivos KPI:**
  - `weeklyRevenueTarget` (default: 25.000€)
  - `ticketComensalTarget` (default: 27€)
  - `breakEvenTarget` (default: 33.500€)
  - Migración SQL necesaria: `ALTER TABLE kpi_targets ADD COLUMN ...` (fallback a defaults si no ejecutada)
  - `types/kpiTargets.ts` y `lib/kpiTargets.ts` actualizados con nuevos campos y mapeo Supabase

- **Target Facturación Semanal dinámico:**
  - Ya no es un campo configurable manual (25.000€ hardcodeado no tenía sentido)
  - Ahora se calcula automáticamente: `breakEvenTarget ÷ semanas del mes actual`
  - Ej: 33.500€ / 4 semanas (feb) = ~8.375€/semana — refleja la realidad operativa
  - En Ajustes el campo aparece como solo lectura con indicador "(auto)"
  - Cambiar los costes fijos actualiza automáticamente el target semanal

### Corregido
- **Coste Laboral KPI — media ponderada del mes:**
  - Antes: cogía el último día con datos (muy volátil, ej: 27% un viernes vs 90% un martes)
  - Ahora: calcula la **media ponderada mensual** = total costes laborales / total ventas netas del mes
  - Valor más representativo para un KPI operativo (ej: 36.1% en feb-2026 con 6 días de datos)
  - Nuevo `useMemo` `laborCostMonthlyAvg` en DashboardPage — filtra solo mes actual y días con datos reales
  - Alertas también usan la media mensual en vez del último día

- **Sistema de conciliación de facturas mejorado:**
  - Vista SQL `vw_compras_facturas_pendientes` ampliada con 3 columnas IA: `ia_confianza`, `motivo_revision`, `tipo_referencia`
  - `comprasService.ts` mapea datos IA reales (antes hardcodeados a null)
  - `ComprasConciliacionTab.tsx` reescrito: resumen visual de estados, barra de confianza IA, motivos de revisión, acción en lote "Confirmar auto-conciliadas"
  - `ComprasPage.tsx` nueva función `handleConfirmarTodas` para confirmar todas las auto-conciliadas
  - `constants.tsx` añadido estado "pendiente" a `ESTADO_CONCILIACION_CONFIG`
  - `dataService.ts` nueva función `fetchConciliacionResumen()` para alertas
  - `alertEngine.ts` nuevas reglas: "facturas-requieren-revision" (warning) y "facturas-auto-confirmar" (info)
  - `DashboardPage.tsx` conectado con datos de conciliación para alertas proactivas

### Mejorado
- **Rediseño sección "Progreso vs Objetivos" del Dashboard:**
  - `KPIProgressBar.tsx` reescrito: eliminado sistema dual (compact/full), diseño premium unificado
  - Nuevo prop `icon` — cada KPI tiene su icono lucide en contenedor coloreado por estado
  - Números en brand color `#364f6b` (antes `text-slate-800` genérico)
  - Barra de progreso más gruesa (`h-2.5`, antes `h-1.5`/`h-2`) sobre `bg-slate-100`
  - Tarjetas individuales con `bg-white border-slate-200 rounded-xl` (antes fondo pastel lavado)
  - Badge de estado: `uppercase tracking-wider` (patrón consistente con el resto de la app)
  - Layout reorganizado: sección "Ingresos" (3 cols) + separador + sección "Costes y Rentabilidad" (3 cols)
  - Los 6 KPIs tienen idéntico tratamiento visual (antes los 4 inferiores eran segunda clase)
  - Header mejorado con subtítulo descriptivo (patrón WeatherCard)
  - Animación suavizada a `duration-700 ease-out`

---

## [2.3.0] - 2026-02-08

### Añadido
- **KPI Targets persistidos en Supabase:**
  - Nueva tabla `kpi_targets` en Supabase (script SQL en `scripts/create_kpi_targets_table.sql`)
  - `lib/kpiTargets.ts` ahora lee/escribe en Supabase con fallback a localStorage
  - `saveKPITargets()` y `loadKPITargets()` son ahora funciones async
  - `loadKPITargetsLocal()` exportada para fallback directo
  - Row Level Security habilitado: solo usuarios autenticados pueden leer/escribir
  - `updated_by` registra qué usuario modificó los objetivos por última vez
  - Los objetivos se comparten entre todos los usuarios del restaurante
  - 3 nuevos tests async: carga desde Supabase, fallback a localStorage, guardado dual

### Modificado
- `DashboardPage.tsx` — `loadKPITargets()` ahora usa `.then()` (async)
- `SettingsPage.tsx` — `handleKpiSave` y `handleKpiReset` ahora son async
- Tests de kpiTargets aumentados de 11 a 14 (mock completo de Supabase)

---

## [2.2.1] - 2026-02-08

### Corregido
- **Fix superposición de notificaciones:** El `NotificationCenter` estaba posicionado como `fixed top-4 right-20 z-50` flotando sobre la app, superponiéndose con los botones del `PageHeader` (Exportar, Actualizar, etc.)
  - Movido el `NotificationCenter` al componente `PageHeader` como última acción del header, integrado de forma consistente en todas las 16 vistas
  - Eliminado el wrapper `fixed` en `app/page.tsx`
  - El Toaster de Sonner movido de `top-right` a `bottom-right` para evitar conflictos con el header

### Mejorado
- **Consistencia de colores de marca:**
  - Eliminadas definiciones locales duplicadas de `BRAND_COLORS` en `BenchmarksTab.tsx` y `FoodCostTab.tsx` → ahora importan desde `@/constants`
  - Renombrado `.danger` → `.error` para consistencia con la constante central
  - Normalización de variantes de color: `#ffce85` → `#ffcb77`, `#fec94f` → `#ffcb77`, `#fec869` → `#ffcb77`, `#f97316` → `#f59e0b`
  - Reemplazado `#49eada` en expenses por `BRAND_COLORS.success` (#17c3b2)
  - Nueva constante `EXTENDED_CHART_COLORS` en `constants.ts` con 12 colores para gráficos multi-categoría
  - `BenchmarksTab` usa `EXTENDED_CHART_COLORS` centralizada en vez de array local

---

## [2.2.0] - 2026-02-08

### Seguridad
- **Monitoreo de errores con Sentry (`@sentry/nextjs`):**
  - **`sentry.client.config.ts`** — Configuración cliente: tracesSampleRate 10%, replays 100% en errores / 10% general, filtrado de errores de extensiones de navegador, sanitización de URLs de Supabase en breadcrumbs
  - **`sentry.server.config.ts`** — Configuración servidor: tracesSampleRate 10%, filtrado de errores de red
  - **`sentry.edge.config.ts`** — Configuración edge runtime: tracesSampleRate 10%
  - **`instrumentation.ts`** / **`instrumentation-client.ts`** — Hooks de instrumentación de Next.js para carga de configs Sentry
  - **`next.config.mjs`** — Envuelto con `withSentryConfig` para source maps y configuración automática
  - **`lib/errorLogger.ts`** — Integración con Sentry: errores error/critical van a `Sentry.captureException`, warnings a `Sentry.captureMessage`
  - **`components/ErrorBoundary.tsx`** — Reporta errores de boundary a Sentry con tags y componentStack
- **Variables de entorno nuevas:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

---

## [2.1.0] - 2026-02-08

### Seguridad
- **Autenticación en rutas API:**
  - **`lib/apiAuth.ts`** — Middleware de autenticación: verifica Bearer token contra Supabase, valida dominio `@nuasmartrestaurant.com`. Exporta `verifyAuth()` y `unauthorizedResponse()`
  - **`lib/rateLimit.ts`** — Rate limiting in-memory con ventana deslizante: configurable por endpoint (chat: 10/min, docs: 30/min). Limpieza automática cada 5 minutos. Exporta `checkRateLimit()`
  - **`app/api/chat/route.ts`** — Reescrito: verificación de autenticación + rate limiting (10 req/min) + URL de n8n desde variable de entorno
  - **`app/api/docs/route.ts`** — Reescrito: verificación de autenticación + rate limiting (30 req/min)
  - **`lib/env.ts`** — Nuevas exports: `N8N_WEBHOOK_URL` (opcional, antes hardcoded), `SENTRY_DSN` (opcional)
  - **Frontend (3 componentes):** `SmartAssistant.tsx`, `SmartAssistantPage.tsx`, `DocumentationTab.tsx` — Envían Bearer token de sesión Supabase en headers de fetch

---

## [2.0.0] - 2026-02-08

### Añadido
- **Sistema de Objetivos KPI:** Configuración y seguimiento de objetivos para métricas del restaurante
  - **`types/kpiTargets.ts`** — Tipos `KPITargets` (9 objetivos configurables), `KPIProgress` (resultado de comparación real vs objetivo), y constantes `DEFAULT_KPI_TARGETS` con valores por defecto para un restaurante tipo
  - **`lib/kpiTargets.ts`** — Servicio para gestión de objetivos: `loadKPITargets()` (carga desde localStorage con merge de defaults), `saveKPITargets()` (persiste en localStorage), `calculateProgress()` (calcula progreso con soporte para métricas inversas como food cost)
  - **`components/ui/KPIProgressBar.tsx`** — Componente de barra de progreso con dos variantes (`compact` y `full`), colores por estado (on-track/at-risk/behind), formato español, y soporte para métricas inversas
  - **SettingsPage** — Nueva pestaña "Objetivos KPI" con formulario para configurar los 9 objetivos agrupados por categoría (Ingresos, Costes, Ocupación, Operaciones), botón Guardar y Restaurar
  - **DashboardPage** — Nueva sección "Progreso vs Objetivos" con 7 barras de progreso KPI (facturación diaria, ticket medio, ingresos mensuales, food cost, coste laboral, ocupación comida/cena)
- **Ampliación de tests (63 tests en 10 archivos):**
  - **`lib/__tests__/kpiTargets.test.ts`** — 11 tests: calculateProgress normal, isLowerBetter, behind, zero target, on-track, at-risk, loadKPITargets defaults, invalid JSON, merge, round trip
  - **`lib/__tests__/alertEngine.test.ts`** — 6 tests: low occupancy warning, high food cost critical, cooldown, resetCooldowns, no alerts when good, multiple alerts
  - **`lib/__tests__/exportUtils.test.ts`** — 6 tests: CSV content, semicolon escaping, BOM UTF-8, Spanish decimal format, null/undefined, semicolon separator
  - **`lib/__tests__/rateLimit.test.ts`** — 5 tests: allows within limit, blocks over limit, resets after window, independent identifiers, resetIn value
  - **`lib/__tests__/apiAuth.test.ts`** — 5 tests: no Authorization header, no Bearer prefix, invalid token, domain restriction, valid auth
  - **`hooks/__tests__/useAlerts.test.ts`** — 4 tests: evaluates when enabled, skips when disabled, skips null context, throttle 30s

---

## [1.9.0] - 2026-02-08

### Añadido
- **Exportación PDF y CSV** en las vistas principales:
  - **`lib/exportUtils.ts`** — Utilidades de exportación: `exportToCSV` (formato español con separador `;` y BOM UTF-8) y `exportToPDF` (tablas con branding NÜA, colores corporativos, header/footer con paginación)
  - **`components/ui/ExportButton.tsx`** — Componente dropdown reutilizable con opciones CSV y PDF, estados de carga, y diseño consistente con el sistema de diseño existente
  - **DashboardPage** — Exporta KPIs financieros, facturación en vivo y costes laborales
  - **TreasuryPage** — Exporta movimientos bancarios (tab Movimientos) o resumen general con cuentas y categorías
  - **ExpensesPage** — Exporta detalle de facturas por categoría o resumen por proveedor según la tab activa
  - **ReservationsPage** — Exporta métricas de reservas/ocupación y comparativa anual
- **Dependencias nuevas:** `jspdf`, `jspdf-autotable`, `file-saver`, `@types/file-saver`

---

## [1.8.0] - 2026-02-08

### Añadido
- **TanStack React Query (`@tanstack/react-query` v5):** Sistema de caching y gestión de estado del servidor
  - **`components/providers/QueryProvider.tsx`** — Proveedor global de QueryClient con configuración adaptada al restaurante: staleTime 5 min, gcTime 30 min, refetch on window focus, retry inteligente (sin retry en errores 401)
  - **`app/layout.tsx`** — QueryProvider integrado envolviendo los children del layout
  - **`hooks/queries/`** — 8 módulos de hooks con 37 hooks reutilizables:
    - `useDashboardData.ts` — 6 hooks: useRealTimeData, useWeekReservations, useFinancialKPIs, useLaborCostAnalysis, useWeekRevenue, useOcupacionSemanal
    - `useReservationsData.ts` — 3 hooks: useReservationsFromDB, useYearlyComparison, usePeriodComparison
    - `useIncomeData.ts` — 2 hooks: useIncomeFromDB, useTableBillingFromDB
    - `useExpensesData.ts` — 5 hooks: useExpenseTags, useExpensesByTags, useExpensesByDueDate, useExpenseSummaryByTags, useExpenseSummaryByProvider
    - `useTreasuryData.ts` — 13 hooks: useTreasuryKPIs, useTreasuryAccounts, useTreasuryTransactions, useTreasuryTransactionsSummary, useTreasuryCategories, useTreasuryByCategory, useTreasuryMonthlySummary, usePoolBancarioResumen, usePoolBancarioPrestamos, usePoolBancarioVencimientos, usePoolBancarioPorBanco, usePoolBancarioCalendario
    - `useOperationsData.ts` — 7 hooks: useOperationsRealTime, useOperativaKPIs, useOperativaProductos, useOperativaCliente, useOperativaPorHora, useOperativaItems, useOperativaCategorias
    - `useProductsData.ts` — 4 hooks: useProductMix, useCategoryMix, useOptionMix, useFoodCostProducts
    - `useForecastingData.ts` — 3 hooks: useForecastData, useForecastCalendar, useBenchmarks
    - `index.ts` — Barrel export de todos los hooks
- **staleTime por tipo de dato:** Datos en tiempo real (2 min), reservas (10 min), financieros/gastos (15 min), históricos/benchmarks (30 min)
- **enabled condicional:** Hooks con parámetros obligatorios solo ejecutan la query cuando los parámetros son válidos

### Notas técnicas
- Los hooks son wrappers sobre las funciones existentes en `lib/dataService.ts`, `lib/treasuryService.ts` y `lib/operativaService.ts`
- Las vistas pueden adoptar progresivamente estos hooks reemplazando los patrones manuales de `useState` + `useEffect` + `useCallback`
- Los queryKeys incluyen todos los parámetros relevantes para invalidación automática del cache al cambiar filtros

---

## [1.7.0] - 2026-02-08

### Añadido
- **Sistema unificado de alertas y notificaciones:**
  - **`lib/alertEngine.ts`** — Motor de alertas con reglas predefinidas, cooldowns por alerta, disparo de toasts via Sonner, y sistema de listeners para el NotificationCenter. 7 reglas incluidas: baja ocupación, food cost elevado, coste laboral elevado, facturas vencidas, ticket medio bajo, ingresos diarios bajo objetivo, cancelaciones elevadas
  - **`hooks/useAlerts.ts`** — Hook que evalúa alertas cuando cambian los datos del dashboard (throttle de 30s)
  - **`components/features/NotificationCenter.tsx`** — Centro de notificaciones con icono de campana, contador de no leídas, lista desplegable con severidad visual (info/warning/critical), marcar leídas y limpiar. Máximo 50 notificaciones
  - **Sonner Toaster en `layout.tsx`** — Proveedor global de toasts (`position="top-right"`, `richColors`, `closeButton`)
- **Integración de alertas en DashboardPage:** El dashboard evalúa automáticamente las reglas de alertas cuando se cargan datos financieros, laborales y de ocupación
- **NotificationCenter flotante en `app/page.tsx`:** Icono de campana visible en la esquina superior derecha del área principal

### Notas técnicas
- Sonner es ahora el sistema de toasts estándar. El hook `use-toast.ts` (Radix) se mantiene por compatibilidad pero el código nuevo debe usar `sonner`
- El AlertEngine usa un patrón pub/sub para comunicar alertas al NotificationCenter sin acoplamiento directo

---

## [1.6.0] - 2026-02-08

### Añadido
- **Suite de tests con Vitest:** Configurado Vitest 4 + Testing Library + jsdom. 26 tests en 4 archivos:
  - `lib/__tests__/env.test.ts` — Validación de variables de entorno requeridas y opcionales (4 tests)
  - `lib/__tests__/errorLogger.test.ts` — Logging por severidad, contexto, delegación de logWarning (7 tests)
  - `lib/__tests__/dataService.test.ts` — getBusinessDate, aggregateMetrics, aggregateTableMetrics (6 tests)
  - `hooks/__tests__/useAppRouter.test.ts` — Navegación, validación de paths, popstate, deep linking (9 tests)
- **Scripts de test:** `pnpm test` (watch mode) y `pnpm test:run` (single run)
- **`vitest.config.ts`** — Configuración con alias `@/`, jsdom environment, setup file
- **`vitest.setup.ts`** — Setup de jest-dom matchers para Vitest

### Actualizado
- **`README.md`** — Añadido Vitest al stack, tests a comandos, estructura de carpetas actualizada con sub-componentes, types/, __tests__/, y nuevos archivos en lib/

---

## [1.5.0] - 2026-02-08

### Refactorizado
- **TreasuryPage (~2163 lineas -> ~500 lineas):** Extraidos 5 sub-componentes en `components/views/treasury/`: `TreasuryDashboardTab`, `TreasuryMovimientosTab`, `TreasuryCategoriaTab`, `TreasuryPoolBancarioTab`, `TreasuryCuentaTab`, mas `constants.ts` con tipos, labels, mapas de iconos y configuracion compartida
- **ComprasPage (~1550 lineas -> ~660 lineas):** Extraidos 3 sub-componentes en `components/views/compras/`: `ComprasPedidosTab`, `ComprasConciliacionTab`, `ComprasAnalisisTab`, mas `constants.tsx` con configuracion de estados (pedido, conciliacion, pago) y colores
- **ExpensesPage (~1591 lineas -> ~632 lineas):** Extraidos 3 sub-componentes en `components/views/expenses/`: `ExpensesCategoriaTab`, `ExpensesProveedorTab`, `ExpensesCalendarioTab`, mas `constants.ts` con tipos de filtro, labels y colores
- **ReservationsPage (~1442 lineas -> ~591 lineas):** Extraidos 3 sub-componentes en `components/views/reservations/`: `ReservationsKPISection`, `ReservationsYearlyChart`, `ReservationsComparatorSection`, mas `constants.ts` con tipos de periodo, colores de ano y nombres de mes
- **Patron de separacion aplicado:** Componente padre mantiene useState, useEffect, data fetching, useMemo y navegacion de tabs. Sub-componentes reciben datos y callbacks via props tipados (interfaces explicitas). Constantes compartidas extraidas a archivos dedicados

---

## [1.4.2] - 2026-02-08

### Refactorizado
- **Mock data extraído a `lib/mockData.ts`:** Separados los datos ficticios, constantes de demo (`SMART_TABLES`, `CATEGORIES`, `PRODUCTS_DB`, `PROVIDERS_DB`), generadores (`generateSalesData`, `generateExpenses`, `generateTableSales`, `generateShift`, `generateMockHistory`, `generateMockForecastData`, `generateMockForecastCalendar`) y funciones dependientes de mocks (`fetchHistoryRange`, `fetchFinancialHistory`, `fetchUpcomingInvoices`) desde `dataService.ts` al nuevo módulo `lib/mockData.ts`
- **`dataService.ts` reducido (~1500 líneas):** Solo contiene lógica de Supabase y funciones reales. Re-exporta las funciones mock para compatibilidad hacia atrás
- **Inline mock en `fetchForecastCalendar` reemplazado** por llamada a `generateMockForecastCalendar` desde `mockData.ts`

---

## [1.4.1] - 2026-02-08

### Refactorizado
- **types.ts dividido en módulos por dominio:** El archivo monolítico `types.ts` (~1266 líneas) se ha separado en 15 archivos dentro de `types/`, organizados por dominio funcional (sales, dashboard, expenses, operations, products, forecasting, treasury, billing, purchases, etc.)
- **Barrel re-export en `types/index.ts`:** Mantiene compatibilidad total con todos los imports existentes (`import { X } from '@/types'` sigue funcionando)
- **`types.ts` raíz reducido a 1 línea:** Solo re-exporta desde `types/index.ts`
- **Dependencias cruzadas correctas:** `sales.ts` importa `ExpenseStats` de `expenses.ts`; `dashboard.ts` importa `ShiftMetrics` de `sales.ts`

---

## [1.4.0] - 2026-02-08

### Añadido
- **Hook `useAppRouter`:** Nuevo hook de navegación SPA con soporte de hash-based routing (`#/ruta`), historial del navegador (back/forward), y validación de rutas
- **Lazy loading de vistas:** Las 16 vistas principales ahora se cargan bajo demanda con `React.lazy()` + `Suspense`, reduciendo el bundle inicial
- **`ViewLoadingFallback`:** Componente de loading spinner mostrado mientras se cargan vistas lazy
- **`ErrorBoundary` en contenido principal:** Envuelve el área de contenido para capturar errores de render en vistas y ofrecer recuperación al dashboard

### Refactorizado
- **`app/page.tsx`:** Reemplazado `useState("/")` por `useAppRouter()` para navegación con hash. Imports estáticos de vistas reemplazados por `lazy()`. Contenido envuelto en `ErrorBoundary` + `Suspense`
- **Sidebar:** `onNavigate` ahora recibe `navigate` de `useAppRouter` en vez de `setCurrentPath`

---

## [1.3.6] - 2026-02-08

### Añadido
- **`lib/env.ts`** — Módulo centralizado de variables de entorno con validación. `getRequiredEnv()` lanza error descriptivo si falta una variable requerida. Exporta `SUPABASE_URL`, `SUPABASE_ANON_KEY` (requeridas) y `AI_API_KEY` (opcional)
- **`lib/errorLogger.ts`** — Sistema de logging estructurado con severidades (`info`, `warning`, `error`, `critical`). Funciones `logError()` y `logWarning()`. Preparado para integración futura con Supabase/Sentry
- **`components/ErrorBoundary.tsx`** — Componente React class-based para captura de errores en el árbol de componentes. Muestra UI de fallback con opción de reset y loguea errores críticos via `errorLogger`

### Refactorizado
- **`lib/supabase.ts`** — Reemplazado acceso directo a `process.env` por imports de `lib/env.ts` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- **`lib/gemini.ts`** — Reemplazado acceso directo a `process.env.IA_ASSISTANT_SMART_APP` por import de `AI_API_KEY` desde `lib/env.ts`

---

## [1.3.5] - 2026-02-06

### Añadido
- **Tab Documentación en Configuración:** Nueva pestaña que renderiza los 6 archivos `.md` del proyecto con Markdown formateado
- **API `/api/docs`:** Endpoint GET para servir archivos de documentación desde `docs/` (whitelist de seguridad)
- **Componente `DocumentationTab`:** Sub-navegación por documento, renderizado con `react-markdown` + `remark-gfm`, descarga individual y masiva
- **Plugin `@tailwindcss/typography`:** Clases `prose` para renderizado Markdown bonito (headings, tablas, código, blockquotes)

---

## [1.3.4] - 2026-02-06

### Modificado
- **Configuración:** Reemplazado selector de tabs simple (botones) por `MenuBar` animado con 3D flip, igual que el resto de la app (Smart Food, Compras, Smart Tables)

---

## [1.3.3] - 2026-02-06

### Modificado
- **Smart Food (antes "Costes"):** Renombrada la sección en sidebar y PageHeader
- **Eliminada tab "Escandallos":** Era un placeholder "Próximamente" redundante con Food Cost. Quedan 3 tabs: Recetas, Food Cost, Benchmarks

---

## [1.3.2] - 2026-02-06

### Corregido
- **WeatherCard — Bug UTC en cálculo de "hoy":** `new Date().toISOString()` devolvía fecha UTC, causando desfase entre 00:00-01:00 hora España. Cambiado a `toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })` tanto en `fetchWeatherForecast()` como en el componente
- **WeatherCard — Marcador "Hoy" incorrecto:** Se usaba `idx === 0` para marcar el día actual. Ahora compara la fecha real del dato con la fecha local de España
- **WeatherCard — Desfase de fecha al parsear:** `new Date("YYYY-MM-DD")` parsea como UTC medianoche, lo que puede cambiar el día en timezones positivas. Añadido `T12:00:00` al parsear para evitar el salto de día
- **WeatherCard — Siempre 7 días:** Si AEMET no ha actualizado y solo hay 6 días desde hoy, completa con días anteriores para llenar las 7 columnas. Fallback total si no hay datos desde hoy

---

## [1.3.1] - 2026-02-06

### Modificado
- **Smart Tables (antes "Uso de Mesas"):** Renombrada la sección en sidebar y PageHeader
- **Smart Tables — Tabs con MenuBar:** Reemplazado selector de tabs custom por componente `MenuBar` (mismo patrón que ComprasPage, CostesPage, etc.)
- Tabs renombradas: "Uso de Mesas" y "Configuración" mantienen sus nombres internos pero ahora usan el componente estándar con animaciones 3D

---

## [1.3.0] - 2026-02-06

### Corregido
- **ComprasPage — KPIs mostraban 0:** Desajuste total de nombres entre `vw_compras_resumen` (devuelve `total_mes_albaranes`, `num_pedidos_mes`, etc.) y el tipo `CompraKPIs` (esperaba `pedidos_pendientes`, `albaranes_sin_facturar`, etc.). Reescrito `fetchKPIs()` para consultar 4 fuentes en paralelo y computar KPIs reales.
- **ComprasPage — Tab Conciliación vacía:** `fetchFacturasConciliacion()` leía de `vw_compras_conciliacion` que hace JOIN con tabla vacía `gstock_conciliacion_compras`. Cambiada fuente a `vw_compras_facturas_pendientes` (225 facturas reales) con mapeo de campos.
- **ComprasPage — Albaranes sin fecha ni importe:** `fetchAlbaranesDisponibles()` usaba nombres de campo incorrectos (`fecha` en vez de `fecha_albaran`, `importe_total` en vez de `total`). Añadido mapeo correcto.

### Modificado
- Tipo `CompraKPIs` ampliado: 6 campos de resumen mensual + 6 KPIs computados
- Tipo `CompraFacturaConciliacion` extendido con `albaranes_candidatos`
- KPI cards: "Revisar" y "Conciliadas" reemplazados por "Facturas Pendientes" y "Actividad del Mes"
- Filtro "Estado Pago" eliminado de Conciliación (no disponible en la vista actual)
- Cards de factura muestran cantidad de albaranes candidatos en vez de estado de pago

---

## [1.2.1] - 2026-02-06

### Corregido
- **ComprasPage — Detalle de productos en pedidos:** Las líneas de producto (nombre, cantidad pedida, cantidad recibida, formato, validación OK) no se mostraban en el panel de detalle de pedidos. La causa era un desajuste de nombres: la vista Supabase `vw_compras_pedidos` devuelve el campo como `items`, pero el tipo TypeScript y el componente esperaban `pedido_items`. Añadido mapeo `items → pedido_items` en `fetchPedidos()` de `comprasService.ts`.

---

## [1.2.0] - 2026-02-06

### Añadido
- Documentación local completa del proyecto
  - `README.md` — Punto de entrada con stack, quick start, estructura
  - `docs/ARCHITECTURE.md` — Arquitectura SPA, autenticación, dark mode, patrones
  - `docs/VIEWS.md` — 15 vistas documentadas con servicios, tablas, métricas, filtros, cálculos
  - `docs/SERVICES.md` — 9 servicios con funciones, queries, tipos
  - `docs/INTEGRATIONS.md` — 11 integraciones con protocolos, flujos, tablas
  - `docs/TYPES.md` — Referencia de tipos TypeScript por dominio
  - `docs/CHANGELOG.md` — Este archivo

### Actualizado
- Documentación en Notion (Frontend y Backend) actualizada con:
  - SettingsPage (5 tabs: integraciones, BD, restaurante, perfil, apariencia)
  - Autenticación Google OAuth y dominio restringido
  - Modo oscuro (implementación, FOUC prevention)
  - Transición Billin → Cuentica

---

## [1.1.0] - 2026-02-05

### Añadido
- **SettingsPage** con 5 tabs:
  - Integraciones: estado de Supabase, GStock, GoCardless, Cuentica, Billin
  - Base de datos: tamaño total, tabla de tamaño por tabla, logs de refresh
  - Restaurante: capacidad, mesas, turnos, plazas/día
  - Perfil: nombre y email del usuario autenticado
  - Apariencia: selector de tema (claro/oscuro/sistema)
- **settingsService.ts** — Nuevo servicio para datos de configuración
  - `fetchIntegrationStatuses()` — Estado de integraciones
  - `fetchViewRefreshLogs()` — Logs de refresh de vistas materializadas
  - `fetchDatabaseInfo()` — Tamaño de BD vía RPCs
  - `fetchRestaurantCapacity()` — Capacidad dinámica del restaurante
  - `fetchRecentSyncLogs()` — Logs de sincronización recientes
- **Modo oscuro** implementación completa:
  - Clase `.dark` en `<html>` con variables CSS
  - Script inline anti-FOUC en `layout.tsx`
  - Persistencia en `localStorage` con clave `nua-theme`
  - Tres opciones: Claro, Oscuro, Sistema
- **Sidebar dinámico** — Muestra nombre e iniciales del usuario autenticado + botón LogOut
- **LoginScreen rediseñada** — De gradiente oscuro a diseño minimalista claro

### Cambiado
- Vistas totales: 14 → 15 (nueva SettingsPage)
- Sidebar: información estática → dinámica (nombre real del usuario de Supabase)

### Corregido
- `pedido_base` → `pedido_subtotal` en `types.ts` y `ComprasPage.tsx`

---

## [1.0.1] - 2026-01

### Refactorizado
- Centralización de `formatCurrency()` en `lib/utils.ts` (eliminación de funciones duplicadas)
- Limpieza de `console.log` innecesarios en producción
- Nuevo hook genérico `useAsyncData<T>` para data fetching con loading/error/refresh

---

## [1.0.0] - 2025-12

### Release Inicial

#### Vistas
- Dashboard con datos en tiempo real (ventas, comensales, KPIs financieros)
- Reservas con comparación interanual
- Ingresos con facturación por mesas
- Gastos con filtros por categoría y estado
- Costes (recetas, food cost, escandallos, benchmarks)
- Compras (pedidos, conciliación, análisis)
- Operaciones (tiempos cocina/sala, rendimiento por producto)
- Productos (mix de productos, categorías, opciones)
- Facturación (listado, cuadre diario, alertas, evolución)
- Tesorería (saldos, transacciones, pool bancario)
- Forecasting (predicción de comensales y facturación)
- What-If (simulador de escenarios)
- Asistente IA (chat con contexto del restaurante)
- Conexiones Bancarias (interfaz GoCardless)

#### Integraciones
- Supabase (PostgreSQL + Auth)
- Dotyk POS (webhooks vía n8n)
- Billin (facturación)
- GoCardless (open banking)
- CoverManager (reservas)
- Connecteam (RRHH)
- GStock (stock y proveedores)
- n8n (orquestación)
- Google Generative AI (Gemini)
- Vercel (hosting + analytics)

#### Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Shadcn/Radix UI
- Recharts + Tremor
- Framer Motion
- pnpm

---

## Convenciones

- **Añadido** — Funcionalidades nuevas
- **Cambiado** — Cambios en funcionalidades existentes
- **Obsoleto** — Funcionalidades que serán eliminadas próximamente
- **Eliminado** — Funcionalidades eliminadas
- **Corregido** — Corrección de bugs
- **Seguridad** — Vulnerabilidades corregidas
- **Refactorizado** — Cambios de código sin cambio funcional
