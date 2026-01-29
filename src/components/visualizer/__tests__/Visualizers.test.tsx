import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioStore } from '../../../store/audioStore';
import { usePreferencesStore } from '../../../store/preferencesStore';
import Visualizers from '../Visualizers';

// Mock dependencies
vi.mock('../../../store/audioStore', () => ({
    useAudioStore: vi.fn()
}));

vi.mock('../../../store/preferencesStore', () => ({
    usePreferencesStore: vi.fn()
}));

vi.mock('components/audioEngine/master.logic', () => ({
    masterAudioOutput: {
        audioContext: {},
        mixerNode: {}
    }
}));

// Mock visualizer components
vi.mock('../Butterchurn', () => ({
    default: () => <div data-testid="butterchurn">Butterchurn</div>
}));
vi.mock('../FrequencyAnalyzer', () => ({
    default: () => <div data-testid="frequency">Frequency</div>
}));
vi.mock('../ThreeDimensionVisualizer', () => ({
    default: () => <div data-testid="threed">3D</div>
}));
vi.mock('../WaveSurfer', () => ({
    WaveSurferVisualizer: () => <div data-testid="waveform">Waveform</div>
}));

describe('Visualizers Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render nothing if audio engine is not ready', () => {
        (useAudioStore as any).mockReturnValue(false);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: true, type: 'butterchurn' },
                ui: { showVisualizer: true }
            })
        );

        const { container } = render(<Visualizers />);
        expect(container.firstChild).toBeNull();
    });

    it('should render nothing if visualizer is disabled in settings', () => {
        (useAudioStore as any).mockReturnValue(true);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: false, type: 'butterchurn' },
                ui: { showVisualizer: true }
            })
        );

        const { container } = render(<Visualizers />);
        expect(container.firstChild).toBeNull();
    });

    it('should render nothing if visualizer is disabled in UI', () => {
        (useAudioStore as any).mockReturnValue(true);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: true, type: 'butterchurn' },
                ui: { showVisualizer: false }
            })
        );

        const { container } = render(<Visualizers />);
        expect(container.firstChild).toBeNull();
    });

    it('should render Butterchurn when type is butterchurn', async () => {
        (useAudioStore as any).mockReturnValue(true);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: true, type: 'butterchurn' },
                ui: { showVisualizer: true }
            })
        );

        render(<Visualizers />);
        expect(await screen.findByTestId('butterchurn')).toBeDefined();
    });

    it('should render FrequencyAnalyzer when type is frequency', async () => {
        (useAudioStore as any).mockReturnValue(true);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: true, type: 'frequency' },
                ui: { showVisualizer: true }
            })
        );

        render(<Visualizers />);
        expect(await screen.findByTestId('frequency')).toBeDefined();
    });

    it('should render Waveform when type is waveform', async () => {
        (useAudioStore as any).mockReturnValue(true);
        (usePreferencesStore as any).mockImplementation((selector: any) =>
            selector({
                visualizer: { enabled: true, type: 'waveform' },
                ui: { showVisualizer: true }
            })
        );

        render(<Visualizers />);
        expect(await screen.findByTestId('waveform')).toBeDefined();
    });
});
