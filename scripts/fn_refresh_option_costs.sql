-- fn_refresh_option_costs() — refresca product_options.cost_price_option desde GStock,
-- vía el puente option_recipe_map (source_type recipe / gstock_product), con guarda de plausibilidad.
-- Lo ejecuta el cron diario (fn_refresh_all_costs). Idempotente.
--
-- GUARDA (paso B): aplica el coste SOLO si es plausible y el mapeo está revisado.
-- Plausible = coste > 0 y coste <= precio del ITEM CON ESA OPCIÓN (products.price + option_price).
-- (Antes era solo <= products.price = precio base; eso bloqueaba la opción "Botella" de los vinos,
--  cuyo coste supera el precio de la copa pero no el de la botella — auditoría A5.)

CREATE OR REPLACE FUNCTION public.fn_refresh_option_costs()
 RETURNS TABLE(option_sku text, opcion text, coste_nuevo numeric, fuente text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- A) Coste desde receta GStock (coste por ración)
  UPDATE option_recipe_map o
  SET cost = ROUND((r.gstock_raw_data->>'cost')::numeric, 3), updated_at = now()
  FROM gstock_recipes r
  WHERE o.source_type = 'recipe' AND o.source_id = r.id AND r.is_active = true;

  -- A2) Coste desde producto de compra (precio medio × ración)
  UPDATE option_recipe_map o
  SET cost = ROUND((gp.gstock_raw_data->>'measurePriceAverage')::numeric * COALESCE(o.portion, 1), 3), updated_at = now()
  FROM gstock_products gp
  WHERE o.source_type = 'gstock_product' AND o.source_id = gp.id AND gp.is_active = true;

  -- B) Aplicar si plausible (>0 y <= precio del item con la opción) y revisado
  RETURN QUERY
  UPDATE product_options po
  SET cost_price_option = o.cost, updated_at = now()
  FROM option_recipe_map o
  JOIN products p ON p.sku = o.product_sku
  WHERE po.option_sku = o.option_sku
    AND o.cost IS NOT NULL AND o.cost > 0 AND o.cost <= p.price + COALESCE(po.option_price, 0::numeric)
    AND o.reviewed = true
    AND po.cost_price_option IS DISTINCT FROM o.cost
  RETURNING po.option_sku, o.option_name, po.cost_price_option, o.source_type;
END;
$function$;
