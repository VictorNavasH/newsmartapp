-- ============================================================================
-- Vista: vw_coste_ticket
-- Coste real de mercancía y food cost POR TICKET (factura).
--
-- Calcula, para cada ticket, el coste real combinatorio:
--   coste = SUM(coste_base) + SUM(product_options.cost_price_option)
--   donde coste_base = combo real (taquitos/baos, resuelto por las 2 opciones
--   cantidad+sabor vía vw_taquitos_baos_combos) o products.cost_price para el resto.
-- sobre las líneas pagadas (is_paid = true), uniendo:
--   sales_order_items.linked_transaction_id = v_facturas_listado.transaction_id
--   sales_item_options.item_id              = sales_order_items.item_id
--   product_options.option_sku              = sales_item_options.option_sku
--
-- food cost % se calcula sobre BASE IMPONIBLE (sin IVA, sin propinas), estándar.
-- Flags:
--   coste_parcial  → el ticket incluye algún producto con coste base 0 (p. ej. el
--                    poke "crea tu", cuyo coste son las opciones aún sin mapear) →
--                    el food cost mostrado infravalora; la UI lo avisa.
--   cuadra_factura → |suma de líneas − (importe_total − propinas)| <= 0,05 €
--                    (marca split-bills / dobles enlaces; excluir en agregados).
--
-- Consumida por: lib/facturacionService.ts → fetchCosteTicket(transactionId),
-- mostrado en el detalle de factura (FacturacionPage).
-- Índices necesarios: ver final del fichero.
-- ============================================================================
CREATE OR REPLACE VIEW vw_coste_ticket AS
WITH combo_item AS (
  SELECT soi.item_id, tbc.coste AS combo_cost
  FROM sales_order_items soi
  JOIN sales_item_options a ON a.item_id = soi.item_id
  JOIN sales_item_options b ON b.item_id = soi.item_id AND b.option_sku <> a.option_sku
  JOIN vw_taquitos_baos_combos tbc ON tbc.cantidad_sku = a.option_sku AND tbc.sabor_sku = b.option_sku
  WHERE soi.product_sku IN ('RST-SFC-NST', 'RST-SFC-NSB')
),
lineas AS (
  SELECT soi.linked_transaction_id AS transaction_id, soi.item_id, soi.price_total,
         COALESCE(ci.combo_cost, p.cost_price, 0) AS coste_base,
         (p.sku IS NOT NULL AND COALESCE(ci.combo_cost, p.cost_price, 0) = 0) AS base_sin_coste
  FROM sales_order_items soi
  LEFT JOIN products p ON p.sku = soi.product_sku
  LEFT JOIN combo_item ci ON ci.item_id = soi.item_id
  WHERE soi.is_paid = true AND soi.linked_transaction_id IS NOT NULL
),
opciones AS (
  SELECT sio.item_id, SUM(COALESCE(po.cost_price_option, 0)) AS coste_opciones
  FROM sales_item_options sio
  LEFT JOIN product_options po ON po.option_sku = sio.option_sku
  GROUP BY sio.item_id
),
ticket AS (
  SELECT l.transaction_id,
    SUM(l.coste_base + COALESCE(o.coste_opciones, 0)) AS coste_real,
    SUM(l.price_total) AS pvp_lineas,
    bool_or(l.base_sin_coste) AS coste_parcial,
    COUNT(*) AS num_lineas
  FROM lineas l
  LEFT JOIN opciones o ON o.item_id = l.item_id
  GROUP BY l.transaction_id
)
SELECT
  f.transaction_id,
  f.fecha,
  f.numero_completo,
  f.importe_total,
  f.base_imponible,
  f.propinas,
  t.coste_real::numeric(12,2)                                          AS coste_mercancia,
  ROUND(100.0 * t.coste_real / NULLIF(f.base_imponible, 0), 1)         AS food_cost_pct,
  (f.base_imponible - t.coste_real)::numeric(12,2)                     AS margen_bruto,
  t.coste_parcial,
  (ABS(t.pvp_lineas - (f.importe_total - f.propinas)) <= 0.05)         AS cuadra_factura,
  t.num_lineas
FROM v_facturas_listado f
JOIN ticket t ON t.transaction_id = f.transaction_id;

GRANT SELECT ON vw_coste_ticket TO anon, authenticated;

-- Índices para la búsqueda por ticket y el join de opciones
CREATE INDEX IF NOT EXISTS ix_soi_linked_tx ON sales_order_items(linked_transaction_id);
CREATE INDEX IF NOT EXISTS ix_sio_item ON sales_item_options(item_id);
