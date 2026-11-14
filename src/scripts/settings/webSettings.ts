import DefaultConfig from '../../config.json';
import fetchLocal from '../../utils/fetchLocal';

export interface WebTheme {
    name: string
    id: string
    color?: string
    default?: boolean
}

export interface WebMenuLink {
    name: string
    url: string
    icon?: string
}

export interface WebConfig {
    includeCorsCredentials?: boolean
    multiserver?: boolean
    themes?: WebTheme[]
    menuLinks?: WebMenuLink[]
    servers?: string[]
    plugins?: string[]
}

const DEFAULT_CONFIG: WebConfig & Required<Pick<WebConfig, 'themes' | 'plugins'>> = DefaultConfig;

let data: WebConfig | undefined;

async function getConfig(): Promise<WebConfig> {
    if (data) return data;
    try {
        const response = await fetchLocal('config.json', {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('network response was not ok');
        }

        data = await response.json() as WebConfig;

        return data;
    } catch (error) {
        console.warn('failed to fetch the web config file:', error);
        data = DEFAULT_CONFIG;
        return data;
    }
}

export function getIncludeCorsCredentials(): Promise<boolean> {
    return getConfig()
        .then(config => !!config.includeCorsCredentials)
        .catch(error => {
            console.log('cannot get web config:', error);
            return false;
        });
}

export function getMultiServer(): Promise<boolean> {
    // Enable multi-server support when served by webpack
    if (__WEBPACK_SERVE__) {
        return Promise.resolve(true);
    }

    return getConfig().then(config => {
        return !!config.multiserver;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return false;
    });
}

export function getServers(): Promise<string[]> {
    return getConfig().then(config => {
        return config.servers || [];
    }).catch(error => {
        console.log('cannot get web config:', error);
        return [];
    });
}

const baseDefaultTheme: WebTheme = {
    'name': 'Dark',
    'id': 'dark',
    'default': true
};

let internalDefaultTheme: WebTheme = baseDefaultTheme;

const checkDefaultTheme = (themes?: WebTheme[]): void => {
    if (themes) {
        const defaultTheme = themes.find((theme) => theme.default);

        if (defaultTheme) {
            internalDefaultTheme = defaultTheme;
            return;
        }
    }

    internalDefaultTheme = baseDefaultTheme;
};

export function getThemes(): Promise<WebTheme[]> {
    return getConfig().then(config => {
        if (!Array.isArray(config.themes)) {
            console.error('web config is invalid, missing themes:', config);
        }
        const themes = Array.isArray(config.themes) ? config.themes : DEFAULT_CONFIG.themes;
        checkDefaultTheme(themes);
        return themes;
    }).catch(error => {
        console.log('cannot get web config:', error);
        checkDefaultTheme();
        return DEFAULT_CONFIG.themes;
    });
}

export const getDefaultTheme = (): WebTheme => internalDefaultTheme;

export function getMenuLinks(): Promise<WebMenuLink[]> {
    return getConfig().then(config => {
        if (!config.menuLinks) {
            console.error('web config is invalid, missing menuLinks:', config);
        }
        return config.menuLinks || [];
    }).catch(error => {
        console.log('cannot get web config:', error);
        return [];
    });
}

export function getPlugins(): Promise<string[]> {
    return getConfig().then(config => {
        if (!config.plugins) {
            console.error('web config is invalid, missing plugins:', config);
        }
        return config.plugins || DEFAULT_CONFIG.plugins;
    }).catch(error => {
        console.log('cannot get web config:', error);
        return DEFAULT_CONFIG.plugins;
    });
}
