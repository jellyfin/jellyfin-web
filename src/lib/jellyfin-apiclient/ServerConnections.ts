/**
 * Server Connections
 *
 * Singleton instance managing connections to Jellyfin servers.
 * Provides typed interface for server connection management.
 *
 * @see ServerConnections.legacy.js - Legacy implementation
 */

import type { Api } from '@jellyfin/sdk';
import type { ApiClient } from 'jellyfin-apiclient';

import type { ConnectOptions, ConnectResponse, ServerInfo } from './types/connectionManager.types';

/**
 * ServerConnections Wrapper
 *
 * Wraps the legacy ServerConnections singleton with TypeScript typing.
 */
export interface IServerConnections {
    // Properties
    localApiClient: ApiClient | null;
    firstConnection: Promise<ConnectResponse> | null;
    devServerAddress: string | null;

    // ConnectionManager methods
    appVersion(): string;
    appName(): string;
    deviceId(): string;
    deviceName(): string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capabilities(): any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credentialProvider(): any;
    getServerInfo(id: string): ServerInfo | undefined;
    getLastUsedServer(): ServerInfo | null;
    addApiClient(apiClient: ApiClient): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getApiClient(idOrItem: string | any): ApiClient | undefined;
    getOrCreateApiClient(serverId: string): ApiClient;
    getApiClients(): ApiClient[];
    getAvailableServers(): ServerInfo[];
    getSavedServers(): ServerInfo[];
    connectToAddress(address: string, options?: ConnectOptions): Promise<ConnectResponse>;
    connectToServer(server: ServerInfo, options?: ConnectOptions): Promise<ConnectResponse>;
    connectToServers(servers: ServerInfo[], options?: ConnectOptions): Promise<ConnectResponse>;
    connect(options?: ConnectOptions): Promise<ConnectResponse>;
    deleteServer(serverId: string): Promise<void>;
    clearData(): void;
    logout(): Promise<void>;
    minServerVersion(val?: string): string;
    updateSavedServerId(server: ServerInfo): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user(apiClient: ApiClient): Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMessageReceived(msg: any): void;

    // ServerConnections-specific methods
    initApiClient(server: string): void;
    currentApiClient(): ApiClient | null;
    getLocalApiClient(): ApiClient | null;
    setLocalApiClient(apiClient: ApiClient | null): void;
    getCurrentApi(): Api | undefined;
    getCurrentApiClientAsync(): Promise<ApiClient>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onLocalUserSignedIn(user: any): Promise<void>;
    setDevServerAddress(address: string | null): void;
    applyDevServerAddress(): void;
}

/**
 * Get the singleton ServerConnections instance
 *
 * For backward compatibility, the legacy ServerConnections.legacy.js file
 * is loaded dynamically and returned as a typed singleton.
 */
function getServerConnections(): IServerConnections {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const legacyModule = require('./ServerConnections.legacy.js');
    return legacyModule.default as IServerConnections;
}

// Export the singleton
export const ServerConnections: IServerConnections = getServerConnections();

// Also export as default for backward compatibility
export default ServerConnections;
