import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginType } from 'constants/pluginType';

import type Manager from '../Manager';
import GenericPlayer from './GenericPlayer';
import PlayerFactory, { type SyncPlayPlayer } from './PlayerFactory';

class VideoWrapper extends GenericPlayer {
    static readonly type = 'htmlvideoplayer';
}

class AudioWrapper extends GenericPlayer {
    static readonly type = 'htmlaudioplayer';
}

class OtherVideoWrapper extends GenericPlayer {
    static readonly type = 'htmlvideoplayer';
}

class DefaultWrapper extends GenericPlayer {
    static readonly type = 'default';
}

// GenericPlayer's constructor only reads the playback and queue cores from the manager.
const managerStub: Pick<Manager, 'getPlaybackCore' | 'getQueueCore'> = {
    getPlaybackCore: vi.fn<Manager['getPlaybackCore']>(),
    getQueueCore: vi.fn<Manager['getQueueCore']>()
};
const manager = managerStub as Manager;

const createPlayer = (id: string, syncPlayWrapAs?: string): SyncPlayPlayer => ({
    type: PluginType.MediaPlayer,
    name: id,
    id,
    syncPlayWrapAs
});

const expectDefaultWrapper = (wrapper: GenericPlayer, Expected: typeof GenericPlayer = DefaultWrapper) => {
    expect(wrapper).toBeInstanceOf(Expected);
    expect(wrapper.player).toBeNull();
    expect(wrapper.manager).toBe(manager);
};

describe('PlayerFactory', () => {
    let factory: PlayerFactory;

    beforeEach(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        factory = new PlayerFactory();
    });

    describe('getDefaultWrapper', () => {
        it('should use GenericPlayer as the default wrapper', () => {
            const wrapper = factory.getDefaultWrapper(manager);

            expect(wrapper.constructor).toBe(GenericPlayer);
            expect(wrapper.player).toBeNull();
            expect(wrapper.manager).toBe(manager);
        });

        it('should use the last wrapper set by setDefaultWrapper', () => {
            factory.setDefaultWrapper(VideoWrapper);
            factory.setDefaultWrapper(DefaultWrapper);

            expectDefaultWrapper(factory.getDefaultWrapper(manager));
        });

        it('should not change the default wrapper when registering a wrapper', () => {
            factory.registerWrapper(VideoWrapper);

            expect(factory.getDefaultWrapper(manager).constructor).toBe(GenericPlayer);
        });

        it('should create a new wrapper on every call', () => {
            expect(factory.getDefaultWrapper(manager)).not.toBe(factory.getDefaultWrapper(manager));
        });
    });

    describe('getWrapper', () => {
        it.each([
            ['htmlvideoplayer', VideoWrapper],
            ['htmlaudioplayer', AudioWrapper]
        ])('should wrap a %s player with its registered wrapper', (id, Expected) => {
            factory.registerWrapper(VideoWrapper);
            factory.registerWrapper(AudioWrapper);
            const player = createPlayer(id);

            const wrapper = factory.getWrapper(player, manager);

            expect(wrapper).toBeInstanceOf(Expected);
            expect(wrapper.player).toBe(player);
            expect(wrapper.manager).toBe(manager);
        });

        it('should use the last wrapper registered for a type', () => {
            factory.registerWrapper(VideoWrapper);
            factory.registerWrapper(OtherVideoWrapper);

            expect(factory.getWrapper(createPlayer('htmlvideoplayer'), manager)).toBeInstanceOf(OtherVideoWrapper);
        });

        it('should create a new wrapper on every call', () => {
            factory.registerWrapper(VideoWrapper);
            const player = createPlayer('htmlvideoplayer');

            expect(factory.getWrapper(player, manager)).not.toBe(factory.getWrapper(player, manager));
        });

        it('should prefer syncPlayWrapAs over id', () => {
            factory.registerWrapper(VideoWrapper);
            factory.registerWrapper(AudioWrapper);

            expect(factory.getWrapper(createPlayer('htmlaudioplayer', 'htmlvideoplayer'), manager)).toBeInstanceOf(VideoWrapper);
        });

        it('should use the default wrapper for an unknown syncPlayWrapAs, even if id is registered', () => {
            factory.registerWrapper(VideoWrapper);
            factory.setDefaultWrapper(DefaultWrapper);

            expectDefaultWrapper(factory.getWrapper(createPlayer('htmlvideoplayer', 'unknownwrapper'), manager));
        });

        it('should ignore an empty syncPlayWrapAs', () => {
            factory.registerWrapper(VideoWrapper);

            expect(factory.getWrapper(createPlayer('htmlvideoplayer', ''), manager)).toBeInstanceOf(VideoWrapper);
        });

        it('should use the default wrapper for unknown players', () => {
            factory.registerWrapper(VideoWrapper);
            factory.setDefaultWrapper(DefaultWrapper);

            expectDefaultWrapper(factory.getWrapper(createPlayer('unknownplayer'), manager));
        });

        it.each([null, undefined])('should use the default wrapper for a %s player', (player) => {
            factory.registerWrapper(VideoWrapper);
            factory.setDefaultWrapper(DefaultWrapper);

            expectDefaultWrapper(factory.getWrapper(player, manager));
        });
    });
});
