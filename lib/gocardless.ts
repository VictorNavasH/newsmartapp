const GOCARDLESS_BASE_URL = "https://bankaccountdata.gocardless.com"
const SECRET_ID = process.env.GOCARDLESS_SECRET_ID
const SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY

interface GoCardlessToken {
    access: string
    access_expires: number
    refresh: string
    refresh_expires: number
}

interface RateLimitInfo {
    limit?: number
    remaining?: number
    reset?: number
    accountSuccessLimit?: number
    accountSuccessRemaining?: number
    accountSuccessReset?: number
}

class GoCardlessClient {
    private token: GoCardlessToken | null = null
    private rateLimitInfo: RateLimitInfo = {}

    async getAccessToken(): Promise<string> {
        if (!SECRET_ID || !SECRET_KEY) {
            throw new Error(
                "GoCardless credentials not configured. Check GOCARDLESS_SECRET_ID and GOCARDLESS_SECRET_KEY environment variables.",
            )
        }

        if (this.token && Date.now() < this.token.access_expires * 1000) {
            return this.token.access
        }

        if (this.token && this.token.refresh && Date.now() < this.token.refresh_expires * 1000) {
            try {
                const refreshResponse = await fetch(`${GOCARDLESS_BASE_URL}/api/v2/token/refresh/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh: this.token.refresh }),
                })

                if (refreshResponse.ok) {
                    this.token = await refreshResponse.json()
                    return this.token!.access
                }
            } catch (error) {
                console.error("[GoCardless] Token refresh error:", error)
            }
        }

        const tokenUrl = `${GOCARDLESS_BASE_URL}/api/v2/token/new/`
        try {
            const response = await fetch(tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ secret_id: SECRET_ID, secret_key: SECRET_KEY }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Failed to get access token: ${response.status} ${errorText}`)
            }

            this.token = await response.json()
            return this.token!.access
        } catch (error) {
            console.error("[GoCardless] Token request error:", error)
            throw error
        }
    }

    async makeRequest(endpoint: string, options: RequestInit = {}) {
        const token = await this.getAccessToken()
        const response = await fetch(`${GOCARDLESS_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        })

        if (response.status === 401) {
            this.token = null
            const retryToken = await this.getAccessToken()
            const retryResponse = await fetch(`${GOCARDLESS_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    Authorization: `Bearer ${retryToken}`,
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            })
            if (!retryResponse.ok) throw new Error(`GoCardless API Error: ${retryResponse.status}`)
            return retryResponse.json()
        }

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`GoCardless API Error: ${response.status} - ${errorText}`)
        }

        return response.json()
    }

    async getInstitutions(country = "ES") {
        return this.makeRequest(`/api/v2/institutions/?country=${country}`)
    }

    async createRequisition(institutionId: string, redirectUrl: string, options?: any) {
        const requisitionData: any = {
            redirect: redirectUrl,
            institution_id: institutionId,
            reference: options?.reference || `req_${Date.now()}`,
            user_language: options?.userLanguage || "ES",
        }

        if (options?.agreement) {
            requisitionData.agreement = options.agreement
        }

        return this.makeRequest("/api/v2/requisitions/", {
            method: "POST",
            body: JSON.stringify(requisitionData),
        })
    }

    async getRequisition(requisitionId: string) {
        return this.makeRequest(`/api/v2/requisitions/${requisitionId}/`)
    }

    async getAccountBalances(accountId: string) {
        const result = await this.makeRequest(`/api/v2/accounts/${accountId}/balances/`)
        return result.balances || []
    }

    async getAccountTransactions(accountId: string) {
        const result = await this.makeRequest(`/api/v2/accounts/${accountId}/transactions/`)
        if (result && result.transactions) {
            return [...(result.transactions.booked || []), ...(result.transactions.pending || [])]
        }
        return []
    }

    async getAccountDetails(accountId: string) {
        const result = await this.makeRequest(`/api/v2/accounts/${accountId}/`)
        return result
    }

    getRateLimitInfo(): RateLimitInfo {
        return { ...this.rateLimitInfo }
    }
}

export const gocardless = new GoCardlessClient()
