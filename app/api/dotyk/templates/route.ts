import { NextResponse } from "next/server";
import { dotykService } from "@/lib/dotykService";

export async function GET() {
    try {
        const templates = await dotykService.getTemplates();
        return NextResponse.json(templates);
    } catch (error) {
        console.error("[API] Dotyk templates error:", error);
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}
