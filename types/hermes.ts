// Tipos del dashboard del agente NÜA (Hermes Agent).
// La Smart App LEE estas tablas de Supabase (rol authenticated). El VPS las
// sincroniza cada ~5 min. Todos los campos pueden venir null si aún no hay sync.

/** Estado del agente — fila única (id=1) en `hermes_status`. */
export interface HermesStatus {
  id: number
  updated_at: string | null
  gateway_state: string | null // running | stopped
  gateway_pid: number | null
  version: string | null
  model_name: string | null
  active_sessions_count: number | null
  cpu_usage_pct: number | null
  ram_usage_mb: number | null
  ram_total_mb: number | null
  monthly_spend_usd: number | null
  api_balance_usd: number | null
  tokens_input_30d: number | null
  tokens_output_30d: number | null
  cache_hit_pct: number | null
}

/** Nota de memoria del agente — `hermes_memory`. */
export interface HermesMemory {
  id: string
  target: string // 'user' (perfil) | 'system'
  content: string
  created_at: string | null
  updated_at: string | null
}

/** Sesión / conversación — `hermes_sessions`. */
export interface HermesSession {
  session_id: string
  title: string | null
  model: string | null
  started_at: string | null
  last_active: string | null
  is_active: boolean | null
  source: string | null // telegram | cli | cron
  message_count: number | null
  token_count: number | null
  preview: string | null
}

/** Tarea programada — `hermes_cron_jobs`. */
export interface HermesCronJob {
  job_id: string
  name: string | null
  schedule: string | null // expresión cron
  status: string | null // active | paused | error
  deliver: string | null
  next_run: string | null
  last_run_at: string | null
  last_run_status: string | null // ok | error
}

/** Skill instalada — `hermes_skills`. */
export interface HermesSkill {
  name: string
  description: string | null
  category: string | null
  enabled: boolean | null
  is_custom: boolean | null
  updated_at: string | null
}

/** Analítica diaria de consumo — `hermes_analytics_daily`. */
export interface HermesAnalyticsDay {
  date: string
  sessions_count: number | null
  tokens_input: number | null
  tokens_output: number | null
  cache_hit_pct: number | null
  cost_usd: number | null
  models_used: Record<string, number> | null
}
