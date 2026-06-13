# Sistema de Food Cost — NÜA Smart App

> Handoff técnico para Hermes y referencia del proyecto. Última actualización: 2026-06-13.

## 1. Contexto / problema resuelto

El food cost de la app dependía de `products.cost_price`, que estaba **desincronizado**
con las recetas reales de GStock (unos costes altos, otros bajos, algunos apuntando a
recetas viejas/desactivadas). No existía un puente fiable receta↔SKU y los nombres de
receta están duplicados (activas + viejas + de lote + de menú). Además, los platos
**dinámicos** (poke "crea tu", NÜA Smart Hummus, menús, vinos por copa) tienen su coste
real en las **opciones** que elige el cliente, que no se contaban.

Solución: dos puentes revisables (producto↔receta y opción↔fuente) + funciones
idempotentes que aplican el coste con **guarda de plausibilidad**, programadas a diario.

## 2. Objetos nuevos en la base de datos

### Vistas
| Vista | Qué da | Consumida por |
|---|---|---|
| `vw_food_cost_real` | Food cost ponderado por ventas (30 días), filas Comida/Bebida/Global. Numerador = escandallo base (deduplicado por SKU) + coste de opciones elegidas. | Dashboard (KPI Food Cost), Ajustes (break-even) |
| `vw_coste_ticket` | Coste real por ticket (`transaction_id`): coste_mercancia, food_cost_pct (sobre base imponible), margen_bruto, flags `coste_parcial` y `cuadra_factura`. Líneas `is_paid=true`. | Facturación (detalle + columna Food Cost) |

### Tablas puente (revisables)
| Tabla | Mapea | Notas |
|---|---|---|
| `product_recipe_map` | `product_sku` → receta GStock | `reviewed=true` = mapeo manual bloqueado. `product_cost_actual` guarda el coste viejo (backup). |
| `option_recipe_map` | `option_sku` → fuente de coste | `source_type`: `recipe` / `gstock_product` / `manual`. `portion` para productos por unidad de medida. |

### Funciones
| Función | Qué hace |
|---|---|
| `fn_refresh_food_costs()` | Refresca `products.cost_price` desde la receta mapeada (solo si plausible). Autodescubre recetas reactivadas por nombre exacto (≥0.95). Devuelve los cambios. |
| `fn_refresh_option_costs()` | Refresca `product_options.cost_price_option` desde la fuente de cada opción (receta o producto×ración), solo si plausible. |
| `fn_refresh_all_costs()` | Orquesta las dos. Es lo que ejecuta el cron. |

### Cron (pg_cron)
- `refresh-food-costs` → `30 6 * * *` (06:30 diario, justo tras el sync de recetas de GStock de las 06:00). Ejecuta `SELECT fn_refresh_all_costs();`.
- (GStock sync: full 04:00, recetas 06:00 — ver `gstock_sync_schedule`.)

## 3. Lógica clave (importante para no romper nada)

- **Guarda de plausibilidad**: un coste solo se aplica si es `> 0` y `<= PVP` del producto.
  Esto bloquea errores de cantidades en GStock (p. ej. una receta a 299€/465€/1861€) —
  nunca contaminan el food cost. Cuando GStock se corrige y re-sincroniza, entra solo.
- **`reviewed=true`** = mapeo decidido a mano. La función NO lo re-empareja; solo refresca
  su coste desde la fuente. Úsalo para fijar mapeos que el nombre no acierta.
- **Autodescubrimiento**: para productos sin receta, busca match EXACTO de receta activa
  (≥0.95). Así, al reactivar una receta en GStock (p. ej. Vegan Poke), se mapea sola.
- **Food cost siempre sobre base imponible (sin IVA).** En GStock los costes son SIN IVA;
  el PVP de venta al público es CON IVA.

## 4. Estado de los costes (2026-06-13)

**Aplicado y vivo (autocorrigiéndose a diario):**
- 41 platos base cuadrados con su receta GStock.
- 7 vinos por copa (Mencía 1,98 € … Afrutado/Rosé/Aromático 0,99 €).
- Opciones dinámicas: sabores de NÜA Smart Hummus (Garbanzo 1,00 €, Pimiento 2,12 €),
  helados kids (0,34 €), bebidas kids (Coca-Cola 0,97 €, Aquarius 0,95 €, Fanta/Sprite
  0,86 €…) y Cheesecake Kinder (1,14 €).

**Pendiente:**
- **Poke "crea tu"**: faltan los gramajes por ración (cocina). Ver `docs/poke_gramajes_cocina.csv`.
  Cargar como `option_recipe_map` con `source_type='gstock_product'` + `portion`.
- **Menús compuestos** (Burger/Poke/Crea-tu-Menú): decisión pendiente — ¿la receta del
  menú ya incluye los componentes o se suman? (riesgo de doble conteo).
- **Remolacha** (hummus): corregido en GStock; entra solo al re-sync (la guarda lo bloquea mientras esté alto).
- **Vino "Botella"**: la copa es la base; la botella suma un delta (pendiente).
- **Side kids** (patatas vs ensalada): base fijada a "con patatas"; delta ensalada ~0,52 € (pendiente, impacto mínimo).

## 5. Cómo consultar (SQL)

```sql
-- Food cost global / comida / bebida (últimos 30 días)
SELECT * FROM vw_food_cost_real;

-- Coste y food cost de un ticket concreto
SELECT * FROM vw_coste_ticket WHERE transaction_id = '<id>';

-- Coste medio por ticket y food cost global (30 días)
SELECT ROUND(AVG(coste_mercancia),2) coste_medio, ROUND(AVG(food_cost_pct),1) fc_medio
FROM vw_coste_ticket WHERE fecha::date >= (now() - interval '30 days')::date AND cuadra_factura;

-- Mapeo y coste de un plato
SELECT * FROM product_recipe_map WHERE product_sku = '<sku>';

-- Opciones mapeadas de un plato (coste dinámico)
SELECT * FROM option_recipe_map WHERE product_sku = '<sku>';

-- Forzar un refresco manual (idempotente)
SELECT fn_refresh_all_costs();
```

## 6. Reglas de negocio capturadas

- **Vinos**: coste = copa (precio botella ÷ copas). El cliente elige Copa (base) o Botella (+delta de precio).
- **NÜA Smart Hummus**: 1 sabor elegido → receta de RACIÓN INDIVIDUAL (`SMART HUMMUS DE *`).
  `Hummus Smart Mix` = degustación de los 3 → receta `HUMMUS SMART MIX` (raciones pequeñas, NO la individual).
- **Menús kids**: base con patatas/ensalada (comida); agua = 0 €, refresco = botella; el +0,50 € es PRECIO no coste; helado = `HELADO KIDS EDICION` (0,34 € medio).
- **Poke "crea tu" / NÜA Smart Hummus**: platos dinámicos, su coste vive en las opciones (aditivo: base + Σ opciones).
- **Taquitos / Baos (combinatorios)**: 1 producto + 2 grupos de opción (cantidad + sabor) que **interactúan** → el coste es `cantidad × coste-por-unidad-del-sabor`, **NO aditivo**. La capa `option_recipe_map` (aditiva) NO los cubre. GStock tiene el coste de TODAS las combinaciones (ej. `NÜA SMART TAQUITOS DE SOLOMILLO 3UD` = 7,56 €) y por unidad (`SMART TAQUITO DE *`: Pollo 0,57 € / Cochinita 1,18 € / Carrillera 1,26 € / Solomillo 2,57 €). Requiere lógica específica: resolver (cantidad+sabor)→receta de combo, o `nº × coste/ud del sabor`. Pendiente.

## 7. Qué debe respetar Hermes / el pipeline n8n

- `products.cost_price` y `product_options.cost_price_option` los gestionan ahora estas
  funciones. Si el sync GStock→Supabase los pisa, **re-ejecutar `fn_refresh_all_costs()`**
  o (mejor) hacer que el sync respete/use `product_recipe_map`.
- No introducir costes cableados en vistas. El coste sale siempre de GStock vía los puentes.
- El puente es la fuente de verdad del emparejado: editar ahí (con `reviewed=true`) en vez
  de pelear con el nombre.

## 8. Cambios en la app (frontend)

- **Facturación**: el detalle de cada factura muestra sección "Coste y margen" (coste de
  mercancía, food cost %, margen bruto) + barra de reparto; el listado tiene columna
  "Food Cost" coloreada. Datos de `vw_coste_ticket` (`fetchCosteTicket` / `fetchCostesTickets`).
- **Dashboard**: "Progreso vs Objetivos" usa food cost real (`vw_food_cost_real`), break-even
  real (margen de contribución) y ritmo (pace).

## 9. Scripts (repo)
`scripts/create_vw_food_cost_real.sql`, `scripts/create_vw_coste_ticket.sql`,
`scripts/create_product_recipe_map.sql`, `scripts/create_option_recipe_map.sql`.
