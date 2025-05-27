import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID!
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { institutionId } = await request.json()

    // 1. Obtener token
    const tokenResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret_id: gocardlessSecretId,
        secret_key: gocardlessSecretKey,
      }),
    })

    const tokenData = await tokenResponse.json()

    // 2. Crear acuerdo
    const agreementResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/agreements/enduser/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ["balances", "details", "transactions"],
      }),
    })

    const agreement = await agreementResponse.json()

    // 3. Crear requisition
    const requisitionResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/requisitions/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        redirect: `${process.env.VERCEL_URL || "http://localhost:3000"}/configuracion?success=true`,
        institution_id: institutionId,
        agreement: agreement.id,
        reference: `req_${Date.now()}`,
        user_language: "ES",
      }),
    })

    const requisition = await requisitionResponse.json()

    // 4. Guardar en Supabase
    await supabase.from("gocardless_agreements").upsert({
      id: agreement.id,
      institution_id: institutionId,
      status: "created",
      created_at: new Date().toISOString(),
    })

    await supabase.from("gocardless_requisitions").upsert({
      id: requisition.id,
      institution_id: institutionId,
      agreement_id: agreement.id,
      status: requisition.status,
      link: requisition.link,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      authUrl: requisition.link,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    })
  }
}
