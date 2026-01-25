/**
 * Server Store
 *
 * Zustand store for managing server connections.
 */

import { create } from 'zustand';

export interface ServerInfo {
    id: string;
    name: string;
    address: string;
    localAddress: string;
    remoteAddress: string;
    manualAddress: string;
    lastConnectionMode: number;
    dateLastAccessed: number;
    userId: string | null;
    accessToken: string | null;
}

export interface ServerState {
    servers: ServerInfo[];
    currentServer: ServerInfo | null;
    isConnecting: boolean;
    error: string | null;

    // Actions
    setServers: (servers: ServerInfo[]) => void;
    addServer: (server: ServerInfo) => void;
    removeServer: (id: string) => void;
    setCurrentServer: (server: ServerInfo | null) => void;
    setConnecting: (connecting: boolean) => void;
    setError: (error: string | null) => void;
    clearServers: () => void;
}

const initialState = {
    servers: [] as ServerInfo[],
    currentServer: null as ServerInfo | null,
    isConnecting: false,
    error: null as string | null,
};

export const useServerStore = create<ServerState>((set) => ({
    ...initialState,

    setServers: (servers) => set({ servers }),

    addServer: (server) => set((state) => ({
        servers: [...state.servers, server],
    })),

    removeServer: (id) => set((state) => ({
        servers: state.servers.filter((s) => s.id !== id),
    })),

    setCurrentServer: (server) => set({ currentServer: server }),

    setConnecting: (connecting) => set({ isConnecting: connecting }),

    setError: (error) => set({ error }),

    clearServers: () => set(initialState),
}));
