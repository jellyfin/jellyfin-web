import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Events from '../utils/events';
import { bindEventsToHlsPlayer } from './htmlMediaHelper';
import { MediaError } from '../types/mediaError';

interface FakeHls {
    destroy: ReturnType<typeof vi.fn>
    handlers: Map<string, (event: unknown, data: HlsErrorData) => void>
    on: ReturnType<typeof vi.fn>
    startLoad: ReturnType<typeof vi.fn>
}

interface HlsErrorData {
    details?: string
    fatal?: boolean
    response?: { code: number }
    type: string
}

const HLS_EVENTS = {
    error: 'error',
    manifestParsed: 'manifestParsed'
};

function createHls(): FakeHls {
    const handlers = new Map<string, (event: unknown, data: HlsErrorData) => void>();

    return {
        destroy: vi.fn(),
        handlers,
        on: vi.fn((event: string, handler: (event: unknown, data: HlsErrorData) => void) => {
            handlers.set(event, handler);
        }),
        startLoad: vi.fn()
    };
}

describe('bindEventsToHlsPlayer', () => {
    beforeEach(() => {
        vi.stubGlobal('Hls', {
            ErrorTypes: Object.fromEntries([
                [ 'MEDIA_ERROR', 'mediaError' ],
                [ 'NETWORK_ERROR', 'networkError' ]
            ]),
            Events: Object.fromEntries([
                [ 'ERROR', HLS_EVENTS.error ],
                [ 'MANIFEST_PARSED', HLS_EVENTS.manifestParsed ]
            ])
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects a network error during startup', () => {
        const hls = createHls();
        const instance = {};
        const onError = vi.fn();
        const resolve = vi.fn();
        const reject = vi.fn();
        const playbackError = vi.fn();
        Events.on(instance, 'error', playbackError);

        bindEventsToHlsPlayer(instance, hls, {} as HTMLMediaElement, onError, resolve, reject);
        hls.handlers.get(HLS_EVENTS.error)?.(undefined, {
            response: { code: 503 },
            type: 'networkError'
        });

        expect(reject).toHaveBeenCalledWith(MediaError.SERVER_ERROR);
        expect(playbackError).not.toHaveBeenCalled();
    });

    it('rejects startup only once when playback cannot start', async () => {
        const hls = createHls();
        const mediaElement = {
            addEventListener: vi.fn(),
            play: vi.fn().mockRejectedValue(new Error('playback failed'))
        } as unknown as HTMLMediaElement;
        const reject = vi.fn();

        bindEventsToHlsPlayer(
            {},
            hls,
            mediaElement,
            vi.fn(),
            vi.fn(),
            reject
        );

        const manifestParsed = hls.handlers.get(HLS_EVENTS.manifestParsed);
        manifestParsed?.(undefined, { type: '' });
        await vi.waitFor(() => expect(reject).toHaveBeenCalledOnce());

        manifestParsed?.(undefined, { type: '' });
        await vi.waitFor(() => expect(mediaElement.play).toHaveBeenCalledTimes(2));
        expect(reject).toHaveBeenCalledOnce();
    });

    it('emits a playback error after startup succeeds', async () => {
        const hls = createHls();
        const mediaElement = {
            addEventListener: vi.fn(),
            play: vi.fn().mockResolvedValue(undefined)
        } as unknown as HTMLMediaElement;
        const instance = {};
        const onError = vi.fn();
        const resolve = vi.fn();
        const reject = vi.fn();
        const playbackError = vi.fn();
        Events.on(instance, 'error', playbackError);

        bindEventsToHlsPlayer(instance, hls, mediaElement, onError, resolve, reject);
        hls.handlers.get(HLS_EVENTS.manifestParsed)?.(undefined, { type: '' });
        await vi.waitFor(() => expect(resolve).toHaveBeenCalledOnce());

        hls.handlers.get(HLS_EVENTS.error)?.(undefined, {
            response: { code: 503 },
            type: 'networkError'
        });

        expect(reject).not.toHaveBeenCalled();
        expect(playbackError).toHaveBeenCalledWith(
            { type: 'error' },
            { type: MediaError.SERVER_ERROR }
        );
    });

    it.each([
        {
            data: {
                fatal: true,
                response: { code: 0 },
                type: 'networkError'
            },
            name: 'a zero-status network error',
            playbackError: MediaError.NETWORK_ERROR,
            startupError: MediaError.NETWORK_ERROR
        },
        {
            data: {
                fatal: true,
                type: 'unrecoverableError'
            },
            name: 'an unrecoverable HLS error',
            playbackError: MediaError.FATAL_HLS_ERROR,
            startupError: undefined
        }
    ])('routes $name based on startup state', async ({
        data,
        playbackError: expectedPlaybackError,
        startupError
    }) => {
        const startupHls = createHls();
        const startupReject = vi.fn();
        const startupPlaybackError = vi.fn();
        const startupInstance = {};
        Events.on(startupInstance, 'error', startupPlaybackError);

        bindEventsToHlsPlayer(
            startupInstance,
            startupHls,
            {} as HTMLMediaElement,
            vi.fn(),
            vi.fn(),
            startupReject
        );
        startupHls.handlers.get(HLS_EVENTS.error)?.(undefined, data);

        expect(startupReject).toHaveBeenCalledOnce();
        if (startupError) {
            expect(startupReject).toHaveBeenCalledWith(startupError);
        } else {
            expect(startupReject.mock.calls[0]).toEqual([]);
        }
        expect(startupPlaybackError).not.toHaveBeenCalled();

        const playbackHls = createHls();
        const mediaElement = {
            addEventListener: vi.fn(),
            play: vi.fn().mockResolvedValue(undefined)
        } as unknown as HTMLMediaElement;
        const playbackInstance = {};
        const playbackReject = vi.fn();
        const playbackResolve = vi.fn();
        const playbackError = vi.fn();
        Events.on(playbackInstance, 'error', playbackError);

        bindEventsToHlsPlayer(
            playbackInstance,
            playbackHls,
            mediaElement,
            vi.fn(),
            playbackResolve,
            playbackReject
        );
        playbackHls.handlers.get(HLS_EVENTS.manifestParsed)?.(undefined, { type: '' });
        await vi.waitFor(() => expect(playbackResolve).toHaveBeenCalledOnce());

        playbackHls.handlers.get(HLS_EVENTS.error)?.(undefined, data);

        expect(playbackReject).not.toHaveBeenCalled();
        expect(playbackError).toHaveBeenCalledWith(
            { type: 'error' },
            { type: expectedPlaybackError }
        );
    });
});
