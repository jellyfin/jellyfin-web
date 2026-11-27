import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { showMock } = vi.hoisted(() => ({
    showMock: vi.fn()
}));

vi.mock('./actionSheet/actionSheet', () => ({
    default: {
        show: showMock
    }
}));

import {
    chooseOfflineTracks,
    makeOfflineFilename,
    makeOfflineUrl,
    showOfflineDownload
} from './offlineDownload';
import {
    showActionSheetOrCancel,
    validateTransferHeaders,
    type OfflineApiClient
} from './offlineResumable';
import * as store from './offlineResumeStore';

const ITEM_ID = '0123456789abcdef0123456789abcdef';
const JOB_ID = 'abcdef0123456789abcdef0123456789';
const VALID_ETAG = '"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"';

function createApiClient(): OfflineApiClient {
    return {
        getUrl: (name, params) => {
            const search = new URLSearchParams();
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    if (v != null) search.set(k, String(v));
                }
            }
            const qs = search.toString();
            return qs ? `https://example.test/${name}?${qs}` : `https://example.test/${name}`;
        },
        accessToken: () => 'test-token',
        getCurrentUserId: () => 'user-1'
    };
}

function createResponse(options: {
    status?: number;
    ok?: boolean;
    headers?: Record<string, string>;
    json?: unknown;
} = {}): Response {
    const status = options.status ?? 200;
    const headerMap = new Map<string, string>();
    for (const [k, v] of Object.entries(options.headers ?? {})) {
        headerMap.set(k.toLowerCase(), v);
    }
    return {
        status,
        ok: options.ok ?? (status >= 200 && status < 300),
        headers: {
            get: (name: string) => headerMap.get(name.toLowerCase()) ?? null
        },
        json: vi.fn().mockResolvedValue(options.json)
    } as unknown as Response;
}

describe('offlineDownload & offlineResumable', () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
        showMock.mockReset();
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('makeOfflineUrl', () => {
        it('builds a valid URL with quality and track parameters', () => {
            const api = createApiClient();
            const url = makeOfflineUrl(api, ITEM_ID, '720p', {
                audioStreamIndex: 1,
                subtitleStreamIndex: 3,
                subtitleMode: 'embed'
            });
            expect(url).toBe(
                `https://example.test/Videos/${ITEM_ID}/download.mp4?quality=720p&audioStreamIndex=1&subtitleStreamIndex=3&subtitleMode=embed`
            );
        });

        it('rejects invalid item IDs, qualities, and mismatched subtitle selections', () => {
            const api = createApiClient();
            expect(() => makeOfflineUrl(api, 'not-a-guid', '720p')).toThrow('Invalid offline download selection.');
            expect(() => makeOfflineUrl(api, ITEM_ID, '4k')).toThrow('Invalid offline download selection.');
            expect(() => makeOfflineUrl(api, ITEM_ID, '720p', { audioStreamIndex: -1 })).toThrow('Invalid track selection.');
            expect(() => makeOfflineUrl(api, ITEM_ID, '720p', { subtitleMode: 'burn' })).toThrow('Invalid subtitle selection.');
            expect(() => makeOfflineUrl(api, ITEM_ID, '720p', { subtitleStreamIndex: 2 })).toThrow('Choose a subtitle mode.');
        });
    });

    describe('makeOfflineFilename', () => {
        it('sanitizes forbidden characters, control chars, and trailing dots/spaces', () => {
            expect(makeOfflineFilename('Movie: Part 1 / 2? . ', '1080p')).toBe('Movie_ Part 1 _ 2_ - 1080p.mp4');
            expect(makeOfflineFilename('', '540p')).toBe('video - 540p.mp4');
            expect(makeOfflineFilename('...', '720p')).toBe('video - 720p.mp4');
        });

        it('rejects unknown quality values', () => {
            expect(() => makeOfflineFilename('Movie', '2160p')).toThrow('Unknown quality.');
        });
    });

    describe('validateTransferHeaders', () => {
        it('accepts valid full (200) and ranged (206) MP4 responses', () => {
            const fullResponse = createResponse({
                status: 200,
                headers: {
                    ETag: VALID_ETAG,
                    'Content-Length': '1000',
                    'Content-Type': 'video/mp4'
                }
            });
            expect(() => validateTransferHeaders(fullResponse, { Size: 1000, ETag: VALID_ETAG }, 0)).not.toThrow();

            const rangeResponse = createResponse({
                status: 206,
                headers: {
                    ETag: VALID_ETAG,
                    'Content-Length': '600',
                    'Content-Type': 'video/mp4; codecs="avc1"',
                    'Content-Range': 'bytes 400-999/1000'
                }
            });
            expect(() => validateTransferHeaders(rangeResponse, { Size: 1000, ETag: VALID_ETAG }, 400)).not.toThrow();
        });

        it('rejects mismatched ETag, status, length, content-type, or range', () => {
            const job = { Size: 1000, ETag: VALID_ETAG };
            expect(() => validateTransferHeaders(createResponse({
                status: 200,
                headers: { ETag: '"wrong"', 'Content-Length': '1000', 'Content-Type': 'video/mp4' }
            }), job, 0)).toThrow('file identity changed');

            expect(() => validateTransferHeaders(createResponse({
                status: 200,
                headers: { ETag: VALID_ETAG, 'Content-Length': '999', 'Content-Type': 'video/mp4' }
            }), job, 0)).toThrow('unexpected file length');

            expect(() => validateTransferHeaders(createResponse({
                status: 200,
                headers: { ETag: VALID_ETAG, 'Content-Length': '1000', 'Content-Type': 'text/html' }
            }), job, 0)).toThrow('MP4 bytes');

            expect(() => validateTransferHeaders(createResponse({
                status: 206,
                headers: {
                    ETag: VALID_ETAG,
                    'Content-Length': '600',
                    'Content-Type': 'video/mp4',
                    'Content-Range': 'bytes 0-599/1000'
                }
            }), job, 400)).toThrow('exact requested byte range');
        });
    });

    describe('ActionSheet cancel handling', () => {
        it('returns undefined when ActionSheet is dismissed without resolving', async () => {
            showMock.mockRejectedValueOnce(new Error('ActionSheet closed without resolving'));
            await expect(showActionSheetOrCancel({ title: 'Test', items: [] })).resolves.toBeUndefined();
        });

        it('rethrows unexpected ActionSheet errors', async () => {
            showMock.mockRejectedValueOnce(new Error('Unexpected failure'));
            await expect(showActionSheetOrCancel({ title: 'Test', items: [] })).rejects.toThrow('Unexpected failure');
        });

        it('returns cleanly without throwing when user cancels quality or track selection', async () => {
            const api = createApiClient();
            fetchMock.mockResolvedValueOnce(createResponse({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                json: []
            }));
            showMock.mockRejectedValueOnce(new Error('ActionSheet closed without resolving'));
            await expect(showOfflineDownload(api, { Id: ITEM_ID, Name: 'Film' })).resolves.toBeUndefined();

            fetchMock.mockResolvedValueOnce(createResponse({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                json: {
                    AudioTracks: [
                        { Index: 1, DisplayTitle: 'English' },
                        { Index: 2, DisplayTitle: 'French' }
                    ],
                    SubtitleTracks: []
                }
            }));
            showMock.mockRejectedValueOnce(new Error('ActionSheet closed without resolving'));
            await expect(chooseOfflineTracks(api, ITEM_ID)).resolves.toBeNull();
        });

        it('validates Content-Type on OfflineDownloads listing and allows discarding Failed jobs', async () => {
            const api = createApiClient();
            fetchMock.mockResolvedValueOnce(createResponse({
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                json: []
            }));
            await expect(showOfflineDownload(api, { Id: ITEM_ID, Name: 'Film' })).rejects.toThrow(
                'The server did not return resumable download metadata.'
            );

            fetchMock
                .mockResolvedValueOnce(createResponse({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: [{
                        Id: JOB_ID,
                        Quality: '720p',
                        SubtitleMode: 'none',
                        Status: 'Failed',
                        ExpiresAt: new Date(Date.now() + 60000).toISOString(),
                        Error: 'ffmpeg failed'
                    }]
                }))
                .mockResolvedValueOnce(createResponse({ status: 204 }));
            showMock.mockResolvedValueOnce(`discard:${JOB_ID}`);

            await expect(showOfflineDownload(api, { Id: ITEM_ID, Name: 'Film' })).resolves.toEqual({ status: 'discarded' });
            expect(fetchMock).toHaveBeenLastCalledWith(
                `https://example.test/Videos/${ITEM_ID}/OfflineDownloads/${JOB_ID}`,
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('offlineResumeStore poisoned-promise recovery', () => {
        it('resets the cached database promise after an open error so subsequent calls succeed', async () => {
            let attempt = 0;
            const fakeDb = {
                onversionchange: null as (() => void) | null,
                onclose: null as (() => void) | null,
                close: vi.fn(),
                transaction: vi.fn(() => {
                    const tx: Record<string, unknown> = {
                        oncomplete: null,
                        onerror: null,
                        onabort: null,
                        abort: vi.fn(),
                        objectStore: () => ({
                            get: () => {
                                const req: Record<string, unknown> = {
                                    result: undefined,
                                    onsuccess: null
                                };
                                void Promise.resolve().then(() => {
                                    (req.onsuccess as (() => void) | null)?.();
                                    (tx.oncomplete as (() => void) | null)?.();
                                });
                                return req;
                            }
                        })
                    };
                    return tx;
                })
            };

            vi.stubGlobal('indexedDB', {
                open: vi.fn(() => {
                    attempt += 1;
                    const req: Record<string, unknown> = {
                        result: fakeDb,
                        onupgradeneeded: null,
                        onsuccess: null,
                        onerror: null,
                        onblocked: null
                    };
                    void Promise.resolve().then(() => {
                        if (attempt === 1) {
                            (req.onerror as (() => void) | null)?.();
                        } else {
                            (req.onsuccess as (() => void) | null)?.();
                        }
                    });
                    return req;
                })
            });

            await expect(store.get('test-key')).rejects.toThrow('Browser storage is unavailable');
            await expect(store.get('test-key')).resolves.toBeUndefined();
            expect(attempt).toBe(2);

            // Simulate database close/eviction and verify next call re-opens cleanly.
            fakeDb.onclose?.();
            await expect(store.get('test-key')).resolves.toBeUndefined();
            expect(attempt).toBe(3);
        });
    });
});
