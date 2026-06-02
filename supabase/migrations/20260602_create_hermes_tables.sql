-- ============================================
-- NÜA Smart Restaurant — Hermes Agent Dashboard
-- Migración para crear las 4 tablas de sincronización
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Crear tabla hermes_status
CREATE TABLE IF NOT EXISTS public.hermes_status (
  id int4 PRIMARY KEY DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  gateway_state varchar,
  gateway_pid int4,
  version varchar,
  active_sessions_count int4,
  cpu_usage_pct float4,
  ram_usage_mb int4,
  ram_total_mb int4,
  monthly_spend_usd float4,
  api_balance_usd float4,
  model_name varchar,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 2. Crear tabla hermes_memory
CREATE TABLE IF NOT EXISTS public.hermes_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target varchar NOT NULL, -- 'user' o 'system'
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Crear tabla hermes_sessions
CREATE TABLE IF NOT EXISTS public.hermes_sessions (
  session_id varchar PRIMARY KEY,
  title varchar,
  started_at timestamptz,
  last_active timestamptz,
  is_active boolean,
  source varchar,
  message_count int4
);

-- 4. Crear tabla hermes_cron_jobs
CREATE TABLE IF NOT EXISTS public.hermes_cron_jobs (
  job_id varchar PRIMARY KEY,
  name varchar,
  schedule varchar,
  status varchar,
  next_run timestamptz,
  last_run_at timestamptz,
  last_run_status varchar
);

-- Habilitar RLS en las 4 tablas
ALTER TABLE public.hermes_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hermes_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hermes_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hermes_cron_jobs ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores por si acaso
DROP POLICY IF EXISTS "Permitir lectura de hermes_status" ON public.hermes_status;
DROP POLICY IF EXISTS "Permitir escritura de hermes_status" ON public.hermes_status;
DROP POLICY IF EXISTS "Permitir lectura de hermes_memory" ON public.hermes_memory;
DROP POLICY IF EXISTS "Permitir escritura de hermes_memory" ON public.hermes_memory;
DROP POLICY IF EXISTS "Permitir lectura de hermes_sessions" ON public.hermes_sessions;
DROP POLICY IF EXISTS "Permitir escritura de hermes_sessions" ON public.hermes_sessions;
DROP POLICY IF EXISTS "Permitir lectura de hermes_cron_jobs" ON public.hermes_cron_jobs;
DROP POLICY IF EXISTS "Permitir escritura de hermes_cron_jobs" ON public.hermes_cron_jobs;

-- 1. Políticas de hermes_status
CREATE POLICY "Permitir lectura de hermes_status" ON public.hermes_status
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir escritura de hermes_status" ON public.hermes_status
  FOR ALL TO anon, authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  );

-- 2. Políticas de hermes_memory
CREATE POLICY "Permitir lectura de hermes_memory" ON public.hermes_memory
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir escritura de hermes_memory" ON public.hermes_memory
  FOR ALL TO anon, authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  );

-- 3. Políticas de hermes_sessions
CREATE POLICY "Permitir lectura de hermes_sessions" ON public.hermes_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir escritura de hermes_sessions" ON public.hermes_sessions
  FOR ALL TO anon, authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  );

-- 4. Políticas de hermes_cron_jobs
CREATE POLICY "Permitir lectura de hermes_cron_jobs" ON public.hermes_cron_jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir escritura de hermes_cron_jobs" ON public.hermes_cron_jobs
  FOR ALL TO anon, authenticated
  USING (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    current_setting('request.headers', true)::json->>'x-sync-secret' = 'NUA_HERMES_SYNC_SECRET_2026'
    OR auth.role() = 'service_role'
  );
