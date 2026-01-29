/**
 * API Store
 *
 * Zustand store for managing Jellyfin API state and user.
 */

import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface JellyfinApiContext {
    __legacyApiClient__?: any; // ApiClient from jellyfin-apiclient
    api?: Api;
    user?: UserDto;
}

export interface ApiState {
    context: JellyfinApiContext;
    isLoading: boolean;

    // Actions
    setLegacyApiClient: (client: any) => void;
    setApi: (api: Api | undefined) => void;
    setUser: (user: UserDto | undefined) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

const initialContext: JellyfinApiContext = {};

export const useApiStore = create<ApiState>()(
    subscribeWithSelector((set) => ({
        context: { ...initialContext },
        isLoading: false,

        setLegacyApiClient: (client) =>
            set((state) => ({
                context: { ...state.context, __legacyApiClient__: client }
            })),

        setApi: (api) =>
            set((state) => ({
                context: { ...state.context, api }
            })),

        setUser: (user) =>
            set((state) => ({
                context: { ...state.context, user }
            })),

        setLoading: (loading) => set({ isLoading: loading }),

        reset: () => set({ context: { ...initialContext }, isLoading: false })
    }))
);

// Hook for useApi
export const useApi = () => useApiStore((state) => state.context);
