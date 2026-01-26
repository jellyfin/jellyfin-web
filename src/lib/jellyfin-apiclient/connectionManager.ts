/**
 * Connection Manager
 *
 * Manages connections to Jellyfin servers with TypeScript typing.
 * This implementation wraps the legacy JavaScript ConnectionManager while
 * providing strict TypeScript types and gradual modernization.
 *
 * Phase 2 Enhancement: Dual-write pattern syncs with Zustand store
 * for modern state management alongside legacy events.
 *
 * @see connectionManager.legacy.js - Legacy implementation
 */

import type { ApiClient } from 'jellyfin-apiclient';

import { useConnectionStore } from '../../store/connectionStore';
import logger from '../../utils/logger';

import { ConnectionState } from './connectionState';
import type { ConnectOptions, ConnectResponse, CredentialProvider, ServerInfo } from './types/connectionManager.types';

/**
 * Internal reference to the legacy ConnectionManager class.
 * Dynamically imported to support gradual TypeScript migration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LegacyConnectionManager: any;

/**
 * ConnectionManager
 *
 * Provides typed interface for server connection management.
 * Maintains backward compatibility with existing event-driven architecture.
 *
 * For backward compatibility, external code should listen to events on
 * the ServerConnections.connectionManager instance, not directly on this class.
 */
export class ConnectionManager {
    private readonly legacyManager: unknown;
    private connectionStartTime: number;

    // eslint-disable-next-line max-params
    constructor(
        credentialProvider: CredentialProvider,
        appName: string,
        appVersion: string,
        deviceName: string,
        deviceId: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        capabilities: any
    ) {
        logger.debug('ConnectionManager constructor starting', { component: 'ConnectionManager' });

        this.connectionStartTime = 0;

        // Dynamically load legacy implementation if not already loaded
        if (LegacyConnectionManager === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const legacyModule = require('./connectionManager.legacy.js');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            LegacyConnectionManager = legacyModule.default ?? (legacyModule as any);
        }

        // Create instance of legacy ConnectionManager
        // The legacy manager handles all event triggering internally
        this.legacyManager = new LegacyConnectionManager(
            credentialProvider,
            appName,
            appVersion,
            deviceName,
            deviceId,
            capabilities
        ) as unknown;
    }

    /**
     * Sync API client to connection store
     * Part of Phase 2 dual-write pattern
     */
    private syncApiClientToStore(apiClient: ApiClient | null): void {
        try {
            const store = useConnectionStore.getState();
            store.setCurrentApiClient(apiClient);

            if (apiClient !== null) {
                // Extract server ID from API client if available
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const serverId = (apiClient as any).serverId ?? (apiClient as any).serverInfo?.Id;
                if (serverId !== null && serverId !== undefined) {
                    store.setCurrentServerId(serverId as string);
                }
            }
        } catch (error) {
            // Silently fail if store not available (during testing or initialization)
            logger.debug('Failed to sync API client to store', {
                component: 'ConnectionManager',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Record connection attempt in store
     * Part of Phase 2 dual-write pattern
     */
    private recordConnectionAttempt(
        serverId: string,
        serverName: string,
        result: 'success' | 'failure',
        duration: number,
        error?: string
    ): void {
        try {
            const store = useConnectionStore.getState();
            store.addConnectionAttempt({
                serverId,
                serverName,
                timestamp: Date.now(),
                duration,
                result,
                error
            });

            if (error !== undefined) {
                logger.warn('Connection attempt failed', {
                    component: 'ConnectionManager',
                    serverId,
                    error
                });
            }
        } catch (err) {
            // Silently fail if store not available
            logger.debug('Failed to record connection attempt', {
                component: 'ConnectionManager',
                error: err instanceof Error ? err.message : String(err)
            });
        }
    }

    /**
     * Update available servers in store
     * Part of Phase 2 dual-write pattern
     */
    private syncServersToStore(servers: ServerInfo[]): void {
        try {
            const store = useConnectionStore.getState();
            store.setAvailableServers(servers);
        } catch (error) {
            logger.debug('Failed to sync servers to store', {
                component: 'ConnectionManager',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Get app version
     */
    public appVersion(): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).appVersion() as string;
    }

    /**
     * Get app name
     */
    public appName(): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).appName() as string;
    }

    /**
     * Get device ID
     */
    public deviceId(): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).deviceId() as string;
    }

    /**
     * Get device name
     */
    public deviceName(): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).deviceName() as string;
    }

    /**
     * Get capabilities
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public capabilities(): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).capabilities() as any;
    }

    /**
     * Get credential provider
     */
    public credentialProvider(): CredentialProvider {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).credentialProvider() as CredentialProvider;
    }

    /**
     * Get server info by ID
     */
    public getServerInfo(id: string): ServerInfo | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getServerInfo(id) as ServerInfo | undefined;
    }

    /**
     * Get last used server
     */
    public getLastUsedServer(): ServerInfo | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getLastUsedServer() as ServerInfo | null;
    }

    /**
     * Add an API client
     */
    public addApiClient(apiClient: ApiClient): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.legacyManager as any).addApiClient(apiClient) as void;
        this.syncApiClientToStore(apiClient);
    }

    /**
     * Get API client by ID or item
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getApiClient(idOrItem: string | any): ApiClient | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getApiClient(idOrItem) as ApiClient | undefined;
    }

    /**
     * Get or create API client by server ID
     */
    public getOrCreateApiClient(serverId: string): ApiClient {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getOrCreateApiClient(serverId) as ApiClient;
    }

    /**
     * Get all API clients
     */
    public getApiClients(): ApiClient[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getApiClients() as ApiClient[];
    }

    /**
     * Get current API client
     */
    public currentApiClient(): ApiClient | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).currentApiClient() as ApiClient | null;
    }

    /**
     * Get local API client
     */
    public getLocalApiClient(): ApiClient | null {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getLocalApiClient() as ApiClient | null;
    }

    /**
     * Set local API client
     */
    public setLocalApiClient(apiClient: ApiClient): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).setLocalApiClient(apiClient) as void;
    }

    /**
     * Get available servers
     */
    public getAvailableServers(): ServerInfo[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const servers = (this.legacyManager as any).getAvailableServers() as ServerInfo[];
        this.syncServersToStore(servers);
        return servers;
    }

    /**
     * Get saved servers
     */
    public getSavedServers(): ServerInfo[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const servers = (this.legacyManager as any).getSavedServers() as ServerInfo[];
        this.syncServersToStore(servers);
        return servers;
    }

    /**
     * Connect to a server address
     */
    public async connectToAddress(address: string, options?: ConnectOptions): Promise<ConnectResponse> {
        this.connectionStartTime = Date.now();

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (this.legacyManager as any).connectToAddress(address, options);
            const duration = Date.now() - this.connectionStartTime;

            this.recordConnectionAttempt(address, address, 'success', duration);
            return result as ConnectResponse;
        } catch (error) {
            const duration = Date.now() - this.connectionStartTime;
            this.recordConnectionAttempt(
                address,
                address,
                'failure',
                duration,
                error instanceof Error ? error.message : String(error)
            );
            throw error;
        }
    }

    /**
     * Connect to a specific server
     */
    public async connectToServer(server: ServerInfo, options?: ConnectOptions): Promise<ConnectResponse> {
        this.connectionStartTime = Date.now();

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (this.legacyManager as any).connectToServer(server, options);
            const duration = Date.now() - this.connectionStartTime;

            this.recordConnectionAttempt(
                server.Id,
                server.Name ?? 'Unknown Server',
                'success',
                duration
            );

            // Sync API client if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiClient = (result as any)?.ApiClient;
            if (apiClient !== undefined && apiClient !== null) {
                this.syncApiClientToStore(apiClient);
            }

            return result as ConnectResponse;
        } catch (error) {
            const duration = Date.now() - this.connectionStartTime;
            this.recordConnectionAttempt(
                server.Id,
                server.Name ?? 'Unknown Server',
                'failure',
                duration,
                error instanceof Error ? error.message : String(error)
            );
            throw error;
        }
    }

    /**
     * Connect to multiple servers
     */
    public async connectToServers(servers: ServerInfo[], options?: ConnectOptions): Promise<ConnectResponse> {
        this.connectionStartTime = Date.now();
        const attemptedServer = servers[0];

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (this.legacyManager as any).connectToServers(servers, options);
            const duration = Date.now() - this.connectionStartTime;

            this.recordConnectionAttempt(
                attemptedServer.Id,
                attemptedServer.Name ?? 'Unknown Server',
                'success',
                duration
            );

            // Sync API client if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiClient = (result as any)?.ApiClient;
            if (apiClient !== undefined && apiClient !== null) {
                this.syncApiClientToStore(apiClient);
            }

            return result as ConnectResponse;
        } catch (error) {
            const duration = Date.now() - this.connectionStartTime;
            this.recordConnectionAttempt(
                attemptedServer.Id,
                attemptedServer.Name ?? 'Unknown Server',
                'failure',
                duration,
                error instanceof Error ? error.message : String(error)
            );
            throw error;
        }
    }

    /**
     * Connect with auto-discovery
     */
    public async connect(options?: ConnectOptions): Promise<ConnectResponse> {
        this.connectionStartTime = Date.now();

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (this.legacyManager as any).connect(options);
            const duration = Date.now() - this.connectionStartTime;

            // Extract server info from result
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resultTyped = result as any;
            const serverId = resultTyped?.Servers?.[0]?.Id ?? 'auto-discovery';
            const serverName = resultTyped?.Servers?.[0]?.Name ?? 'Auto-discovered Server';

            this.recordConnectionAttempt(serverId, serverName, 'success', duration);

            // Sync API client if available
            const apiClient = resultTyped?.ApiClient;
            if (apiClient !== undefined && apiClient !== null) {
                this.syncApiClientToStore(apiClient);
            }

            return result as ConnectResponse;
        } catch (error) {
            const duration = Date.now() - this.connectionStartTime;
            this.recordConnectionAttempt(
                'auto-discovery',
                'Auto-discovery',
                'failure',
                duration,
                error instanceof Error ? error.message : String(error)
            );
            throw error;
        }
    }

    /**
     * Delete a server
     */
    public async deleteServer(serverId: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).deleteServer(serverId) as Promise<void>;
    }

    /**
     * Clear all data
     */
    public clearData(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).clearData() as void;
    }

    /**
     * Logout current user
     */
    public async logout(): Promise<void> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (this.legacyManager as any).logout();

            // Sync store to reflect logged-out state
            try {
                const store = useConnectionStore.getState();
                store.setCurrentApiClient(null);
                store.setCurrentUserId(undefined);
                store.setCurrentState(ConnectionState.ServerSelection);
            } catch (error) {
                logger.debug('Failed to sync logout to store', {
                    component: 'ConnectionManager',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        } catch (error) {
            logger.warn('Logout failed', {
                component: 'ConnectionManager',
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get minimum server version
     */
    public minServerVersion(val?: string): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).minServerVersion(val) as string;
    }

    /**
     * Update saved server ID
     */
    public async updateSavedServerId(server: ServerInfo): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).updateSavedServerId(server) as Promise<void>;
    }

    /**
     * Get user information
     */
    public async user(apiClient: ApiClient): Promise<unknown> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).user(apiClient) as Promise<unknown>;
    }

    /**
     * Handle server message
     */
    public handleMessageReceived(msg: unknown): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).handleMessageReceived(msg) as void;
    }
}

export default ConnectionManager;
