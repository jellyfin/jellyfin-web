/**
 * Connection Hooks - React Query Integration for Connection Management
 *
 * Phase 3: Modern React hooks for Jellyfin server connections using React Query.
 * Provides:
 * - useAvailableServers() - Query for discovering available servers
 * - useConnectToServer() - Mutation for connecting to a specific server
 * - useConnectToAddress() - Mutation for connecting to manual address
 * - usePublicSystemInfo() - Query for server public system information
 * - useConnectionStatus() - Hook for accessing current connection state from store
 *
 * All hooks follow project patterns with proper query keys, caching, retry logic,
 * and error handling. Compatible with legacy event system through dual-write.
 */

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ServerConnections } from '../lib/jellyfin-apiclient';
import type {
    ConnectOptions,
    ConnectResponse,
    ServerInfo
} from '../lib/jellyfin-apiclient/types/connectionManager.types';
import { useConnectionStore } from '../store/connectionStore';
import logger from '../utils/logger';

/**
 * Query Keys for connection-related queries
 */
export const connectionQueryKeys = {
    all: ['connection'] as const,
    servers: () => [...connectionQueryKeys.all, 'servers'] as const,
    availableServers: () => [...connectionQueryKeys.servers(), 'available'] as const,
    savedServers: () => [...connectionQueryKeys.servers(), 'saved'] as const,
    publicSystemInfo: (serverId: string) =>
        [...connectionQueryKeys.all, 'publicSystemInfo', serverId] as const,
    status: () => [...connectionQueryKeys.all, 'status'] as const
} as const;

/**
 * Fetch available servers - servers discovered via auto-discovery or manual entry
 */
const fetchAvailableServers = async (): Promise<ServerInfo[]> => {
    try {
        const servers = ServerConnections.getAvailableServers();
        logger.debug('Fetched available servers', {
            component: 'useAvailableServers',
            count: servers.length
        });
        return servers;
    } catch (error) {
        logger.error('Failed to fetch available servers', {
            component: 'useAvailableServers',
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
};

/**
 * Query options for available servers
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getAvailableServersQuery = () =>
    queryOptions({
        queryKey: connectionQueryKeys.availableServers(),
        queryFn: fetchAvailableServers,
        staleTime: 30000, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false
    });

/**
 * Hook: useAvailableServers
 * Queries for available servers (those previously connected or discovered)
 *
 * Usage:
 *   const { data: servers, isLoading, error } = useAvailableServers();
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useAvailableServers = () => {
    return useQuery(getAvailableServersQuery());
};

/**
 * Fetch saved servers - servers with stored connection info
 */
const fetchSavedServers = async (): Promise<ServerInfo[]> => {
    try {
        const servers = ServerConnections.getSavedServers();
        logger.debug('Fetched saved servers', {
            component: 'useSavedServers',
            count: servers.length
        });
        return servers;
    } catch (error) {
        logger.error('Failed to fetch saved servers', {
            component: 'useSavedServers',
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
};

/**
 * Query options for saved servers
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getSavedServersQuery = () =>
    queryOptions({
        queryKey: connectionQueryKeys.savedServers(),
        queryFn: fetchSavedServers,
        staleTime: 30000, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false
    });

/**
 * Hook: useSavedServers
 * Queries for servers with saved connection information
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useSavedServers = () => {
    return useQuery(getSavedServersQuery());
};

/**
 * Mutation: connectToServer
 * Attempts to establish connection to a specific server
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useConnectToServer = () => {
    const queryClient = useQueryClient();
    const store = useConnectionStore();

    return useMutation({
        mutationFn: async (
            payload: { server: ServerInfo; options?: ConnectOptions } | ServerInfo
        ): Promise<ConnectResponse> => {
            const server = 'Id' in payload ? payload : payload.server;
            const options = !('Id' in payload) ? payload.options : undefined;

            logger.debug('Starting connection to server', {
                component: 'useConnectToServer',
                serverId: server.Id,
                serverName: server.Name
            });

            return ServerConnections.connectToServer(server, options);
        },
        onSuccess: (response, variables) => {
            const server = 'Id' in variables ? variables : variables.server;

            logger.debug('Successfully connected to server', {
                component: 'useConnectToServer',
                serverId: server.Id
            });

            // Invalidate related queries
            void queryClient.invalidateQueries({
                queryKey: connectionQueryKeys.availableServers()
            });
            void queryClient.invalidateQueries({ queryKey: connectionQueryKeys.savedServers() });
            void queryClient.invalidateQueries({ queryKey: connectionQueryKeys.status() });

            // Update store (already done by ConnectionManager, but ensure consistency)
            if (response.ApiClient) {
                store.setCurrentApiClient(response.ApiClient);
                store.setCurrentServerId(server.Id);
            }
        },
        onError: (error, variables) => {
            const server = 'Id' in variables ? variables : variables.server;

            logger.warn('Failed to connect to server', {
                component: 'useConnectToServer',
                serverId: server.Id,
                error: error instanceof Error ? error.message : String(error)
            });

            // Update store error state
            store.setLastError(error instanceof Error ? error.message : String(error));
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000) // Exponential backoff
    });
};

/**
 * Mutation: connectToAddress
 * Attempts to connect to a server using manual address
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useConnectToAddress = () => {
    const queryClient = useQueryClient();
    const store = useConnectionStore();

    return useMutation({
        mutationFn: async (payload: {
            address: string;
            options?: ConnectOptions;
        }): Promise<ConnectResponse> => {
            logger.debug('Starting connection to address', {
                component: 'useConnectToAddress',
                address: payload.address
            });

            return ServerConnections.connectToAddress(payload.address, payload.options);
        },
        onSuccess: (response, variables) => {
            logger.debug('Successfully connected to address', {
                component: 'useConnectToAddress',
                address: variables.address
            });

            // Invalidate related queries
            void queryClient.invalidateQueries({
                queryKey: connectionQueryKeys.availableServers()
            });
            void queryClient.invalidateQueries({ queryKey: connectionQueryKeys.status() });

            // Update store
            if (response.ApiClient && response.Servers.length > 0) {
                store.setCurrentApiClient(response.ApiClient);
                store.setCurrentServerId(response.Servers[0].Id);
            }
        },
        onError: (error, variables) => {
            logger.warn('Failed to connect to address', {
                component: 'useConnectToAddress',
                address: variables.address,
                error: error instanceof Error ? error.message : String(error)
            });

            store.setLastError(error instanceof Error ? error.message : String(error));
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
    });
};

/**
 * Mutation: useLogout
 * Logs out the current user and clears connection state
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useLogout = () => {
    const queryClient = useQueryClient();
    const store = useConnectionStore();

    return useMutation({
        mutationFn: async (): Promise<void> => {
            logger.debug('Logging out', {
                component: 'useLogout'
            });

            return ServerConnections.logout();
        },
        onSuccess: () => {
            logger.debug('Successfully logged out', {
                component: 'useLogout'
            });

            // Clear all connection queries
            void queryClient.invalidateQueries({ queryKey: connectionQueryKeys.all });

            // Reset store
            store.reset();
        },
        onError: (error) => {
            logger.warn('Logout failed', {
                component: 'useLogout',
                error: error instanceof Error ? error.message : String(error)
            });

            store.setLastError(error instanceof Error ? error.message : String(error));
        }
    });
};

/**
 * Hook: useConnectionStatus
 * Provides current connection status from store
 *
 * Usage:
 *   const { currentState, webSocketState, currentApiClient, metrics } = useConnectionStatus();
 *
 * Returns object with:
 *   - currentState: ConnectionState enum value
 *   - webSocketState: WebSocket connection state
 *   - currentServerId: Current connected server ID
 *   - currentApiClient: Current API client instance
 *   - currentUserId: Current user ID
 *   - metrics: Connection metrics (attempts, success rate, avg time)
 *   - lastError: Last error message if any
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useConnectionStatus = () => {
    return useConnectionStore((state) => ({
        currentState: state.currentState,
        webSocketState: state.webSocketState,
        currentServerId: state.currentServerId,
        currentApiClient: state.currentApiClient,
        currentUserId: state.currentUserId,
        metrics: state.metrics,
        lastError: state.lastError,
        availableServers: state.availableServers
    }));
};

/**
 * Hook: useConnectionMetrics
 * Provides connection attempt metrics and history
 *
 * Usage:
 *   const { metrics, connectionAttempts, clearHistory } = useConnectionMetrics();
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useConnectionMetrics = () => {
    return useConnectionStore((state) => ({
        metrics: state.metrics,
        connectionAttempts: state.connectionAttempts,
        clearHistory: state.clearConnectionHistory,
        addAttempt: state.addConnectionAttempt
    }));
};

/**
 * Hook: useAvailableServersWithStatus
 * Combines available servers query with connection status
 *
 * Usage:
 *   const { data: servers, currentServerId, currentServer, isLoading } = useAvailableServersWithStatus();
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useAvailableServersWithStatus = () => {
    const serversQuery = useAvailableServers();
    const status = useConnectionStatus();

    return {
        ...serversQuery,
        currentServerId: status.currentServerId,
        currentServer: serversQuery.data?.find((s) => s.Id === status.currentServerId)
    };
};
