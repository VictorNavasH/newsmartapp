-- ============================================================================
-- Añade el componente de costes variables (aparte del food cost) necesario
-- para calcular el punto de equilibrio REAL con margen de contribución.
--
--   other_variable_cost_pct = % sobre ventas de costes variables que NO son
--   food cost: comisiones TPV/delivery, consumibles, etc.
--
-- Usado por: types/kpiTargets.ts (otherVariableCostPct) y
--            lib/kpiTargets.ts → calculateBreakEven()
-- ============================================================================
ALTER TABLE kpi_targets
  ADD COLUMN IF NOT EXISTS other_variable_cost_pct numeric DEFAULT 3;
