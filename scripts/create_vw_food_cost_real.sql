-- ============================================================================
-- Vista: vw_food_cost_real
-- Food cost REAL y DINÁMICO ponderado por el mix de ventas (últimos 30 días).
--
-- A diferencia de vw_food_cost (media simple del food_cost_pct de cada plato
-- de la carta), esta vista:
--   1) pondera cada producto por las UNIDADES realmente vendidas
--      (sales_order_items × vw_food_cost por SKU), y
--   2) suma el coste DINÁMICO de los modificadores/opciones que eligió el
--      cliente (sales_item_options → product_options.cost_price_option):
--      destilados premium en combinados, suplementos, ingredientes de pokes…
--
-- NOTA sobre el denominador: se usa solo la venta neta BASE (pvp_neto). NO se
-- suma todavía la venta de las opciones de pago, porque muchos costes de
-- opción (sobre todo los ingredientes de los pokes "crea tu") aún no están
-- mapeados en GStock/n8n; sumar venta sin su coste infravaloraría el food cost.
-- Cuando esos costes estén mapeados, añadir al denominador la venta de opción:
--   ... + COALESCE(io.option_revenue,0)   (ver Plan de Food Cost Dinámico).
--
-- Base de venta neta (pvp_neto, sin IVA) — estándar en hostelería.
-- Devuelve 3 filas: Comida, Bebida y Global.
-- Consumida por: lib/dataService.ts → fetchFoodCostReal()
-- ============================================================================
CREATE OR REPLACE VIEW vw_food_cost_real AS
WITH item_option_cost AS (
  -- Coste real de las opciones elegidas, agregado por línea de venta (item_id)
  SELECT sio.item_id, SUM(COALESCE(po.cost_price_option, 0)) AS option_cost
  FROM sales_item_options sio
  LEFT JOIN product_options po ON po.option_sku = sio.option_sku
  GROUP BY sio.item_id
)
SELECT
  COALESCE(fc.tipo, 'Global')                                                              AS tipo,
  ROUND(100.0 * SUM(soi.quantity * (fc.coste_escandallo + COALESCE(ioc.option_cost, 0)))
        / NULLIF(SUM(soi.quantity * fc.pvp_neto), 0), 1)                                   AS food_cost_pct,
  SUM(soi.quantity * fc.pvp_neto)::numeric(12,2)                                           AS venta_neta,
  SUM(soi.quantity * (fc.coste_escandallo + COALESCE(ioc.option_cost, 0)))::numeric(12,2)  AS coste_mercancia,
  SUM(soi.quantity)::bigint                                                                AS unidades
FROM sales_order_items soi
JOIN vw_food_cost fc ON fc.sku = soi.product_sku
LEFT JOIN item_option_cost ioc ON ioc.item_id = soi.item_id
WHERE soi.confirmed_at >= (now() - interval '30 days')
  AND soi.cancelled_at IS NULL
GROUP BY GROUPING SETS ((fc.tipo), ());

GRANT SELECT ON vw_food_cost_real TO anon, authenticated;
