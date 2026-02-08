# Changelog — NÜA Smart App

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased]

### Añadido
- **Food Cost real en Dashboard KPI:**
  - Nueva función `fetchFoodCostAverage()` en `lib/dataService.ts` — consulta ligera a `vw_food_cost` que devuelve el % promedio global
  - `DashboardPage.tsx` ahora llama a `fetchFoodCostAverage()` en el `Promise.all` de carga de datos
  - KPI "Food Cost" muestra el valor real (~20.4%) en vez del `0` hardcodeado
  - Se carga en paralelo con los demás datos del dashboard (sin impacto en rendimiento)

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
