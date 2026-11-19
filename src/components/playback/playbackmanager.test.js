import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaError } from 'types/mediaError';
import Events from 'utils/events';
import { PLAYBACK_LIMIT_ERROR_CODE, PlaybackLimitError } from 'utils/playbackLimit';

import { PlaybackManager } from './playbackmanager';

const { alert, client, getUri, openLiveStream, closeLiveStream, playbackInfo, plugins } = vi.hoisted(() => ({
    alert: vi.fn(),
    client: {
        serverId: () => 'server',
        getCurrentUserId: () => 'user',
        getCurrentUser: () => Promise.resolve({ Configuration: {} }),
        getItem: (_, id) => Promise.resolve({ Id: id }),
        getEndpointInfo: () => Promise.resolve({ IsInNetwork: true }),
        getSavedEndpointInfo: () => ({ IsInNetwork: true }),
        getLiveStreamMediaInfo: () => Promise.resolve({ MediaStreams: [] }),
        reportPlaybackStart: vi.fn(),
        reportPlaybackProgress: vi.fn(),
        reportPlaybackStopped: vi.fn(),
        stopActiveEncodings: vi.fn()
    },
    getUri: vi.fn(),
    openLiveStream: vi.fn(),
    closeLiveStream: vi.fn(),
    playbackInfo: vi.fn(),
    plugins: { ofType: vi.fn(() => []) }
}));

vi.mock('@jellyfin/sdk/lib/utils/api/media-info-api', () => ({
    getMediaInfoApi: () => ({ getPostedPlaybackInfo: playbackInfo, openLiveStream, closeLiveStream })
}));
vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getApi: () => ({ getUri, deviceInfo: { id: 'device' }, accessToken: 'token' }),
        getApiClient: () => client
    }
}));
vi.mock('components/itemHelper', () => ({ default: { isLocalItem: () => false } }));
vi.mock('components/pluginManager', () => ({ pluginManager: plugins }));
vi.mock('components/apphost', () => ({ appHost: { supports: () => false } }));
vi.mock('components/alert', () => ({ default: alert }));
vi.mock('components/loading/loading', () => ({ default: { show: vi.fn(), hide: vi.fn() } }));
vi.mock('lib/globalize', () => ({ default: { translate: key => key } }));
vi.mock('scripts/settings/appSettings', () => ({
    default: {
        alwaysBurnInSubtitleWhenTranscoding: () => false,
        enableAutomaticBitrateDetection: () => false,
        maxStreamingBitrate: () => 2000000
    }
}));
vi.mock('scripts/settings/userSettings', () => ({ enableCinemaMode: () => false }));
vi.mock('lib/jellyfin-apiclient/utils/backdropImage', () => ({ getItemBackdropImageUrl: () => null }));
vi.mock('apps/legacy/features/playback/utils/mediaSegmentManager', () => ({ bindMediaSegmentManager: vi.fn() }));
vi.mock('apps/legacy/features/playback/utils/mediaSessionSubscriber', () => ({ bindMediaSessionSubscriber: vi.fn() }));
vi.mock('./skipsegment.ts', () => ({ bindSkipSegment: vi.fn() }));

function deferred() {
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });
    return { promise, resolve };
}

function response(playbackInstanceId, alias, source = {}) {
    return { data: {
        PlaybackInstanceId: playbackInstanceId,
        PlaySessionId: alias,
        MediaSources: [{
            Id: 'movie',
            Container: 'mp4',
            MediaStreams: [],
            Protocol: 'File',
            SupportsDirectPlay: true,
            ...source
        }]
    } };
}

const limitMessage = `PlaybackError.${PLAYBACK_LIMIT_ERROR_CODE}`;

function quotaResponse() {
    return {
        response: {
            status: 403,
            data: { ErrorCode: PLAYBACK_LIMIT_ERROR_CODE }
        }
    };
}

function queueResponse(alias, source) {
    playbackInfo.mockImplementationOnce(({ playbackInfoDto }) => Promise.resolve(response(playbackInfoDto.PlaybackInstanceId, alias, source)));
}

function bodyAt(index) {
    return playbackInfo.mock.calls[index]?.[0].playbackInfoDto;
}

function playItem(manager, item = {}) {
    return manager.play({
        fullscreen: false,
        items: [{ Id: 'movie', Name: 'Movie', MediaType: 'Video', Type: 'Movie', ServerId: 'server', ...item }]
    });
}

function setupPlayer() {
    let streamInfo;
    const player = {
        type: 'mediaplayer',
        name: 'Browser video',
        id: 'browser-video',
        isLocalPlayer: true,
        canPlayMediaType: type => type === 'Video',
        canSetAudioStreamIndex: () => false,
        supports: () => false,
        currentTime: vi.fn(() => 1000),
        getDeviceProfile: vi.fn(async () => ({})),
        duration: () => 20000,
        getVolume: () => 1,
        setVolume: vi.fn(),
        isMuted: () => false,
        paused: () => false,
        seekable: () => false,
        setSubtitleStreamIndex: vi.fn(),
        play: vi.fn(async info => { streamInfo = info; }),
        stop: vi.fn(async (_, isUserStop) => { Events.trigger(player, 'stopped', [{ streamInfo, isUserStop }]); }),
        destroy: vi.fn()
    };
    plugins.ofType.mockImplementation(type => type === 'mediaplayer' ? [player] : []);
    const manager = new PlaybackManager();
    plugins.ofType.mockImplementation(() => []);
    return { manager, player };
}

describe('video playback identity', () => {
    let manager;
    let player;

    beforeEach(() => {
        alert.mockClear();
        playbackInfo.mockReset();
        openLiveStream.mockReset();
        closeLiveStream.mockReset().mockResolvedValue(undefined);
        for (const mock of [client.reportPlaybackStart, client.reportPlaybackProgress, client.reportPlaybackStopped, client.stopActiveEncodings]) {
            mock.mockReset().mockResolvedValue(undefined);
        }
        getUri.mockImplementation((path, params) => {
            const url = new URL(path, 'https://jellyfin.test/');
            for (const [key, value] of Object.entries(params || {})) url.searchParams.set(key, value);
            return url.toString();
        });
        ({ manager, player } = setupPlayer());
    });

    afterEach(async () => {
        await manager.stop();
    });

    it.each([
        { name: 'Direct Play', source: {}, method: 'DirectPlay' },
        { name: 'Direct Stream', source: { SupportsDirectPlay: false, SupportsDirectStream: true }, method: 'DirectStream' }
    ])('propagates the negotiated alias into $name and playback reports', async ({ source, method }) => {
        queueResponse('first-encoding', source);
        await playItem(manager);

        const info = player.play.mock.calls[0][0];
        expect(new URL(info.url).searchParams.get('PlaySessionId')).toBe('first-encoding');
        expect(info).toMatchObject({ playSessionId: 'first-encoding', playMethod: method });
        expect(info.playbackInstanceId).toBe(bodyAt(0).PlaybackInstanceId);
        expect(client.reportPlaybackStart).toHaveBeenCalledWith(expect.objectContaining({ PlaySessionId: 'first-encoding' }));
        await manager.stop();
        expect(client.reportPlaybackStopped).toHaveBeenCalledWith(expect.objectContaining({ PlaySessionId: 'first-encoding' }));
    });

    it('keeps a legacy Direct Play URL and the legacy alias from a transcoding URL', async () => {
        playbackInfo.mockResolvedValueOnce(response(undefined, 'unused-legacy-alias'));
        await playItem(manager);
        expect(new URL(player.play.mock.calls[0][0].url).searchParams.has('PlaySessionId')).toBe(false);

        const legacyUrl = '/Videos/movie/master.m3u8?PlaySessionId=alias-in-url&VideoCodec=h264';
        playbackInfo.mockResolvedValueOnce(response(undefined, 'unused-legacy-alias', {
            SupportsDirectPlay: false,
            SupportsTranscoding: true,
            TranscodingSubProtocol: 'hls',
            TranscodingUrl: legacyUrl
        }));
        await playItem(manager);
        expect(player.play.mock.calls[1][0].playSessionId).toBe('alias-in-url');
    });

    it('keeps HLS on the supplied URL, and local seek issues no new metadata request', async () => {
        const hlsUrl = '/Videos/movie/master.m3u8?PlaySessionId=hls-alias&VideoCodec=h264';
        queueResponse('hls-alias', {
            SupportsDirectPlay: false,
            SupportsTranscoding: true,
            TranscodingSubProtocol: 'hls',
            TranscodingUrl: hlsUrl
        });
        await playItem(manager);

        expect(player.play.mock.calls[0][0].url).toBe(`https://jellyfin.test${hlsUrl}`);
        manager.seek(15000000, player);
        expect(player.currentTime).toHaveBeenCalledWith(1500);
        expect(playbackInfo).toHaveBeenCalledOnce();
    });

    it('retains the logical ID for server seek, audio, subtitles and a quality change to HLS', async () => {
        const subtitleSource = { MediaStreams: [{ Type: 'Subtitle', Index: 2, DeliveryMethod: 'Encode' }] };
        queueResponse('direct-alias', subtitleSource);
        await playItem(manager);
        const logicalId = bodyAt(0).PlaybackInstanceId;

        queueResponse('seek-alias', subtitleSource);
        manager.seek(10000000, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(2));
        expect(bodyAt(1)).toMatchObject({ PlaybackInstanceId: logicalId, StartTimeTicks: 10000000 });

        queueResponse('audio-alias', subtitleSource);
        manager.setAudioStreamIndex(1, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(3));
        expect(bodyAt(2)).toMatchObject({ PlaybackInstanceId: logicalId, AudioStreamIndex: 1 });

        queueResponse('subtitle-alias', subtitleSource);
        manager.setSubtitleStreamIndex(2, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(4));
        expect(bodyAt(3)).toMatchObject({ PlaybackInstanceId: logicalId, SubtitleStreamIndex: 2 });

        queueResponse('hls-alias', {
            ...subtitleSource,
            SupportsDirectPlay: false,
            SupportsTranscoding: true,
            TranscodingSubProtocol: 'hls',
            TranscodingUrl: '/Videos/movie/master.m3u8?PlaySessionId=hls-alias'
        });
        manager.setMaxStreamingBitrate({ maxBitrate: 1000000 }, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(5));

        expect(bodyAt(4)).toMatchObject({ PlaybackInstanceId: logicalId, MaxStreamingBitrate: 1000000 });
        expect(manager.playSessionId(player)).toBe('hls-alias');
        expect(client.stopActiveEncodings.mock.calls.flat()).toEqual(['direct-alias', 'seek-alias', 'audio-alias', 'subtitle-alias']);
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
    });

    it('uses the same logical identity and opened Live TV input during a quality change', async () => {
        queueResponse('live-alias', { Id: 'channel', RequiresOpening: true, OpenToken: 'live-open-token' });
        openLiveStream.mockResolvedValueOnce({ data: { MediaSource: {
            Id: 'channel', Container: 'ts', Protocol: 'Http', RequiredHttpHeaders: [],
            Path: 'https://jellyfin.test/Videos/channel/stream.ts?Static=true&PlaySessionId=live-alias&LiveStreamId=live-input',
            SupportsDirectPlay: true, LiveStreamId: 'live-input', MediaStreams: []
        } } });
        await playItem(manager, { Id: 'channel', Type: 'TvChannel' });

        const logicalId = bodyAt(0).PlaybackInstanceId;
        expect(openLiveStream).toHaveBeenCalledWith({
            openLiveStreamDto: expect.objectContaining({ ItemId: 'channel', PlaySessionId: 'live-alias', OpenToken: 'live-open-token' })
        });
        expect(player.play.mock.calls[0][0].url).toContain('PlaySessionId=live-alias&LiveStreamId=live-input');

        queueResponse('new-live-alias', {
            Id: 'channel',
            Container: 'ts',
            Protocol: 'Http',
            RequiredHttpHeaders: [],
            Path: 'https://jellyfin.test/Videos/channel/stream.ts?Static=true&PlaySessionId=new-live-alias&LiveStreamId=live-input',
            LiveStreamId: 'live-input'
        });
        manager.setMaxStreamingBitrate({ maxBitrate: 1400000 }, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(2));
        expect(bodyAt(1)).toMatchObject({ PlaybackInstanceId: logicalId, LiveStreamId: 'live-input' });
        expect(openLiveStream).toHaveBeenCalledOnce();
        expect(closeLiveStream).not.toHaveBeenCalled();
        expect(manager.playSessionId(player)).toBe('new-live-alias');
    });

    it('allocates a fresh identity for an independent play of the same video after the old stop', async () => {
        queueResponse('first-encoding');
        await playItem(manager);

        const stop = deferred();
        client.reportPlaybackStopped.mockReturnValueOnce(stop.promise);
        queueResponse('second-encoding');
        const nextPlay = playItem(manager);
        await vi.waitFor(() => expect(client.reportPlaybackStopped).toHaveBeenCalledOnce());
        expect(playbackInfo).toHaveBeenCalledOnce();

        stop.resolve();
        await nextPlay;
        expect(bodyAt(1).PlaybackInstanceId).not.toBe(bodyAt(0).PlaybackInstanceId);
        expect(manager.playSessionId(player)).toBe('second-encoding');
    });

    it('ignores a late encoding response and a stopped event from the previous generation', async () => {
        queueResponse('first-encoding');
        await playItem(manager);
        const originalStream = player.play.mock.calls[0][0];
        const late = deferred();
        playbackInfo.mockReturnValueOnce(late.promise);

        manager.setAudioStreamIndex(1, player);
        await vi.waitFor(() => expect(playbackInfo).toHaveBeenCalledTimes(2));
        queueResponse('new-encoding');
        manager.setMaxStreamingBitrate({ maxBitrate: 1000000 }, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(2));

        late.resolve(response(bodyAt(0).PlaybackInstanceId, 'late-encoding'));
        await late.promise;
        Events.trigger(player, 'stopped', [{ streamInfo: originalStream }]);

        expect(bodyAt(2)).toMatchObject({ PlaybackInstanceId: bodyAt(0).PlaybackInstanceId, AudioStreamIndex: 1 });
        expect(player.play).toHaveBeenCalledTimes(2);
        expect(client.stopActiveEncodings.mock.calls.flat()).toEqual(['first-encoding']);
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
        expect(manager.playSessionId(player)).toBe('new-encoding');
    });

    it('reports the pending and previously admitted aliases if stopped before a replacement loads', async () => {
        queueResponse('first-encoding');
        await playItem(manager);
        const opening = deferred();
        player.play.mockImplementationOnce(() => opening.promise);
        queueResponse('pending-encoding');

        manager.setAudioStreamIndex(1, player);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(2));
        await manager.stop();
        opening.resolve();
        await opening.promise;

        expect(client.reportPlaybackStopped.mock.calls.map(([payload]) => payload.PlaySessionId)).toEqual([
            'pending-encoding', 'first-encoding'
        ]);
        expect(client.reportPlaybackProgress).not.toHaveBeenCalled();
    });

    it('closes a superseded live start by its own alias without loading it', async () => {
        const late = deferred();
        playbackInfo.mockReturnValueOnce(late.promise);
        const old = playItem(manager, { Id: 'channel', Type: 'TvChannel' });
        await vi.waitFor(() => expect(playbackInfo).toHaveBeenCalledOnce());

        queueResponse('new-encoding');
        await playItem(manager);
        late.resolve(response(bodyAt(0).PlaybackInstanceId, 'abandoned-live-encoding', { LiveStreamId: 'abandoned-live-input' }));
        await old;

        expect(player.play).toHaveBeenCalledOnce();
        expect(closeLiveStream).toHaveBeenCalledWith(
            { liveStreamId: 'abandoned-live-input' }, { params: { playSessionId: 'abandoned-live-encoding' } }
        );
        expect(manager.playSessionId(player)).toBe('new-encoding');
    });

    it('does not load a stream if stopped while its metadata is pending', async () => {
        const late = deferred();
        playbackInfo.mockReturnValueOnce(late.promise);
        const start = playItem(manager);
        await vi.waitFor(() => expect(playbackInfo).toHaveBeenCalledOnce());

        await manager.stop();
        late.resolve(response(bodyAt(0).PlaybackInstanceId, 'abandoned-encoding'));
        await start;

        expect(player.play).not.toHaveBeenCalled();
        expect(client.reportPlaybackStart).not.toHaveBeenCalled();
    });

    it.each(['HTTP 403', 'PlaybackInfo response'])('shows one quota message when negotiation returns %s', async (failure) => {
        if (failure === 'HTTP 403') {
            playbackInfo.mockRejectedValueOnce(quotaResponse());
        } else {
            playbackInfo.mockResolvedValueOnce({ data: { ErrorCode: PLAYBACK_LIMIT_ERROR_CODE } });
        }

        await playItem(manager);

        expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage }));
        expect(playbackInfo).toHaveBeenCalledOnce();
        expect(player.play).not.toHaveBeenCalled();
        expect(client.reportPlaybackStart).not.toHaveBeenCalled();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
    });

    it('shows one quota message when a Live TV source is denied', async () => {
        queueResponse('live-attempt', { Id: 'channel', RequiresOpening: true, OpenToken: 'live-open-token' });
        openLiveStream.mockRejectedValueOnce(quotaResponse());

        await playItem(manager, { Id: 'channel', Type: 'TvChannel' });

        expect(openLiveStream).toHaveBeenCalledOnce();
        expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage }));
        expect(player.play).not.toHaveBeenCalled();
        expect(client.reportPlaybackStart).not.toHaveBeenCalled();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
    });

    it('does not report a start, retry, or write a stop for a denied player load', async () => {
        queueResponse('denied-alias', { SupportsTranscoding: true });
        player.play.mockImplementationOnce(async (streamInfo) => {
            const error = new PlaybackLimitError();
            Events.trigger(player, 'error', [{ streamInfo, type: MediaError.SERVER_ERROR, error }]);
            throw error;
        });

        await playItem(manager);

        expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage }));
        expect(playbackInfo).toHaveBeenCalledOnce();
        expect(player.play).toHaveBeenCalledOnce();
        expect(client.reportPlaybackStart).not.toHaveBeenCalled();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
        expect(client.stopActiveEncodings).not.toHaveBeenCalled();
    });

    it('preserves the normal transcode fallback and reports only its successful start', async () => {
        queueResponse('failed-alias', { SupportsTranscoding: true });
        queueResponse('retry-alias', {
            SupportsDirectPlay: false,
            SupportsTranscoding: true,
            TranscodingSubProtocol: 'hls',
            TranscodingUrl: '/Videos/movie/master.m3u8?PlaySessionId=retry-alias'
        });
        player.play.mockRejectedValueOnce(new DOMException('Codec unavailable', 'NotSupportedError'));

        await playItem(manager);

        expect(playbackInfo).toHaveBeenCalledTimes(2);
        expect(bodyAt(1)).toMatchObject({
            PlaybackInstanceId: bodyAt(0).PlaybackInstanceId,
            EnableDirectPlay: false
        });
        expect(client.reportPlaybackStart).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ PlaySessionId: 'retry-alias' }));
        expect(alert).not.toHaveBeenCalled();
    });

    it.each([new Error('Network error'), { response: { status: 403, data: {} } }])(
        'uses ordinary error handling for %s with no false start',
        async (error) => {
            queueResponse('failed-alias', { SupportsTranscoding: false });
            player.play.mockRejectedValueOnce(error);

            await playItem(manager);

            expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: `PlaybackError.${MediaError.PLAYER_ERROR}` }));
            expect(client.reportPlaybackStart).not.toHaveBeenCalled();
        }
    );

    it('terminates the fallback after a confirmed quota response without reporting a start', async () => {
        queueResponse('native-alias', { SupportsTranscoding: true });
        queueResponse('hls-attempt', { SupportsTranscoding: true });
        player.play.mockRejectedValueOnce(new DOMException('Native response is opaque', 'NotSupportedError'))
            .mockRejectedValueOnce(new PlaybackLimitError());

        await playItem(manager);

        expect(playbackInfo).toHaveBeenCalledTimes(2);
        expect(player.play).toHaveBeenCalledTimes(2);
        expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage }));
        expect(client.reportPlaybackStart).not.toHaveBeenCalled();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
        expect(client.stopActiveEncodings).not.toHaveBeenCalled();
    });

    it('keeps the current playback when negotiating a replacement is denied', async () => {
        queueResponse('admitted-alias');
        await playItem(manager);
        playbackInfo.mockRejectedValueOnce(quotaResponse());

        manager.setMaxStreamingBitrate({ maxBitrate: 1000000 }, player);
        await vi.waitFor(() => expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage })));

        expect(manager.playSessionId(player)).toBe('admitted-alias');
        expect(player.play).toHaveBeenCalledOnce();
        expect(player.destroy).not.toHaveBeenCalled();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
    });

    it('does not advance the queue when a current stream encounters a confirmed denial', async () => {
        queueResponse('admitted-alias', { SupportsTranscoding: true });
        const items = ['movie', 'next'].map(id => ({
            Id: id, Name: id, MediaType: 'Video', Type: 'Movie', ServerId: 'server'
        }));
        await manager.play({ fullscreen: false, items });
        const streamInfo = player.play.mock.calls[0][0];

        Events.trigger(player, 'error', [{ streamInfo, type: MediaError.SERVER_ERROR, error: new PlaybackLimitError() }]);
        await vi.waitFor(() => expect(alert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ text: limitMessage })));

        expect(playbackInfo).toHaveBeenCalledOnce();
        expect(player.play).toHaveBeenCalledOnce();
        expect(client.reportPlaybackStopped).not.toHaveBeenCalled();
    });

    it('allows an explicit stop after the current item ended without sending a second stop report', async () => {
        queueResponse('finished-alias');
        const items = ['movie', 'next'].map(id => ({
            Id: id, Name: id, MediaType: 'Video', Type: 'Movie', ServerId: 'server'
        }));
        await manager.play({ fullscreen: false, items });
        const streamInfo = player.play.mock.calls[0][0];

        Events.trigger(player, 'stopped', [{ streamInfo }]);
        expect(client.reportPlaybackStopped).toHaveBeenCalledOnce();

        await manager.stop();

        expect(player.destroy).toHaveBeenCalledOnce();
        expect(client.reportPlaybackStopped).toHaveBeenCalledOnce();
    });
});
