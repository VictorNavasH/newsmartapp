"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatCurrency, formatDateFromString } from "@/lib/utils"
import { AlertCircle, Clock, ExternalLink } from "lucide-react"
import type { CompraAlbaranDisponible } from "@/types"
import { differenceInDays, parseISO } from "date-fns"

interface UnbilledAlbaranesDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    albaranes: CompraAlbaranDisponible[]
    loading: boolean
}

export function UnbilledAlbaranesDrawer({
    open,
    onOpenChange,
    albaranes,
    loading,
}: UnbilledAlbaranesDrawerProps) {
    // Ordenar por antigüedad (más viejos primero)
    const sortedAlbaranes = [...albaranes].sort((a, b) => {
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    })

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-slate-100">
                    <SheetTitle className="flex items-center gap-2 text-[#364f6b]">
                        <AlertCircle className="h-5 w-5 text-[#ffcb77]" />
                        Albaranes sin Facturar
                    </SheetTitle>
                    <p className="text-sm text-slate-500">
                        {albaranes.length} albaranes recepcionados pendientes de vincular a una factura.
                    </p>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Cargando albaranes...</div>
                    ) : albaranes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">No hay albaranes pendientes.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {sortedAlbaranes.map((albaran) => {
                                const days = differenceInDays(new Date(), parseISO(albaran.fecha))
                                const isCritical = days > 30

                                return (
                                    <div key={albaran.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="font-bold text-[#364f6b] flex items-center gap-2">
                                                    {albaran.numero_albaran}
                                                    <span className="text-xs font-normal text-slate-400">#{albaran.id.slice(0, 8)}</span>
                                                </h4>
                                                <p className="text-sm text-slate-600 font-medium">{albaran.proveedor}</p>
                                            </div>
                                            <span className="font-bold text-[#364f6b]">{formatCurrency(albaran.importe_total)}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs mt-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-slate-500">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateFromString(albaran.fecha)}
                                                </div>
                                                <div className={`flex items-center gap-1 font-bold ${isCritical ? "text-[#fe6d73]" : "text-slate-500"}`}>
                                                    {days} días sin factura
                                                </div>
                                            </div>
                                            <button className="text-[#02b1c4] hover:underline flex items-center gap-1">
                                                Ver detalle <ExternalLink className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
