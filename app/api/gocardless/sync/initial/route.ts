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
                        gocardless_id: tx.transactionId || tx.internalTransactionId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        account_id: accountData.id,
                        account_gocardless_id: acc.id,
                        amount: tx.transactionAmount.amount,
                        currency: tx.transactionAmount.currency || "EUR",
                        booking_date: tx.bookingDate || new Date().toISOString().split("T")[0],
                        value_date: tx.valueDate || null,
                        creditor_name: tx.creditorName || null,
                        debtor_name: tx.debtorName || null,
                        remittance_information_unstructured: tx.remittanceInformationUnstructured || null,
                        creditor_account_iban: tx.creditorAccount?.iban || null,
                        debtor_account_iban: tx.debtorAccount?.iban || null,
                        bank_transaction_code: tx.bankTransactionCode || null,
                        transaction_id: tx.transactionId || null,
                        end_to_end_id: tx.endToEndId || null,
                        raw_data: tx
                    }))

                    const { error: upsertError } = await supabase
                        .from("gocardless_transactions")
                        .upsert(txData, { onConflict: 'gocardless_id' })

                    if (upsertError) {
                        console.error(`Transaction upsert error for ${acc.id}:`, upsertError)
                    } else {
                        totalImported += transactions.length
                    }
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
