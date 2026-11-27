import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerConnections } from 'lib/jellyfin-apiclient';

import { completeLogin } from './completeLogin';

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getOrCreateApiClient: vi.fn(),
        setLocalApiClient: vi.fn()
    }
}));

const SERVER_ID = 'server-id';
const RESULT: AuthenticationResult = { ServerId: SERVER_ID, AccessToken: 'token' };

const apiClient = {
    onAuthenticated: vi.fn()
};

const expectNotCompleted = () => {
    expect(ServerConnections.getOrCreateApiClient).not.toHaveBeenCalled();
    expect(apiClient.onAuthenticated).not.toHaveBeenCalled();
    expect(ServerConnections.setLocalApiClient).not.toHaveBeenCalled();
};

describe('completeLogin', () => {
    beforeEach(() => {
        vi.mocked(ServerConnections.getOrCreateApiClient).mockReturnValue(apiClient as never);
        apiClient.onAuthenticated.mockResolvedValue(undefined);
    });

    it('updates the ApiClient of the server', async () => {
        await completeLogin(RESULT, SERVER_ID);

        expect(ServerConnections.getOrCreateApiClient).toHaveBeenCalledWith(SERVER_ID);
        expect(apiClient.onAuthenticated).toHaveBeenCalledWith(apiClient, RESULT);
        expect(ServerConnections.setLocalApiClient).toHaveBeenCalledWith(apiClient);
    });

    it.each([
        [ 'is missing the server id', { AccessToken: 'token' } ],
        [ 'is for a different server', { ServerId: 'other-server-id', AccessToken: 'token' } ]
    ])('rejects a result that %s', async (_, result: AuthenticationResult) => {
        await expect(completeLogin(result, SERVER_ID)).rejects.toThrow();
        expectNotCompleted();
    });

    it('rejects a result when the expected server is unknown', async () => {
        await expect(completeLogin(RESULT, undefined)).rejects.toThrow();
        expectNotCompleted();
    });
});
