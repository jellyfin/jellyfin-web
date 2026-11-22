import { ErrorTypes, Events as HlsEvents } from 'hls.js/dist/hls.js';
import { describe, expect, it, vi } from 'vitest';

import { MediaError } from 'types/mediaError';
import Events from 'utils/events';
import { PLAYBACK_LIMIT_ERROR_CODE, PlaybackLimitError } from 'utils/playbackLimit';

import { bindEventsToHlsPlayer } from './htmlMediaHelper';

vi.mock('scripts/settings/appSettings', () => ({ default: {} }));

interface HlsTestHandlers {
    [HlsEvents.MANIFEST_PARSED]: () => void;
    [HlsEvents.ERROR]: (event: HlsEvents.ERROR, data: {
        type: ErrorTypes;
        response: { code: number };
        networkDetails: Response;
    }) => Promise<void>;
}

function setup() {
    const handlers: Partial<HlsTestHandlers> = {};
    const hls = {
        on: <T extends keyof HlsTestHandlers>(event: T, callback: HlsTestHandlers[T]) => {
            handlers[event] = callback;
        },
        destroy: vi.fn(),
        startLoad: vi.fn()
    };
    const player = { _hlsPlayer: hls };
    const elem = document.createElement('video');
    vi.spyOn(elem, 'play').mockResolvedValue(undefined);
    const onError = vi.fn();
    const streamInfo = { playbackController: { signal: { aborted: false } } };
    const reject = vi.fn();
    const resolve = vi.fn();
    const reportLimit = bindEventsToHlsPlayer(player, hls, elem, vi.fn(), resolve, reject, streamInfo);
    Events.on(player, 'error', onError);

    const parseManifest = handlers[HlsEvents.MANIFEST_PARSED];
    const onHlsError = handlers[HlsEvents.ERROR];
    if (!parseManifest || !onHlsError) {
        throw new Error('Expected HLS manifest and error handlers');
    }

    return {
        hls, reject, resolve, onError, streamInfo, reportLimit,
        parseManifest,
        respondForbidden: (networkDetails: Response) => onHlsError(HlsEvents.ERROR, {
            type: ErrorTypes.NETWORK_ERROR,
            response: { code: 403 },
            networkDetails
        })
    };
}

describe('HLS playback quota', () => {
    it('rejects startup and destroys HLS once when the application code is known', async () => {
        const playback = setup();

        playback.reportLimit();
        playback.reportLimit();
        await playback.respondForbidden(new Response('', { status: 403 }));

        expect(playback.hls.destroy).toHaveBeenCalledOnce();
        expect(playback.reject).toHaveBeenCalledExactlyOnceWith(expect.any(PlaybackLimitError));
        expect(playback.resolve).not.toHaveBeenCalled();
        expect(playback.onError).not.toHaveBeenCalled();
    });

    it('emits later segment errors for the matching stream generation instead of rejecting an already resolved start', async () => {
        const playback = setup();
        playback.parseManifest();
        await vi.waitFor(() => expect(playback.resolve).toHaveBeenCalledOnce());

        const response = new Response(JSON.stringify({ ErrorCode: PLAYBACK_LIMIT_ERROR_CODE }), { status: 403 });
        await playback.respondForbidden(response);

        expect(playback.onError).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
            type: MediaError.SERVER_ERROR,
            error: expect.any(PlaybackLimitError),
            streamInfo: playback.streamInfo
        });
        expect(playback.reject).not.toHaveBeenCalled();
        expect(playback.hls.destroy).toHaveBeenCalledOnce();
    });

    it('preserves the generic error for a different HTTP 403', async () => {
        const playback = setup();

        await playback.respondForbidden(new Response('Forbidden', { status: 403 }));

        expect(playback.reject).toHaveBeenCalledExactlyOnceWith(MediaError.SERVER_ERROR);
    });

    it('ignores a quota response from a superseded generation', async () => {
        const playback = setup();
        const response = new Response(JSON.stringify({ ErrorCode: PLAYBACK_LIMIT_ERROR_CODE }), { status: 403 });

        const failure = playback.respondForbidden(response);
        playback.streamInfo.playbackController.signal.aborted = true;
        await failure;

        expect(playback.reject).not.toHaveBeenCalled();
        expect(playback.onError).not.toHaveBeenCalled();
    });
});
