export interface DotykTemplate {
    id: string;
    name: string;
    media: {
        url: string;
    };
    preview?: {
        url: string;
    };
    tables?: any[];
    viewMode?: string;
}

export interface DotykAuth {
    token: string;
}

export interface DotykCommandPayload {
    ApplicationName: string;
    Argument: string;
    X: number;
    Y: number;
    TableId?: string;
}

export interface DotykPublishResult {
    success: boolean;
    mesaId: string;
    status?: number;
    error?: string;
}
