import type { Api } from '@jellyfin/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ endpoint: vi.fn() }));

vi.mock('@jellyfin/sdk/lib/utils/api/system-api', () => ({
    getSystemApi: () => ({ getEndpointInfo: mocks.endpoint })
}));

describe('bitrate detection diagnostics', () => {
    const api = { basePath: 'https://server.test', authorizationHeader: 'test-token' } as Api;
    let requests: number[];
    let fail: boolean;
    let elapsed: number;

    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers({ toFake: [ 'Date' ] });
        vi.setSystemTime(10000000);
        requests = [];
        fail = false;
        elapsed = 0;
        mocks.endpoint.mockResolvedValue({ data: { IsInNetwork: false } });
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
        vi.stubGlobal('navigator', {});
        class TestRequest {
            readyState = 0;
            status = 200;
            response = { size: 0 };
            onreadystatechange?: () => void;
            onload?: () => void;
            ontimeout?: () => void;

            open(_method: string, url: string) {
                this.response.size = Number(new URL(url).searchParams.get('Size'));
            }

            setRequestHeader() { /* No transport in the unit test. */ }

            send() {
                requests.push(this.response.size);
                void Promise.resolve().then(() => {
                    if (fail) {
                        this.ontimeout?.();
                        return;
                    }
                    this.readyState = 2;
                    this.onreadystatechange?.();
                    elapsed += 1000;
                    this.onload?.();
                });
            }
        }
        Object.defineProperty(TestRequest, 'HEADERS_RECEIVED', { value: 2 });
        vi.stubGlobal('XMLHttpRequest', TestRequest);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('reports the measurement and selected budget without logging credentials', async () => {
        const { detectBitrate } = await import('./bitrateTest');
        expect(await detectBitrate(api, false)).toBe(5600000);
        expect(requests).toEqual([ 500000, 1000000 ]);
        const logs = vi.mocked(console.debug).mock.calls.flat().join(' ');
        expect(logs).toContain('8000000 bps');
        expect(logs).toContain('selected 5600000 bps');
        expect(logs).not.toContain('test-token');
        expect(logs).not.toContain('server.test');
    });

    it('reports cache age and remaining lifetime without making another request', async () => {
        const { detectBitrate } = await import('./bitrateTest');
        await detectBitrate(api, false);
        vi.setSystemTime(10001000);
        expect(await detectBitrate(api, false)).toBe(5600000);
        expect(requests).toHaveLength(2);
        expect(console.debug).toHaveBeenCalledWith('[bitratetest] using cached 5600000 bps; age 1000 ms; expires in 3599000 ms');
    });

    it('reports forced detection and still performs the measurement', async () => {
        const { detectBitrate } = await import('./bitrateTest');
        await detectBitrate(api, false);
        expect(await detectBitrate(api, true)).toBe(5600000);
        expect(requests).toHaveLength(4);
        expect(console.debug).toHaveBeenCalledWith('[bitratetest] starting detection; forced true; previous cache age 0 ms');
    });

    it('reports an expired fallback without renewing its cache lifetime', async () => {
        const { detectBitrate } = await import('./bitrateTest');
        await detectBitrate(api, false);
        vi.setSystemTime(13600001);
        fail = true;
        expect(await detectBitrate(api, false)).toBe(5600000);
        expect(await detectBitrate(api, false)).toBe(5600000);
        expect(requests).toHaveLength(4);
        expect(console.debug).toHaveBeenCalledWith('[bitratetest] no measurement; reusing 5600000 bps detected 3600001 ms ago without renewing cache');
    });

    it('reports the actual LAN budget after applying the local-network minimum', async () => {
        mocks.endpoint.mockResolvedValue({ data: { IsInNetwork: true } });
        const { detectBitrate } = await import('./bitrateTest');
        expect(await detectBitrate(api, false)).toBe(140000000);
        expect(console.debug).toHaveBeenCalledWith('[bitratetest] selected 140000000 bps; local network true; cache age 0 ms; expires in 3600000 ms');
    });
});
