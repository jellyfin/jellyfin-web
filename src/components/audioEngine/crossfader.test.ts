/**
 * Crossfader Logic Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('components/audioEngine/master.logic', () => ({
    masterAudioOutput: { audioContext: { currentTime: 0 } },
    audioNodeBus: [],
    delayNodeBus: []
}));

vi.mock('components/visualizer/butterchurn.logic', () => ({
    butterchurnInstance: { nextPreset: vi.fn() }
}));

vi.mock('components/sitbackMode/sitback.logic', () => ({
    endSong: vi.fn(),
    triggerSongInfoDisplay: vi.fn()
}));

vi.mock('components/visualizer/visualizers.logic', () => ({
    visualizerSettings: { butterchurn: { enabled: false } },
    setVisualizerSettings: vi.fn(),
    getSavedVisualizerSettings: vi.fn()
}));

vi.mock('scripts/settings/userSettings', () => ({
    crossfadeDuration: vi.fn(() => 1)
}));

vi.mock('components/audioEngine/crossfader.logic', async () => {
    const actual = await vi.importActual('components/audioEngine/crossfader.logic');
    return {
        ...actual,
        syncManager: actual.syncManager
    };
});

// Import after mocks
import { syncManager, cancelCrossfadeTimeouts } from './crossfader.logic';

describe('crossfader - sync manager', () => {
    beforeEach(() => {
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        syncManager.stopSync();
    });

    it('should register and unregister elements', () => {
        const mockElement = { paused: false, readyState: 3, currentTime: 1 } as HTMLMediaElement;

        syncManager.registerElement(mockElement, 0);
        expect(syncManager['elements'].has(mockElement)).toBe(true);

        syncManager.unregisterElement(mockElement);
        expect(syncManager['elements'].has(mockElement)).toBe(false);
    });

    it('should start and stop sync', () => {
        syncManager.startSync();
        expect(syncManager['syncInterval']).not.toBeNull();

        syncManager.stopSync();
        expect(syncManager['syncInterval']).toBeNull();
    });

    it('should calculate buffered ahead', () => {
        const mockElement = {
            buffered: {
                length: 1,
                end: vi.fn(() => 10)
            },
            currentTime: 5
        } as any;

        const buffered = syncManager.getBufferedAhead(mockElement);
        expect(buffered).toBe(5);
    });

    it('should cancel timeouts and stop sync', () => {
        syncManager.startSync();
        cancelCrossfadeTimeouts();
        expect(syncManager['syncInterval']).toBeNull();
    });
});
