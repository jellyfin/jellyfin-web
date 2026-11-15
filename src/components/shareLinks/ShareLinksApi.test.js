import { beforeEach, describe, expect, it, vi } from 'vitest';

const getApiClient = vi.fn();

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        appName: () => 'Jellyfin Web',
        appVersion: () => '13.0.0',
        deviceId: () => 'device-id',
        deviceName: () => 'Chrome',
        currentApiClient: () => getApiClient(),
        getApiClient: () => getApiClient()
    }
}));

vi.mock('@jellyfin/sdk/lib/utils', () => ({
    getAuthorizationHeader: () => 'Authorization value'
}));

const { ShareLinkError, createShareLink, revokeShareLink } = await import('./ShareLinksApi');

describe('ShareLinksApi', () => {
    const apiClient = {
        accessToken: () => 'session-token',
        getUrl: vi.fn((path) => `https://server/${path}`)
    };

    beforeEach(() => {
        getApiClient.mockReturnValue(apiClient);
        apiClient.getUrl.mockClear();
        vi.unstubAllGlobals();
    });

    it('Should create a link with the requested duration', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ Id: 'abc', Url: 'https://server/Videos/1/stream?share_token=tok' })
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await createShareLink('item-1', { DurationSeconds: 3600 });

        // The server returns PascalCase; the module normalises it so callers can
        // read `url` and never copy the string "undefined".
        expect(result.url).toContain('share_token=');
        expect(result.id).toBe('abc');
        expect(result.Url).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledOnce();

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://server/Items/item-1/ShareLinks');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ DurationSeconds: 3600 });
    });

    it('Should not put the session token in the request URL', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ Id: 'abc', Url: 'x' })
        });
        vi.stubGlobal('fetch', fetchMock);

        await createShareLink('item-1', { DurationSeconds: 3600 });

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).not.toContain('session-token');
        expect(url).not.toContain('api_key');
        expect(options.headers.Authorization).toBeDefined();
    });

    it('Should surface the server error code on failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            headers: { get: (name) => (name === 'X-ShareLink-Error' ? 'SharingDisabled' : null) },
            text: async () => ''
        }));

        const error = await createShareLink('item-1', { DurationSeconds: 60 }).catch((e) => e);

        expect(error).toBeInstanceOf(ShareLinkError);
        expect(error.status).toBe(403);
        expect(error.shareLinkErrorCode).toBe('SharingDisabled');
    });

    it('Should return undefined for a 204 response', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
        vi.stubGlobal('fetch', fetchMock);

        await expect(revokeShareLink('jti-1')).resolves.toBeUndefined();
        expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });

    it('Should target the requested server', async () => {
        const otherApiClient = {
            accessToken: () => 'other-token',
            getUrl: vi.fn((path) => `https://other/${path}`)
        };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ Id: 'abc', Url: 'x' })
        });
        vi.stubGlobal('fetch', fetchMock);
        getApiClient.mockReturnValue(otherApiClient);

        await createShareLink('item-9', { DurationSeconds: 3600 }, 'other-server');

        expect(fetchMock.mock.calls[0][0]).toBe('https://other/Items/item-9/ShareLinks');
    });
});
