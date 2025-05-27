"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const GOCARDLESS_API_BASE = "https://bankaccountdata.gocardless.com/api/v2"

// Obtener tablas existentes
export async function obtenerTablas() {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (error) {
      console.error("Error al obtener tablas:", error)
      return { success: false, error: error.message }
    }

    console.log("Tablas en la base de datos:", data)
    return { success: true, data: data?.map((t) => t.table_name) || [] }
  } catch (error: any) {
    console.error("Error:", error)
    return { success: false, error: error.message }
  }
}

// Obtener token real de GoCardless
export async function obtenerTokenReal() {
  try {
    console.log("🔑 Obteniendo token de GoCardless...")
    console.log("Secret ID:", gocardlessSecretId?.substring(0, 8) + "...")
    console.log("Secret Key:", gocardlessSecretKey?.substring(0, 8) + "...")

    const response = await fetch(`${GOCARDLESS_API_BASE}/token/new/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        secret_id: gocardlessSecretId,
        secret_key: gocardlessSecretKey,
      }),
    })

    console.log("📡 Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Token error:", errorText)
      return { success: false, error: `Token error: ${response.status} - ${errorText}` }
    }

    const tokenData = await response.json()
    console.log("✅ Token obtenido:", tokenData.access?.substring(0, 20) + "...")

    return { success: true, token: tokenData.access }
  } catch (error: any) {
    console.error("❌ Error obteniendo token:", error)
    return { success: false, error: error.message }
  }
}

// Obtener bancos reales de GoCardless
export async function obtenerBancosReales() {
  try {
    // Primero obtener token
    const tokenResult = await obtenerTokenReal()
    if (!tokenResult.success) {
      return tokenResult
    }

    console.log("🏦 Obteniendo bancos españoles...")

    const response = await fetch(`${GOCARDLESS_API_BASE}/institutions/?country=ES`, {
      headers: {
        Authorization: `Bearer ${tokenResult.token}`,
        Accept: "application/json",
      },
    })

    console.log("📡 Bancos response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Bancos error:", errorText)
      return { success: false, error: `Bancos error: ${response.status} - ${errorText}` }
    }

    const institutions = await response.json()
    console.log("✅ Bancos obtenidos:", institutions.length)
    console.log(
      "📋 Primeros 3 bancos:",
      institutions.slice(0, 3).map((b: any) => b.name),
    )

    return { success: true, data: institutions, count: institutions.length }
  } catch (error: any) {
    console.error("❌ Error obteniendo bancos:", error)
    return { success: false, error: error.message }
  }
}

// Sincronizar bancos a Supabase
export async function sincronizarBancosReal() {
  try {
    // Verificar tablas
    console.log("📊 Verificando tablas...")
    const tablasResult = await obtenerTablas()
    if (!tablasResult.success) {
      return tablasResult
    }

    const tablas = tablasResult.data || []
    console.log("📋 Tablas encontradas:", tablas)

    if (!tablas.includes("gocardless_institutions")) {
      return {
        success: false,
        error: "Tabla gocardless_institutions no existe. Tablas disponibles: " + tablas.join(", "),
      }
    }

    // Obtener bancos
    const bancosResult = await obtenerBancosReales()
    if (!bancosResult.success) {
      return bancosResult
    }

    console.log("💾 Guardando bancos en Supabase...")
    let guardados = 0

    // Guardar cada banco
    for (const banco of bancosResult.data) {
      try {
        const { error } = await supabase.from("gocardless_institutions").upsert({
          id: banco.id,
          name: banco.name,
          bic: banco.bic,
          transaction_total_days: banco.transaction_total_days,
          countries: banco.countries,
          logo: banco.logo,
          supported_payments: banco.supported_payments || [],
          supported_features: banco.supported_features || [],
          identification_codes: banco.identification_codes || [],
          last_sync: new Date().toISOString(),
        })

        if (error) {
          console.error(`❌ Error guardando ${banco.name}:`, error)
        } else {
          guardados++
          if (guardados <= 5) {
            console.log(`✅ Guardado: ${banco.name}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando ${banco.name}:`, error)
      }
    }

    console.log(`🎉 Sincronización completa: ${guardados}/${bancosResult.count} bancos guardados`)

    return {
      success: true,
      message: `${guardados} bancos sincronizados en Supabase`,
      total: bancosResult.count,
      guardados: guardados,
    }
  } catch (error: any) {
    console.error("❌ Error en sincronización:", error)
    return { success: false, error: error.message }
  }
}
