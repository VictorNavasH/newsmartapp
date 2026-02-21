import { type NextRequest, NextResponse } from "next/server"
import { gocardless } from "@/lib/gocardless"
import { createClient } from "@/lib/supabaseServer"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params
        const supabase = await createClient()

        const { data: requisitionData, error: dbError } = await supabase
            .from("gocardless_requisitions")
            .select("id, gocardless_id, institution_id, reference")
            .or(`reference.eq.${idParam},gocardless_id.eq.${idParam}`)
            .single()

        if (dbError || !requisitionData) {
            return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
        }

        const requisition = await gocardless.getRequisition(requisitionData.gocardless_id)

        if (!requisition.accounts || requisition.accounts.length === 0) {
            return NextResponse.json({ accounts: [] })
        }

        const accountsWithDetails = await Promise.all(
            requisition.accounts.map(async (accountId: string) => {
                try {
                    const [accountDetails, balances] = await Promise.all([
                        gocardless.getAccountDetails(accountId),
                        gocardless.getAccountBalances(accountId),
                    ])

                    const currentBalance = Number.parseFloat(balances?.[0]?.balanceAmount?.amount || "0")

                    const accountData = {
                        gocardless_id: accountId,
                        requisition_id: requisitionData.id,
                        institution_id: requisitionData.institution_id,
                        iban: accountDetails.iban || null,
                        name: accountDetails.name || `Cuenta ${accountId.slice(-4)}`,
                        display_name: accountDetails.name || `Cuenta ${accountId.slice(-4)}`,
                        currency: accountDetails.currency || "EUR",
                        current_balance: currentBalance,
                        status: "ACTIVE",
                        last_sync_at: new Date().toISOString(),
                    }

                    await supabase.from("gocardless_accounts").upsert(accountData, { onConflict: 'gocardless_id' })

                    return {
                        id: accountId,
                        name: accountData.display_name,
                        iban: accountData.iban,
                        balance: currentBalance,
                        currency: accountData.currency,
                    }
                } catch (err) {
                    console.error(`Error processing account ${accountId}:`, err)
                    return null
                }
            })
        )

        return NextResponse.json({
            accounts: accountsWithDetails.filter(a => a !== null)
        })
    } catch (error) {
        console.error("[API] Error fetching accounts:", error)
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
    }
}
