-- Fix: get_treasury_accounts y get_treasury_kpis no podían leer current_balance
-- cuando estaba almacenado como número plano ("80.56") en lugar de JSON ({"amount":"80.56","currency":"EUR"}).
-- Esta migración actualiza ambas funciones para manejar los dos formatos,
-- y también usa GREATEST(last_sync_at, balance_last_updated_at) para la fecha de sync.

-- 1. Fix get_treasury_accounts
CREATE OR REPLACE FUNCTION public.get_treasury_accounts()
 RETURNS TABLE(id uuid, bank_name text, bank_logo text, account_name text, iban text, balance numeric, currency text, last_sync timestamp with time zone, is_active boolean, sync_error text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    i.name::TEXT as bank_name,
    i.logo_url::TEXT as bank_logo,
    a.display_name::TEXT as account_name,
    a.iban::TEXT,
    CASE
      WHEN a.current_balance IS NULL OR a.current_balance = '' THEN 0
      WHEN jsonb_typeof(a.current_balance::jsonb) = 'object'
        THEN (a.current_balance::jsonb->>'amount')::NUMERIC
      ELSE a.current_balance::NUMERIC
    END as balance,
    COALESCE(a.currency, 'EUR')::TEXT as currency,
    GREATEST(a.last_sync_at, a.balance_last_updated_at) as last_sync,
    (a.status = 'ACTIVE') as is_active,
    a.sync_error::TEXT
  FROM gocardless_accounts a
  LEFT JOIN gocardless_institutions i ON a.institution_id = i.id
  WHERE a.status = 'ACTIVE'
  ORDER BY i.name, a.display_name;
END;
$function$;

-- 2. Fix get_treasury_kpis
CREATE OR REPLACE FUNCTION public.get_treasury_kpis(p_fecha_inicio date DEFAULT NULL::date, p_fecha_fin date DEFAULT NULL::date)
 RETURNS TABLE(saldo_total numeric, ingresos_periodo numeric, gastos_periodo numeric, ingresos_anterior numeric, gastos_anterior numeric, transacciones_sin_categorizar integer, num_cuentas integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_fecha_inicio DATE := COALESCE(p_fecha_inicio, CURRENT_DATE - INTERVAL '30 days');
  v_fecha_fin DATE := COALESCE(p_fecha_fin, CURRENT_DATE);
  v_dias_periodo INTEGER := v_fecha_fin - v_fecha_inicio + 1;
  v_traspaso_category_id UUID := '8f3bb6f1-c828-40c7-b371-4a1ed39b9f14';
BEGIN
  RETURN QUERY
  WITH periodo_actual AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as ingresos,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as gastos
    FROM gocardless_transactions t
    JOIN gocardless_accounts a ON t.account_id = a.id
    WHERE a.status = 'ACTIVE'
      AND t.booking_date BETWEEN v_fecha_inicio AND v_fecha_fin
      AND (t.category_id IS NULL OR t.category_id != v_traspaso_category_id)
  ),
  periodo_anterior AS (
    SELECT
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as ingresos,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as gastos
    FROM gocardless_transactions t
    JOIN gocardless_accounts a ON t.account_id = a.id
    WHERE a.status = 'ACTIVE'
      AND t.booking_date BETWEEN (v_fecha_inicio - v_dias_periodo) AND (v_fecha_inicio - 1)
      AND (t.category_id IS NULL OR t.category_id != v_traspaso_category_id)
  ),
  sin_categorizar AS (
    SELECT COUNT(*)::INTEGER as count
    FROM gocardless_transactions t
    JOIN gocardless_accounts a ON t.account_id = a.id
    WHERE a.status = 'ACTIVE'
      AND t.category_id IS NULL
  ),
  saldos AS (
    SELECT COALESCE(SUM(
      CASE
        WHEN a.current_balance IS NULL OR a.current_balance = '' THEN 0
        WHEN jsonb_typeof(a.current_balance::jsonb) = 'object'
          THEN (a.current_balance::jsonb->>'amount')::NUMERIC
        ELSE a.current_balance::NUMERIC
      END
    ), 0) as total
    FROM gocardless_accounts a
    WHERE a.status = 'ACTIVE'
  ),
  cuentas AS (
    SELECT COUNT(*)::INTEGER as count
    FROM gocardless_accounts
    WHERE status = 'ACTIVE'
  )
  SELECT
    saldos.total::NUMERIC,
    periodo_actual.ingresos::NUMERIC,
    periodo_actual.gastos::NUMERIC,
    periodo_anterior.ingresos::NUMERIC,
    periodo_anterior.gastos::NUMERIC,
    sin_categorizar.count::INTEGER,
    cuentas.count::INTEGER
  FROM periodo_actual, periodo_anterior, sin_categorizar, saldos, cuentas;
END;
$function$;
