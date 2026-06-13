# Estado y pendientes — Food Cost & Objetivos

> Punto de partida para la próxima sesión. Última actualización: 2026-06-13.

## A) Dashboard → tarjeta "Progreso vs Objetivos" (cómo quedó configurada)

La tarjeta se reorganizó en **2 bloques**, cada barra etiquetada con su periodo, y con
marca vertical de **ritmo (pace)** en las métricas acumuladas del mes:

**Bloque 1 — "Este mes" (con ritmo)**
- **Ingresos del mes**: acumulado del mes vs objetivo mensual. La marca indica lo que
  deberías llevar a estas alturas (ya no sale rojo falso a principio de mes).
- **Punto de Equilibrio**: acumulado del mes vs **break-even real** (€). Con ritmo.
- **Coste Laboral**: % del mes sobre ventas vs objetivo (menor = mejor).

**Bloque 2 — "Tendencia · últimos 30 días"**
- **Food Cost**: real ponderado por ventas (`vw_food_cost_real`) vs objetivo (menor mejor).
- **Ticket Comensal**: gasto medio/cliente 30d vs objetivo.
- **Facturación Semanal**: semana en curso vs objetivo (break-even ÷ semanas), con ritmo de semana.

Al pie: desglose del cálculo del punto de equilibrio.

### Punto de Equilibrio REAL (fórmula)
```
Punto de equilibrio (€) = Costes fijos mensuales ÷ Margen de contribución
Margen de contribución % = 100 − (Food cost real % + Otros costes variables %)
```
Funciones en `lib/kpiTargets.ts`: `calculateBreakEven()`, `calculateProgress(..., paceFraction)`, `monthPaceFraction()`.
Config en Ajustes → Objetivos KPI (con preview en vivo del break-even).

## B) PENDIENTES

### 🔴 Acción tuya (clave, desbloquea el break-even real)
- **Configurar en Ajustes → Objetivos KPI tus números reales**:
  - `Costes fijos mensuales` (alquiler, personal fijo, suministros base, seguros, préstamos…).
    Ahora usa el valor por defecto **33.500 €**.
  - `Otros costes variables %` (comisiones TPV/delivery, consumibles). Por defecto **3 %**.
  - Mientras no se ajusten, el break-even mostrado es aproximado (con defaults ≈ 43.700 €/mes).

### 🍽️ Food cost (capa de opciones)
- **Gramajes del poke** → CSV `docs/poke_gramajes_cocina.csv` para cocina. Al volver, se cargan
  en `option_recipe_map` (`gstock_product` + `portion`).
- **Menús compuestos** (Burger/Poke/Crea-tu-Menú): decisión pendiente — ¿la receta del menú
  ya incluye los componentes o se suman? (riesgo de doble conteo).
- **Taquitos / Baos (combinatorios)** (✅ pestaña RESUELTA): cada combo (cantidad + sabor, identificado
  por sus 2 opciones `-C-{2T/3T/4T}` + `-C-{P/CP/CD/S}`) se resuelve a su **receta GStock real** vía la
  vista `vw_taquitos_baos_combos`; la pestaña sobrescribe coste y receta por variante (antes: CTE cableado
  que infravaloraba y referenciaba siempre "POLLO"). Ver `scripts/create_vw_taquitos_baos_combos.sql`.
  - PENDIENTE (mayor): **coste real por ticket** usando esas 2 opciones de `sales_item_options`
    (`vw_food_cost_real`/`vw_coste_ticket` aún usan el combo más barato por SKU vía `DISTINCT ON`).
  - PENDIENTE: **desajuste de PVP base** — `products.price` dice NST 11,50 / NSB 16,50, pero `vw_food_cost`
    cablea 10,90 / 17 (y el TPV mostraba 10,5). Decidir la fuente correcta del PVP.
  - NOTA del usuario: los **taquitos de solomillo ya no se sirven** (siguen `is_active` en TPV) — gestionar visibilidad.
- **Visibilidad de platos fuera de carta** (✅ RESUELTO — opción b): la pestaña Food Cost oculta por
  defecto los platos **sin ventas en 60 días** vía la vista `vw_productos_vendidos_60d` (campo
  `soldRecently`), con toggle "Ver también sin ventas" + chip "Sin ventas 60d" + contador de ocultos.
  Se auto-mantiene (un plato reaparece al volver a venderse). Validado: hoy oculta 7 (Burrata, Croquets
  Kids, Vegan Poke, Cervezas Artesanales, Combinado Vodka, NÜA Smart Beer, NÜA Smart Cava). Nota: el
  filtro por ventas corrige las suposiciones — Beef Ribs y Pulpo gallego SÍ venden, así que se quedan.
  Ver `scripts/create_vw_productos_vendidos_60d.sql`.
- **Vino "Botella"**: copa hecha; falta el delta de botella.
- **Side kids** (patatas vs ensalada): base fijada a "con patatas"; delta ensalada ~0,52 € (impacto mínimo).
- **Remolacha (hummus)**: corregida en GStock; entra sola al re-sync (guarda de plausibilidad la bloquea mientras esté alta).

### 🛠️ Mejoras futuras
- Rehacer la **pestaña de food cost de Smart Food** (con `docs/FOOD_COST_SYSTEM.md` como base).
- Food cost **real de compras consumidas** + desviación vs teórico (mermas) — siguiente nivel.
- Ritmo (pace) ponderado por **día de semana** (hoy es por días naturales).
- Limpieza menor de código muerto en Smart Food (variant_id / precio_manual / badge "PVP Manual").

## C) Lo que está VIVO y autocorrigiéndose
- Costes base de 41 platos + 7 vinos cuadrados con GStock.
- Opciones: sabores hummus, helados/bebidas/cheesecake kids.
- Coste y food cost por ticket en Facturación; food cost real + break-even + ritmo en Dashboard.
- Cron `refresh-food-costs` diario 06:30 (refresca todo desde GStock con guarda de plausibilidad).

Detalle técnico completo: `docs/FOOD_COST_SYSTEM.md`.
