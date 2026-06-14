-- Coste de la opción "Botella" de los vinos (auditoría A5) — HECHO DESDE GSTOCK, sin números a mano.
--
-- Modelo: el vino tiene base = COPA (products.cost_price = coste copa, de la receta GStock
-- "COPA DE VINO *"). La botella es una OPCIÓN con SKU propio (RST-SDCA-W*-*-B). El COSTE de la
-- botella es el del PRODUCTO DE COMPRA de GStock (factura proveedor), no la copa × algo a mano.
--
-- Verificado: copa = 150 ml, botella = 750 ml = 5 copas (measurePriceAverage × 150 = coste copa
-- exacto en los 7 vinos). Por tanto la opción "Botella" = 4 copas extra = 600 ml del producto
-- de compra (la base ya cuenta 1 copa). Total línea botella = botella de compra completa.
--
-- 1) Mapeo en option_recipe_map: cada opción Botella -> su producto de compra GStock, portion=600.
--    fn_refresh_option_costs calcula el coste = measurePriceAverage × 600 (nada cableado) y lo aplica.
INSERT INTO option_recipe_map (option_sku, option_name, product_sku, source_type, source_id, portion, reviewed, notes, updated_at)
SELECT po.option_sku, po.option_name, po.product_sku, 'gstock_product', m.gstock_id, 600, true,
  'Botella = 4 copas extra (600ml) del producto de compra GStock; la base ya cuenta 1 copa (150ml). Coste = measurePriceAverage x 600.', now()
FROM product_options po
JOIN (VALUES
  ('RST-SDCA-WA-P-B', 80),   -- Aromatic  -> NÜA BLANCO
  ('RST-SDCA-WC-P-B', 79),   -- Crianza   -> NÜA CRIANZA
  ('RST-SDCA-WGB-O-B', 40),  -- Garnacha  -> NÜA COLLECTION GARNATXA BLANCA
  ('RST-SDCA-WM-T-M', 77),   -- Mencía    -> NÜA COLLECTION MENCIA
  ('RST-SDCA-WF-P-B', 81),   -- Rosé      -> NÜA ROSADO
  ('RST-SDCA-WV-P-B', 78)    -- Verdejo   -> NÜA VERDEJO ECOLOGICO Y VEGANO
) m(option_sku, gstock_id) ON m.option_sku = po.option_sku
WHERE po.is_active = true
ON CONFLICT (option_sku) DO UPDATE SET source_type='gstock_product', source_id=EXCLUDED.source_id,
  portion=600, reviewed=true, notes=EXCLUDED.notes, updated_at=now();

-- 2) NOTA: la guarda de fn_refresh_option_costs se ajustó para que la botella entre.
--    Antes: aplicar solo si coste <= products.price (precio COPA) -> bloqueaba la botella
--    (coste 6-8€ > precio copa 5-6€). Ahora: coste <= products.price + product_options.option_price
--    (precio del ITEM con esa opción = precio botella ~25€). Sigue bloqueando lote-basura (299/465€).
--    Ver scripts/fn_refresh_option_costs.sql.

SELECT fn_refresh_option_costs();
