-- ============================================================================
-- Vista: vw_food_cost — catálogo de food cost por plato (base de toda la pestaña).
-- NOTA: contiene CTEs con valores CABLEADOS (extras patatas +0.47 / helado +0.41 /
-- ensalada kids +0.05, y combos taquitos/baos) que la app ya sobrescribe vía
-- vw_taquitos_baos_combos. Esta definición AÑADE la categoría RST-SM (Smart Menús),
-- que antes quedaba excluida pese a tener coste correcto (auditoría jun 2026, A2).
-- pvp_neto = price/1.10 (food cost sobre base imponible).
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_food_cost AS
 WITH productos_con_opcion_patatas AS (
         SELECT DISTINCT po.product_sku
           FROM product_options po
          WHERE po.is_active = true AND lower(po.option_name) ~~ '%patata%'::text AND po.option_price > 0::numeric AND po.product_sku !~~ 'RST-SFK%'::text
        ), productos_kids AS (
         SELECT DISTINCT p.sku
           FROM products p
          WHERE p.category_sku = 'RST-SFK'::text AND p.is_active = true AND p.cost_price > 0::numeric
        ), producto_coulant AS (
         SELECT p.sku
           FROM products p
          WHERE p.sku = 'RST-SFD-C'::text
        ), productos_sin_patatas AS (
         SELECT p.sku,
            p.name AS nombre_producto,
                CASE p.category_sku
                    WHEN 'RST-SPK'::text THEN 'Smart Poke'::text
                    WHEN 'RST-SF'::text THEN 'Smart Food'::text
                    WHEN 'RST-SFC'::text THEN 'Compartir'::text
                    WHEN 'RST-SFK'::text THEN 'Kids'::text
                    WHEN 'RST-SFD'::text THEN 'Dulce'::text
                    ELSE NULL::text
                END AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.is_active = true AND p.cost_price > 0::numeric AND (p.category_sku = ANY (ARRAY['RST-SPK'::text, 'RST-SF'::text, 'RST-SFC'::text, 'RST-SFD'::text])) AND (p.sku <> ALL (ARRAY['RST-SFC-NST'::text, 'RST-SFC-NSB'::text])) AND NOT (p.sku IN ( SELECT producto_coulant.sku
                   FROM producto_coulant)) AND (p.sku IN ( SELECT productos_con_opcion_patatas.product_sku
                   FROM productos_con_opcion_patatas))
        ), productos_con_patatas AS (
         SELECT p.sku,
            p.name AS nombre_producto,
                CASE p.category_sku
                    WHEN 'RST-SPK'::text THEN 'Smart Poke'::text
                    WHEN 'RST-SF'::text THEN 'Smart Food'::text
                    WHEN 'RST-SFC'::text THEN 'Compartir'::text
                    WHEN 'RST-SFK'::text THEN 'Kids'::text
                    WHEN 'RST-SFD'::text THEN 'Dulce'::text
                    ELSE NULL::text
                END AS categoria,
            'Comida'::text AS tipo,
            round(p.price + 3::numeric, 2) AS pvp,
            round((p.price + 3::numeric) / 1.10, 2) AS pvp_neto,
            round(p.cost_price + 0.47, 2) AS coste_escandallo,
            round((p.cost_price + 0.47) / NULLIF((p.price + 3::numeric) / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            true AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.is_active = true AND p.cost_price > 0::numeric AND (p.category_sku = ANY (ARRAY['RST-SPK'::text, 'RST-SF'::text, 'RST-SFC'::text, 'RST-SFD'::text])) AND (p.sku <> ALL (ARRAY['RST-SFC-NST'::text, 'RST-SFC-NSB'::text])) AND NOT (p.sku IN ( SELECT producto_coulant.sku
                   FROM producto_coulant)) AND (p.sku IN ( SELECT productos_con_opcion_patatas.product_sku
                   FROM productos_con_opcion_patatas))
        ), coulant_sin_helado AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Dulce'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.sku = 'RST-SFD-C'::text
        ), coulant_con_helado AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Dulce'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price + 1::numeric, 2) AS pvp,
            round((p.price + 1::numeric) / 1.10, 2) AS pvp_neto,
            round(p.cost_price + 0.41, 2) AS coste_escandallo,
            round((p.cost_price + 0.41) / NULLIF((p.price + 1::numeric) / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            true AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.sku = 'RST-SFD-C'::text
        ), kids_con_patatas AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Kids'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            true AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE (p.sku IN ( SELECT productos_kids.sku
                   FROM productos_kids)) AND p.name !~~* '%spaguetti%'::text
        ), kids_con_ensalada AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Kids'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price + 0.05, 2) AS coste_escandallo,
            round((p.cost_price + 0.05) / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            true AS tiene_ensalada
           FROM products p
          WHERE (p.sku IN ( SELECT productos_kids.sku
                   FROM productos_kids)) AND p.name !~~* '%spaguetti%'::text
        ), kids_spaguetti AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Kids'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE (p.sku IN ( SELECT productos_kids.sku
                   FROM productos_kids)) AND p.name ~~* '%spaguetti%'::text
        ), productos_comida_simple AS (
         SELECT p.sku,
            p.name AS nombre_producto,
                CASE p.category_sku
                    WHEN 'RST-SPK'::text THEN 'Smart Poke'::text
                    WHEN 'RST-SF'::text THEN 'Smart Food'::text
                    WHEN 'RST-SFC'::text THEN 'Compartir'::text
                    WHEN 'RST-SFK'::text THEN 'Kids'::text
                    WHEN 'RST-SFD'::text THEN 'Dulce'::text
                    ELSE NULL::text
                END AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.is_active = true AND p.cost_price > 0::numeric AND (p.category_sku = ANY (ARRAY['RST-SPK'::text, 'RST-SF'::text, 'RST-SFC'::text, 'RST-SFD'::text])) AND (p.sku <> ALL (ARRAY['RST-SFC-NST'::text, 'RST-SFC-NSB'::text])) AND NOT (p.sku IN ( SELECT productos_con_opcion_patatas.product_sku
                   FROM productos_con_opcion_patatas)) AND NOT (p.sku IN ( SELECT producto_coulant.sku
                   FROM producto_coulant)) AND p.category_sku <> 'RST-SFK'::text
        ), menus AS (
         SELECT p.sku,
            p.name AS nombre_producto,
            'Menús'::text AS categoria,
            'Comida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.category_sku = 'RST-SM'::text AND p.is_active = true AND p.cost_price > 0::numeric
        ), taquitos_combinaciones AS (
         SELECT 'RST-SFC-NST'::text AS sku,
            (('Taquitos '::text || sabor.nombre) || ' '::text) || cantidad.nombre AS nombre_producto,
            'Compartir'::text AS categoria,
            'Comida'::text AS tipo,
            round(10.90 + sabor.precio_extra + cantidad.precio_extra, 2) AS pvp,
            round((10.90 + sabor.precio_extra + cantidad.precio_extra) / 1.10, 2) AS pvp_neto,
            round(sabor.coste + cantidad.coste_extra, 2) AS coste_escandallo,
            round((sabor.coste + cantidad.coste_extra) / NULLIF((10.90 + sabor.precio_extra + cantidad.precio_extra) / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM ( VALUES ('Pollo'::text,0::numeric,1.8357), ('Cochinita'::text,1::numeric,2.1125), ('Carrillera'::text,1::numeric,1.9465), ('Solomillo'::text,3.5,4.5767)) sabor(nombre, precio_extra, coste)
             CROSS JOIN ( VALUES ('2ud'::text,0::numeric,0::numeric), ('3ud'::text,5::numeric,0.9179), ('4ud'::text,9::numeric,1.8357)) cantidad(nombre, precio_extra, coste_extra)
        ), baos_combinaciones AS (
         SELECT 'RST-SFC-NSB'::text AS sku,
            (('Baos '::text || sabor.nombre) || ' '::text) || cantidad.nombre AS nombre_producto,
            'Compartir'::text AS categoria,
            'Comida'::text AS tipo,
            round(17::numeric + sabor.precio_extra + cantidad.precio_extra, 2) AS pvp,
            round((17::numeric + sabor.precio_extra + cantidad.precio_extra) / 1.10, 2) AS pvp_neto,
            round(sabor.coste * cantidad.unidades, 2) AS coste_escandallo,
            round(sabor.coste * cantidad.unidades / NULLIF((17::numeric + sabor.precio_extra + cantidad.precio_extra) / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM ( VALUES ('Carrillera'::text,0::numeric,1.0247), ('Calamares'::text,1::numeric,0.9261)) sabor(nombre, precio_extra, coste)
             CROSS JOIN ( VALUES ('1ud'::text,0::numeric,1::numeric), ('2ud'::text,8.5,2::numeric)) cantidad(nombre, precio_extra, unidades)
        ), bebidas AS (
         SELECT p.sku,
            p.name AS nombre_producto,
                CASE p.category_sku
                    WHEN 'RST-SDCA'::text THEN 'Drinks Con Alcohol'::text
                    WHEN 'RST-SDSA'::text THEN 'Drinks Sin Alcohol'::text
                    WHEN 'RST-SMC'::text THEN 'Mojitos & Cocktails'::text
                    WHEN 'RST-SCTL'::text THEN 'Coffee, Tea & Licores'::text
                    ELSE NULL::text
                END AS categoria,
            'Bebida'::text AS tipo,
            round(p.price, 2) AS pvp,
            round(p.price / 1.10, 2) AS pvp_neto,
            round(p.cost_price, 2) AS coste_escandallo,
            round(p.cost_price / NULLIF(p.price / 1.10, 0::numeric) * 100::numeric, 1) AS food_cost_pct,
            false AS tiene_patatas,
            false AS tiene_helado,
            false AS tiene_ensalada
           FROM products p
          WHERE p.is_active = true AND p.cost_price > 0::numeric AND (p.category_sku = ANY (ARRAY['RST-SDCA'::text, 'RST-SDSA'::text, 'RST-SMC'::text, 'RST-SCTL'::text]))
        )
 SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM productos_sin_patatas
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM productos_con_patatas
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM coulant_sin_helado
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM coulant_con_helado
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM kids_con_patatas
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM kids_con_ensalada
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM kids_spaguetti
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM productos_comida_simple
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM menus
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM taquitos_combinaciones
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM baos_combinaciones
UNION ALL SELECT sku, nombre_producto, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas, tiene_helado, tiene_ensalada FROM bebidas
  ORDER BY 4, 3, 8 DESC;

GRANT SELECT ON public.vw_food_cost TO anon, authenticated;
