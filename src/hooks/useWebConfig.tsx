import React, { type FC, type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

import type { WebConfig } from '../types/webConfig';
import defaultConfig from '../config.json';
import fetchLocal from '../utils/fetchLocal';

export const WebConfigContext = createContext<WebConfig>(defaultConfig);
export const useWebConfig = () => useContext(WebConfigContext);

export const WebConfigProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [ config, setConfig ] = useState<WebConfig>(defaultConfig);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetchLocal('config.json', { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error('network response was not ok');
                }

                const configData = await response.json();
                setConfig(configData);
            } catch (err) {
                console.warn('[WebConfigProvider] failed to fetch config file', err);
            }
        };

        fetchConfig()
            .catch(() => {
                // This should never happen since fetchConfig catches errors internally
            });
    }, [ setConfig ]);

    return (
        <WebConfigContext.Provider value={config}>
            {children}
        </WebConfigContext.Provider>
    );
};
