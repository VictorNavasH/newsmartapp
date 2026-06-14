-- ============================================================================
-- Vista: vw_food_cost_real
-- Food cost REAL y DINÁMICO ponderado por el mix de ventas (últimos 30 días).
--
-- A diferencia de vw_food_cost (media simple de la carta), esta vista:
--   1) pondera cada producto por las UNIDADES realmente vendidas
--      (sales_order_items × vw_food_cost por SKU), y
--   2) suma el coste DINÁMICO de los modificadores/opciones que eligió el
--      cliente (sales_item_options → product_options.cost_price_option).
--
-- COMBINATORIOS (taquitos/baos, RST-SFC-NST / RST-SFC-NSB): el coste y el PVP
-- neto se resuelven por la COMBINACIÓN real (cantidad + sabor) vía las 2 opciones
-- de cada línea contra vw_taquitos_baos_combos (coste GStock real + PVP real
-- cobrado). Antes se usaba el combo más barato por SKU (DISTINCT ON), que
-- infravaloraba (p. ej. todo taquito contaba como Pollo 2ud ~1,84 €).
--
-- IMPORTANTE — deduplicación (fix doble conteo): vw_food_cost contiene filas
-- "fantasma" por variante. El CTE fc_dedup toma una fila por SKU (la de menor
-- coste). Para los combinatorios, combo_item sobrescribe ese valor con el real.
--
-- NOTA denominador: venta neta (pvp_neto, sin IVA). Para combinatorios usa el
-- pvp_neto del combo real; para el resto, el de vw_food_cost.
--
-- UNIVERSO DE VENTA = is_paid = true (lo realmente cobrado). OJO: NO filtrar por
-- cancelled_at — en este TPV `cancelled_at` es una marca AUTOMÁTICA de cocina/curso
-- que se pone a casi todos los platos de comida (~30 ms tras confirmar), NO una
-- anulación. Esos platos se sirven y se cobran (están en la factura). Filtrar
-- cancelled_at IS NULL descartaba ~10.000 €/mes de comida pagada (auditoría A4).
--
-- Devuelve 3 filas: Comida, Bebida y Global.
-- Consumida por: lib/dataService.ts → fetchFoodCostReal()
-- ============================================================================
CREATE OR REPLACE VIEW vw_food_cost_real AS
WITH item_option_cost AS (
  SELECT sio.item_id, SUM(COALESCE(po.cost_price_option, 0)) AS option_cost
  FROM sales_item_options sio
  LEFT JOIN product_options po ON po.option_sku = sio.option_sku
  GROUP BY sio.item_id
),
combo_item AS (
  SELECT soi.item_id, tbc.coste AS combo_cost, tbc.pvp_neto AS combo_pvp_neto
  FROM sales_order_items soi
  JOIN sales_item_options a ON a.item_id = soi.item_id
  JOIN sales_item_options b ON b.item_id = soi.item_id AND b.option_sku <> a.option_sku
  JOIN vw_taquitos_baos_combos tbc ON tbc.cantidad_sku = a.option_sku AND tbc.sabor_sku = b.option_sku
  WHERE soi.product_sku IN ('RST-SFC-NST', 'RST-SFC-NSB')
),
fc_dedup AS (
  SELECT DISTINCT ON (sku) sku, tipo, coste_escandallo, pvp_neto
  FROM vw_food_cost
  ORDER BY sku, coste_escandallo ASC
)
SELECT
  COALESCE(fc.tipo, 'Global')                                                               AS tipo,
  ROUND(100.0 * SUM(soi.quantity * (COALESCE(ci.combo_cost, fc.coste_escandallo)
        + CASE WHEN ci.item_id IS NULL THEN COALESCE(ioc.option_cost, 0) ELSE 0 END))
        / NULLIF(SUM(soi.quantity * COALESCE(ci.combo_pvp_neto, fc.pvp_neto)), 0), 1)        AS food_cost_pct,
  SUM(soi.quantity * COALESCE(ci.combo_pvp_neto, fc.pvp_neto))::numeric(12,2)                AS venta_neta,
  SUM(soi.quantity * (COALESCE(ci.combo_cost, fc.coste_escandallo)
        + CASE WHEN ci.item_id IS NULL THEN COALESCE(ioc.option_cost, 0) ELSE 0 END))::numeric(12,2) AS coste_mercancia,
  SUM(soi.quantity)::bigint                                                                  AS unidades
FROM sales_order_items soi
JOIN fc_dedup fc ON fc.sku = soi.product_sku
LEFT JOIN item_option_cost ioc ON ioc.item_id = soi.item_id
LEFT JOIN combo_item ci ON ci.item_id = soi.item_id
WHERE soi.confirmed_at >= (now() - interval '30 days')
  AND soi.is_paid = true
GROUP BY GROUPING SETS ((fc.tipo), ());

GRANT SELECT ON vw_food_cost_real TO anon, authenticated;
