/**
 * Web Config Store
 *
 * Zustand store for managing web configuration loaded from config.json.
 */

import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import type { WebConfig } from '../types/webConfig';

export interface WebConfigState {
    config: WebConfig;
    isLoading: boolean;
    error: string | null;

    // Actions
    setConfig: (config: WebConfig) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const defaultConfig: WebConfig = {
    includeCorsCredentials: false,
    multiserver: true,
    themes: [
        {
            name: 'Blue Radiance',
            id: 'blueradiance',
            color: '#011432'
        },
        {
            name: 'Dark',
            id: 'dark',
            color: '#202020',
            default: true
        },
        {
            name: 'Purple Haze',
            id: 'purplehaze',
            color: '#000420'
        }
    ],
    menuLinks: [],
    servers: [],
    plugins: [
        'playAccessValidation/plugin',
        'experimentalWarnings/plugin',
        'htmlAudioPlayer/plugin',
        'htmlVideoPlayer/plugin',
        'photoPlayer/plugin',
        'sessionPlayer/plugin',
        'chromecastPlayer/plugin',
        'syncPlay/plugin'
    ]
};

const WEB_CONFIG_STORAGE_KEY = 'jellyfin-web-config';

export const useWebConfigStore = create<WebConfigState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                config: defaultConfig,
                isLoading: false,
                error: null,

                setConfig: (config) => set({ config, error: null }),

                setLoading: (loading) => set({ isLoading: loading }),

                setError: (error) => set({ error })
            }),
            {
                name: WEB_CONFIG_STORAGE_KEY,
                storage: createJSONStorage(() => localStorage),
                partialize: (state) => ({ config: state.config }),
                merge: (persisted, current) => ({
                    ...current,
                    config: { ...current.config, ...(persisted as any)?.config }
                })
            }
        )
    )
);

// Hook for useWebConfig
export const useWebConfig = () => useWebConfigStore((state) => state.config);

// Function to load config
export const loadWebConfig = async () => {
    const store = useWebConfigStore.getState();
    store.setLoading(true);
    try {
        const response = await fetch('/config.json', {
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const configData = await response.json();
        store.setConfig(configData);
    } catch (error) {
        store.setError((error as Error).message);
    } finally {
        store.setLoading(false);
    }
};
