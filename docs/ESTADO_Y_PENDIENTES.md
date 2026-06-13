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
- **Taquitos / Baos (combinatorios)**: coste = cantidad × coste-por-unidad-del-sabor (NO aditivo).
  GStock tiene las 12 combinaciones y el coste por unidad. Necesitan lógica específica
  (resolver cantidad+sabor → receta de combo), no sirve el `option_recipe_map` aditivo.
  **No requiere cambiar el TPV**: la cantidad y el sabor quedan registrados en `sales_item_options`
  por ticket, así que la combinación se resuelve en el cálculo de coste.
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
