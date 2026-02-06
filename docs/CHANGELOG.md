# Changelog — NÜA Smart App

Todos los cambios notables del proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased]

*Cambios en desarrollo pendientes de deploy.*

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
