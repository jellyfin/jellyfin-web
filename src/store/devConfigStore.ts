import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { DEFAULT_DEV_CONFIG, type DevConfig } from 'utils/devConfig';

export interface DevConfigState extends DevConfig {
    setServerBaseUrl: (serverBaseUrl: string) => void;
    setUseProxy: (useProxy: boolean) => void;
    setProxyBasePath: (proxyBasePath: string) => void;
    hydrate: (config: Partial<DevConfig>) => void;
    reset: () => void;
}

const storage = createJSONStorage(() => localStorage);

export const useDevConfigStore = create<DevConfigState>()(
    persist(
        (set) => ({
            ...DEFAULT_DEV_CONFIG,
            setServerBaseUrl: (serverBaseUrl) => set({ serverBaseUrl }),
            setUseProxy: (useProxy) => set({ useProxy }),
            setProxyBasePath: (proxyBasePath) => set({ proxyBasePath }),
            hydrate: (config) => set({ ...DEFAULT_DEV_CONFIG, ...config }),
            reset: () => set({ ...DEFAULT_DEV_CONFIG })
        }),
        {
            name: 'jellyfin-dev-config',
            storage
        }
    )
);
