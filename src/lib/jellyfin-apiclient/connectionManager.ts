/**
 * Connection Manager
 *
 * Manages connections to Jellyfin servers with TypeScript typing.
 * This implementation wraps the legacy JavaScript ConnectionManager while
 * providing strict TypeScript types and gradual modernization.
 *
 * @see connectionManager.legacy.js - Legacy implementation
 */

import type { ApiClient } from 'jellyfin-apiclient';

import logger from '../../utils/logger';

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
        return (this.legacyManager as any).addApiClient(apiClient) as void;
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
        return (this.legacyManager as any).getAvailableServers() as ServerInfo[];
    }

    /**
     * Get saved servers
     */
    public getSavedServers(): ServerInfo[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).getSavedServers() as ServerInfo[];
    }

    /**
     * Connect to a server address
     */
    public async connectToAddress(address: string, options?: ConnectOptions): Promise<ConnectResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).connectToAddress(address, options) as Promise<ConnectResponse>;
    }

    /**
     * Connect to a specific server
     */
    public async connectToServer(server: ServerInfo, options?: ConnectOptions): Promise<ConnectResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).connectToServer(server, options) as Promise<ConnectResponse>;
    }

    /**
     * Connect to multiple servers
     */
    public async connectToServers(servers: ServerInfo[], options?: ConnectOptions): Promise<ConnectResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).connectToServers(servers, options) as Promise<ConnectResponse>;
    }

    /**
     * Connect with auto-discovery
     */
    public async connect(options?: ConnectOptions): Promise<ConnectResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).connect(options) as Promise<ConnectResponse>;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.legacyManager as any).logout() as Promise<void>;
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
