-- ============================================
-- KPI Targets Table — NÜA Smart App
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS kpi_targets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Revenue targets
  daily_revenue_target numeric NOT NULL DEFAULT 4000,
  monthly_revenue_target numeric NOT NULL DEFAULT 100000,
  ticket_medio_target numeric NOT NULL DEFAULT 45,

  -- Cost targets (porcentajes)
  food_cost_target numeric NOT NULL DEFAULT 30,
  labor_cost_target numeric NOT NULL DEFAULT 33,

  -- Occupancy targets (porcentajes)
  lunch_occupancy_target numeric NOT NULL DEFAULT 75,
  dinner_occupancy_target numeric NOT NULL DEFAULT 85,

  -- Operations targets
  average_rating_target numeric NOT NULL DEFAULT 4.5,
  daily_reservations_target integer NOT NULL DEFAULT 40,

  -- Metadata
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),

  -- Solo un registro de objetivos por restaurante
  UNIQUE(restaurant_id)
);

-- 2. Habilitar Row Level Security
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;

-- 3. Política: cualquier usuario autenticado puede leer los objetivos
CREATE POLICY "Usuarios autenticados pueden leer kpi_targets"
  ON kpi_targets
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política: cualquier usuario autenticado puede insertar/actualizar objetivos
CREATE POLICY "Usuarios autenticados pueden modificar kpi_targets"
  ON kpi_targets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Insertar los valores por defecto para NÜA Smart Restaurant
INSERT INTO kpi_targets (restaurant_id)
VALUES ('df67d9fb-9583-4184-b349-a8ec287ff68a')
ON CONFLICT (restaurant_id) DO NOTHING;

-- 6. Verificar
SELECT * FROM kpi_targets;
