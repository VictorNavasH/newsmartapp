export const ASSISTANT_CHIPS: Record<string, string[]> = {
  "/": ["¿Cómo van las ventas hoy?", "Compara con ayer", "¿Cuál es el ticket medio?", "¿Cómo va el mes?"],
  "/reservations": [
    "¿Cuántas reservas hay hoy?",
    "Ocupación de la semana",
    "¿Cuál es el día más fuerte?",
    "Compara con la semana pasada",
  ],
  "/revenue": ["¿Cómo van los ingresos?", "Desglose por turno", "Tendencia del mes", "Compara con mes anterior"],
  "/expenses": [
    "¿Cuáles son los mayores gastos?",
    "Gastos por categoría",
    "¿Cómo va el ratio de gastos?",
    "Gastos pendientes de pago",
  ],
  "/products": [
    "¿Cuál es el producto más vendido?",
    "Top 5 productos del mes",
    "¿Qué categoría vende más?",
    "Productos con bajo rendimiento",
  ],
  "/operations": [
    "¿Cómo fue la operativa hoy?",
    "Tiempo medio de servicio",
    "¿Cuántos turnos hubo?",
    "Eficiencia por turno",
  ],
  "/forecasting": ["Previsión para mañana", "¿Qué esperar esta semana?", "Tendencia de ventas", "Predicción del mes"],
  "/treasury": ["¿Cuál es el saldo actual?", "Flujo de caja del mes", "Pagos pendientes", "Previsión de tesorería"],
}
