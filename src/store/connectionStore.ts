/**
 * Connection Store - Modern Connection State Management
 *
 * Zustand store for managing Jellyfin server connection state.
 * This store provides:
 * - Current connection state (SignedIn, ServerSelection, etc.)
 * - WebSocket lifecycle tracking (connected, attempting, failed)
 * - Connection attempt history with timestamps and results
 * - Current and available servers
 * - Current API client reference
 * - Error tracking and recovery
 *
 * Used alongside legacy event system for gradual migration to modern patterns.
 * Enables declarative state management while preserving backward compatibility.
 */

import type { ApiClient } from 'jellyfin-apiclient';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { ConnectionState } from '../lib/jellyfin-apiclient/connectionState';
import type { ServerInfo } from '../lib/jellyfin-apiclient/types/connectionManager.types';

/**
 * WebSocket connection status tracking
 */
type WebSocketState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Single connection attempt record
 */
interface ConnectionAttempt {
    serverId: string;
    serverName: string;
    timestamp: number;
    duration: number; // ms
    result: 'success' | 'failure';
    error?: string;
}

/**
 * Connection metrics for observability
 */
interface ConnectionMetrics {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageConnectionTime: number; // ms
    lastConnectionTime?: number;
    lastError?: string;
}

/**
 * Core connection store state and actions
 */
interface ConnectionStore {
    // Current Connection State
    currentState: ConnectionState;
    setCurrentState: (state: ConnectionState) => void;

    // WebSocket Lifecycle
    webSocketState: WebSocketState;
    setWebSocketState: (state: WebSocketState) => void;
    webSocketConnectedAt?: number;
    webSocketError?: string;

    // Current Server & API Client
    currentServerId?: string;
    setCurrentServerId: (serverId: string | undefined) => void;
    currentApiClient: ApiClient | null;
    setCurrentApiClient: (client: ApiClient | null) => void;

    // Available Servers
    availableServers: ServerInfo[];
    setAvailableServers: (servers: ServerInfo[]) => void;

    // Current User ID (for context)
    currentUserId?: string;
    setCurrentUserId: (userId: string | undefined) => void;

    // Connection Attempts History
    connectionAttempts: ConnectionAttempt[];
    addConnectionAttempt: (attempt: ConnectionAttempt) => void;
    clearConnectionHistory: () => void;

    // Error State
    lastError?: string;
    setLastError: (error: string | undefined) => void;

    // Metrics
    metrics: ConnectionMetrics;
    updateMetrics: (update: Partial<ConnectionMetrics>) => void;

    // Bulk Reset
    reset: () => void;
}

/**
 * Initial state values
 */
const initialState = {
    currentState: ConnectionState.ServerSelection,
    webSocketState: 'idle' as WebSocketState,
    webSocketConnectedAt: undefined,
    webSocketError: undefined,
    currentServerId: undefined,
    currentApiClient: null,
    availableServers: [],
    currentUserId: undefined,
    connectionAttempts: [],
    lastError: undefined,
    metrics: {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageConnectionTime: 0,
        lastConnectionTime: undefined,
        lastError: undefined
    }
};

/**
 * Connection store with WebSocket state and metrics
 *
 * Maintains dual-sync with legacy event system:
 * - Stores updates are triggered by ConnectionManager events
 * - Store changes trigger logging and metrics
 * - Enables gradual migration to modern patterns
 */
export const useConnectionStore = create<ConnectionStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        ...initialState,

        // Connection State Management
        setCurrentState: (state: ConnectionState) => {
            set({ currentState: state });
        },

        // WebSocket Lifecycle Management
        setWebSocketState: (state: WebSocketState) => {
            const now = Date.now();
            const isConnected = state === 'connected';
            const isFailed = state === 'error';

            set({
                webSocketState: state,
                webSocketConnectedAt: isConnected ? now : undefined,
                webSocketError: isFailed ? 'WebSocket error' : undefined
            });
        },

        // Server Management
        setCurrentServerId: (serverId: string | undefined) => {
            set({ currentServerId: serverId });
        },

        setCurrentApiClient: (client: ApiClient | null) => {
            set({ currentApiClient: client });
        },

        setAvailableServers: (servers: ServerInfo[]) => {
            set({ availableServers: servers });
        },

        // User Context
        setCurrentUserId: (userId: string | undefined) => {
            set({ currentUserId: userId });
        },

        // Connection Attempt Tracking
        addConnectionAttempt: (attempt: ConnectionAttempt) => {
            const { connectionAttempts, metrics } = get();
            const newAttempts = [...connectionAttempts, attempt];

            // Keep only last 50 attempts to avoid memory bloat
            const recentAttempts = newAttempts.slice(-50);

            // Update metrics
            const successCount =
                metrics.successfulAttempts + (attempt.result === 'success' ? 1 : 0);
            const failCount = metrics.failedAttempts + (attempt.result === 'failure' ? 1 : 0);
            const totalAttempts = metrics.totalAttempts + 1;

            // Calculate average connection time
            const successfulAttempts = recentAttempts.filter((a) => a.result === 'success');
            const avgTime =
                successfulAttempts.length > 0
                    ? successfulAttempts.reduce((sum, a) => sum + a.duration, 0) /
                      successfulAttempts.length
                    : 0;

            const newMetrics: ConnectionMetrics = {
                totalAttempts,
                successfulAttempts: successCount,
                failedAttempts: failCount,
                averageConnectionTime: avgTime,
                lastConnectionTime: attempt.result === 'success' ? attempt.duration : undefined,
                lastError: attempt.result === 'failure' ? attempt.error : undefined
            };

            set({
                connectionAttempts: recentAttempts,
                metrics: newMetrics,
                lastError: attempt.result === 'failure' ? attempt.error : undefined
            });
        },

        clearConnectionHistory: () => {
            set({ connectionAttempts: [] });
        },

        // Error Management
        setLastError: (error: string | undefined) => {
            set({ lastError: error });
        },

        // Metrics Management
        updateMetrics: (update: Partial<ConnectionMetrics>) => {
            const { metrics } = get();
            set({
                metrics: {
                    ...metrics,
                    ...update
                }
            });
        },

        // Reset entire store
        reset: () => {
            set(initialState);
        }
    }))
);

/**
 * Export factory function for testing with custom initial state
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createConnectionStore(initialValues?: Partial<ConnectionStore>) {
    return create<ConnectionStore>()(
        subscribeWithSelector((set, get) => ({
            ...initialState,
            ...initialValues,

            setCurrentState: (state: ConnectionState) => {
                set({ currentState: state });
            },

            setWebSocketState: (state: WebSocketState) => {
                const now = Date.now();
                set({
                    webSocketState: state,
                    webSocketConnectedAt: state === 'connected' ? now : undefined,
                    webSocketError: state === 'error' ? 'WebSocket error' : undefined
                });
            },

            setCurrentServerId: (serverId: string | undefined) => {
                set({ currentServerId: serverId });
            },

            setCurrentApiClient: (client: ApiClient | null) => {
                set({ currentApiClient: client });
            },

            setAvailableServers: (servers: ServerInfo[]) => {
                set({ availableServers: servers });
            },

            setCurrentUserId: (userId: string | undefined) => {
                set({ currentUserId: userId });
            },

            addConnectionAttempt: (attempt: ConnectionAttempt) => {
                const { connectionAttempts, metrics } = get();
                const newAttempts = [...connectionAttempts, attempt].slice(-50);

                const successCount =
                    metrics.successfulAttempts + (attempt.result === 'success' ? 1 : 0);
                const failCount = metrics.failedAttempts + (attempt.result === 'failure' ? 1 : 0);

                const successfulAttempts = newAttempts.filter((a) => a.result === 'success');
                const avgTime =
                    successfulAttempts.length > 0
                        ? successfulAttempts.reduce((sum, a) => sum + a.duration, 0) /
                          successfulAttempts.length
                        : 0;

                set({
                    connectionAttempts: newAttempts,
                    metrics: {
                        totalAttempts: metrics.totalAttempts + 1,
                        successfulAttempts: successCount,
                        failedAttempts: failCount,
                        averageConnectionTime: avgTime,
                        lastConnectionTime:
                            attempt.result === 'success' ? attempt.duration : undefined,
                        lastError: attempt.result === 'failure' ? attempt.error : undefined
                    },
                    lastError: attempt.result === 'failure' ? attempt.error : undefined
                });
            },

            clearConnectionHistory: () => {
                set({ connectionAttempts: [] });
            },

            setLastError: (error: string | undefined) => {
                set({ lastError: error });
            },

            updateMetrics: (update: Partial<ConnectionMetrics>) => {
                const { metrics } = get();
                set({
                    metrics: {
                        ...metrics,
                        ...update
                    }
                });
            },

            reset: () => {
                set(initialState);
            }
        }))
    );
}

/**
 * Type exports for consumers
 */
export type { ConnectionStore, WebSocketState, ConnectionAttempt, ConnectionMetrics };
