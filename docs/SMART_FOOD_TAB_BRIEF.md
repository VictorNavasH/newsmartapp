# Brief — Rehacer la pestaña "Food Cost" de Smart Food

> Contexto para una sesión futura con Claude. Objetivo: reconstruir la pestaña de food
> cost de Smart Food para que refleje el nuevo sistema (costes sincronizados con GStock +
> coste dinámico de opciones + coste real por ticket). Leer junto a `docs/FOOD_COST_SYSTEM.md`.

## 1. Dónde está
- Vista Smart Food: `components/views/CostesPage.tsx` (tab "Food Cost", línea ~164 → `<FoodCostTab />`).
- Componente a rehacer: `components/features/FoodCostTab.tsx` (~509 líneas).
- Servicio: `lib/dataService.ts` (`fetchFoodCostProducts`, `fetchFoodCostAverage`, `fetchFoodCostReal`).
- Tipos: `types/food-cost.ts` (`FoodCostProduct`, `FoodCostSummary`, `FoodCostReal`, `FoodCostRealRow`).
- Hook: `hooks/queries/useProductsData.ts` (`useFoodCostProducts`).

## 2. Qué hace HOY (a reemplazar)
- `fetchFoodCostProducts()` → vista `vw_food_cost` → `FoodCostSummary`: tabla de productos con
  `food_cost_pct`, KPIs (promedio simple, críticos >30% / warning 20-30% / ok <20%), y por categoría.
- `ProductCard` permite editar precio manual (RPC `update_manual_price` / `clear_manual_price`).
- **Código muerto a limpiar**: lee `variant_id`, `precio_manual`, `food_cost_peor_pct` que NO existen
  en `vw_food_cost` (caen a default); badge "PVP Manual" inerte (el pvp usa `products.price`, no `manual_price`).

## 3. Qué cambió (sistema nuevo — ver FOOD_COST_SYSTEM.md)
- `products.cost_price` ahora está sincronizado fiable con las recetas de GStock vía el puente
  `product_recipe_map` + `fn_refresh_food_costs()` (cron diario 06:30, guarda de plausibilidad).
- Coste de modificadores/opciones vía `option_recipe_map` + `fn_refresh_option_costs()` →
  `product_options.cost_price_option`.
- **Platos dinámicos** (coste según opciones): poke "crea tu", NÜA Smart Hummus (por sabor),
  vinos (variedad + copa/botella), menús kids (bebida/postre/side). Su coste real vive en las opciones.

## 4. Fuentes de datos disponibles (vistas / tablas)
| Fuente | Qué da |
|---|---|
| `vw_food_cost` | Por producto (base): sku, nombre, categoria, tipo, pvp, pvp_neto, coste_escandallo, food_cost_pct, tiene_patatas/helado/ensalada. (Ojo: tiene filas-variante duplicadas por SKU.) |
| `vw_food_cost_real` | Ponderado por ventas 30d: filas Comida/Bebida/Global con food_cost_pct, venta_neta, coste_mercancia, unidades. |
| `vw_coste_ticket` | Coste real por ticket (transaction_id): coste_mercancia, food_cost_pct, margen_bruto, coste_parcial, cuadra_factura. |
| `product_recipe_map` | Mapeo SKU→receta GStock (recipe_name, recipe_cost, confidence, reviewed). |
| `option_recipe_map` | Mapeo opción→fuente de coste (source_type, cost). |
| `product_options` | Opciones por producto con `cost_price_option` (coste real de cada modificador). |

## 5. Dirección propuesta para la nueva pestaña (validar antes de implementar)
1. **Cabecera**: food cost REAL ponderado (`vw_food_cost_real`) — Global / Comida / Bebida, con % y € de coste de mercancía. (En vez de la media simple actual.)
2. **Tabla por producto**: food cost real (ya correcto), coste, PVP, margen; coloreado por umbral
   con colores de marca **verde `#17c3b2` (≤30%) / ámbar `#ffcb77` (≤35%) / rojo `#fe6d73` (>35%)**.
3. **Platos dinámicos**: marcarlos (poke, hummus, vinos, menús) y permitir **desglosar el coste de sus
   opciones** (`product_options.cost_price_option` / `option_recipe_map`). Idealmente un mini
   "constructor" que sume base + opciones elegidas (food cost dinámico real).
4. **Estado de mapeo**: indicar "coste parcial / sin mapear" donde falte (ej. poke sin gramajes) en
   lugar de mostrar 0 € engañoso. Mostrar la receta GStock origen (de `product_recipe_map`).
5. **(Opcional, potente)** Panel para **revisar/editar el mapeo** `product_recipe_map` desde la app
   (en vez de por SQL): cambiar la receta de un plato, marcar `reviewed`, y disparar el refresco.
6. **Limpiar** el código muerto (variant_id / precio_manual / food_cost_peor_pct / badge "PVP Manual")
   salvo que se decida exponer el precio manual de verdad (usar `COALESCE(manual_price, price)`).

## 6. Recordatorios
- Food cost siempre sobre base imponible (sin IVA). GStock costes sin IVA; PVP con IVA.
- Pendiente upstream: gramajes del poke (CSV `docs/poke_gramajes_cocina.csv`), menús compuestos.
- Mantener el patrón de la app: `React.lazy`/Suspense, React Query, estilo claro, móvil (card view < md).
- Verificar en preview al terminar (nota: en local la anon key no carga datos reales).
