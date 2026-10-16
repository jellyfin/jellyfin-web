import { Jellyfin } from '@jellyfin/sdk';
import { AxiosError, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import saveStartupUser from './saveStartupUser';

const { updateStartupUser, authenticateUserByName } = vi.hoisted(() => ({
    updateStartupUser: vi.fn(),
    authenticateUserByName: vi.fn()
}));
vi.mock('@jellyfin/sdk/lib/utils/api/startup-api', () => ({
    getStartupApi: () => ({ updateStartupUser })
}));
vi.mock('utils/sdk/authentication-api', () => ({
    getAuthenticationApi: () => ({ authenticateUserByName })
}));

const api = new Jellyfin({
    clientInfo: { name: 'Test', version: '1' },
    deviceInfo: { name: 'Test', id: 'test-device' }
}).createApi('http://localhost');

function httpError(status: number) {
    return new AxiosError('Request failed', undefined, undefined, undefined, { status } as AxiosResponse);
}

describe('saveStartupUser', () => {
    beforeEach(() => {
        updateStartupUser.mockReset().mockResolvedValue({});
        authenticateUserByName.mockReset();
    });

    it('saves the initial credentials without authenticating again', async () => {
        await expect(saveStartupUser(api, 'admin', 'synthetic-secret')).resolves.toBeUndefined();
        expect(updateStartupUser).toHaveBeenCalledWith({
            // Synthetic credentials are only passed to the mocked SDK.
            // eslint-disable-next-line sonarjs/no-hardcoded-passwords
            startupUserDto: { Name: 'admin', Password: 'synthetic-secret' }
        });
        expect(authenticateUserByName).not.toHaveBeenCalled();
    });

    it('returns the authenticated session when setup already saved the password', async () => {
        const session = { AccessToken: 'synthetic-token', User: { Id: 'test-user' } };
        updateStartupUser.mockRejectedValue(httpError(403));
        authenticateUserByName.mockResolvedValue({ data: session });
        await expect(saveStartupUser(api, 'admin', 'synthetic-secret')).resolves.toEqual(session);
        expect(authenticateUserByName).toHaveBeenCalledWith({
            authenticateUserByName: { Username: 'admin', Pw: 'synthetic-secret' }
        });
        expect(updateStartupUser).toHaveBeenCalledTimes(1);
    });

    it('rejects incorrect credentials without retrying the password update', async () => {
        const failure = httpError(401);
        updateStartupUser.mockRejectedValue(httpError(403));
        authenticateUserByName.mockRejectedValue(failure);
        await expect(saveStartupUser(api, 'admin', 'incorrect')).rejects.toBe(failure);
        expect(updateStartupUser).toHaveBeenCalledTimes(1);
    });

    it.each([400, 401, 404, 500])('preserves HTTP %s errors', async status => {
        const failure = httpError(status);
        updateStartupUser.mockRejectedValue(failure);
        await expect(saveStartupUser(api, 'admin', 'synthetic-secret')).rejects.toBe(failure);
        expect(authenticateUserByName).not.toHaveBeenCalled();
    });

    it('preserves network failures', async () => {
        const failure = new Error('Offline');
        updateStartupUser.mockRejectedValue(failure);
        await expect(saveStartupUser(api, 'admin', 'synthetic-secret')).rejects.toBe(failure);
        expect(authenticateUserByName).not.toHaveBeenCalled();
    });
});
