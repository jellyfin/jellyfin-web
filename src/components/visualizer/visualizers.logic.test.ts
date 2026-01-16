import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../scripts/settings/userSettings', () => ({
    visualizerConfiguration: vi.fn(() => ({}))
}));

import { getDefaultVisualizerSettings, setVisualizerSettings, visualizerSettings } from './visualizers.logic';

const defaultSettings = getDefaultVisualizerSettings();

function resetSettings() {
    setVisualizerSettings(defaultSettings);
}

describe('visualizers.logic', () => {
    beforeEach(() => {
        resetSettings();
    });

    it('merges legacy sitBack settings into sitback', () => {
        setVisualizerSettings({
            sitBack: {
                trackInfoDuration: 7,
                autoHideTimer: 12
            }
        } as any);

        expect(visualizerSettings.sitback.trackInfoDuration).toBe(7);
        expect(visualizerSettings.sitback.autoHideTimer).toBe(12);
    });

    it('prefers sitback over legacy sitBack when both are present', () => {
        setVisualizerSettings({
            sitBack: {
                trackInfoDuration: 7,
                autoHideTimer: 12
            },
            sitback: {
                trackInfoDuration: 9,
                autoHideTimer: 15
            }
        } as any);

        expect(visualizerSettings.sitback.trackInfoDuration).toBe(9);
        expect(visualizerSettings.sitback.autoHideTimer).toBe(15);
    });
});
