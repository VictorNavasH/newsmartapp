/**
 * Calcula el periodo anterior para comparación, basado en la duración del rango actual.
 *
 * - 1-7 días: mismos días de la semana anterior (retrocede 7 días)
 * - 8-31 días: mismo rango del mes anterior
 * - 32+ días: periodo inmediatamente anterior de igual duración
 */
export function calculatePreviousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const oneDayMs = 24 * 60 * 60 * 1000
  const daysDiff = Math.round((to.getTime() - from.getTime()) / oneDayMs) + 1

  let prevFrom: Date
  let prevTo: Date

  if (daysDiff <= 7) {
    prevFrom = new Date(from)
    prevFrom.setDate(prevFrom.getDate() - 7)
    prevTo = new Date(to)
    prevTo.setDate(prevTo.getDate() - 7)
  } else if (daysDiff <= 31) {
    prevFrom = new Date(from)
    prevFrom.setMonth(prevFrom.getMonth() - 1)
    prevTo = new Date(to)
    prevTo.setMonth(prevTo.getMonth() - 1)

    const maxDayPrevMonth = new Date(prevTo.getFullYear(), prevTo.getMonth() + 1, 0).getDate()
    if (prevTo.getDate() > maxDayPrevMonth) {
      prevTo.setDate(maxDayPrevMonth)
    }
  } else {
    prevTo = new Date(from)
    prevTo.setDate(prevTo.getDate() - 1)
    prevFrom = new Date(prevTo)
    prevFrom.setDate(prevFrom.getDate() - (daysDiff - 1))
  }

  return { from: prevFrom, to: prevTo }
}
