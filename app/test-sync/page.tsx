"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, Download, CheckCircle, AlertCircle } from "lucide-react"
import {
  obtenerTablas,
  obtenerTokenReal,
  obtenerBancosReales,
  sincronizarBancosReal,
} from "@/app/actions/test-sync-real"

export default function TestSyncPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (result: any) => {
    setResults((prev) => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }])
  }

  const testTablas = async () => {
    setLoading(true)
    const result = await obtenerTablas()
    addResult({ type: "tablas", ...result })
    setLoading(false)
  }

  const testToken = async () => {
    setLoading(true)
    const result = await obtenerTokenReal()
    addResult({ type: "token", ...result })
    setLoading(false)
  }

  const testBancos = async () => {
    setLoading(true)
    const result = await obtenerBancosReales()
    addResult({ type: "bancos", ...result })
    setLoading(false)
  }

  const testSincronizar = async () => {
    setLoading(true)
    const result = await sincronizarBancosReal()
    addResult({ type: "sincronizar", ...result })
    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-nua-title">Test Sincronización GoCardless</h1>
        <p className="text-sm text-nua-subtitle">Prueba paso a paso la sincronización con GoCardless</p>
      </div>

      {/* Botones de Prueba */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button onClick={testTablas} disabled={loading} className="h-16 flex flex-col">
          <Database className="w-5 h-5 mb-1" />
          <span className="text-xs">Ver Tablas</span>
        </Button>

        <Button onClick={testToken} disabled={loading} className="h-16 flex flex-col">
          <CheckCircle className="w-5 h-5 mb-1" />
          <span className="text-xs">Test Token</span>
        </Button>

        <Button onClick={testBancos} disabled={loading} className="h-16 flex flex-col">
          <Download className="w-5 h-5 mb-1" />
          <span className="text-xs">Get Bancos</span>
        </Button>

        <Button onClick={testSincronizar} disabled={loading} className="h-16 flex flex-col">
          {loading ? <Loader2 className="w-5 h-5 mb-1 animate-spin" /> : <Database className="w-5 h-5 mb-1" />}
          <span className="text-xs">Sincronizar</span>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-nua-title">Resultados</h2>
        <Button onClick={clearResults} variant="outline" size="sm">
          Limpiar
        </Button>
      </div>

      {/* Resultados */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  {result.type.toUpperCase()} - {result.timestamp}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.success ? "SUCCESS" : "ERROR"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-gray-500">No hay resultados aún. Ejecuta una prueba arriba.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
