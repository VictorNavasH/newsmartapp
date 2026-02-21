import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabaseServer"

export async function GET() {
    try {
        const supabase = await createClient()
        const today = new Date().toISOString().split("T")[0]

        // 1. Obtener rate limits del día actual para todos los scopes
        const { data: rateLimitsData } = await supabase
            .from("gocardless_rate_limits")
            .select("account_id, scope, remaining_calls, limit_per_day")
            .eq("date", today)

        // Calcular el mínimo de requests restantes por scope (entre todas las cuentas)
        // Usamos el mínimo porque si una cuenta ya gastó sus requests, el sync-all no podrá completar
        const DEFAULT_LIMIT = 4
        let transactionsRemaining = DEFAULT_LIMIT
        let balancesRemaining = DEFAULT_LIMIT

        if (rateLimitsData && rateLimitsData.length > 0) {
            const txLimits = rateLimitsData.filter(r => r.scope === "transactions")
            const balLimits = rateLimitsData.filter(r => r.scope === "balances")

            if (txLimits.length > 0) {
                transactionsRemaining = Math.min(...txLimits.map(r => r.remaining_calls ?? DEFAULT_LIMIT))
            }
            if (balLimits.length > 0) {
                balancesRemaining = Math.min(...balLimits.map(r => r.remaining_calls ?? DEFAULT_LIMIT))
            }
        }

        // 2. Obtener la última sincronización más reciente de todas las cuentas
        const { data: accountsData } = await supabase
            .from("gocardless_accounts")
            .select("last_sync_at")
            .not("last_sync_at", "is", null)
            .order("last_sync_at", { ascending: false })
            .limit(1)

        const lastSyncAt = accountsData?.[0]?.last_sync_at || null

        // 3. Obtener estado del consentimiento (requisition más reciente activa)
        const { data: requisitionsData } = await supabase
            .from("gocardless_requisitions")
            .select("created_at, institution_id, status")
            .eq("status", "LN")
            .order("created_at", { ascending: false })
            .limit(1)

        let consentDaysRemaining: number | null = null
        let consentInstitutionId: string | null = null

        if (requisitionsData && requisitionsData.length > 0) {
            const requisition = requisitionsData[0]
            consentInstitutionId = requisition.institution_id

            // GoCardless consents duran 90 días desde la creación
            const createdAt = new Date(requisition.created_at)
            const expiresAt = new Date(createdAt)
            expiresAt.setDate(expiresAt.getDate() + 90)

            const now = new Date()
            const diffMs = expiresAt.getTime() - now.getTime()
            consentDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        }

        return NextResponse.json({
            lastSyncAt,
            rateLimits: {
                transactions: {
                    remaining: transactionsRemaining,
                    limit: DEFAULT_LIMIT
                },
                balances: {
                    remaining: balancesRemaining,
                    limit: DEFAULT_LIMIT
                }
            },
            consentDaysRemaining,
            consentInstitutionId
        })

    } catch (error) {
        console.error("[API] Sync status error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
