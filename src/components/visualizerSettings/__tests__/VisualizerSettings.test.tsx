import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VisualizerSettings } from '../VisualizerSettings';
import { usePreferencesStore } from '../../../store/preferencesStore';

// Mock store
const { mockState } = vi.hoisted(() => ({
    mockState: {
        visualizer: {
            enabled: true,
            type: 'butterchurn' as const,
            sensitivity: 50,
            barCount: 64,
            smoothing: 0.8,
            frequencyAnalyzer: { opacity: 1.0, colorScheme: 'spectrum' },
            waveSurfer: { opacity: 0.7, colorScheme: 'albumArt' },
            butterchurn: { opacity: 0.6, preset: 'Good' },
            advanced: { fftSize: 4096 }
        },
        setVisualizerEnabled: vi.fn(),
        setVisualizerType: vi.fn(),
        setVisualizerOpacity: vi.fn(),
        setFftSize: vi.fn(),
        setSensitivity: vi.fn(),
        setBarCount: vi.fn(),
        setSmoothing: vi.fn()
    }
}));

vi.mock('../../../store/preferencesStore', () => ({
    usePreferencesStore: Object.assign((selector?: any) => (selector ? selector(mockState) : mockState), {
        getState: () => mockState,
        ...mockState
    })
}));

vi.mock('../../../styles/tokens.css', () => ({
    vars: {
        spacing: { md: '16px', sm: '12px', xs: '8px', xl: '24px' },
        colors: { primary: '#000', surfaceSecondary: '#333', textPrimary: '#fff' },
        radius: { sm: '4px', xs: '2px' },
        typography: { fontSizeXs: '12px' }
    }
}));

describe('VisualizerSettings Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render core settings', () => {
        render(<VisualizerSettings />);
        expect(screen.getByText('Enable Visualizer')).toBeDefined();
        expect(screen.getByText('Butterchurn (Liquid)')).toBeDefined();
        expect(screen.getByText('Waveform')).toBeDefined();
    });

    it('should call setVisualizerEnabled when toggle clicked', () => {
        const setEnabled = mockState.setVisualizerEnabled;
        render(<VisualizerSettings />);

        // Switch component has a hidden input[type=checkbox]
        const toggle = screen.getByLabelText('Toggle switch', { selector: 'input' });
        fireEvent.click(toggle);

        expect(setEnabled).toHaveBeenCalled();
    });

    it('should call setVisualizerType when type clicked', () => {
        const setType = mockState.setVisualizerType;
        render(<VisualizerSettings />);

        const waveformBtn = screen.getByText('Waveform');
        fireEvent.click(waveformBtn);

        expect(setType).toHaveBeenCalledWith('waveform');
    });

    it('should call setFftSize when fft size clicked', () => {
        const setFft = mockState.setFftSize;
        render(<VisualizerSettings />);

        const sizeBtn = screen.getByText('1024');
        fireEvent.click(sizeBtn);

        expect(setFft).toHaveBeenCalledWith(1024);
    });
});
