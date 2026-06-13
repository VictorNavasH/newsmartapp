-- Combos de platos COMBINATORIOS (taquitos / baos) con su coste, receta y PVP REALES por variante.
--
-- Problema 1 (coste): en `vw_food_cost` los taquitos/baos se calculaban con un CTE de números CABLEADOS
-- (sabor.coste + cantidad.coste_extra), infravalorando los premium (Solomillo 4ud: 6,41 € cableado
-- vs 10,16 € real GStock), y la pestaña mostraba siempre la receta "POLLO" para todos los combos
-- (porque product_recipe_map está keyado por SKU y los 12 combos comparten RST-SFC-NST).
-- Problema 2 (PVP): el PVP del catálogo (10,90/17 cableado, y products.price 11,50/16,50) NO coincidía
-- con lo realmente cobrado (sales_order_items.price_total). Lo real (validado 90d): taquitos base 10,50
-- + sabor (Pollo+0/Cochinita+1/Carrillera+1/Solomillo+3,5) + cantidad (2ud+0/3ud+5/4ud+10);
-- baos base 7,50 + (Carrillera+0/Calamares+0,5) + (1ud+0/2ud+8,5).
--
-- Esta vista resuelve cada combo (cantidad + sabor, identificado por sus 2 opciones del SKU
-- -C-{2T|3T|4T} + -C-{P|CP|CD|S}) a su receta GStock real:
--   - coste EN VIVO de gstock_recipes (gstock_raw_data->>'cost'); las columnas relacionales cost_* están NULL.
--   - recipe_name/recipe_cost = la receta correcta por variante (Solomillo 3ud → SOLOMILLO 3UD).
--   - pvp = el precio REAL cobrado (price_total), no el catálogo desincronizado.
--   - cantidad_sku/sabor_sku: las 2 opciones que identifican el combo en sales_item_options
--     (base del coste real por ticket en vw_coste_ticket / vw_food_cost_real).
-- La pestaña Food Cost y las vistas por-ticket consumen esta vista. anon-readable como el resto.

CREATE OR REPLACE VIEW public.vw_taquitos_baos_combos AS
WITH combos(sku, nombre_producto, pvp, recipe_id, cantidad_sku, sabor_sku) AS (
  VALUES
    ('RST-SFC-NST','Taquitos Pollo 2ud',      10.50::numeric, 225, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Pollo 3ud',      15.50, 338, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Pollo 4ud',      20.50, 339, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-P'),
    ('RST-SFC-NST','Taquitos Cochinita 2ud',  11.50, 340, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Cochinita 3ud',  16.50, 411, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Cochinita 4ud',  21.50, 412, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-CP'),
    ('RST-SFC-NST','Taquitos Carrillera 2ud', 11.50, 344, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Carrillera 3ud', 16.50, 345, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Carrillera 4ud', 21.50, 346, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-CD'),
    ('RST-SFC-NST','Taquitos Solomillo 2ud',  14.00, 341, 'RST-SFC-NST-C-2T','RST-SFC-NST-C-S'),
    ('RST-SFC-NST','Taquitos Solomillo 3ud',  19.00, 342, 'RST-SFC-NST-C-3T','RST-SFC-NST-C-S'),
    ('RST-SFC-NST','Taquitos Solomillo 4ud',  24.00, 343, 'RST-SFC-NST-C-4T','RST-SFC-NST-C-S'),
    ('RST-SFC-NSB','Baos Carrillera 1ud',      7.50, 488, 'RST-SFC-NSB-C-1','RST-SFC-NSB-O-C'),
    ('RST-SFC-NSB','Baos Carrillera 2ud',     16.00, 226, 'RST-SFC-NSB-C-2','RST-SFC-NSB-O-C'),
    ('RST-SFC-NSB','Baos Calamares 1ud',       8.00, 484, 'RST-SFC-NSB-C-1','RST-SFC-NSB-O-CA'),
    ('RST-SFC-NSB','Baos Calamares 2ud',      16.50, 331, 'RST-SFC-NSB-C-2','RST-SFC-NSB-O-CA')
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
