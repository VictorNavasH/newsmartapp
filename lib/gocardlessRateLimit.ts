import { createClient } from "@/lib/supabaseServer"

export interface RateLimitInfo {
    canRequest: boolean
    remaining: number
    resetTime: Date | null
    scope: "details" | "balances" | "transactions"
}

class GoCardlessRateLimitManager {
    private cache = new Map<string, { data: any; expires: number }>()
    private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutos

    async canMakeRequest(accountId: string, scope: "details" | "balances" | "transactions"): Promise<RateLimitInfo> {
        const cacheKey = `${accountId}-${scope}`
        const cached = this.cache.get(cacheKey)

        if (cached && cached.expires > Date.now()) {
            return cached.data
        }

        const supabase = await createClient()
        const today = new Date().toISOString().split("T")[0]

        const { data: rateLimitData, error } = await supabase
            .from("gocardless_rate_limits")
            .select("*")
            .eq("account_id", accountId)
            .eq("scope", scope)
            .eq("date", today)
            .maybeSingle()

        if (error) {
            console.error("[GoCardless] Error fetching rate limit:", error)
            return { canRequest: true, remaining: 4, resetTime: null, scope }
        }

        const currentLimit = 4
        let remaining = currentLimit

        if (rateLimitData) {
            remaining = rateLimitData.remaining_calls ?? currentLimit
        }

        const resetTime = rateLimitData?.reset_time ? new Date(rateLimitData.reset_time) : null

        const result: RateLimitInfo = {
            canRequest: remaining > 0,
            remaining,
            resetTime,
            scope,
        }

        this.cache.set(cacheKey, {
            data: result,
            expires: Date.now() + this.CACHE_TTL,
        })

        return result
    }

    async updateRateLimit(
        accountId: string,
        scope: "details" | "balances" | "transactions",
        remaining: number,
    ): Promise<void> {
        const supabase = await createClient()
        const today = new Date().toISOString().split("T")[0]
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        await supabase.from("gocardless_rate_limits").upsert({
            account_id: accountId,
            scope,
            date: today,
            limit_per_day: 4,
            remaining_calls: Math.max(0, remaining),
            reset_time: tomorrow.toISOString(),
            last_updated: new Date().toISOString(),
        }, { onConflict: 'account_id,scope,date' })

        this.cache.delete(`${accountId}-${scope}`)
    }

    async checkMultipleScopes(accountId: string, scopes: string[]): Promise<Record<string, RateLimitInfo>> {
        const results: Record<string, RateLimitInfo> = {}
        for (const scope of scopes) {
            results[scope] = await this.canMakeRequest(accountId, scope as any)
        }
        return results
    }
}

export const gocardlessRateLimit = new GoCardlessRateLimitManager()
