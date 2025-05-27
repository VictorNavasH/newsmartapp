"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface ConfiguracionBase {
  dias_apertura: {
    [key: string]: {
      medio_dia: boolean
      noche: boolean
    }
  }
  turnos_servicios: {
    [key: string]: {
      medio_dia: number
      noche: number
    }
  }
  ocupacion_maxima_turno: number
}

export interface EstructuraCostes {
  id: number
  nombre: string
  pct_min: number
  pct_max: number
}

export async function getConfiguracionBase(): Promise<{
  success: boolean
  data?: ConfiguracionBase
  error?: string
}> {
  try {
    const { data, error } = await supabase.from("configuracion_base").select("*").limit(1).single()

    if (error || !data) {
      // Retornar configuración por defecto
      const defaultConfig: ConfiguracionBase = {
        dias_apertura: {
          lunes: { medio_dia: true, noche: true },
          martes: { medio_dia: true, noche: true },
          miercoles: { medio_dia: true, noche: true },
          jueves: { medio_dia: true, noche: true },
          viernes: { medio_dia: true, noche: true },
          sabado: { medio_dia: true, noche: true },
          domingo: { medio_dia: false, noche: true },
        },
        turnos_servicios: {
          lunes: { medio_dia: 2, noche: 2 },
          martes: { medio_dia: 2, noche: 2 },
          miercoles: { medio_dia: 2, noche: 2 },
          jueves: { medio_dia: 2, noche: 2 },
          viernes: { medio_dia: 2, noche: 3 },
          sabado: { medio_dia: 2, noche: 3 },
          domingo: { medio_dia: 0, noche: 2 },
        },
        ocupacion_maxima_turno: 70,
      }
      return { success: true, data: defaultConfig }
    }

    return { success: true, data: data as ConfiguracionBase }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateConfiguracionBase(config: ConfiguracionBase): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.from("configuracion_base").upsert(config)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getEstructuraCostes(): Promise<{
  success: boolean
  data?: EstructuraCostes[]
  error?: string
}> {
  try {
    // Intentamos obtener los datos de la tabla
    const { data, error } = await supabase.from("estructura_costes_ideal").select("*").order("id")

    if (error) {
      console.log("⚠️ Tabla estructura_costes_ideal no existe, usando datos por defecto")

      // Si la tabla no existe, retornamos estructura por defecto basada en tu imagen
      const defaultCostes: EstructuraCostes[] = [
        { id: 1, nombre: "Comida & Bebida", pct_min: 28.0, pct_max: 32.0 },
        { id: 2, nombre: "Personal", pct_min: 28.0, pct_max: 35.0 },
        { id: 3, nombre: "Instalaciones", pct_min: 9.0, pct_max: 15.0 },
        { id: 4, nombre: "Operativos", pct_min: 3.0, pct_max: 6.0 },
        { id: 5, nombre: "Marketing & Ventas", pct_min: 2.0, pct_max: 5.0 },
        { id: 6, nombre: "Administrativo & Finanzas", pct_min: 4.0, pct_max: 8.0 },
        { id: 7, nombre: "Beneficio antes de impuestos", pct_min: 8.0, pct_max: 15.0 },
      ]
      return { success: true, data: defaultCostes }
    }

    // Si no hay datos, retornamos estructura por defecto
    if (!data || data.length === 0) {
      const defaultCostes: EstructuraCostes[] = [
        { id: 1, nombre: "Comida & Bebida", pct_min: 28.0, pct_max: 32.0 },
        { id: 2, nombre: "Personal", pct_min: 28.0, pct_max: 35.0 },
        { id: 3, nombre: "Instalaciones", pct_min: 9.0, pct_max: 15.0 },
        { id: 4, nombre: "Operativos", pct_min: 3.0, pct_max: 6.0 },
        { id: 5, nombre: "Marketing & Ventas", pct_min: 2.0, pct_max: 5.0 },
        { id: 6, nombre: "Administrativo & Finanzas", pct_min: 4.0, pct_max: 8.0 },
        { id: 7, nombre: "Beneficio antes de impuestos", pct_min: 8.0, pct_max: 15.0 },
      ]
      return { success: true, data: defaultCostes }
    }

    return { success: true, data: data as EstructuraCostes[] }
  } catch (error: any) {
    console.log("⚠️ Error al acceder a estructura_costes_ideal, usando datos por defecto")

    // En caso de cualquier error, retornamos datos por defecto
    const defaultCostes: EstructuraCostes[] = [
      { id: 1, nombre: "Comida & Bebida", pct_min: 28.0, pct_max: 32.0 },
      { id: 2, nombre: "Personal", pct_min: 28.0, pct_max: 35.0 },
      { id: 3, nombre: "Instalaciones", pct_min: 9.0, pct_max: 15.0 },
      { id: 4, nombre: "Operativos", pct_min: 3.0, pct_max: 6.0 },
      { id: 5, nombre: "Marketing & Ventas", pct_min: 2.0, pct_max: 5.0 },
      { id: 6, nombre: "Administrativo & Finanzas", pct_min: 4.0, pct_max: 8.0 },
      { id: 7, nombre: "Beneficio antes de impuestos", pct_min: 8.0, pct_max: 15.0 },
    ]
    return { success: true, data: defaultCostes }
  }
}

export async function updateEstructuraCostes(costes: EstructuraCostes[]): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Intentamos crear la tabla si no existe
    await createEstructuraCostesTable()

    for (const coste of costes) {
      const { error } = await supabase.from("estructura_costes_ideal").upsert({
        id: coste.id,
        nombre: coste.nombre,
        pct_min: coste.pct_min,
        pct_max: coste.pct_max,
      })

      if (error) {
        console.error("Error al actualizar coste:", coste, error)
        throw error
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("💥 Error al guardar:", error)
    return { success: false, error: error.message }
  }
}

async function createEstructuraCostesTable() {
  try {
    // Intentamos crear la tabla
    const { error } = await supabase.rpc("create_estructura_costes_table", {})

    if (error) {
      console.log("Tabla ya existe o no se pudo crear:", error.message)
    }
  } catch (error) {
    console.log("No se pudo crear la tabla automáticamente")
  }
}
