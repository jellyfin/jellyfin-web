/**
 * Crossfader Logic Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../../store/preferencesStore', () => ({
    usePreferencesStore: {
        getState: () => ({
            visualizer: {
                enabled: false,
                type: 'butterchurn'
            },
            _runtime: {
                busy: false,
                triggered: false,
                manualTrigger: false
            },
            cancelCrossfade: () => {
                // Mock implementation
            }
        })
    }
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
import { cancelCrossfadeTimeouts, syncManager } from './crossfader.logic';

describe('crossfader - sync manager', () => {
    beforeEach(() => {
        vi.clearAllTimers();
        vi.useFakeTimers();
        syncManager.stopSync();
        syncManager['elements'].clear();
        syncManager['observers'].clear();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.useRealTimers();
        syncManager.stopSync();
        syncManager['elements'].clear();
        syncManager['observers'].clear();
        document.body.innerHTML = '';
    });

    it('should register and unregister elements', () => {
        const mockElement = document.createElement('audio');
        mockElement.src = 'http://example.com/song.mp3';
        document.body.appendChild(mockElement);

        // Verify element is in DOM
        expect(mockElement.parentNode).not.toBeNull();

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
