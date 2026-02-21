import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabaseServer"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const country = searchParams.get("country") || "ES"

        const supabase = await createClient()

        const { data: institutions, error } = await supabase
            .from("gocardless_institutions")
            .select("*")
            .eq("is_active", true)
            .or(`countries.cs.["${country}"],country.eq.${country}`)
            .order("name")

        if (error) {
            console.error("[API] Error fetching institutions:", error.message)
            return NextResponse.json({ error: "Failed to fetch institutions" }, { status: 500 })
        }

        return NextResponse.json(institutions || [])
    } catch (error) {
        console.error("[API] Error in institutions route:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
