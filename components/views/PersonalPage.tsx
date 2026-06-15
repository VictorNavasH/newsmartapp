"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/layout/PageHeader"
import { MenuBar } from "@/components/ui/menu-bar"
import {
  fetchWorkers,
  fetchTurnos,
  fetchFichajesDia,
  fetchAusenciasDia,
  fetchAusencias,
  fetchResumenSemanas,
  fetchPuntualidad,
  fetchNocturnas,
} from "@/lib/personalService"
import type {
  Worker,
  ScheduledShift,
  TimeActivity,
  AusenciaDia,
  Ausencia,
  HorasExtraSemana,
  Puntualidad,
  HorasNocturnas,
} from "@/types"
import { PERSONAL_MENU_ITEMS, type PersonalTab } from "./personal/constants"
import { TrabajadoresTab } from "./personal/TrabajadoresTab"
import { ResumenTab } from "./personal/ResumenTab"
import { PuntualidadTab } from "./personal/PuntualidadTab"
import { AusenciasTab } from "./personal/AusenciasTab"
import { NocturnasTab } from "./personal/NocturnasTab"

// Fecha de hoy en hora local Madrid (YYYY-MM-DD)
const hoyMadrid = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })
const diaMasN = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" })

export default function PersonalPage() {
  const [activeTab, setActiveTab] = useState<PersonalTab>("Trabajadores")
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()))
  const [showArchived, setShowArchived] = useState(false)

  // Datos "tiempo real" (Trabajadores) — no dependen del mes
  const [loadingHoy, setLoadingHoy] = useState(true)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [turnos, setTurnos] = useState<ScheduledShift[]>([])
  const [fichajesHoy, setFichajesHoy] = useState<TimeActivity[]>([])
  const [ausenciasProximos, setAusenciasProximos] = useState<AusenciaDia[]>([])

  // Datos del mes seleccionado
  const [loadingMes, setLoadingMes] = useState(true)
  const [semanas, setSemanas] = useState<HorasExtraSemana[]>([])
  const [puntualidad, setPuntualidad] = useState<Puntualidad[]>([])
  const [nocturnas, setNocturnas] = useState<HorasNocturnas[]>([])
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [ausenciasDiaMes, setAusenciasDiaMes] = useState<AusenciaDia[]>([])

  const hoy = hoyMadrid()
  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es })
  const esMesActual = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM")

  // Carga de datos "hoy / próximos 7 días" (una vez)
  useEffect(() => {
    let active = true
    const load = async () => {
      setLoadingHoy(true)
      const desde = hoy
      const hasta = diaMasN(6)
      const [w, t, f, a] = await Promise.all([
        fetchWorkers(),
        fetchTurnos(desde, hasta),
        fetchFichajesDia(desde),
        fetchAusenciasDia(desde, hasta),
      ])
      if (!active) return
      setWorkers(w)
      setTurnos(t)
      setFichajesHoy(f)
      setAusenciasProximos(a)
      setLoadingHoy(false)
    }
    load()
    return () => {
      active = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Carga de datos del mes (al montar y al cambiar de mes)
  const loadMes = useCallback(async (month: Date) => {
    setLoadingMes(true)
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd")
    const [s, p, n, au, ad] = await Promise.all([
      fetchResumenSemanas(monthStart, monthEnd),
      fetchPuntualidad(monthStart, monthEnd),
      fetchNocturnas(monthStart, monthEnd),
      fetchAusencias(monthStart, monthEnd),
      fetchAusenciasDia(monthStart, monthEnd),
    ])
    setSemanas(s)
    setPuntualidad(p)
    setNocturnas(n)
    setAusencias(au)
    setAusenciasDiaMes(ad)
    setLoadingMes(false)
  }, [])

  useEffect(() => {
    loadMes(selectedMonth)
  }, [selectedMonth, loadMes])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Users}
        title="Personal"
        subtitle="Plantilla, horas, puntualidad y ausencias"
        actions={
          activeTab !== "Trabajadores" ? (
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-0.5">
              <button
                onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-[#364f6b] capitalize min-w-[120px] text-center">
                {monthLabel}
              </span>
              <button
                onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
                disabled={esMesActual}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex justify-center overflow-x-auto">
        <MenuBar
          items={PERSONAL_MENU_ITEMS as any}
          activeItem={activeTab}
          onItemClick={(label) => setActiveTab(label as PersonalTab)}
        />
      </div>

      {activeTab === "Trabajadores" && (
        <TrabajadoresTab
          loading={loadingHoy}
          hoy={hoy}
          workers={workers}
          turnos={turnos}
          fichajesHoy={fichajesHoy}
          ausenciasDia={ausenciasProximos}
          showArchived={showArchived}
          onToggleArchived={setShowArchived}
        />
      )}

      {activeTab === "Resumen" && (
        <ResumenTab loading={loadingMes} semanas={semanas} monthLabel={monthLabel} />
      )}

      {activeTab === "Puntualidad" && (
        <PuntualidadTab loading={loadingMes} rows={puntualidad} monthLabel={monthLabel} />
      )}

      {activeTab === "Ausencias" && (
        <AusenciasTab
          loading={loadingMes}
          ausencias={ausencias}
          ausenciasDia={ausenciasDiaMes}
          monthLabel={monthLabel}
        />
      )}

      {activeTab === "Nocturnas" && (
        <NocturnasTab loading={loadingMes} rows={nocturnas} monthLabel={monthLabel} />
      )}
    </div>
  )
}
