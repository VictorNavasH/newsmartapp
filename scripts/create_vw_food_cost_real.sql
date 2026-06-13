-- ============================================================================
-- Vista: vw_food_cost_real
-- Food cost REAL ponderado por el mix de ventas (últimos 30 días).
--
-- A diferencia de vw_food_cost (media simple del food_cost_pct de cada plato
-- de la carta), esta vista pondera cada producto por las UNIDADES realmente
-- vendidas, uniendo sales_order_items con vw_food_cost por SKU.
--
-- Base de venta neta (pvp_neto, sin IVA) — estándar en hostelería.
-- Devuelve 3 filas: Comida, Bebida y Global.
-- Consumida por: lib/dataService.ts → fetchFoodCostReal()
-- ============================================================================
CREATE OR REPLACE VIEW vw_food_cost_real AS
SELECT
  COALESCE(fc.tipo, 'Global')                                                        AS tipo,
  ROUND(100.0 * SUM(soi.quantity * fc.coste_escandallo)
        / NULLIF(SUM(soi.quantity * fc.pvp_neto), 0), 1)                             AS food_cost_pct,
  SUM(soi.quantity * fc.pvp_neto)::numeric(12,2)                                     AS venta_neta,
  SUM(soi.quantity * fc.coste_escandallo)::numeric(12,2)                             AS coste_mercancia,
  SUM(soi.quantity)::bigint                                                          AS unidades
FROM sales_order_items soi
JOIN vw_food_cost fc ON fc.sku = soi.product_sku
WHERE soi.confirmed_at >= (now() - interval '30 days')
  AND soi.cancelled_at IS NULL
GROUP BY GROUPING SETS ((fc.tipo), ());

GRANT SELECT ON vw_food_cost_real TO anon, authenticated;
