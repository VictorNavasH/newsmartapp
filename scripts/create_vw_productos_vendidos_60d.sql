-- Vista ligera: SKUs vendidos en los últimos 60 días (señal "en carta / con ventas recientes").
-- Usada por la pestaña Food Cost de Smart Food para ocultar por defecto los platos fuera de carta
-- (retirados/standby que siguen is_active=true en el TPV pero sin ventas recientes).
-- Devuelve ~83 SKUs distintos → resultado pequeño, anon-readable (igual que el resto de vistas de food cost).
-- Decisión Q2 — ver docs/ESTADO_Y_PENDIENTES.md y docs/FOOD_COST_SYSTEM.md.

CREATE OR REPLACE VIEW public.vw_productos_vendidos_60d AS
SELECT DISTINCT product_sku
FROM public.sales_order_items
WHERE confirmed_at >= now() - interval '60 days'
  AND cancelled_at IS NULL
  AND product_sku IS NOT NULL;

GRANT SELECT ON public.vw_productos_vendidos_60d TO anon, authenticated;
