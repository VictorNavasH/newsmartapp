-- ============================================================================
-- Capa de OPCIONES: coste dinámico de modificadores (puente opción ↔ fuente)
--
-- Los platos dinámicos (poke "crea tu", NÜA Smart Hummus, menús kids) tienen su
-- coste real en las OPCIONES que elige el cliente (sales_item_options). El coste
-- por ticket (vw_coste_ticket) ya suma product_options.cost_price_option; esto
-- es lo que rellena ese campo de forma fiable.
--
-- Cada opción se mapea a su FUENTE de coste explícita (no por nombre, porque
-- coexisten p. ej. "HUMMUS DE GARBANZO (SMART MIX)" [ración pequeña del mix] y
-- "SMART HUMMUS DE GARBANZO" [ración individual]):
--   - source_type='recipe'         → coste = gstock_recipes.cost (por ración)
--   - source_type='gstock_product' → coste = measurePriceAverage × portion (ración)
--   - source_type='manual'         → coste fijo
--
-- Guarda de plausibilidad: solo aplica si coste > 0 y <= PVP del plato (un error
-- tipo remolacha 465€ nunca entra). Se ejecuta a diario vía fn_refresh_all_costs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS option_recipe_map (
  option_sku   text PRIMARY KEY,
  option_name  text,
  product_sku  text,
  source_type  text,      -- 'recipe' | 'gstock_product' | 'manual'
  source_id    integer,   -- id de gstock_recipes o gstock_products
  portion      numeric,   -- ración (productos por unidad de medida); NULL=1 para recetas
  cost         numeric,   -- cost_price_option resuelto
  reviewed     boolean NOT NULL DEFAULT false,
  notes        text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON option_recipe_map TO anon, authenticated;

-- Siembra: sabores de NÜA Smart Hummus → recetas de RACIÓN INDIVIDUAL (no las del mix)
INSERT INTO option_recipe_map (option_sku, option_name, product_sku, source_type, source_id, reviewed, notes)
VALUES
  ('RST-SFC-NSH-S-G',  'Garbanzo',       'RST-SFC-NSH', 'recipe', 396, true, 'Racion individual SMART HUMMUS DE GARBANZO'),
  ('RST-SFC-NDH-S-PA', 'Pimiento Asado', 'RST-SFC-NSH', 'recipe', 397, true, 'Racion individual SMART HUMMUS DE PIMIENTO ASADO'),
  ('RST-SFC-NSH-S-R',  'Remolacha',      'RST-SFC-NSH', 'recipe', 398, true, 'Racion individual SMART HUMMUS DE REMOLACHA')
ON CONFLICT (option_sku) DO NOTHING;

CREATE OR REPLACE FUNCTION fn_refresh_option_costs()
RETURNS TABLE(option_sku text, opcion text, coste_nuevo numeric, fuente text) AS $$
BEGIN
  UPDATE option_recipe_map o
  SET cost = ROUND((r.gstock_raw_data->>'cost')::numeric, 3), updated_at = now()
  FROM gstock_recipes r
  WHERE o.source_type = 'recipe' AND o.source_id = r.id AND r.is_active = true;

  UPDATE option_recipe_map o
  SET cost = ROUND((gp.gstock_raw_data->>'measurePriceAverage')::numeric * COALESCE(o.portion, 1), 3), updated_at = now()
  FROM gstock_products gp
  WHERE o.source_type = 'gstock_product' AND o.source_id = gp.id AND gp.is_active = true;

  RETURN QUERY
  UPDATE product_options po
  SET cost_price_option = o.cost, updated_at = now()
  FROM option_recipe_map o
  JOIN products p ON p.sku = o.product_sku
  WHERE po.option_sku = o.option_sku
    AND o.cost IS NOT NULL AND o.cost > 0 AND o.cost <= p.price
    AND o.reviewed = true
    AND po.cost_price_option IS DISTINCT FROM o.cost
  RETURNING po.option_sku, o.option_name, po.cost_price_option, o.source_type;
END;
$$ LANGUAGE plpgsql;

-- Orquestador diario (costes base + opciones) — reemplaza al cron anterior
CREATE OR REPLACE FUNCTION fn_refresh_all_costs() RETURNS void AS $$
BEGIN
  PERFORM fn_refresh_food_costs();
  PERFORM fn_refresh_option_costs();
END;
$$ LANGUAGE plpgsql;

SELECT cron.unschedule('refresh-food-costs');
SELECT cron.schedule('refresh-food-costs', '30 6 * * *', $$SELECT fn_refresh_all_costs();$$);

-- PENDIENTE (necesita ración/gramaje de cocina, source_type='gstock_product'):
--   - Proteínas/base/toppings del poke "crea tu" (SALMON LIMPIO, ATUN LIMPIO...)
--   - Bebidas de menús kids (Coca-Cola measurePriceAverage 0.97/ud, Agua ~0, etc.)
--   - Helados/postres kids (HELADO DE *, CHEESECAKE KINDER en gstock_products)
