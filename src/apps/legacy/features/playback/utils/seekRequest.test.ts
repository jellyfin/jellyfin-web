/* eslint-disable sonarjs/code-eval -- This harness executes only checked-in request methods with player/network work stubbed. */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import Events from 'utils/events';
import { TICKS_PER_MILLISECOND, TICKS_PER_SECOND } from 'constants/time';

const managerSource = readFileSync('src/components/playback/playbackmanager.js', 'utf8');
const syncSource = readFileSync('src/plugins/syncPlay/ui/players/NoActivePlayer.js', 'utf8');
function section(source: string, start: string, end: string) {
    const from = source.indexOf(start);
    const to = source.indexOf(end, from);
    if (from < 0 || to < 0) throw new Error('Seek request integration boundary missing');
    return source.slice(from, to);
}

describe('playback seek request notifications', () => {
    function setup() {
        const player = {};
        const streamSeek = vi.fn();
        const manager = { _currentPlayer: player, syncPlayEnabled: false, getCurrentPlayer: () => player } as {
            _currentPlayer: object;
            syncPlayEnabled: boolean;
            getCurrentPlayer: () => object;
            seek: (ticks: number, player?: object) => unknown;
            currentTime: () => number;
            seekMs: (ms: number, player?: object) => unknown;
        };
        new Function('self', 'Events', 'enableLocalPlaylistManagement', 'changeStream',
            section(managerSource, '        self.seek = function', '        self.seekRelative'))(
            manager, Events, () => true, streamSeek);
        const request = vi.fn();
        Events.on(manager, 'seekrequest', request);
        return { manager, player, streamSeek, request };
    }

    it('reports explicit or current player before stream work', () => {
        const { manager, player, streamSeek, request } = setup();
        const other = {};
        manager.seek(10);
        manager.seek(20, other);
        expect(request.mock.calls).toEqual([[{ type: 'seekrequest' }, player], [{ type: 'seekrequest' }, other]]);
        expect(request.mock.invocationCallOrder[0]).toBeLessThan(streamSeek.mock.invocationCallOrder[0]);
        expect(streamSeek.mock.calls).toEqual([[player, 10], [other, 20]]);
    });

    it('reports a SyncPlay request once while later local realization stays silent', () => {
        const { manager, player, streamSeek, request } = setup();
        const controllerSeek = vi.fn();
        const syncManager = { getController: () => ({ seek: controllerSeek }) };
        const syncRequest = new Function('playbackManager', 'Events', 'syncPlayManager', `
            return new (class {
                ${section(syncSource, '    seekRequest(', '    /**')}
            })().seekRequest;
        `)(manager, Events, syncManager);
        manager.syncPlayEnabled = true;
        syncRequest(10);
        expect(request.mock.calls).toEqual([[{ type: 'seekrequest' }, player]]);
        expect(controllerSeek).toHaveBeenCalledWith(10);
        manager.seek(10, player);
        expect(request).toHaveBeenCalledTimes(1);
        expect(streamSeek).toHaveBeenCalledWith(player, 10);
        const other = {};
        syncRequest(20, other);
        expect(request).toHaveBeenLastCalledWith({ type: 'seekrequest' }, other);
    });

    it.each(['fastForward', 'rewind'])('reports delegated %s used by media-session actions', method => {
        const { manager, request } = setup();
        const delegate = vi.fn();
        const player = { [method]: delegate };
        const end = method === 'fastForward' ? '    rewind(' : '    seekFrames(';
        const invoke = new Function('Events', 'userSettings', `
            return new (class {
                ${section(managerSource, `    ${method}(`, end)}
            })().${method};
        `)(Events, { skipForwardLength: () => 30_000, skipBackLength: () => 10_000 });
        invoke.call(manager, player);
        expect(request).toHaveBeenCalledWith({ type: 'seekrequest' }, player);
        expect(delegate).toHaveBeenCalledOnce();
    });

    it('reports actual automatic media-segment skip requests', () => {
        const { manager, player, request } = setup();
        const source = readFileSync('src/apps/legacy/features/playback/utils/mediaSegmentManager.ts', 'utf8');
        const skip = new Function('TICKS_PER_SECOND', 'TICKS_PER_MILLISECOND', `
            return new (class {
                ${section(source, '    skipSegment(', '    promptToSkip(').replace('mediaSegment: MediaSegmentDto', 'mediaSegment')}
            })().skipSegment;
        `)(TICKS_PER_SECOND, TICKS_PER_MILLISECOND);
        skip.call({ playbackManager: manager, player, lastTime: -1 }, { StartTicks: TICKS_PER_SECOND, EndTicks: 30 * TICKS_PER_SECOND });
        expect(request).toHaveBeenCalledWith({ type: 'seekrequest' }, player);
    });

    it('reports an actual Skip Intro button click', () => {
        const { manager, request, player } = setup();
        manager.currentTime = () => 0;
        const source = readFileSync('src/components/playback/skipsegment.ts', 'utf8');
        const createSkipElement = new Function('TICKS_PER_MILLISECOND', 'TICKS_PER_SECOND', `
            return new (class {
                ${section(source, '    createSkipElement(', '    setButtonText(')}
            })().createSkipElement;
        `)(TICKS_PER_MILLISECOND, TICKS_PER_SECOND);
        document.body.innerHTML = '';
        createSkipElement.call({ playbackManager: manager, skipElement: null, currentSegment: { EndTicks: 30 * TICKS_PER_SECOND } });
        document.querySelector<HTMLButtonElement>('.skip-button')!.click();
        expect(request).toHaveBeenCalledWith({ type: 'seekrequest' }, player);
    });

    it('reports an actual media-session seek-to action through seekMs', () => {
        const { manager, request, player } = setup();
        manager.seekMs = new Function(`return new (class {
            ${section(managerSource, '    seekMs(', '    stop(')}
        })().seekMs;`)();
        const source = readFileSync('src/apps/legacy/features/playback/utils/mediaSessionSubscriber.ts', 'utf8');
        const action = new Function('MILLISECONDS_PER_SECOND', `
            return new (class {
                ${section(source, '    private onMediaSessionAction(', '    private onMediaSessionUpdate(')
                    .replace('private onMediaSessionAction(details: MediaSessionActionDetails)', 'onMediaSessionAction(details)')}
            })().onMediaSessionAction;
        `)(1_000);
        action.call({ playbackManager: manager, player }, { action: 'seekto', seekTime: 200 });
        expect(request).toHaveBeenCalledWith({ type: 'seekrequest' }, player);
    });
});
/* eslint-enable sonarjs/code-eval */
