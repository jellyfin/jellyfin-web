export const DEFAULT_DEV_PROXY_BASE_PATH = '/__jellyfin-api';

export interface DevConfig {
    serverBaseUrl: string;
    useProxy: boolean;
    proxyBasePath: string;
}

export const DEFAULT_DEV_CONFIG: DevConfig = {
    serverBaseUrl: '',
    useProxy: false,
    proxyBasePath: DEFAULT_DEV_PROXY_BASE_PATH
};

const hasProtocol = (value: string): boolean => /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value);

export const normalizeServerBaseUrl = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed === '') return '';

    const withProtocol = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);

    url.hash = '';
    url.search = '';

    const normalized = `${url.origin}${url.pathname}`.replace(/\/$/, '');
    return normalized;
};

export const resolveApiBaseUrl = (config: DevConfig, isDev: boolean): string | undefined => {
    if (isDev && config.useProxy) {
        return config.proxyBasePath !== '' ? config.proxyBasePath : DEFAULT_DEV_PROXY_BASE_PATH;
    }

    try {
        const normalized = normalizeServerBaseUrl(config.serverBaseUrl);
        return normalized !== '' ? normalized : undefined;
    } catch {
        return undefined;
    }
};

export const fetchDevConfig = async (): Promise<DevConfig> => {
    if (!import.meta.env.DEV) {
        return { ...DEFAULT_DEV_CONFIG };
    }

    try {
        const response = await fetch('/__dev-config', { cache: 'no-store' });
        if (!response.ok) {
            return { ...DEFAULT_DEV_CONFIG };
        }

        const data = (await response.json()) as Partial<DevConfig>;
        return {
            ...DEFAULT_DEV_CONFIG,
            ...data
        };
    } catch {
        return { ...DEFAULT_DEV_CONFIG };
    }
};

export const saveDevConfig = async (config: Partial<DevConfig>): Promise<DevConfig> => {
    if (!import.meta.env.DEV) {
        return { ...DEFAULT_DEV_CONFIG };
    }

    const response = await fetch('/__dev-config', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        throw new Error('Failed to save dev config');
    }

    const data = (await response.json()) as Partial<DevConfig>;
    return {
        ...DEFAULT_DEV_CONFIG,
        ...data
    };
};
