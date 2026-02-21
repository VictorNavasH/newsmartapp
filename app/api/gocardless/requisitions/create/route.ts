import { type NextRequest, NextResponse } from "next/server"
import { gocardless } from "@/lib/gocardless"
import { createClient } from "@/lib/supabaseServer"

export async function POST(request: NextRequest) {
    try {
        const { institution_id, redirect_url, reference, agreement_options } = await request.json()

        if (!institution_id || !redirect_url || !reference) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Obtener la institución de la base de datos
        const { data: localInstitution, error: localError } = await supabase
            .from("gocardless_institutions")
            .select("*")
            .eq("id", institution_id)
            .single()

        if (localError || !localInstitution) {
            return NextResponse.json({ error: "Institution not found" }, { status: 404 })
        }

        // 2. Crear la requisition en GoCardless
        const requisition = await gocardless.createRequisition(
            localInstitution.gocardless_id,
            redirect_url,
            {
                reference,
                userLanguage: "ES",
            }
        )

        // 3. Guardar en la base de datos
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)

        const { error: dbError } = await supabase.from("gocardless_requisitions").insert({
            gocardless_id: requisition.id,
            institution_id: localInstitution.id,
            reference: reference,
            status: requisition.status,
            redirect_url: redirect_url,
            link: requisition.link,
            user_language: "ES",
            expires_at: expiresAt.toISOString(),
        })

        if (dbError) {
            console.error("[API] Error saving requisition:", dbError)
            return NextResponse.json({ error: "Error saving requisition" }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            requisition_id: requisition.id,
            link: requisition.link,
            reference: reference,
        })
    } catch (error) {
        console.error("[API] Error creating requisition:", error)
        return NextResponse.json({ error: "Failed to create requisition" }, { status: 500 })
    }
}
