"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface FiltrosOcupacion {
  fechaInicio: string
  fechaFin: string
  turno: "todos" | "medio_dia" | "noche"
  diaSemana: "todos" | "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"
}

export interface ReservaData {
  fecha: string
  dia_semana: string
  turno: string
  reservas_atendidas: number
  ocupacion_maxima: number
  ocupacion_objetivo: number
  porcentaje_ocupacion: number
  diferencia_objetivo: number
}

export interface KPIOcupacion {
  tasaOcupacionPromedio: number
  reservasAtendidasTotales: number
  cumplimientoObjetivo: number
  tendenciaOcupacion: number
  capacidadNoUtilizada: number
}

export interface OcupacionPorDia {
  dia: string
  ocupacionReal: number
  ocupacionObjetivo: number
}

export interface EvolucionOcupacion {
  fecha: string
  ocupacion: number
}

export interface OcupacionPorTurno {
  turno: string
  ocupacion: number
}

// OBTENER DATOS REALES DE SUPABASE
export async function getReservasData(filtros: FiltrosOcupacion): Promise<ReservaData[]> {
  try {
    console.log("🔍 Consultando tabla formulario_reservas con filtros:", filtros)

    let query = supabase
      .from("formulario_reservas")
      .select("*")
      .gte("fecha", filtros.fechaInicio)
      .lte("fecha", filtros.fechaFin)
      .order("fecha", { ascending: true })

    if (filtros.turno !== "todos") {
      query = query.eq("turno", filtros.turno)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error en consulta Supabase:", error)
      throw error
    }

    console.log("✅ Datos obtenidos de formulario_reservas:", data?.length || 0, "registros")

    // OBTENER CONFIGURACIÓN REAL DE DATOS BASE
    const { data: configData } = await supabase.from("configuracion_base").select("*").single()
    const ocupacionMaxima = configData?.ocupacion_maxima_turno || 70
    const ocupacionObjetivo = configData?.ocupacion_objetivo || 80

    console.log("⚙️ Configuración:", { ocupacionMaxima, ocupacionObjetivo })

    // PROCESAR DATOS REALES
    return (data || []).map((reserva: any) => {
      const fecha = new Date(reserva.fecha)
      const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" })
      const reservasAtendidas = reserva.reservas_atendidas || reserva.ocupacion || reserva.pax || 0
      const porcentajeOcupacion = (reservasAtendidas / ocupacionMaxima) * 100
      const diferenciaObjetivo = porcentajeOcupacion - ocupacionObjetivo

      return {
        fecha: reserva.fecha,
        dia_semana: diaSemana,
        turno: reserva.turno || "noche",
        reservas_atendidas: reservasAtendidas,
        ocupacion_maxima: ocupacionMaxima,
        ocupacion_objetivo: ocupacionObjetivo,
        porcentaje_ocupacion: Math.round(porcentajeOcupacion * 100) / 100,
        diferencia_objetivo: Math.round(diferenciaObjetivo * 100) / 100,
      }
    })
  } catch (error) {
    console.error("❌ Error al obtener datos de reservas:", error)
    return []
  }
}

// CALCULAR KPIS CON REGLAS CORRECTAS
export async function getKPIOcupacion(filtros: FiltrosOcupacion): Promise<KPIOcupacion> {
  try {
    const reservasData = await getReservasData(filtros)

    if (reservasData.length === 0) {
      console.log("⚠️ No hay datos para calcular KPIs")
      return {
        tasaOcupacionPromedio: 0,
        reservasAtendidasTotales: 0,
        cumplimientoObjetivo: 0,
        tendenciaOcupacion: 0,
        capacidadNoUtilizada: 0,
      }
    }

    // CÁLCULOS EXACTOS SEGÚN TU ESPECIFICACIÓN
    const totalReservas = reservasData.reduce((sum, item) => sum + item.reservas_atendidas, 0)
    const totalCapacidadMaxima = reservasData.reduce((sum, item) => sum + item.ocupacion_maxima, 0)
    const tasaOcupacionPromedio = (totalReservas / totalCapacidadMaxima) * 100

    const ocupacionObjetivoPromedio = reservasData[0]?.ocupacion_objetivo || 80
    const cumplimientoObjetivo = (tasaOcupacionPromedio / ocupacionObjetivoPromedio) * 100
    const capacidadNoUtilizada = totalCapacidadMaxima - totalReservas

    // CALCULAR TENDENCIA VS PERÍODO ANTERIOR
    const diasPeriodo = Math.ceil(
      (new Date(filtros.fechaFin).getTime() - new Date(filtros.fechaInicio).getTime()) / (1000 * 60 * 60 * 24),
    )
    const fechaInicioAnterior = new Date(new Date(filtros.fechaInicio).getTime() - diasPeriodo * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
    const fechaFinAnterior = new Date(new Date(filtros.fechaInicio).getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const reservasAnteriores = await getReservasData({
      ...filtros,
      fechaInicio: fechaInicioAnterior,
      fechaFin: fechaFinAnterior,
    })

    let tendenciaOcupacion = 0
    if (reservasAnteriores.length > 0) {
      const totalReservasAnteriores = reservasAnteriores.reduce((sum, item) => sum + item.reservas_atendidas, 0)
      const totalCapacidadAnterior = reservasAnteriores.reduce((sum, item) => sum + item.ocupacion_maxima, 0)
      const tasaAnterior = (totalReservasAnteriores / totalCapacidadAnterior) * 100
      tendenciaOcupacion = tasaOcupacionPromedio - tasaAnterior
    }

    console.log("📊 KPIs calculados:", {
      tasaOcupacionPromedio,
      reservasAtendidasTotales: totalReservas,
      cumplimientoObjetivo,
      tendenciaOcupacion,
      capacidadNoUtilizada,
    })

    return {
      tasaOcupacionPromedio: Math.round(tasaOcupacionPromedio * 100) / 100,
      reservasAtendidasTotales: totalReservas,
      cumplimientoObjetivo: Math.round(cumplimientoObjetivo * 100) / 100,
      tendenciaOcupacion: Math.round(tendenciaOcupacion * 100) / 100,
      capacidadNoUtilizada,
    }
  } catch (error) {
    console.error("❌ Error al calcular KPIs:", error)
    return {
      tasaOcupacionPromedio: 0,
      reservasAtendidasTotales: 0,
      cumplimientoObjetivo: 0,
      tendenciaOcupacion: 0,
      capacidadNoUtilizada: 0,
    }
  }
}

// OCUPACIÓN POR DÍA DE LA SEMANA
export async function getOcupacionPorDia(filtros: FiltrosOcupacion): Promise<OcupacionPorDia[]> {
  try {
    const reservasData = await getReservasData(filtros)

    const diasSemana = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

    return diasSemana.map((dia) => {
      const reservasDia = reservasData.filter((r) => r.dia_semana.toLowerCase() === dia)

      if (reservasDia.length === 0) {
        return {
          dia: dia.charAt(0).toUpperCase() + dia.slice(1),
          ocupacionReal: 0,
          ocupacionObjetivo: 80,
        }
      }

      const totalReservas = reservasDia.reduce((sum, item) => sum + item.reservas_atendidas, 0)
      const totalCapacidad = reservasDia.reduce((sum, item) => sum + item.ocupacion_maxima, 0)
      const ocupacionReal = (totalReservas / totalCapacidad) * 100
      const ocupacionObjetivo = reservasDia[0]?.ocupacion_objetivo || 80

      return {
        dia: dia.charAt(0).toUpperCase() + dia.slice(1),
        ocupacionReal: Math.round(ocupacionReal * 100) / 100,
        ocupacionObjetivo,
      }
    })
  } catch (error) {
    console.error("❌ Error al calcular ocupación por día:", error)
    return []
  }
}

// EVOLUCIÓN TEMPORAL
export async function getEvolucionOcupacion(filtros: FiltrosOcupacion): Promise<EvolucionOcupacion[]> {
  try {
    const reservasData = await getReservasData(filtros)

    // Agrupar por fecha
    const ocupacionPorFecha = reservasData.reduce((acc: any, reserva) => {
      const fecha = reserva.fecha
      if (!acc[fecha]) {
        acc[fecha] = { totalReservas: 0, totalCapacidad: 0 }
      }
      acc[fecha].totalReservas += reserva.reservas_atendidas
      acc[fecha].totalCapacidad += reserva.ocupacion_maxima
      return acc
    }, {})

    return Object.entries(ocupacionPorFecha)
      .map(([fecha, data]: [string, any]) => ({
        fecha,
        ocupacion: Math.round((data.totalReservas / data.totalCapacidad) * 10000) / 100,
      }))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  } catch (error) {
    console.error("❌ Error al calcular evolución:", error)
    return []
  }
}

// OCUPACIÓN POR TURNO
export async function getOcupacionPorTurno(filtros: FiltrosOcupacion): Promise<OcupacionPorTurno[]> {
  try {
    const reservasData = await getReservasData(filtros)

    const turnos = ["medio_dia", "noche"]

    return turnos.map((turno) => {
      const reservasTurno = reservasData.filter((r) => r.turno === turno)

      if (reservasTurno.length === 0) {
        return {
          turno: turno === "medio_dia" ? "Mediodía" : "Noche",
          ocupacion: 0,
        }
      }

      const totalReservas = reservasTurno.reduce((sum, item) => sum + item.reservas_atendidas, 0)
      const totalCapacidad = reservasTurno.reduce((sum, item) => sum + item.ocupacion_maxima, 0)
      const ocupacion = (totalReservas / totalCapacidad) * 100

      return {
        turno: turno === "medio_dia" ? "Mediodía" : "Noche",
        ocupacion: Math.round(ocupacion * 100) / 100,
      }
    })
  } catch (error) {
    console.error("❌ Error al calcular ocupación por turno:", error)
    return []
  }
}
