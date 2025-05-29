import { NextResponse } from "next/server"
import { syncInstitutions } from "@/app/actions/banking"

export async function POST() {
  try {
    const result = await syncInstitutions()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
