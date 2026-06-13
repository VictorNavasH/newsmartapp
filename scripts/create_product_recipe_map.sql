-- ============================================================================
-- Puente producto (SKU) ↔ receta GStock + sincronización fiable de costes
--
-- PROBLEMA: products.cost_price (que alimenta TODO el food cost) estaba
-- desincronizado con las recetas reales de GStock (unos altos, otros bajos,
-- algunos apuntando a recetas viejas/desactivadas). No existía un puente
-- fiable receta↔SKU y los nombres de receta están duplicados (activas + viejas).
--
-- SOLUCIÓN:
--   1) Tabla puente product_recipe_map (SKU → receta GStock), revisable.
--   2) Función fn_refresh_food_costs() re-ejecutable e idempotente que:
--      A) refresca el coste de cada receta mapeada desde GStock actual,
--      B) autodescubre recetas reactivadas/nuevas por nombre EXACTO (>=0.95),
--      C) aplica el coste a products SOLO si es plausible (>0 y <= PVP) y el
--         match es de confianza alta o revisado manualmente.
--      → guarda de plausibilidad: un error de cantidades en GStock (p. ej. una
--        receta a 299€) NUNCA entra al food cost.
--   3) Cron diario 06:30 (tras el sync de recetas de GStock de las 06:00).
--
-- 'reviewed = true' = mapeo bloqueado manualmente (la función no lo re-empareja,
-- solo refresca su coste). 'reviewed = false' = autogestionado por la función.
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_recipe_map (
  product_sku         text PRIMARY KEY,
  product_name        text,
  product_cost_actual numeric,   -- products.cost_price en el momento de la siembra (backup)
  recipe_id           integer,   -- gstock_recipes.id mapeada
  recipe_name         text,
  recipe_cost         numeric,   -- coste real GStock (gstock_raw_data->>'cost')
  similarity          numeric,   -- 0-1 similitud de nombre (pg_trgm + unaccent)
  confidence          text,      -- 'alta' | 'media' | 'baja' | 'sin_receta' | 'sin_receta_activa'
  reviewed            boolean NOT NULL DEFAULT false,
  notes               text,
  updated_at          timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recipe_map TO anon, authenticated;

-- Siembra inicial (mejor receta activa por similitud de nombre)
INSERT INTO product_recipe_map
  (product_sku, product_name, product_cost_actual, recipe_id, recipe_name, recipe_cost, similarity, confidence)
SELECT p.sku, p.name, p.cost_price, m.id, m.name, m.cost, ROUND(m.sim::numeric, 3),
  CASE WHEN m.sim IS NULL OR m.sim < 0.30 THEN 'sin_receta'
       WHEN m.sim >= 0.95 THEN 'alta' WHEN m.sim >= 0.55 THEN 'media' ELSE 'baja' END
FROM products p
LEFT JOIN LATERAL (
  SELECT r.id, r.name, ROUND((r.gstock_raw_data->>'cost')::numeric, 2) AS cost,
         similarity(unaccent(lower(r.name)), unaccent(lower(p.name))) AS sim
  FROM gstock_recipes r
  WHERE r.is_active AND r.is_subrecipe = false AND (r.gstock_raw_data->>'cost') IS NOT NULL
  ORDER BY similarity(unaccent(lower(r.name)), unaccent(lower(p.name))) DESC, r.id
  LIMIT 1
) m ON true
WHERE p.is_active
ON CONFLICT (product_sku) DO NOTHING;

-- Función de refresco/aplicación (re-ejecutable e idempotente)
CREATE OR REPLACE FUNCTION fn_refresh_food_costs()
RETURNS TABLE(sku text, plato text, coste_nuevo numeric, receta text) AS $$
BEGIN
  -- 0) Alta de productos nuevos
  INSERT INTO product_recipe_map (product_sku, product_name, product_cost_actual)
  SELECT p.sku, p.name, p.cost_price FROM products p
  WHERE p.is_active AND NOT EXISTS (SELECT 1 FROM product_recipe_map m WHERE m.product_sku = p.sku);

  -- A) Refrescar coste de la receta mapeada desde GStock actual
  UPDATE product_recipe_map m
  SET recipe_cost = ROUND((r.gstock_raw_data->>'cost')::numeric, 2), recipe_name = r.name, updated_at = now()
  FROM gstock_recipes r
  WHERE m.recipe_id = r.id AND r.is_active = true AND r.is_subrecipe = false;

  -- A2) Si la receta dejó de estar activa, soltar coste (no aplicar caducado)
  UPDATE product_recipe_map m SET recipe_cost = NULL, updated_at = now()
  WHERE m.recipe_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM gstock_recipes r WHERE r.id = m.recipe_id AND r.is_active AND r.is_subrecipe = false);

  -- B) Autodescubrir receta para productos SIN receta (match exacto >=0.95)
  UPDATE product_recipe_map m
  SET recipe_id = x.id, recipe_name = x.name, recipe_cost = x.cost, similarity = x.sim,
      confidence = 'alta', updated_at = now()
  FROM (
    SELECT p.sku, b.id, b.name, b.cost, b.sim
    FROM products p
    JOIN LATERAL (
      SELECT r.id, r.name, ROUND((r.gstock_raw_data->>'cost')::numeric, 2) AS cost,
             similarity(unaccent(lower(r.name)), unaccent(lower(p.name))) AS sim
      FROM gstock_recipes r
      WHERE r.is_active AND r.is_subrecipe = false AND (r.gstock_raw_data->>'cost') IS NOT NULL
      ORDER BY similarity(unaccent(lower(r.name)), unaccent(lower(p.name))) DESC, r.id
      LIMIT 1
    ) b ON true
    WHERE p.is_active AND b.sim >= 0.95
  ) x
  WHERE m.product_sku = x.sku AND m.recipe_id IS NULL;

  -- C) Aplicar coste plausible a products
  RETURN QUERY
  UPDATE products p
  SET cost_price = m.recipe_cost, updated_at = now()
  FROM product_recipe_map m
  WHERE m.product_sku = p.sku
    AND m.recipe_cost IS NOT NULL AND m.recipe_cost > 0 AND m.recipe_cost <= p.price
    AND (m.confidence = 'alta' OR m.reviewed = true)
    AND p.cost_price IS DISTINCT FROM m.recipe_cost
  RETURNING p.sku, p.name, p.cost_price, COALESCE(m.recipe_name, '');
END;
$$ LANGUAGE plpgsql;

-- Programación diaria (06:30, tras el sync de recetas de GStock de las 06:00)
SELECT cron.schedule('refresh-food-costs', '30 6 * * *', $$SELECT fn_refresh_food_costs();$$);
