import { beforeEach, describe, expect, it, vi } from 'vitest';

type Server = {
    Id: string;
    ManualAddress?: string;
    UserId?: string | null;
    AccessToken?: string | null;
    DateLastAccessed?: number;
};

type CredentialsState = { Servers: Server[] };

type AuthResult = {
    ServerId: string;
    AccessToken: string;
    User: { Id: string };
};

// Mock the external jellyfin-apiclient dependency used by ConnectionManager so the test
// is purely about credential persistence behavior.
vi.mock('jellyfin-apiclient', () => {
    class ApiClientMock {
        private readonly _serverUrl: string;
        private _serverInfo?: Server;
        public onAuthenticated?: (instance: ApiClientMock, result: AuthResult) => unknown;
        public enableAutomaticBitrateDetection?: unknown;
        public lastAuth?: { accessToken: string | null; userId: string | null };
        public reportedCapabilities = false;
        public lastReportedCapabilities: unknown;
        public ensuredWebSocket = false;
        public extraArgsCount = 0;

        constructor(serverUrl: string, ...rest: unknown[]) {
            this._serverUrl = serverUrl;
            this.extraArgsCount = rest.length;
        }

        serverInfo(server?: Server) {
            if (server) this._serverInfo = server;
            return this._serverInfo as Server;
        }

        setAuthenticationInfo(accessToken: string | null, userId: string | null) {
            this.lastAuth = { accessToken, userId };
        }

        serverAddress() {
            return this._serverUrl;
        }

        reportCapabilities(capabilities: unknown) {
            this.reportedCapabilities = true;
            this.lastReportedCapabilities = capabilities;
        }

        ensureWebSocket() {
            this.ensuredWebSocket = true;
        }
    }

    return { ApiClient: ApiClientMock };
});

import ConnectionManager from './connectionManager';

function createCredentialProvider(initialServers: Server[] = []) {
    let current: CredentialsState = { Servers: initialServers };
    return {
        credentials(data?: CredentialsState) {
            if (data) current = data;
            return current;
        },
        addOrUpdateServer(servers: Server[], server: Server) {
            const idx = servers.findIndex((s) => s.Id === server.Id);
            if (idx >= 0) servers[idx] = server;
            else servers.push(server);
        }
    };
}

describe('ConnectionManager credential persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('does not persist AccessToken when enableAutoLogin is disabled', () => {
        localStorage.setItem('enableAutoLogin', 'false');

        const credentialProvider = createCredentialProvider([{ Id: 'srv1', ManualAddress: 'https://example' }]);
        const mgr = new ConnectionManager(credentialProvider as unknown as never, 'app', '1.0.0', 'dev', 'device', {} as never) as unknown as {
            _getOrAddApiClient: (server: Server, serverUrl: string) => {
                onAuthenticated?: (instance: unknown, result: AuthResult) => unknown;
            };
        };

        const server = credentialProvider.credentials().Servers[0];
        const apiClient = mgr._getOrAddApiClient(server, 'https://example');

        apiClient.onAuthenticated?.(apiClient, {
            ServerId: 'srv1',
            AccessToken: 'x'.repeat(32),
            User: { Id: 'u1' }
        });

        const saved = credentialProvider.credentials().Servers.find((s) => s.Id === 'srv1');
        expect(saved).toBeDefined();
        if (!saved) throw new Error('Expected server to be saved');
        expect(saved.AccessToken).toBeNull();
        expect(saved.UserId).toBeNull();
    });

    it('persists AccessToken when enableAutoLogin is enabled', () => {
        localStorage.setItem('enableAutoLogin', 'true');

        const credentialProvider = createCredentialProvider([{ Id: 'srv1', ManualAddress: 'https://example' }]);
        const mgr = new ConnectionManager(credentialProvider as unknown as never, 'app', '1.0.0', 'dev', 'device', {} as never) as unknown as {
            _getOrAddApiClient: (server: Server, serverUrl: string) => {
                onAuthenticated?: (instance: unknown, result: AuthResult) => unknown;
            };
        };

        const server = credentialProvider.credentials().Servers[0];
        const apiClient = mgr._getOrAddApiClient(server, 'https://example');

        apiClient.onAuthenticated?.(apiClient, {
            ServerId: 'srv1',
            AccessToken: 'x'.repeat(32),
            User: { Id: 'u1' }
        });

        const saved = credentialProvider.credentials().Servers.find((s) => s.Id === 'srv1');
        expect(saved).toBeDefined();
        if (!saved) throw new Error('Expected server to be saved');
        expect(saved.AccessToken).toHaveLength(32);
        expect(saved.UserId).toBe('u1');
    });
});
