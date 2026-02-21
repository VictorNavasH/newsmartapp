import { type NextRequest, NextResponse } from "next/server"
import { gocardless } from "@/lib/gocardless"
import { createClient } from "@/lib/supabaseServer"
import { gocardlessRateLimit } from "@/lib/gocardlessRateLimit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: accountId } = await params
        const supabase = await createClient()

        // Buscar por gocardless_id primero, luego por id (UUID) como fallback
        let account: any = null
        const { data: byGcId } = await supabase
            .from("gocardless_accounts")
            .select("*")
            .eq("gocardless_id", accountId)
            .maybeSingle()

        if (byGcId) {
            account = byGcId
        } else {
            const { data: byUuid } = await supabase
                .from("gocardless_accounts")
                .select("*")
                .eq("id", accountId)
                .maybeSingle()
            account = byUuid
        }

        if (!account) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 })
        }

        // Usar siempre gocardless_id para las llamadas a la API de GoCardless
        const gcAccountId = account.gocardless_id

        const rateLimits = await gocardlessRateLimit.checkMultipleScopes(gcAccountId, ["balances", "transactions"])

        let syncedBalances = false
        let syncedTransactions = false
        let finalBalance = account.current_balance

        // 1. Sync Balances
        if (rateLimits.balances.canRequest) {
            try {
                const balances = await gocardless.getAccountBalances(gcAccountId)
                if (balances && balances.length > 0) {
                    const mainBalance = balances[0]
                    finalBalance = Number.parseFloat(mainBalance.balanceAmount.amount)

                    await supabase.from("gocardless_accounts").update({
                        current_balance: finalBalance,
                        currency: mainBalance.balanceAmount.currency,
                        last_sync_at: new Date().toISOString()
                    }).eq("gocardless_id", gcAccountId)

                    syncedBalances = true
                    const gcLimits = gocardless.getRateLimitInfo()
                    if (gcLimits.accountSuccessRemaining !== undefined) {
                        await gocardlessRateLimit.updateRateLimit(gcAccountId, "balances", gcLimits.accountSuccessRemaining)
                    }
                }
            } catch (err) {
                console.error("Balance sync error:", err)
            }
        }

        // 2. Sync Transactions
        if (rateLimits.transactions.canRequest) {
            try {
                const transactions = await gocardless.getAccountTransactions(gcAccountId)
                if (transactions && transactions.length > 0) {
                    const txData = transactions.map((tx: any) => ({
                        gocardless_id: tx.transactionId || `tx_${Math.random().toString(36).substr(2, 9)}`,
                        account_id: account.id,
                        amount: tx.transactionAmount.amount,
                        currency: tx.transactionAmount.currency,
                        booking_date: tx.bookingDate || new Date().toISOString().split("T")[0],
                        creditor_name: tx.creditorName || null,
                        debtor_name: tx.debtorName || null,
                        remittance_information_unstructured: tx.remittanceInformationUnstructured || null,
                        raw_data: tx
                    }))

                    await supabase.from("gocardless_transactions").upsert(txData, { onConflict: 'gocardless_id' })
                    syncedTransactions = true

                    const gcLimits = gocardless.getRateLimitInfo()
                    if (gcLimits.accountSuccessRemaining !== undefined) {
                        await gocardlessRateLimit.updateRateLimit(gcAccountId, "transactions", gcLimits.accountSuccessRemaining)
                    }
                }
            } catch (err) {
                console.error("Transaction sync error:", err)
            }
        }

        return NextResponse.json({
            success: true,
            synced: {
                balances: syncedBalances,
                transactions: syncedTransactions
            },
            balance: finalBalance
        })

    } catch (error) {
        console.error("[API] Full sync error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
