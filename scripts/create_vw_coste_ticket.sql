-- ============================================================================
-- Vista: vw_coste_ticket
-- Coste real de mercancía y food cost POR TICKET (factura).
--
-- Calcula, para cada ticket, el coste real combinatorio:
--   coste = SUM(products.cost_price) + SUM(product_options.cost_price_option)
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
WITH lineas AS (
  SELECT soi.linked_transaction_id AS transaction_id, soi.item_id, soi.price_total,
         COALESCE(p.cost_price, 0) AS coste_base,
         (p.sku IS NOT NULL AND COALESCE(p.cost_price, 0) = 0) AS base_sin_coste
  FROM sales_order_items soi
  LEFT JOIN products p ON p.sku = soi.product_sku
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
