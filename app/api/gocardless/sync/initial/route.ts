import { type NextRequest, NextResponse } from "next/server"
import { gocardless } from "@/lib/gocardless"
import { createClient } from "@/lib/supabaseServer"

export async function POST(request: NextRequest) {
    try {
        const { accounts } = await request.json()

        if (!accounts || !Array.isArray(accounts)) {
            return NextResponse.json({ error: "Invalid accounts" }, { status: 400 })
        }

        const supabase = await createClient()
        let totalImported = 0

        for (const acc of accounts) {
            try {
                const transactions = await gocardless.getAccountTransactions(acc.id)

                // Obtener ID interno
                const { data: accountData } = await supabase
                    .from("gocardless_accounts")
                    .select("id")
                    .eq("gocardless_id", acc.id)
                    .single()

                if (accountData && transactions.length > 0) {
                    const txData = transactions.map((tx: any) => ({
                        gocardless_id: tx.transactionId || `tx_${Math.random().toString(36).substr(2, 9)}`,
                        account_id: accountData.id,
                        amount: tx.transactionAmount.amount,
                        currency: tx.transactionAmount.currency,
                        booking_date: tx.bookingDate || new Date().toISOString().split("T")[0],
                        creditor_name: tx.creditorName || null,
                        debtor_name: tx.debtorName || null,
                        remittance_information_unstructured: tx.remittanceInformationUnstructured || null,
                        raw_data: tx
                    }))

                    await supabase.from("gocardless_transactions").upsert(txData, { onConflict: 'gocardless_id' })
                    totalImported += transactions.length
                }
            } catch (err) {
                console.error(`Error in initial sync for ${acc.id}:`, err)
            }
        }

        return NextResponse.json({
            success: true,
            transactions_imported: totalImported
        })

    } catch (error) {
        console.error("[API] Initial sync error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
