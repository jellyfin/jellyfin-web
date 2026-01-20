import React, {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { WebConfig } from "../types/webConfig";
import fetchLocal from "../utils/fetchLocal";
import { logger } from "../utils/logger";

const defaultConfig: WebConfig = {
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

export const WebConfigContext = createContext<WebConfig>(defaultConfig);
export const useWebConfig = () => useContext(WebConfigContext);

export const WebConfigProvider: FC<PropsWithChildren<unknown>> = ({
    children,
}) => {
    const [config, setConfig] = useState<WebConfig>(defaultConfig);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetchLocal("config.json", {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("network response was not ok");
                }

                const configData = await response.json();
                setConfig(configData);
            } catch (err) {
                logger.warn('[WebConfigProvider] failed to fetch config file', { component: 'useWebConfig' }, err as Error);
            }
        };

        fetchConfig().catch(() => {
            // This should never happen since fetchConfig catches errors internally
        });
    }, [setConfig]);

    return (
        <WebConfigContext.Provider value={config}>
            {children}
        </WebConfigContext.Provider>
    );
};
