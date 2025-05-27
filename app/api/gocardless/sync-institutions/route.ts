import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID!
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // 1. Obtener token
    const tokenResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret_id: gocardlessSecretId,
        secret_key: gocardlessSecretKey,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token error: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()

    // 2. Obtener bancos españoles
    const institutionsResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/institutions/?country=ES", {
      headers: { Authorization: `Bearer ${tokenData.access}` },
    })

    if (!institutionsResponse.ok) {
      throw new Error(`Institutions error: ${institutionsResponse.status}`)
    }

    const institutions = await institutionsResponse.json()

    // 3. Guardar en Supabase
    let saved = 0
    for (const inst of institutions) {
      const { error } = await supabase.from("gocardless_institutions").upsert({
        id: inst.id,
        name: inst.name,
        bic: inst.bic,
        transaction_total_days: inst.transaction_total_days,
        countries: inst.countries,
        logo: inst.logo,
        supported_payments: inst.supported_payments || [],
        supported_features: inst.supported_features || [],
        identification_codes: inst.identification_codes || [],
        last_sync: new Date().toISOString(),
      })

      if (!error) saved++
    }

    return NextResponse.json({
      success: true,
      count: saved,
      total: institutions.length,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
