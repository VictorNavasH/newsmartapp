-- Coste de la opción "Botella" de los vinos (auditoría A5).
--
-- Estructura: el vino tiene precio/coste BASE = COPA (products.cost_price = coste copa,
-- de la receta GStock "COPA DE VINO *"). La botella es una OPCIÓN con SKU propio
-- (RST-SDCA-W*-*-B) que suma un delta al precio. Antes su coste (cost_price_option) = 0,
-- así que al vender una botella solo se contaba el coste de UNA copa → food cost ridículo.
--
-- Verificado en GStock: measurePriceAverage x 750 ml = coste botella, y sale EXACTAMENTE
-- 5 copas/botella (Mencía 0,0132x750=9,90=5x1,98; Crianza 7,95=5x1,59; Verdejo 5,95=5x1,19).
-- Por tanto: coste botella = coste copa x 5 → la opción "Botella" suma coste copa x 4
-- (la base ya cuenta 1 copa). Se mantiene derivado del coste de copa (GStock), no cableado.

-- 1) Puente option_recipe_map (manual, revisado) para durabilidad y trazabilidad
INSERT INTO option_recipe_map (option_sku, option_name, product_sku, source_type, cost, reviewed, notes, updated_at)
SELECT po.option_sku, po.option_name, po.product_sku, 'manual', ROUND(p.cost_price * 4, 3), true,
  'Botella = 4 copas extra sobre la copa base (5 copas/botella, verificado GStock measurePriceAverage x 750ml)', now()
FROM product_options po JOIN products p ON p.sku = po.product_sku
WHERE po.product_sku LIKE 'RST-SDCA-W%' AND lower(po.option_name) = 'botella' AND po.is_active = true
ON CONFLICT (option_sku) DO UPDATE SET cost = EXCLUDED.cost, reviewed = true, notes = EXCLUDED.notes, updated_at = now();

-- 2) Aplicar el coste a la opción (lo que suman vw_coste_ticket / vw_food_cost_real)
UPDATE product_options po
SET cost_price_option = ROUND(p.cost_price * 4, 3)
FROM products p
WHERE p.sku = po.product_sku AND po.product_sku LIKE 'RST-SDCA-W%' AND lower(po.option_name) = 'botella' AND po.is_active = true;
