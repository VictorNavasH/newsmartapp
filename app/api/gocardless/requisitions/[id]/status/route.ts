import { type NextRequest, NextResponse } from "next/server"
import { gocardless } from "@/lib/gocardless"
import { createClient } from "@/lib/supabaseServer"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: reference } = await params
        const supabase = await createClient()

        const { data: requisitionRecord, error: dbError } = await supabase
            .from("gocardless_requisitions")
            .select("gocardless_id, status, accounts, linked_at")
            .eq("reference", reference)
            .single()

        if (dbError || !requisitionRecord) {
            return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
        }

        const requisition = await gocardless.getRequisition(requisitionRecord.gocardless_id)

        await supabase
            .from("gocardless_requisitions")
            .update({
                status: requisition.status,
                accounts: requisition.accounts || [],
                linked_at: requisition.status === "LN" ? new Date().toISOString() : requisitionRecord.linked_at,
                updated_at: new Date().toISOString(),
            })
            .eq("reference", reference)

        return NextResponse.json(requisition)
    } catch (error) {
        console.error("[API] Error checking status:", error)
        return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
    }
}
