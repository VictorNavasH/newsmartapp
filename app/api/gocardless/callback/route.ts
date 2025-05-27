import { type NextRequest, NextResponse } from "next/server"
import { processCallback } from "@/app/actions/gocardless-complete"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requisitionId = searchParams.get("ref")

  if (!requisitionId) {
    return NextResponse.redirect(new URL("/configuracion?tab=conexiones&subtab=bancos&error=missing_ref", request.url))
  }

  try {
    const result = await processCallback(requisitionId)

    if (result.success) {
      return NextResponse.redirect(
        new URL(`/configuracion?tab=conexiones&subtab=bancos&success=true&accounts=${result.accounts}`, request.url),
      )
    } else {
      return NextResponse.redirect(
        new URL(
          `/configuracion?tab=conexiones&subtab=bancos&error=${encodeURIComponent(result.error || "unknown")}`,
          request.url,
        ),
      )
    }
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/configuracion?tab=conexiones&subtab=bancos&error=${encodeURIComponent(error.message)}`, request.url),
    )
  }
}
