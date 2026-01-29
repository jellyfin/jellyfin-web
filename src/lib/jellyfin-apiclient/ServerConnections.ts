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

import { logger } from '../../utils/logger';
import type {
    ConnectOptions,
    ConnectResponse,
    CredentialProvider,
    ServerInfo
} from './types/connectionManager.types';

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
    credentialProvider(): CredentialProvider;
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
let cachedServerConnections: IServerConnections | undefined;

export function getServerConnections(): IServerConnections {
    if (!cachedServerConnections) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const legacyModule = require('./ServerConnections.legacy.js');
            cachedServerConnections = legacyModule.default as IServerConnections;
        } catch (error) {
            logger.error(
                'Failed to load ServerConnections.legacy.js',
                { component: 'ServerConnections' },
                error as Error
            );
            throw error;
        }
    }
    return cachedServerConnections;
}

// Create a simple wrapper object that loads the actual ServerConnections on first access
class LazyServerConnections {
    private _instance: IServerConnections | null = null;

    private getInstance(): IServerConnections {
        if (!this._instance) {
            this._instance = getServerConnections();
        }
        return this._instance;
    }

    // Implement all IServerConnections methods by delegating to the actual instance
    [key: string]: unknown;
}

// Create a proxy-like object using getter/setter
const handler = {
    get(_target: unknown, prop: string | symbol): unknown {
        if (typeof prop === 'symbol') return undefined;
        const instance = getServerConnections();
        return (instance as unknown as { [key: string]: unknown })[prop as string];
    }
};

export const ServerConnections = new Proxy(
    new LazyServerConnections(),
    handler
) as unknown as IServerConnections;

// Also export as default for backward compatibility
export default ServerConnections;
