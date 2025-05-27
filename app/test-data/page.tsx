"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { insertTestData, clearTestData } from "@/app/actions/test-gocardless-data"

export default function TestDataPage() {
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleInsertData = async () => {
    setLoading(true)
    setMessage(null)
    setResults(null)

    try {
      const result = await insertTestData()

      if (result.success) {
        setResults(result.results)
        setMessage({
          type: "success",
          text: "Datos de prueba insertados correctamente en Supabase",
        })
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error insertando datos",
        })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = async () => {
    setClearing(true)
    setMessage(null)

    try {
      const result = await clearTestData()

      if (result.success) {
        setResults(null)
        setMessage({
          type: "success",
          text: "Datos de prueba eliminados correctamente",
        })
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error eliminando datos",
        })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-nua-title">Prueba de Datos GoCardless</h1>
        <p className="text-nua-subtitle">Inserta datos de prueba en las tablas de Supabase</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px] text-nua-title flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Insertar Datos de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[12px] text-nua-subtitle mb-4">
              Inserta datos de ejemplo en todas las tablas de GoCardless:
            </p>
            <ul className="text-[11px] text-gray-600 mb-4 space-y-1">
              <li>• 1 Token de acceso</li>
              <li>• 3 Instituciones bancarias</li>
              <li>• 1 Acuerdo (Agreement)</li>
              <li>• 1 Requisition</li>
              <li>• 2 Cuentas bancarias</li>
              <li>• 3 Transacciones</li>
            </ul>
            <Button onClick={handleInsertData} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Insertando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Insertar Datos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px] text-nua-title flex items-center">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar Datos de Prueba
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[12px] text-nua-subtitle mb-4">Elimina todos los datos de prueba de las tablas.</p>
            <Button onClick={handleClearData} disabled={clearing} variant="destructive" className="w-full">
              {clearing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpiar Datos
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px] text-nua-title">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.tokens}</div>
                <div className="text-[11px] text-gray-500">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.institutions}</div>
                <div className="text-[11px] text-gray-500">Instituciones</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.agreements}</div>
                <div className="text-[11px] text-gray-500">Acuerdos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.requisitions}</div>
                <div className="text-[11px] text-gray-500">Requisitions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.accounts}</div>
                <div className="text-[11px] text-gray-500">Cuentas</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-nua-title">{results.transactions}</div>
                <div className="text-[11px] text-gray-500">Transacciones</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <div
          className={`
          p-4 rounded-lg flex items-center space-x-2
          ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
        `}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-[12px]">{message.text}</span>
        </div>
      )}
    </div>
  )
}
