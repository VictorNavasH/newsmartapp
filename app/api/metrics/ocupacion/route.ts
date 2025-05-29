import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fecha_inicio = searchParams.get('fecha_inicio') ?? new Date().toISOString().slice(0,10)
  const fecha_fin = searchParams.get('fecha_fin') ?? new Date().toISOString().slice(0,10)
  const turno = searchParams.get('turno') ?? 'todos'
  const capacidad_max = parseInt(searchParams.get('capacidad_max') ?? '65')

  let query = supabase
    .from('formulario_reservas')
    .select('fecha,turno,reservas,comensales')
    .gte('fecha', fecha_inicio)
    .lte('fecha', fecha_fin)

  if (turno !== 'todos') query = query.eq('turno', turno)

  const { data: reservas, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total_reservas = reservas.reduce((sum, r) => sum + (r.reservas || 0), 0)
  const total_comensales = reservas.reduce((sum, r) => sum + (r.comensales || 0), 0)
  const dias = [...new Set(reservas.map(r => r.fecha))]
  const dias_count = dias.length || 1
  const ocupacion_total = dias_count > 0 ? +(total_comensales / (capacidad_max * dias_count) * 100).toFixed(2) : 0
  const capacidad_perdida = (capacidad_max * dias_count) - total_comensales

  const detalle_por_dia: Record<string, {comensales: number, reservas: number}> = {}
  reservas.forEach(r => {
    if (!detalle_por_dia[r.fecha])
      detalle_por_dia[r.fecha] = { comensales: 0, reservas: 0 }
    detalle_por_dia[r.fecha].comensales += r.comensales || 0
    detalle_por_dia[r.fecha].reservas += r.reservas || 0
  })
  const detalle_por_dia_list = Object.entries(detalle_por_dia).map(([fecha, val]) => ({
    fecha, ...val
  }))

  // TENDENCIA: compara con periodo anterior
  const daysDiff = (new Date(fecha_fin).getTime() - new Date(fecha_inicio).getTime())/(1000*3600*24) + 1
  const prev_inicio = new Date(new Date(fecha_inicio).getTime() - daysDiff*24*3600*1000).toISOString().slice(0,10)
  const prev_fin = new Date(new Date(fecha_inicio).getTime() - 1*24*3600*1000).toISOString().slice(0,10)
  let prev_query = supabase
    .from('formulario_reservas')
    .select('comensales')
    .gte('fecha', prev_inicio)
    .lte('fecha', prev_fin)
  if (turno !== 'todos') prev_query = prev_query.eq('turno', turno)
  const { data: prev_reservas } = await prev_query
  const prev_comensales = prev_reservas?.reduce((sum, r) => sum + (r.comensales || 0), 0) ?? 0
  const tendencia = prev_comensales ? +(((total_comensales - prev_comensales) / prev_comensales) * 100).toFixed(2) : null

  // Breakdown por turno
  const detalle_por_turno: Record<string, {comensales: number, reservas: number}> = {}
  reservas.forEach(r => {
    if (!detalle_por_turno[r.turno])
      detalle_por_turno[r.turno] = { comensales: 0, reservas: 0 }
    detalle_por_turno[r.turno].comensales += r.comensales || 0
    detalle_por_turno[r.turno].reservas += r.reservas || 0
  })

  return NextResponse.json({
    ocupacion_total,
    reservas_atendidas: total_reservas,
    comensales: total_comensales,
    capacidad_perdida,
    dias_count,
    detalle_por_dia: detalle_por_dia_list,
    detalle_por_turno,
    tendencia,
    periodo: {fecha_inicio, fecha_fin, turno, capacidad_max}
  })
}