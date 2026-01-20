import fetchLocal from "../../utils/fetchLocal";
import { logger } from "../../utils/logger";

const DefaultConfig = {
    includeCorsCredentials: false,
    multiserver: true,
    themes: [
        {
            name: "Blue Radiance",
            id: "blueradiance",
            color: "#011432",
        },
        {
            name: "Dark",
            id: "dark",
            color: "#202020",
            default: true,
        },
        {
            name: "Purple Haze",
            id: "purplehaze",
            color: "#000420",
        },
    ],
    menuLinks: [],
    servers: [],
    plugins: [
        "playAccessValidation/plugin",
        "experimentalWarnings/plugin",
        "htmlAudioPlayer/plugin",
        "htmlVideoPlayer/plugin",
        "photoPlayer/plugin",
        "sessionPlayer/plugin",
        "chromecastPlayer/plugin",
        "syncPlay/plugin",
    ],
};

let data;

async function getConfig() {
    if (data) return Promise.resolve(data);
    try {
        const response = await fetchLocal("config.json", {
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("network response was not ok");
        }

        data = await response.json();

        return data;
    } catch (error) {
        logger.warn("Failed to fetch the web config file", { component: 'webSettings' }, error);
        data = DefaultConfig;
        return data;
    }
}

export function getIncludeCorsCredentials() {
    return getConfig()
        .then((config) => !!config.includeCorsCredentials)
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            return false;
        });
}

export function getMultiServer() {
    // Enable multi-server support when served by webpack
    if (__WEBPACK_SERVE__) {
        return Promise.resolve(true);
    }

    return getConfig()
        .then((config) => {
            return !!config.multiserver;
        })
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            return false;
        });
}

export function getServers() {
    return getConfig()
        .then((config) => {
            return config.servers || [];
        })
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            return [];
        });
}

const baseDefaultTheme = {
    name: "Dark",
    id: "dark",
    default: true,
};

let internalDefaultTheme = baseDefaultTheme;

const checkDefaultTheme = (themes) => {
    if (themes) {
        const defaultTheme = themes.find((theme) => theme.default);

        if (defaultTheme) {
            internalDefaultTheme = defaultTheme;
            return;
        }
    }

    internalDefaultTheme = baseDefaultTheme;
};

export function getThemes() {
    return getConfig()
        .then((config) => {
            if (!Array.isArray(config.themes)) {
                logger.error("Web config is invalid, missing themes", { component: 'webSettings' });
            }
            const themes = Array.isArray(config.themes)
                ? config.themes
                : DefaultConfig.themes;
            checkDefaultTheme(themes);
            return themes;
        })
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            checkDefaultTheme();
            return DefaultConfig.themes;
        });
}

export const getDefaultTheme = () => internalDefaultTheme;

export function getMenuLinks() {
    return getConfig()
        .then((config) => {
            if (!config.menuLinks) {
                logger.error("Web config is invalid, missing menuLinks", { component: 'webSettings' });
            }
            return config.menuLinks || [];
        })
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            return [];
        });
}

export function getPlugins() {
    return getConfig()
        .then((config) => {
            if (!config.plugins) {
                logger.error("Web config is invalid, missing plugins", { component: 'webSettings' });
            }
            return config.plugins || DefaultConfig.plugins;
        })
        .catch((error) => {
            logger.warn("Cannot get web config", { component: 'webSettings' }, error);
            return DefaultConfig.plugins;
        });
}
