-- Combos de platos COMBINATORIOS (taquitos / baos) con su coste y receta GStock REAL por variante.
--
-- Problema: en `vw_food_cost` los taquitos/baos se calculaban con un CTE de números CABLEADOS
-- (sabor.coste + cantidad.coste_extra), infravalorando los premium (Solomillo 4ud: 6,41 € cableado
-- vs 10,16 € real GStock), y la pestaña mostraba siempre la receta "POLLO" para todos los combos
-- (porque product_recipe_map está keyado por SKU y los 12 combos comparten RST-SFC-NST).
--
-- Esta vista resuelve cada combo (cantidad + sabor) a su receta GStock real:
--   - El coste sale EN VIVO de gstock_recipes (gstock_raw_data->>'cost'), nada cableado.
--   - recipe_name/recipe_cost = la receta correcta por variante (p. ej. Solomillo 3ud → SOLOMILLO 3UD).
--   - cantidad_sku/sabor_sku: las dos opciones del SKU que identifican el combo en sales_item_options
--     (RST-SFC-NST-C-{2T|3T|4T} + RST-SFC-NST-C-{P|CP|CD|S}) — base para el coste real por ticket (futuro).
-- PVP se mantiene igual que el vw_food_cost actual (base 10,90 taquitos / 17 baos + deltas) para no
-- mover el food cost por el denominador. La pestaña Food Cost consume esta vista y sobrescribe el coste
-- y la receta de los combos. anon-readable como el resto de vistas de food cost.

CREATE OR REPLACE VIEW public.vw_taquitos_baos_combos AS
WITH combos(sku, nombre_producto, pvp, recipe_id, cantidad_sku, sabor_sku) AS (
  VALUES
    ('RST-SFC-NST','Taquitos Pollo 2ud',      10.90::numeric, 225, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Pollo 3ud',      15.90, 338, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Pollo 4ud',      19.90, 339, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Cochinita 2ud',  11.90, 340, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Cochinita 3ud',  16.90, 411, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Cochinita 4ud',  20.90, 412, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Carrillera 2ud', 11.90, 344, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Carrillera 3ud', 16.90, 345, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Carrillera 4ud', 20.90, 346, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Solomillo 2ud',  14.40, 341, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-S'),
    ('RST-SFC-NST','Taquitos Solomillo 3ud',  19.40, 342, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-S'),
    ('RST-SFC-NST','Taquitos Solomillo 4ud',  23.40, 343, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-S'),
    ('RST-SFC-NSB','Baos Carrillera 1ud',     17.00, 488, 'RST-SFC-NSB-C-1','RST-SFC-NSB-O-C'),
    ('RST-SFC-NSB','Baos Carrillera 2ud',     25.50, 226, 'RST-SFC-NSB-C-2','RST-SFC-NSB-O-C'),
    ('RST-SFC-NSB','Baos Calamares 1ud',      18.00, 484, 'RST-SFC-NSB-C-1','RST-SFC-NSB-O-CA'),
    ('RST-SFC-NSB','Baos Calamares 2ud',      26.50, 331, 'RST-SFC-NSB-C-2','RST-SFC-NSB-O-CA')
)
SELECT
  c.sku,
  c.nombre_producto,
  round(c.pvp, 2) AS pvp,
  round(c.pvp / 1.10, 2) AS pvp_neto,
  round((gr.gstock_raw_data->>'cost')::numeric, 2) AS coste,
  round((gr.gstock_raw_data->>'cost')::numeric / NULLIF(c.pvp / 1.10, 0) * 100, 1) AS food_cost_pct,
  c.recipe_id,
  gr.name AS recipe_name,
  round((gr.gstock_raw_data->>'cost')::numeric, 2) AS recipe_cost,
  c.cantidad_sku,
  c.sabor_sku
FROM combos c
JOIN gstock_recipes gr ON gr.id = c.recipe_id;

GRANT SELECT ON public.vw_taquitos_baos_combos TO anon, authenticated;
