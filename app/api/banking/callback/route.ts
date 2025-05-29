import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const gocardlessSecretId = process.env.GOCARDLESS_SECRET_ID!
const gocardlessSecretKey = process.env.GOCARDLESS_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get("ref")

  try {
    // 1. Validación básica
    if (!ref) {
      throw new Error("Falta referencia")
    }

    // 2. Obtener token
    const tokenResponse = await fetch("https://bankaccountdata.gocardless.com/api/v2/token/new/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret_id: gocardlessSecretId,
        secret_key: gocardlessSecretKey,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Error al obtener token")
    }

    const { access: token } = await tokenResponse.json()

    // 3. Obtener requisition
    const requisitionResponse = await fetch(`https://bankaccountdata.gocardless.com/api/v2/requisitions/${ref}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!requisitionResponse.ok) {
      throw new Error("Error al obtener requisition")
    }

    const requisition = await requisitionResponse.json()

    // 4. Guardar requisition (ignorar errores de tabla)
    try {
      await supabase.from("requisitions").upsert({
        id: ref,
        institution_id: requisition.institution_id,
        status: requisition.status,
        accounts: requisition.accounts || [],
      })
    } catch (e) {
      console.log("Error guardando requisition:", e)
    }

    // 5. Si hay cuentas vinculadas, procesarlas
    if (requisition.status === "LN" && requisition.accounts?.length > 0) {
      for (const accountId of requisition.accounts) {
        try {
          // Obtener detalles de cuenta
          const accountResponse = await fetch(
            `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/details/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          if (accountResponse.ok) {
            const { account } = await accountResponse.json()

            // Obtener balance
            let balance = 0
            try {
              const balanceResponse = await fetch(
                `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/balances/`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              )

              if (balanceResponse.ok) {
                const { balances } = await balanceResponse.json()
                const closingBalance = balances?.find((b: any) => b.balanceType === "closingBooked")
                balance = closingBalance ? Number.parseFloat(closingBalance.balanceAmount.amount) : 0
              }
            } catch (e) {
              console.log("Error obteniendo balance:", e)
            }

            // Guardar cuenta
            try {
              await supabase.from("accounts").upsert({
                id: accountId,
                institution_id: requisition.institution_id,
                name: account?.name || "Cuenta",
                iban: account?.iban || "",
                currency: account?.currency || "EUR",
                balance: balance,
                account_type: account?.product || "current",
                status: "active",
                last_sync: new Date().toISOString(),
              })
            } catch (e) {
              console.log("Error guardando cuenta:", e)
            }

            // Obtener transacciones
            try {
              const transResponse = await fetch(
                `https://bankaccountdata.gocardless.com/api/v2/accounts/${accountId}/transactions/`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              )

              if (transResponse.ok) {
                const { transactions } = await transResponse.json()
                const bookedTransactions = transactions?.booked || []

                // Guardar transacciones
                for (const trans of bookedTransactions.slice(0, 100)) {
                  // Limitar a 100 para evitar timeout
                  try {
                    const amount = Number.parseFloat(trans.transactionAmount?.amount || "0")
                    const transId = trans.transactionId || `${accountId}_${Date.now()}_${Math.random()}`

                    await supabase.from("transactions").upsert({
                      id: transId,
                      account_id: accountId,
                      amount: amount,
                      currency: trans.transactionAmount?.currency || "EUR",
                      description:
                        trans.remittanceInformationUnstructured ||
                        trans.creditorName ||
                        trans.debtorName ||
                        "Transacción",
                      date: trans.bookingDate || trans.valueDate || new Date().toISOString().split("T")[0],
                      creditor_name: trans.creditorName || "",
                      debtor_name: trans.debtorName || "",
                      merchant: trans.merchantName || "",
                      category: trans.proprietaryBankTransactionCode || "",
                      type: amount >= 0 ? "credit" : "debit",
                    })
                  } catch (e) {
                    // Ignorar errores individuales de transacciones
                    console.log("Error en transacción individual:", e)
                  }
                }
              }
            } catch (e) {
              console.log("Error obteniendo transacciones:", e)
            }
          }
        } catch (e) {
          console.log("Error procesando cuenta:", e)
        }
      }
    }

    // 6. Éxito - redirigir
    return NextResponse.redirect(new URL("/configuracion?tab=conexiones&subtab=bancos&status=success", request.url))
  } catch (error) {
    // 7. Error - redirigir con mensaje
    console.error("Error en callback:", error)
    return NextResponse.redirect(
      new URL(
        `/configuracion?tab=conexiones&subtab=bancos&status=error&message=${encodeURIComponent(
          (error as Error).message,
        )}`,
        request.url,
      ),
    )
  }
}
