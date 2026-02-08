# Changelog — NÜA Smart App

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased]

*Cambios en desarrollo pendientes de deploy.*

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
