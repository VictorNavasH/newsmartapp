import { DotykTemplate, DotykCommandPayload, DotykPublishResult } from "@/types/dotyk";

const DOTYK_ME_TOKEN_URL = "https://dotyk.me/api/v1.2/token/password/";
const DOTYK_TECH_LOGIN_URL = "https://dotyk.tech/api/user/LoginWithDotykMe";
const DOTYK_COMMAND_URL = "https://dotyk.tech/api/Locations/{location_id}/Devices/Sessions/Command/ChangeBackground";
const DOTYK_TEMPLATES_URL = "https://eu.performanceshow.dotyk.cloud/{root_id}/Template";

const DEFAULT_LOCATION_ID = 38;
const DEFAULT_ROOT_ID = "nua-barcelona";

class DotykService {
    private token: string | null = null;

    private async authenticate(): Promise<string> {
        const username = process.env.DOTYK_USERNAME;
        const password = process.env.DOTYK_PASSWORD;

        if (!username || !password) {
            throw new Error("Dotyk credentials not configured in environment variables.");
        }

        // Step 1: Get token from dotyk.me
        const tokenResp = await fetch(`${DOTYK_ME_TOKEN_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
        if (!tokenResp.ok) {
            throw new Error(`Failed to get Dotyk token: ${tokenResp.statusText}`);
        }

        const data = await tokenResp.json();
        const rawToken = typeof data === 'string' ? data : (data.token || data.access_token);

        if (!rawToken) {
            throw new Error("Dotyk token not found in response.");
        }

        // Step 2: Login to dotyk.tech to validate session
        const loginResp = await fetch(DOTYK_TECH_LOGIN_URL, {
            headers: { 'Authorization': `Bearer ${rawToken}` }
        });

        if (!loginResp.ok) {
            throw new Error(`Failed to login to Dotyk Tech: ${loginResp.statusText}`);
        }

        this.token = rawToken;
        return rawToken;
    }

    private async getToken(): Promise<string> {
        if (this.token) return this.token;
        return this.authenticate();
    }

    async getTemplates(rootId: string = DEFAULT_ROOT_ID): Promise<DotykTemplate[]> {
        const url = DOTYK_TEMPLATES_URL.replace("{root_id}", rootId);
        const resp = await fetch(url);

        if (!resp.ok) {
            console.warn(`[DotykService] Failed to fetch templates: ${resp.status}`);
            return [];
        }

        const data = await resp.json();
        return Array.isArray(data) ? data : [data];
    }

    async publish(mediaUrl: string, tableIds: string[], locationId: number = DEFAULT_LOCATION_ID): Promise<DotykPublishResult[]> {
        const token = await this.getToken();
        const url = DOTYK_COMMAND_URL.replace("{location_id}", String(locationId));

        const results: DotykPublishResult[] = [];

        for (const tableId of tableIds) {
            try {
                const payload: DotykCommandPayload = {
                    ApplicationName: "Dotyk.Application.Dots",
                    Argument: mediaUrl,
                    X: 1920,
                    Y: 1080,
                    TableId: tableId
                };

                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                results.push({
                    success: resp.ok,
                    mesaId: tableId,
                    status: resp.status,
                    error: resp.ok ? undefined : await resp.text()
                });
            } catch (error) {
                results.push({
                    success: false,
                    mesaId: tableId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return results;
    }
}

export const dotykService = new DotykService();
