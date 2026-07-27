import type { Api } from '@jellyfin/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const endpoint = vi.hoisted(() => ({
    isInNetwork: false
}));

vi.mock('@jellyfin/sdk/lib/utils/api/system-api', () => ({
    getSystemApi: () => ({
        getEndpointInfo: () => Promise.resolve({
            data: {
                IsInNetwork: endpoint.isInNetwork
            }
        })
    })
}));

const api = {
    authorizationHeader: 'MediaBrowser Client="test"',
    basePath: 'http://localhost:8096'
} as unknown as Api;

let currentTime: number;
let downloadSpeeds: number[];
let failRequest: boolean;
let reportHeadersReceived: boolean;
let requestedSizes: number[];

class MockXMLHttpRequest {
    onabort: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onload: (() => void) | null = null;
    onreadystatechange: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    readyState = 0;
    response = { size: 0 };
    responseType = '';
    status = 200;
    timeout = 0;
    url = '';

    open(_method: string, url: string) {
        this.url = url;
    }

    setRequestHeader() {
        // No-op for tests.
    }

    send() {
        const size = Number(new URL(this.url).searchParams.get('Size'));
        requestedSizes.push(size);

        if (failRequest) {
            this.onerror?.();
            return;
        }

        const speed = downloadSpeeds.shift();
        if (!speed) {
            throw new Error('Missing mocked download speed');
        }

        if (reportHeadersReceived) {
            this.readyState = 2;
            this.onreadystatechange?.();
        }

        currentTime += size * 8 / speed * 1000;
        this.response = { size };
        this.onload?.();
    }
}

describe('detectBitrate', () => {
    beforeEach(() => {
        vi.resetModules();
        Object.defineProperty(MockXMLHttpRequest, 'HEADERS_RECEIVED', { value: 2 });
        vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
        vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

        currentTime = 0;
        downloadSpeeds = [];
        endpoint.isInNetwork = false;
        failRequest = false;
        reportHeadersReceived = true;
        requestedSizes = [];
    });

    it('uses a measured low bitrate on a local network', async () => {
        endpoint.isInNetwork = true;
        downloadSpeeds = [ 8_000_000, 8_000_000 ];
        const { detectBitrate } = await import('./bitrateTest');

        const bitrate = await detectBitrate(api, true);

        expect(bitrate).toBe(5_600_000);
        expect(requestedSizes).toEqual([ 500_000, 1_000_000 ]);
    });

    it('measures speed when an older webview omits the headers event', async () => {
        downloadSpeeds = [ 8_000_000, 8_000_000 ];
        reportHeadersReceived = false;
        const { detectBitrate } = await import('./bitrateTest');

        const bitrate = await detectBitrate(api, true);

        expect(bitrate).toBe(5_600_000);
    });

    it('falls back to the LAN estimate when no speed can be measured', async () => {
        endpoint.isInNetwork = true;
        failRequest = true;
        const { detectBitrate } = await import('./bitrateTest');

        const bitrate = await detectBitrate(api, true);

        expect(bitrate).toBe(140_000_000);
    });

    it('does not assume LAN speed for a failed remote test', async () => {
        failRequest = true;
        const { detectBitrate } = await import('./bitrateTest');

        const bitrate = await detectBitrate(api, true);

        expect(bitrate).toBe(0);
    });
});
