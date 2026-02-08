import { supabase } from "@/lib/supabase"

// ============================================
// ESTADO DE INTEGRACIONES
// ============================================

export interface IntegrationStatus {
  name: string
  description: string
  status: "ok" | "error" | "warning" | "unknown"
  lastSync: string | null
  details: string
}

export async function fetchIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const results: IntegrationStatus[] = []

  // 1. Supabase — si llegamos aquí, está conectado
  results.push({
    name: "Supabase",
    description: "Base de datos y autenticación",
    status: "ok",
    lastSync: new Date().toISOString(),
    details: "Conexión activa",
  })

  // 2. GStock
  try {
    const { data } = await supabase
      .from("gstock_sync_logs")
      .select("sync_type, status, started_at, completed_at, records_processed, records_failed, error_message")
      .order("started_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const hasErrors = data.records_failed > 0 || data.status !== "completed"
      results.push({
        name: "GStock",
        description: "Gestión de stock y proveedores",
        status: hasErrors ? "warning" : "ok",
        lastSync: data.completed_at || data.started_at,
        details: `${data.sync_type} — ${data.records_processed} registros${data.records_failed > 0 ? `, ${data.records_failed} errores` : ""}`,
      })
    }
  } catch {
    results.push({
      name: "GStock",
      description: "Gestión de stock y proveedores",
      status: "unknown",
      lastSync: null,
      details: "Sin datos de sincronización",
    })
  }

  // 3. GoCardless (Banco)
  try {
    const { data } = await supabase
      .from("gocardless_sync_logs")
      .select("sync_type, executed_at, total_accounts, successful_accounts, failed_accounts")
      .order("executed_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      const hasErrors = data.failed_accounts > 0
      results.push({
        name: "GoCardless",
        description: "Conexión bancaria",
        status: hasErrors ? "warning" : "ok",
        lastSync: data.executed_at,
        details: `${data.successful_accounts}/${data.total_accounts} cuentas sincronizadas`,
      })
    }
  } catch {
    results.push({
      name: "GoCardless",
      description: "Conexión bancaria",
      status: "unknown",
      lastSync: null,
      details: "Sin datos de sincronización",
    })
  }

  // 4. Cuentica
  try {
    const { data } = await supabase
      .from("cuentica_logs")
      .select("created_at, action, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      results.push({
        name: "Cuentica",
        description: "Contabilidad y facturación",
        status: data.status === "error" ? "error" : "ok",
        lastSync: data.created_at,
        details: data.action || "Sincronización completada",
      })
    }
  } catch {
    results.push({
      name: "Cuentica",
      description: "Contabilidad y facturación",
      status: "unknown",
      lastSync: null,
      details: "Sin datos de sincronización",
    })
  }

  // 5. Billin
  try {
    const { data } = await supabase
      .from("billin_logs")
      .select("created_at, action, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      results.push({
        name: "Billin",
        description: "Facturación electrónica",
        status: data.status === "error" ? "error" : "ok",
        lastSync: data.created_at,
        details: data.action || "Sincronización completada",
      })
    }
  } catch {
    results.push({
      name: "Billin",
      description: "Facturación electrónica",
      status: "unknown",
      lastSync: null,
      details: "Sin datos de sincronización",
    })
  }

  return results
}

// ============================================
// VISTAS MATERIALIZADAS
// ============================================

export interface ViewRefreshLog {
  vista_nombre: string
  refresh_iniciado_at: string
  refresh_completado_at: string | null
  duracion_ms: number | null
  estado: string
  trigger_source: string | null
}

export async function fetchViewRefreshLogs(): Promise<ViewRefreshLog[]> {
  const { data, error } = await supabase
    .from("business_views_refresh_log")
    .select("vista_nombre, refresh_iniciado_at, refresh_completado_at, duracion_ms, estado, trigger_source")
    .order("refresh_iniciado_at", { ascending: false })
    .limit(30)

  if (error) {
    console.error("[fetchViewRefreshLogs] Error:", error.message)
    return []
  }

  return data || []
}

// ============================================
// TAMAÑO DE TABLAS (vía RPC o query directa)
// ============================================

export interface TableSize {
  table_name: string
  total_size: string
  row_count: number
}

export async function fetchDatabaseInfo(): Promise<{
  totalSize: string
  tables: TableSize[]
}> {
  // Usamos las queries a pg_stat
  const { data: sizeData } = await supabase.rpc("get_database_size").single() as { data: { total_size: string } | null }
  const { data: tablesData } = await supabase.rpc("get_tables_size")

  return {
    totalSize: sizeData?.total_size || "N/A",
    tables: tablesData || [],
  }
}

// ============================================
// CAPACIDAD DEL RESTAURANTE
// ============================================

export interface RestaurantCapacity {
  totalMesas: number
  totalPlazas: number
  turnos: { nombre: string; hora_inicio: string; hora_fin: string }[]
  plazasPorDia: number
  mesasPorDia: number
}

export async function fetchRestaurantCapacity(): Promise<RestaurantCapacity> {
  const [tablesRes, turnosRes] = await Promise.all([
    supabase.from("tables").select("id, name, capacity, zone, is_active").eq("is_active", true),
    supabase.from("turnos").select("nombre, hora_inicio, hora_fin, activo").eq("activo", true).neq("nombre", "Otros"),
  ])

  const tables = tablesRes.data || []
  const turnos = turnosRes.data || []

  const totalMesas = tables.length
  const totalPlazas = tables.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0)
  const numTurnos = turnos.length || 2

  return {
    totalMesas,
    totalPlazas,
    turnos: turnos.map((t: any) => ({
      nombre: t.nombre,
      hora_inicio: t.hora_inicio,
      hora_fin: t.hora_fin,
    })),
    plazasPorDia: totalPlazas * numTurnos,
    mesasPorDia: totalMesas * numTurnos,
  }
}

// ============================================
// LOGS DE SINCRONIZACIÓN RECIENTES
// ============================================

export interface SyncLogEntry {
  id: string
  source: string
  type: string
  status: string
  timestamp: string
  records: number
  errors: number
  message: string | null
}

export async function fetchRecentSyncLogs(): Promise<SyncLogEntry[]> {
  const logs: SyncLogEntry[] = []

  // GStock logs
  const { data: gstockLogs } = await supabase
    .from("gstock_sync_logs")
    .select("id, sync_type, status, started_at, records_processed, records_failed, error_message")
    .order("started_at", { ascending: false })
    .limit(10)

  if (gstockLogs) {
    for (const log of gstockLogs) {
      logs.push({
        id: log.id,
        source: "GStock",
        type: log.sync_type,
        status: log.status,
        timestamp: log.started_at,
        records: log.records_processed || 0,
        errors: log.records_failed || 0,
        message: log.error_message,
      })
    }
  }

  // GoCardless logs
  const { data: gcLogs } = await supabase
    .from("gocardless_sync_logs")
    .select("id, sync_type, executed_at, total_accounts, successful_accounts, failed_accounts")
    .order("executed_at", { ascending: false })
    .limit(10)

  if (gcLogs) {
    for (const log of gcLogs) {
      logs.push({
        id: log.id,
        source: "GoCardless",
        type: log.sync_type,
        status: log.failed_accounts > 0 ? "warning" : "completed",
        timestamp: log.executed_at,
        records: log.total_accounts || 0,
        errors: log.failed_accounts || 0,
        message: null,
      })
    }
  }

  // Sort by timestamp desc
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return logs.slice(0, 20)
}
