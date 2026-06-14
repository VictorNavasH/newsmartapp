-- Vista ligera: SKUs vendidos en los últimos 60 días (señal "en carta / con ventas recientes").
-- Usada por la pestaña Food Cost de Smart Food para ocultar por defecto los platos fuera de carta
-- (retirados/standby que siguen is_active=true en el TPV pero sin ventas recientes).
-- Devuelve ~83 SKUs distintos → resultado pequeño, anon-readable (igual que el resto de vistas de food cost).
-- Decisión Q2 — ver docs/ESTADO_Y_PENDIENTES.md y docs/FOOD_COST_SYSTEM.md.

-- OJO: criterio is_paid = true (lo cobrado), NO cancelled_at — en este TPV
-- cancelled_at es una marca automática de cocina/curso, no una anulación
-- (ver auditoría A4 / scripts/create_vw_food_cost_real.sql).
CREATE OR REPLACE VIEW public.vw_productos_vendidos_60d AS
SELECT DISTINCT product_sku
FROM public.sales_order_items
WHERE confirmed_at >= now() - interval '60 days'
  AND is_paid = true
  AND product_sku IS NOT NULL;

GRANT SELECT ON public.vw_productos_vendidos_60d TO anon, authenticated;
