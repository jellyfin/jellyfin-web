import { ApiClient } from 'jellyfin-apiclient';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ConnectionManager from './connectionManager';
import { ConnectionState } from './connectionState';

// The SDK compat layer pulls in app globals (globalize, settings) that are not needed here
vi.mock('./utils/compat', () => ({
    toApi: () => undefined,
    updateApiClientSdk: () => undefined
}));

interface StoredServer {
    Id: string;
    ManualAddress: string;
    LastConnectionMode: number;
    UserId: string | null;
    AccessToken: string | null;
}

interface Credentials {
    Servers: StoredServer[];
}

const SERVER_URL = 'http://jellyfin.test';
const SERVER_ID = 'server-id';

const jsonResponse = (body: unknown, status = 200) => ({
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body)
});

function createCredentialProvider() {
    let stored = JSON.stringify({
        Servers: [{
            Id: SERVER_ID,
            ManualAddress: SERVER_URL,
            LastConnectionMode: 2,
            UserId: 'user-id',
            AccessToken: 'token'
        }]
    });

    return {
        credentials: (data?: Credentials): Credentials => {
            if (data) stored = JSON.stringify(data);
            return JSON.parse(stored) as Credentials;
        },
        addOrUpdateServer: (list: StoredServer[], server: StoredServer) => {
            const i = list.findIndex((s) => s.Id === server.Id);
            if (i === -1) list.push(server);
            else list[i] = { ...list[i], ...server };
        }
    };
}

function mockFetch(systemInfoResult: () => Promise<unknown>) {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
        if (url.endsWith('/System/Info/Public')) {
            return Promise.resolve(jsonResponse({ Id: SERVER_ID, Version: '10.11.0' }));
        }
        if (url.endsWith('/System/Info')) {
            return systemInfoResult();
        }
        return Promise.resolve(jsonResponse({}));
    }));
}

async function connect() {
    vi.spyOn(ApiClient.prototype, 'getCurrentUser').mockResolvedValue({ Id: 'user-id', Name: 'user' });

    const credentialProvider = createCredentialProvider();
    const cm = new ConnectionManager(credentialProvider, 'Jellyfin Web', '10.11.0', 'Test', 'device', {});
    const server = credentialProvider.credentials().Servers[0];
    const result = await cm.connectToServer(server, { enableWebSocket: false, reportCapabilities: false });
    return { result, saved: credentialProvider.credentials().Servers[0] };
}

describe('ConnectionManager auth validation', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps the token when /System/Info is aborted', async () => {
        mockFetch(() => Promise.reject(new DOMException('The user aborted a request.', 'AbortError')));
        const { result, saved } = await connect();
        expect(saved.AccessToken).toBe('token');
        expect(result.State).toBe(ConnectionState.SignedIn);
    });

    it('keeps the token when /System/Info returns 500', async () => {
        mockFetch(() => Promise.resolve(jsonResponse({}, 500)));
        const { result, saved } = await connect();
        expect(saved.AccessToken).toBe('token');
        expect(result.State).toBe(ConnectionState.SignedIn);
    });

    it('clears the token when /System/Info returns 401', async () => {
        mockFetch(() => Promise.resolve(jsonResponse({}, 401)));
        const { result, saved } = await connect();
        expect(saved.AccessToken).toBeNull();
        expect(result.State).toBe(ConnectionState.ServerSignIn);
    });
});
