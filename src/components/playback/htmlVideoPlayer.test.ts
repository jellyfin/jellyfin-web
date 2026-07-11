import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    vi.stubGlobal('__PACKAGE_JSON_VERSION__', 'test');
    vi.stubGlobal('__WEBPACK_SERVE__', false);
});

vi.mock('dompurify', () => ({ default: { sanitize: vi.fn() } }));
vi.mock('lodash-es/debounce', () => ({ default: (callback: unknown) => callback }));
vi.mock('screenfull', () => ({ default: { isEnabled: false } }));
vi.mock('apps/legacy/features/playback/utils/subtitleStyles', () => ({ useCustomSubtitles: false }));
vi.mock('components/subtitlesettings/subtitleappearancehelper', () => ({ default: {} }));
vi.mock('constants/appFeature', () => ({ AppFeature: { HtmlVideoAutoplay: 'HtmlVideoAutoplay', PhysicalVolumeControl: 'PhysicalVolumeControl' } }));
vi.mock('constants/pluginType', () => ({ PluginType: { MediaPlayer: 'MediaPlayer' } }));
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));
vi.mock('scripts/settings/userSettings', () => ({ currentSettings: {} }));
vi.mock('types/mediaError', () => ({ MediaError: {} }));
vi.mock('../../scripts/browser', () => ({ default: { supportsCssAnimation: () => false } }));
vi.mock('../../scripts/settings/appSettings', () => ({ default: {} }));
vi.mock('../../components/apphost', () => ({ appHost: { supports: () => false } }));
vi.mock('../../components/loading/loading', () => ({ default: { show: vi.fn() } }));
vi.mock('../../utils/dom', () => ({ default: {} }));
vi.mock('../../components/playback/playbackmanager', () => ({ playbackManager: {} }));
vi.mock('../../components/router/appRouter', () => ({ appRouter: {} }));
vi.mock('../../components/htmlMediaHelper', () => ({
    applySrc: vi.fn(),
    bindEventsToHlsPlayer: vi.fn(),
    destroyCastPlayer: vi.fn(),
    destroyFlvPlayer: vi.fn(),
    destroyHlsPlayer: vi.fn(),
    enableHlsJsPlayerForCodecs: vi.fn(),
    getBufferedRanges: vi.fn(),
    getCrossOriginValue: vi.fn(),
    getSavedVolume: () => 1,
    handleHlsJsMediaError: vi.fn(),
    isValidDuration: vi.fn(),
    onEndedInternal: vi.fn(),
    onErrorInternal: vi.fn(),
    playWithPromise: vi.fn(),
    resetSrc: vi.fn(),
    saveVolume: vi.fn(),
    seekOnPlaybackStart: vi.fn()
}));
vi.mock('../../components/itemHelper', () => ({ default: {} }));
vi.mock('../../lib/globalize', () => ({ default: {} }));
vi.mock('../../scripts/browserDeviceProfile', () => ({ canPlaySecondaryAudio: vi.fn(), default: vi.fn() }));
vi.mock('../../scripts/settings/webSettings', () => ({ getIncludeCorsCredentials: vi.fn() }));
vi.mock('../../components/backdrop/backdrop', () => ({ setBackdropTransparency: vi.fn(), ['TRANSPARENCY_LEVEL']: {} }));
vi.mock('../../utils/events.ts', () => ({ default: { trigger: vi.fn() } }));
vi.mock('../../utils/container.ts', () => ({ includesAny: vi.fn() }));
vi.mock('../../utils/mediaSource.ts', () => ({ isHls: vi.fn() }));

import { HtmlVideoPlayer } from '../../plugins/htmlVideoPlayer/plugin';

interface TestableHtmlVideoPlayer {
    createMediaElement(options: { fullscreen: boolean }): Promise<HTMLVideoElement>
    currentTime(value?: number): number | undefined
}

function createPlayer(): TestableHtmlVideoPlayer {
    return new HtmlVideoPlayer() as unknown as TestableHtmlVideoPlayer;
}

describe('HtmlVideoPlayer currentTime', () => {
    afterEach(() => {
        document.querySelector('.videoPlayerContainer')?.remove();
    });

    it('keeps the last playback position when the media element reports zero', async () => {
        const player = createPlayer();
        const mediaElement = await player.createMediaElement({ fullscreen: false });

        mediaElement.currentTime = 600;
        mediaElement.dispatchEvent(new Event('timeupdate'));
        mediaElement.currentTime = 0;
        mediaElement.dispatchEvent(new Event('timeupdate'));

        expect(player.currentTime()).toBe(600000);
    });

    it('converts explicit seeks between milliseconds and seconds', async () => {
        const player = createPlayer();
        const mediaElement = await player.createMediaElement({ fullscreen: false });

        mediaElement.currentTime = 6;
        expect(player.currentTime()).toBe(6000);

        player.currentTime(12000);
        expect(mediaElement.currentTime).toBe(12);
        expect(player.currentTime()).toBe(12000);

        player.currentTime(0);
        expect(mediaElement.currentTime).toBe(0);
        expect(player.currentTime()).toBe(0);
    });
});
