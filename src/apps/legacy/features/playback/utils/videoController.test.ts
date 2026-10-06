import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TICKS_PER_SECOND } from 'constants/time';
import Events from 'utils/events';
import { createVideoGestures } from './videoGestures';
import { createVideoSeekQueue } from './videoSeekQueue';

// Exercise the actual legacy controller integration without loading unrelated UI plugins.
const source = readFileSync('src/apps/legacy/controllers/playback/video/index.js', 'utf8').replace(/\r\n/g, '\n');
function slice(start: string, end: string) {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from);
    if (from < 0 || to < 0) throw new Error('Controller integration boundary missing');
    return source.slice(from, to);
}
// Only checked-in controller source is executed; no user or network text enters this harness.
// eslint-disable-next-line sonarjs/code-eval
const install = new Function('createVideoGestures', 'createVideoSeekQueue', 'view', 'playbackManager', 'showOsd', 'toggleOsd', 'Events', `
    let currentPlayer = {}, isEnabled = false, currentRuntimeTicks;
    const originalPlayer = currentPlayer;
    playbackManager.getCurrentPlayer = () => currentPlayer;
    playbackManager._currentPlayer = currentPlayer;
    const nowPlayingPositionSlider = { disabled: false };
    const getOpenedDialog = () => null;
    const updatePlayerStateInternal = () => {}, updatePlaylist = () => {},
        enableStopOnBack = () => {}, updatePlaybackRate = () => {}, resetUpNextDialog = () => {};
    ${slice('    let dispatchingVideoSeek =', '    function getDisplayItem')}
    ${slice('    function onStateChanged(', '    function onPlayPauseStateChanged')}
    ${slice('    function onPlaybackStart(', '    function resetUpNextDialog')}
    ${slice('    function onPlaybackStopped(', '    function onMediaStreamsChanged')}
    ${slice('    const videoGestures = createVideoGestures', '    /* eslint-disable-next-line compat/compat */\n    dom.addEventListener(view, window.PointerEvent')}
    function subscribe() {
        ${slice("            Events.off(playbackManager, 'seekrequest'", "            Events.on(playbackManager, 'playerchange'")}
    }
    function unsubscribe() {
        ${slice("    view.addEventListener('viewbeforehide', function () {", '        if (statsOverlay)').split('\n').slice(1).join('\n')}
    }
    subscribe();
    return {
        state: state => onStateChanged.call(currentPlayer, { type: 'init' }, state),
        restart: state => onPlaybackStart.call(currentPlayer, { type: 'playbackstart' }, state),
        restartOld: state => onPlaybackStart.call(originalPlayer, { type: 'playbackstart' }, state),
        stop: () => onPlaybackStopped.call(currentPlayer, {}, { NextMediaType: 'Video' }),
        changePlayer: () => { currentPlayer = {}; playbackManager._currentPlayer = currentPlayer; },
        observe: videoSeekQueue.observe,
        externalSeek: () => playbackManager.seek(2000000000),
        otherPlayerSeek: () => playbackManager.seek(2000000000, {}),
        subscribe,
        hide: () => { unsubscribe(); resetVideoSeeking(); },
        slider: nowPlayingPositionSlider,
        destroy: () => { unsubscribe(); resetVideoSeeking(); videoGestures.destroy(); }
    };
`);

const ticks = (seconds: number) => seconds * TICKS_PER_SECOND;

describe('legacy video controller gesture integration', () => {
    let surface: HTMLElement;
    let controller: {
        state: (state: typeof item) => void;
        restart: (state: typeof item) => void;
        restartOld: (state: typeof item) => void;
        stop: () => void;
        changePlayer: () => void;
        observe: (position: number) => void;
        externalSeek: () => void;
        otherPlayerSeek: () => void;
        subscribe: () => void;
        hide: () => void;
        slider: { disabled: boolean };
        destroy: () => void;
    };
    let position: number;
    const seek = vi.fn();
    const playPause = vi.fn();
    const showOsd = vi.fn();
    const toggleOsd = vi.fn();
    const item = { NowPlayingItem: { Id: 'video', ServerId: 'server' } };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        vi.stubGlobal('PointerEvent', MouseEvent);
        document.body.innerHTML = '<div></div>';
        surface = document.querySelector('div')!;
        surface.getBoundingClientRect = () => ({ left: 100, right: 900, top: 0, bottom: 600, width: 800 } as DOMRect);
        position = ticks(100);
        [seek, playPause, showOsd, toggleOsd].forEach(mock => {
            mock.mockClear();
        });
        const manager = { playPause, getCurrentTicks: () => position, duration: () => ticks(300) };
        const managerSource = readFileSync('src/components/playback/playbackmanager.js', 'utf8');
        const start = managerSource.indexOf('        self.seek = function');
        const end = managerSource.indexOf('        self.seekRelative', start);
        // Execute the checked-in manager request entry point with stream work stubbed.
        // eslint-disable-next-line sonarjs/code-eval
        new Function('self', 'Events', 'enableLocalPlaylistManagement', 'changeStream', managerSource.slice(start, end))(
            manager, Events, () => true, (player: object, time: number) => seek(time, player));
        // eslint-disable-next-line sonarjs/code-eval
        controller = install(createVideoGestures, createVideoSeekQueue, surface, manager, showOsd, toggleOsd, Events);
        controller.state(item);
    });
    afterEach(() => {
        controller.destroy();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    function click(kind = 'mouse', x = 700) {
        for (const type of ['pointerdown', 'pointerup']) {
            const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 200, button: 0 });
            Object.assign(event, { pointerId: 1, pointerType: kind, isPrimary: true });
            surface.dispatchEvent(event);
        }
    }
    function pair(kind = 'mouse', x = 700, gap = 350) {
        click(kind, x);
        vi.advanceTimersByTime(gap);
        click(kind, x);
    }

    it.each(['mouse', 'touch'])('integrates %s seeking with stale positions and no pause or overlay toggle', kind => {
        pair(kind);
        pair(kind);
        expect(seek.mock.calls).toEqual([[ticks(110), expect.any(Object)]]);
        position = ticks(110);
        controller.observe(position);
        expect(seek).toHaveBeenLastCalledWith(ticks(130), expect.any(Object));
        vi.advanceTimersByTime(600);
        expect(playPause).not.toHaveBeenCalled();
        expect(toggleOsd).not.toHaveBeenCalled();
    });

    it('preserves pending targets and acceleration across a same-item stream restart', () => {
        pair();
        pair();
        position = ticks(110);
        controller.restart(item);
        expect(seek).toHaveBeenLastCalledWith(ticks(130), expect.any(Object));
        position = ticks(130);
        controller.observe(position);
        pair();
        expect(seek).toHaveBeenLastCalledWith(ticks(170), expect.any(Object));
    });

    it.each(['item', 'server', 'player', 'stop'])('resets pending singles and seek sequence on %s change', change => {
        pair();
        pair();
        click();
        if (change === 'player') controller.changePlayer();
        if (change === 'stop') controller.stop();
        controller.state({ NowPlayingItem: {
            Id: change === 'item' ? 'next' : 'video', ServerId: change === 'server' ? 'other' : 'server'
        } });
        vi.advanceTimersByTime(600);
        expect(playPause).not.toHaveBeenCalled();
        position = ticks(200);
        controller.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(1);
        pair();
        expect(seek).toHaveBeenLastCalledWith(ticks(210), expect.any(Object));
    });

    it('retains isolated single actions and suppresses seeking for disabled streams', () => {
        click();
        vi.advanceTimersByTime(501);
        expect(playPause).toHaveBeenCalledTimes(1);
        click('touch');
        vi.advanceTimersByTime(501);
        expect(toggleOsd).toHaveBeenCalledTimes(1);
        controller.slider.disabled = true;
        pair('touch');
        expect(seek).not.toHaveBeenCalled();
    });

    it('discards queued gestures when a controller seek control is used', () => {
        pair();
        pair();
        controller.externalSeek();
        expect(seek).toHaveBeenLastCalledWith(ticks(200), expect.any(Object));
        controller.observe(ticks(110));
        expect(seek).toHaveBeenCalledTimes(2);
        position = ticks(200);
        pair('mouse', 200);
        expect(seek).toHaveBeenLastCalledWith(ticks(190), expect.any(Object));
    });

    it('ignores a late playbackstart callback from a released player', () => {
        controller.changePlayer();
        controller.state(item);
        position = ticks(200);
        pair();
        pair();
        controller.restartOld(item);
        controller.observe(ticks(210));
        expect(seek).toHaveBeenLastCalledWith(ticks(230), expect.any(Object));
    });

    it('ignores other-player seeks and does not duplicate request subscriptions after reopening', () => {
        controller.subscribe();
        controller.subscribe();
        pair();
        pair();
        controller.otherPlayerSeek();
        controller.observe(ticks(110));
        expect(seek).toHaveBeenLastCalledWith(ticks(130), expect.any(Object));
        controller.hide();
        controller.subscribe();
        controller.state(item);
        position = ticks(200);
        pair();
        expect(seek).toHaveBeenLastCalledWith(ticks(210), expect.any(Object));
    });
});
