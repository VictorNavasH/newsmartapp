import { type NextRequest, NextResponse } from "next/server"
import { createBankConnection } from "@/app/actions/banking"

export async function POST(request: NextRequest) {
  try {
    const { institutionId } = await request.json()
    const result = await createBankConnection(institutionId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
