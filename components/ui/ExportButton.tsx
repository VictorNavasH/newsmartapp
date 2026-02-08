"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet } from "lucide-react"

interface ExportButtonProps {
  onExportCSV: () => void
  onExportPDF: () => void
  /** Tamaño del botón */
  size?: "sm" | "md"
  /** Clase adicional */
  className?: string
}

/**
 * Botón de exportación con dropdown para CSV y PDF.
 * Se usa en las vistas principales del dashboard para exportar datos.
 */
export function ExportButton({ onExportCSV, onExportPDF, size = "sm", className = "" }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (fn: () => void | Promise<void>) => {
    setExporting(true)
    try {
      await fn()
    } finally {
      setExporting(false)
      setOpen(false)
    }
  }

  const btnSize = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className={`${btnSize} inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50`}
      >
        <Download className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {exporting ? "Exportando..." : "Exportar"}
      </button>

      {open && (
        <>
          {/* Backdrop para cerrar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
            <button
              onClick={() => handleExport(onExportCSV)}
              className="w-full px-3 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleExport(onExportPDF)}
              className="w-full px-3 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-red-500" />
              Exportar PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
