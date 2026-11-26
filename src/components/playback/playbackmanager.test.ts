import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Events from '../../utils/events';
import { PlaybackManager } from './playbackmanager';

const mocks = vi.hoisted(() => ({
    alert: vi.fn(),
    ofType: vi.fn<(type: string) => object[]>(() => []),
    loading: {
        active: false,
        show: vi.fn(),
        hide: vi.fn()
    },
    apiClient: {
        serverId: () => 'server',
        getCurrentUserId: () => 'user',
        getLocalTrailers: vi.fn(),
        getSavedEndpointInfo: () => ({ IsInNetwork: true }),
        getCurrentUser: vi.fn(async () => ({ Configuration: { EnableNextEpisodeAutoPlay: true } })),
        reportPlaybackStart: vi.fn(async () => undefined),
        reportPlaybackStopped: vi.fn(async () => undefined),
        reportPlaybackProgress: vi.fn(async () => undefined)
    }
}));

vi.mock('../pluginManager', () => ({ pluginManager: { ofType: mocks.ofType } }));
vi.mock('../alert', () => ({ default: mocks.alert }));
vi.mock('../apphost', () => ({ appHost: { supports: () => false } }));
vi.mock('../loading/loading', () => ({ default: mocks.loading }));
vi.mock('../itemHelper', () => ({ default: { isLocalItem: () => false } }));
vi.mock('../../scripts/datetime', () => ({ default: {} }));
vi.mock('../../scripts/settings/appSettings', () => ({ default: { maxStreamingBitrate: () => 20_000_000 } }));
vi.mock('../../scripts/settings/userSettings', () => ({ enableCinemaMode: () => false }));
vi.mock('../../lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getApiClient: () => mocks.apiClient,
        currentApiClient: () => mocks.apiClient,
        getApi: () => undefined
    }
}));
vi.mock('../../utils/jellyfin-apiclient/getItems', () => ({ getItems: vi.fn() }));
vi.mock('../../utils/jellyfin-apiclient/backdropImage', () => ({ getItemBackdropImageUrl: vi.fn() }));
vi.mock('apps/legacy/features/playback/utils/mediaSegmentManager', () => ({ bindMediaSegmentManager: vi.fn() }));
vi.mock('apps/legacy/features/playback/utils/mediaSessionSubscriber', () => ({ bindMediaSessionSubscriber: vi.fn() }));
vi.mock('./skipsegment', () => ({ bindSkipSegment: vi.fn() }));
vi.mock('utils/bitrateTest', () => ({ detectBitrate: vi.fn() }));

const remoteTrailers = ['blocked', 'working', 'last'].map(id => ({
    Name: id,
    Url: `https://www.youtube.com/watch?v=${id}`
}));

const movie = {
    Id: 'movie',
    Name: 'Movie',
    ServerId: 'server',
    RemoteTrailers: remoteTrailers
};

function createPlayer() {
    const player = {
        id: 'youtubeplayer',
        name: 'Youtube Player',
        isLocalPlayer: true,
        canPlayMediaType: () => true,
        canPlayUrl: (url: string) => Boolean(url),
        play: vi.fn<(info: { url: string }) => Promise<void>>(async () => undefined),
        stop: vi.fn(async () => {
            Events.trigger(player, 'stopped');
        }),
        destroy: vi.fn(),
        currentSrc: () => 'url',
        currentTime: () => 0,
        duration: () => 60,
        volume: () => 100,
        isMuted: () => false,
        paused: () => false
    };
    return player;
}

describe('PlaybackManager remote trailers', () => {
    let player: ReturnType<typeof createPlayer>;
    let manager: PlaybackManager;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        mocks.loading.active = false;
        mocks.loading.show.mockImplementation(() => {
            mocks.loading.active = true;
        });
        mocks.loading.hide.mockImplementation(() => {
            mocks.loading.active = false;
        });
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        player = createPlayer();
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player] : []);
        mocks.apiClient.getLocalTrailers.mockResolvedValue([]);
        manager = new PlaybackManager();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('skips a denied first trailer and queues the working trailer and those after it', async () => {
        player.play.mockRejectedValueOnce('YoutubeDenied');
        const onStart = vi.fn();
        Events.on(manager, 'playbackstart', onStart);

        await manager.playTrailers(movie);

        expect(player.play).toHaveBeenCalledTimes(2);
        expect(player.play.mock.calls.map(([info]) => info.url)).toEqual(remoteTrailers.slice(0, 2).map(t => t.Url));
        expect(manager.currentItem(player)?.Url).toBe(remoteTrailers[1].Url);
        expect((await manager.getPlaylist(player)).map((item: { Url: string }) => item.Url)).toEqual(remoteTrailers.slice(1).map(t => t.Url));
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('tries each denied candidate once and shows one error when all candidates are denied', async () => {
        player.play.mockRejectedValue('YoutubeDenied');

        await manager.playTrailers(movie);

        expect(player.play).toHaveBeenCalledTimes(remoteTrailers.length);
        expect(player.stop).toHaveBeenCalledTimes(remoteTrailers.length);
        expect(mocks.alert).toHaveBeenCalledExactlyOnceWith({ text: 'YoutubeDenied', title: 'HeaderPlaybackError' });
        expect(await manager.getPlaylist(player)).toEqual([]);
        expect(manager.isPlaying()).toBe(false);
    });

    it('skips multiple denied trailers before a working one', async () => {
        player.play.mockRejectedValueOnce('YoutubeDenied').mockRejectedValueOnce('YoutubeDenied');

        await manager.playTrailers(movie);

        expect(player.play).toHaveBeenCalledTimes(3);
        expect(manager.currentItem(player)?.Url).toBe(remoteTrailers[2].Url);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it.each(['YoutubeBadRequest', 'YoutubePlaybackError', 'YoutubeNotFound', 'ErrorDefault'])(
        'preserves the error for %s without trying another trailer',
        async error => {
            player.play.mockRejectedValueOnce(error);

            await manager.playTrailers(movie);

            expect(player.play).toHaveBeenCalledTimes(1);
            expect(mocks.alert).toHaveBeenCalledExactlyOnceWith({ text: error, title: 'HeaderPlaybackError' });
        }
    );

    it('does not skip errors in ordinary URL playback', async () => {
        player.play.mockRejectedValueOnce('YoutubeDenied');
        const items = remoteTrailers.map(t => ({ ...t, Type: 'Trailer', MediaType: 'Video', ServerId: 'server' }));

        await manager.play({ items });

        expect(player.play).toHaveBeenCalledTimes(1);
        expect(mocks.alert).toHaveBeenCalledTimes(1);
    });

    it('leaves a successful first trailer and its complete queue unchanged', async () => {
        await manager.playTrailers(movie);

        expect(player.play).toHaveBeenCalledTimes(1);
        expect((await manager.getPlaylist(player)).map((item: { Url: string }) => item.Url)).toEqual(remoteTrailers.map(t => t.Url));
        expect(manager.currentItem(player)?.Url).toBe(remoteTrailers[0].Url);
    });

    it('also skips a denied trailer reached later in the queue', async () => {
        player.play.mockResolvedValueOnce(undefined).mockRejectedValueOnce('YoutubeDenied');
        await manager.playTrailers(movie);

        manager.nextTrack(player);

        await vi.waitFor(() => {
            expect(manager.currentItem(player)?.Url).toBe(remoteTrailers[2].Url);
        });
        expect(player.play).toHaveBeenCalledTimes(3);
        expect((await manager.getPlaylist(player)).map((item: { Url: string }) => item.Url)).toEqual([remoteTrailers[2].Url]);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('keeps local trailers preferred and does not enable embedding fallback for them', async () => {
        const localTrailers = [{ Id: 'local', Type: 'Trailer', MediaType: 'Video', ServerId: 'server' }];
        mocks.apiClient.getLocalTrailers.mockResolvedValue(localTrailers);
        const play = vi.spyOn(manager, 'play').mockResolvedValue(undefined);

        await manager.playTrailers({ ...movie, LocalTrailerCount: 1 });

        expect(mocks.apiClient.getLocalTrailers).toHaveBeenCalledWith('user', 'movie');
        expect(play).toHaveBeenCalledExactlyOnceWith({ items: localTrailers, trailerPlayback: undefined });
    });

    it('waits for failed-player cleanup before trying the next candidate', async () => {
        let completeStop: (() => void) | undefined;
        player.play.mockRejectedValueOnce('YoutubeDenied');
        player.stop.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeStop = () => {
                Events.trigger(player, 'stopped');
                resolve();
            };
        }));

        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.stop).toHaveBeenCalledTimes(1));
        expect(player.play).toHaveBeenCalledTimes(1);
        completeStop?.();
        await playback;

        expect(player.play).toHaveBeenCalledTimes(2);
        expect(manager.currentItem(player)?.Url).toBe(remoteTrailers[1].Url);
    });

    it('does not retry a delayed denial after the user stops the pending trailer', async () => {
        let denyPlayback: ((error: string) => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
            denyPlayback = reject;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        await manager.stop(player);
        denyPlayback?.('YoutubeDenied');
        await playback;

        expect(player.play).toHaveBeenCalledTimes(1);
        expect(player.stop).toHaveBeenCalledTimes(1);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('cancels the pending trailer even when no current player has been established', async () => {
        let denyPlayback: ((error: string) => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
            denyPlayback = reject;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        await manager.stop();
        expect(mocks.loading.active).toBe(false);
        denyPlayback?.('YoutubeDenied');
        await playback;

        expect(player.play).toHaveBeenCalledTimes(1);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('does not report playback start when the pending trailer succeeds after cancellation', async () => {
        let completePlayback: (() => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completePlayback = resolve;
        }));
        const onStart = vi.fn();
        Events.on(manager, 'playbackstart', onStart);
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        await manager.stop();
        completePlayback?.();
        await playback;

        expect(onStart).not.toHaveBeenCalled();
        expect(player.stop).toHaveBeenCalledTimes(1);
        expect(manager.isPlaying()).toBe(false);
    });

    it('does not retry when the user stops during failed-player cleanup', async () => {
        let completeStop: (() => void) | undefined;
        player.play.mockRejectedValueOnce('YoutubeDenied');
        player.stop.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeStop = () => {
                Events.trigger(player, 'stopped');
                resolve();
            };
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.stop).toHaveBeenCalledTimes(1));

        await manager.stop();
        expect(mocks.loading.active).toBe(false);
        mocks.loading.show();
        completeStop?.();
        await playback;

        expect(mocks.loading.active).toBe(false);
        expect(player.play).toHaveBeenCalledTimes(1);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('clears owned loading when cancelled startup resumes before player creation', async () => {
        const playback = manager.playTrailers(movie);
        const stopping = manager.stop();
        expect(mocks.loading.active).toBe(false);
        mocks.loading.show();

        await stopping;
        await playback;

        expect(mocks.loading.active).toBe(false);
        expect(player.play).not.toHaveBeenCalled();
    });

    it.each(['denied', 'playing'] as const)('clears late owned loading after a cancelled trailer reports %s', async result => {
        let denyPlayback: ((error: string) => void) | undefined;
        let completePlayback: (() => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
            completePlayback = resolve;
            denyPlayback = reject;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        await manager.stop();
        expect(mocks.loading.active).toBe(false);
        mocks.loading.show();
        if (result === 'denied') {
            denyPlayback?.('YoutubeDenied');
        } else {
            completePlayback?.();
        }
        await playback;

        expect(mocks.loading.active).toBe(false);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it.each(['denied', 'playing'] as const)('preserves a new movie loader when a stale trailer reports %s', async result => {
        const moviePlayer = createPlayer();
        moviePlayer.id = 'videoplayer';
        moviePlayer.name = 'Video Player';
        player.canPlayUrl = (url: string) => url.includes('youtube.com');
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player, moviePlayer] : []);
        manager = new PlaybackManager();
        let denyPlayback: ((error: string) => void) | undefined;
        let completePlayback: (() => void) | undefined;
        let completeMovie: (() => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
            completePlayback = resolve;
            denyPlayback = reject;
        }));
        moviePlayer.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeMovie = resolve;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        const nextPlayback = manager.play({
            items: [{ Url: 'https://example.org/movie.mp4', Type: 'Movie', MediaType: 'Video', ServerId: 'server' }]
        });
        await vi.waitFor(() => expect(moviePlayer.play).toHaveBeenCalledTimes(1));
        expect(mocks.loading.active).toBe(true);
        if (result === 'denied') {
            denyPlayback?.('YoutubeDenied');
        } else {
            completePlayback?.();
        }
        await playback;

        expect(mocks.loading.active).toBe(true);
        expect(moviePlayer.stop).not.toHaveBeenCalled();
        completeMovie?.();
        await nextPlayback;
        expect(mocks.loading.active).toBe(false);
    });

    it('preserves a new movie loader when cancelled trailer cleanup finishes', async () => {
        const moviePlayer = createPlayer();
        moviePlayer.id = 'videoplayer';
        moviePlayer.name = 'Video Player';
        player.canPlayUrl = (url: string) => url.includes('youtube.com');
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player, moviePlayer] : []);
        manager = new PlaybackManager();
        let completeStop: (() => void) | undefined;
        let completeMovie: (() => void) | undefined;
        player.play.mockRejectedValueOnce('YoutubeDenied');
        player.stop.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeStop = resolve;
        }));
        moviePlayer.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeMovie = resolve;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.stop).toHaveBeenCalledTimes(1));

        const nextPlayback = manager.play({
            items: [{ Url: 'https://example.org/movie.mp4', Type: 'Movie', MediaType: 'Video', ServerId: 'server' }]
        });
        await vi.waitFor(() => expect(moviePlayer.play).toHaveBeenCalledTimes(1));
        completeStop?.();
        await playback;

        expect(mocks.loading.active).toBe(true);
        expect(player.play).toHaveBeenCalledTimes(1);
        completeMovie?.();
        await nextPlayback;
        expect(mocks.loading.active).toBe(false);
    });

    it('preserves a new movie loader when cleanup after cancelled trailer success finishes', async () => {
        const moviePlayer = createPlayer();
        moviePlayer.id = 'videoplayer';
        moviePlayer.name = 'Video Player';
        player.canPlayUrl = (url: string) => url.includes('youtube.com');
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player, moviePlayer] : []);
        manager = new PlaybackManager();
        let completePlayback: (() => void) | undefined;
        let completeStop: (() => void) | undefined;
        let completeMovie: (() => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completePlayback = resolve;
        }));
        player.stop.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeStop = resolve;
        }));
        moviePlayer.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeMovie = resolve;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));
        await manager.stop();
        completePlayback?.();
        await vi.waitFor(() => expect(player.stop).toHaveBeenCalledTimes(1));

        const nextPlayback = manager.play({
            items: [{ Url: 'https://example.org/movie.mp4', Type: 'Movie', MediaType: 'Video', ServerId: 'server' }]
        });
        await vi.waitFor(() => expect(moviePlayer.play).toHaveBeenCalledTimes(1));
        completeStop?.();
        await playback;

        expect(mocks.loading.active).toBe(true);
        expect(moviePlayer.stop).not.toHaveBeenCalled();
        completeMovie?.();
        await nextPlayback;
        expect(mocks.loading.active).toBe(false);
    });

    it('does not clear a new movie loader when cancelled trailer startup resumes before player creation', async () => {
        const moviePlayer = createPlayer();
        moviePlayer.id = 'videoplayer';
        moviePlayer.name = 'Video Player';
        player.canPlayUrl = (url: string) => url.includes('youtube.com');
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player, moviePlayer] : []);
        manager = new PlaybackManager();
        let completeMovie: (() => void) | undefined;
        moviePlayer.play.mockImplementationOnce(() => new Promise<void>(resolve => {
            completeMovie = resolve;
        }));

        const playback = manager.playTrailers(movie);
        const nextPlayback = manager.play({
            items: [{ Url: 'https://example.org/movie.mp4', Type: 'Movie', MediaType: 'Video', ServerId: 'server' }]
        });
        await vi.waitFor(() => expect(moviePlayer.play).toHaveBeenCalledTimes(1));
        await playback;

        expect(mocks.loading.active).toBe(true);
        expect(player.play).not.toHaveBeenCalled();
        completeMovie?.();
        await nextPlayback;
        expect(mocks.loading.active).toBe(false);
    });

    it.each(['denied', 'playing'] as const)('leaves a new movie playing after a stale trailer reports %s', async result => {
        const moviePlayer = createPlayer();
        moviePlayer.id = 'videoplayer';
        moviePlayer.name = 'Video Player';
        moviePlayer.canPlayUrl = () => true;
        player.canPlayUrl = (url: string) => url.includes('youtube.com');
        mocks.ofType.mockImplementation(type => type === 'mediaplayer' ? [player, moviePlayer] : []);
        manager = new PlaybackManager();
        let denyPlayback: ((error: string) => void) | undefined;
        let completePlayback: (() => void) | undefined;
        player.play.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
            completePlayback = resolve;
            denyPlayback = reject;
        }));
        const playback = manager.playTrailers(movie);
        await vi.waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));

        const movieUrl = 'https://example.org/movie.mp4';
        await manager.play({ items: [{ Url: movieUrl, Type: 'Movie', MediaType: 'Video', ServerId: 'server' }] });
        if (result === 'denied') {
            denyPlayback?.('YoutubeDenied');
        } else {
            completePlayback?.();
        }
        await playback;

        expect(manager.currentItem(moviePlayer)?.Url).toBe(movieUrl);
        expect(moviePlayer.play).toHaveBeenCalledTimes(1);
        expect(moviePlayer.stop).not.toHaveBeenCalled();
        expect(player.play).toHaveBeenCalledTimes(1);
        expect(player.stop).not.toHaveBeenCalled();
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('does not start an unrelated queued item as a trailer fallback', async () => {
        player.play.mockRejectedValueOnce('YoutubeDenied');

        await manager.play({
            trailerPlayback: { cancelled: false },
            items: [
                { ...remoteTrailers[0], Type: 'Trailer', MediaType: 'Video', ServerId: 'server' },
                { Id: 'next-movie', Type: 'Movie', MediaType: 'Video', ServerId: 'server' }
            ]
        });

        expect(player.play).toHaveBeenCalledTimes(1);
        expect(mocks.alert).toHaveBeenCalledExactlyOnceWith({ text: 'YoutubeDenied', title: 'HeaderPlaybackError' });
    });

    it('enables remote fallback when the advertised local trailers list is empty', async () => {
        player.play.mockRejectedValueOnce('YoutubeDenied');

        await manager.playTrailers({ ...movie, LocalTrailerCount: 1 });

        expect(player.play).toHaveBeenCalledTimes(2);
        expect(mocks.alert).not.toHaveBeenCalled();
    });

    it('leaves a native player trailer handler in control', async () => {
        const playTrailers = vi.fn(async () => undefined);
        Object.assign(manager, { _currentPlayer: { playTrailers } });

        await manager.playTrailers(movie);

        expect(playTrailers).toHaveBeenCalledExactlyOnceWith(movie);
        expect(player.play).not.toHaveBeenCalled();
    });

    it('still rejects when no trailer is available', async () => {
        await expect(manager.playTrailers({ ...movie, RemoteTrailers: [] })).rejects.toBeUndefined();
        expect(player.play).not.toHaveBeenCalled();
    });
});
