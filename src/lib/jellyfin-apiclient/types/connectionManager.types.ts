/**
 * ConnectionManager Type Definitions
 *
 * Provides strict TypeScript types for the connection management system.
 */

import type { ClientCapabilitiesDto, SystemInfo } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';

import type { ConnectionMode } from '../connectionMode';
import type { ConnectionState } from '../connectionState';

/**
 * Represents a server that can be connected to.
 */
export interface ServerInfo {
    Id: string;
    Name?: string;
    ManualAddress?: string;
    LocalAddress?: string;
    RemoteAddress?: string;
    LastConnectionMode?: ConnectionMode;
    DateLastAccessed?: number;
    UserId?: string | null;
    AccessToken?: string | null;
    ExchangeToken?: string | null;
    manualAddressOnly?: boolean;
    UserLinkType?: string;
}

/**
 * Options for connection operations.
 */
export interface ConnectOptions {
    enableAutoLogin?: boolean;
    enableAutomaticBitrateDetection?: boolean;
    enableWebSocket?: boolean;
    reportCapabilities?: boolean;
    updateDateLastAccessed?: boolean;
}

/**
 * Result of a connection attempt.
 */
export interface ConnectResponse {
    ApiClient?: ApiClient;
    Servers: ServerInfo[];
    State: ConnectionState;
    SystemInfo?: SystemInfo;
}

/**
 * Credentials provider interface.
 */
export interface CredentialProvider {
    credentials(): Credentials;
    credentials(data: Credentials): void;
    addOrUpdateServer(servers: ServerInfo[], server: ServerInfo): void;
}

/**
 * Stored credentials data structure.
 */
export interface Credentials {
    Servers: ServerInfo[];
}

/**
 * Authentication result from server.
 */
export interface AuthenticationResult {
    User: {
        Id: string;
        Name: string;
        ServerId?: string;
        HasPassword?: boolean;
        PrimaryImageTag?: string;
    };
    AccessToken: string;
    ServerId?: string;
    SessionInfo?: unknown;
}

/**
 * Configuration for ConnectionManager initialization.
 */
export interface ConnectionManagerConfig {
    credentialProvider: CredentialProvider;
    appName: string;
    appVersion: string;
    deviceName: string;
    deviceId: string;
    capabilities: ClientCapabilitiesDto;
}

/**
 * Internal state for tracking connection attempts.
 */
export interface ConnectionAttempt {
    serverId: string;
    serverUrl: string;
    startTime: number;
    endTime?: number;
    success?: boolean;
    error?: string;
    connectionMode?: ConnectionMode;
}

/**
 * WebSocket state information.
 */
export interface WebSocketState {
    isOpen: boolean;
    isConnecting: boolean;
    lastError?: string;
    reconnectAttempts: number;
    lastConnectedTime?: number;
}

/**
 * Options for trying to reconnect to a server.
 */
export interface TryReconnectOptions {
    serverAddress?: string;
    manualAddress?: string;
    port?: number;
}
