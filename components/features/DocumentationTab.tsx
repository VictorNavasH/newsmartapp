"use client"

import { useState, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Download,
  History,
  Boxes,
  Layout,
  Server,
  Plug,
  Braces,
  FileText,
  Loader2,
} from "lucide-react"

// ============================================
// CONFIGURACIÓN DE DOCUMENTOS
// ============================================

interface DocFile {
  key: string
  label: string
  icon: React.ElementType
  description: string
}

const DOC_FILES: DocFile[] = [
  { key: "CHANGELOG", label: "Changelog", icon: History, description: "Historial de cambios" },
  { key: "ARCHITECTURE", label: "Arquitectura", icon: Boxes, description: "Estructura y patrones" },
  { key: "VIEWS", label: "Vistas", icon: Layout, description: "Páginas de la app" },
  { key: "SERVICES", label: "Servicios", icon: Server, description: "Funciones y datos" },
  { key: "INTEGRATIONS", label: "Integraciones", icon: Plug, description: "APIs externas" },
  { key: "TYPES", label: "Tipos", icon: Braces, description: "Definiciones TypeScript" },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DocumentationTab() {
  const [activeDoc, setActiveDoc] = useState("CHANGELOG")
  const [docs, setDocs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/docs?file=all")
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setDocs(data.docs)
    } catch (e) {
      console.error("[DocumentationTab] Error loading docs:", e)
      setError("No se pudieron cargar los documentos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  // Descarga individual
  const handleDownload = (key: string) => {
    const content = docs[key]
    if (!content) return
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${key}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Descarga de todos los archivos
  const handleDownloadAll = () => {
    DOC_FILES.forEach((doc) => {
      setTimeout(() => handleDownload(doc.key), 0)
    })
  }

  const activeDocInfo = DOC_FILES.find((d) => d.key === activeDoc)

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#02b1c4] animate-spin" />
          <p className="text-slate-400 text-sm">Cargando documentación...</p>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <FileText className="w-12 h-12 text-slate-300" />
          <p className="text-slate-500 font-medium">{error}</p>
          <button
            onClick={loadDocs}
            className="px-4 py-2 rounded-xl bg-[#02b1c4] text-white text-sm font-medium hover:bg-[#02a0b2] transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Sub-navegación de documentos ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {DOC_FILES.map((doc) => {
            const Icon = doc.icon
            const isActive = activeDoc === doc.key
            return (
              <button
                key={doc.key}
                onClick={() => setActiveDoc(doc.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#227c9d] text-white shadow-md shadow-cyan-200"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {doc.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Header del documento activo + acciones ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeDocInfo && (
            <>
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <activeDocInfo.icon className="w-5 h-5 text-[#227c9d]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#364f6b]">{activeDocInfo.label}</h3>
                <p className="text-xs text-slate-400">{activeDocInfo.description}</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(activeDoc)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#227c9d] text-white text-sm font-medium hover:bg-[#1a6478] transition-all"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Todo
          </button>
        </div>
      </div>

      {/* ── Contenido Markdown ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 overflow-x-auto">
        <div
          className="prose prose-slate max-w-none
            prose-headings:text-[#364f6b] prose-headings:font-bold
            prose-h1:text-2xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-3 prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6
            prose-a:text-[#02b1c4] prose-a:no-underline hover:prose-a:underline
            prose-code:text-[#227c9d] prose-code:bg-sky-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-inner
            prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-lg
            prose-th:bg-slate-50 prose-th:text-[#364f6b] prose-th:font-semibold prose-th:text-left prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-slate-200
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-slate-100
            prose-tr:hover:bg-slate-50/50
            prose-strong:text-[#364f6b]
            prose-blockquote:border-l-[#02b1c4] prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-li:marker:text-[#02b1c4]
            prose-hr:border-slate-200"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {docs[activeDoc] || ""}
          </ReactMarkdown>
        </div>
      </div>

      {/* ── Footer con info ── */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <p>
          Documentación generada desde los archivos <code className="bg-slate-100 px-1 rounded">docs/</code> del repositorio
        </p>
        <p>{Object.keys(docs).length} documentos disponibles</p>
      </div>
    </div>
  )
}
