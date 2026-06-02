"use client"

import { supabase } from "@/lib/supabase"
import type {
  HermesStatus,
  HermesMemory,
  HermesSession,
  HermesCronJob,
  HermesSkill,
  HermesAnalyticsDay,
} from "@/types"

// Servicio de lectura del dashboard del agente NÜA (Hermes).
// Todo se lee de las tablas hermes_* en Supabase (rol authenticated, RLS de solo lectura).

/** Estado del agente (fila única id=1). */
export async function fetchHermesStatus(): Promise<HermesStatus | null> {
  const { data, error } = await supabase.from("hermes_status").select("*").eq("id", 1).maybeSingle()
  if (error) {
    console.error("[hermes] error status:", error.message)
    return null
  }
  return (data as HermesStatus) ?? null
}

/** Notas de memoria (perfil + sistema), más recientes primero. */
export async function fetchHermesMemory(): Promise<HermesMemory[]> {
  const { data, error } = await supabase
    .from("hermes_memory")
    .select("*")
    .order("updated_at", { ascending: false })
  if (error) {
    console.error("[hermes] error memory:", error.message)
    return []
  }
  return (data as HermesMemory[]) ?? []
}

/** Últimas sesiones / conversaciones. */
export async function fetchHermesSessions(limit = 50): Promise<HermesSession[]> {
  const { data, error } = await supabase
    .from("hermes_sessions")
    .select("*")
    .order("last_active", { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) {
    console.error("[hermes] error sessions:", error.message)
    return []
  }
  return (data as HermesSession[]) ?? []
}

/** Tareas programadas (cron), por próxima ejecución. */
export async function fetchHermesCronJobs(): Promise<HermesCronJob[]> {
  const { data, error } = await supabase
    .from("hermes_cron_jobs")
    .select("*")
    .order("next_run", { ascending: true, nullsFirst: false })
  if (error) {
    console.error("[hermes] error cron:", error.message)
    return []
  }
  return (data as HermesCronJob[]) ?? []
}

/** Skills instaladas, alfabéticas. */
export async function fetchHermesSkills(): Promise<HermesSkill[]> {
  const { data, error } = await supabase.from("hermes_skills").select("*").order("name", { ascending: true })
  if (error) {
    console.error("[hermes] error skills:", error.message)
    return []
  }
  return (data as HermesSkill[]) ?? []
}

/** Analítica diaria de consumo (últimos `days` días, orden cronológico). */
export async function fetchHermesAnalytics(days = 30): Promise<HermesAnalyticsDay[]> {
  const { data, error } = await supabase
    .from("hermes_analytics_daily")
    .select("*")
    .order("date", { ascending: false })
    .limit(days)
  if (error) {
    console.error("[hermes] error analytics:", error.message)
    return []
  }
  // Devolver en orden cronológico ascendente para el gráfico
  return ((data as HermesAnalyticsDay[]) ?? []).slice().reverse()
}
