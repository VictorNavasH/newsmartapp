import { NextRequest, NextResponse } from "next/server";
import { dotykService } from "@/lib/dotykService";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mediaUrl, tableIds, locationId } = body;

        if (!mediaUrl || !tableIds || !Array.isArray(tableIds)) {
            return NextResponse.json({ error: "Missing required fields: mediaUrl, tableIds" }, { status: 400 });
        }

        const results = await dotykService.publish(mediaUrl, tableIds, locationId);

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: successCount === results.length,
            results,
            summary: `${successCount}/${results.length} tables updated`
        });
    } catch (error) {
        console.error("[API] Dotyk publish error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
