import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
const mockStore = {
    visualizer: {
        enabled: false,
        type: 'butterchurn',
        frequencyAnalyzer: { enabled: false },
        waveSurfer: { enabled: false },
        butterchurn: { enabled: false },
        sitback: { enabled: false },
        advanced: {}
    },
    importPreferences: vi.fn(),
    exportPreferences: vi.fn(() => ({ visualizer: mockStore.visualizer }))
};

vi.mock('../../store/preferencesStore', () => ({
    usePreferencesStore: {
        getState: () => mockStore
    }
}));

import { currentSettings } from './userSettings';

describe('userSettings - visualizerConfiguration interaction with store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return visualizer settings from store', () => {
        const result = currentSettings.visualizerConfiguration();
        expect(result).toEqual(mockStore.visualizer);
    });

    it('should update store when setting configuration', () => {
        const newConfig = { enabled: true, type: 'waveform' };
        currentSettings.visualizerConfiguration(newConfig);

        expect(mockStore.importPreferences).toHaveBeenCalledWith({
            visualizer: newConfig
        });
    });
});
