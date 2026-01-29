import type { Meta, StoryObj } from '@storybook/react';
import { usePreferencesStore } from 'store/preferencesStore';
import { VisualizerSettings } from '../VisualizerSettings';

const meta = {
    title: 'Audio/VisualizerSettings',
    component: VisualizerSettings,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
} satisfies Meta<typeof VisualizerSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Disabled state - visualizer toggle is off
 */
export const Disabled: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(false);
        return <VisualizerSettings />;
    }
};

/**
 * Butterchurn (Liquid) visualizer with default settings
 */
export const ButterchurmDefault: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('butterchurn');
        store.setSensitivity(50);
        store.setVisualizerOpacity(0.6);
        return <VisualizerSettings />;
    }
};

/**
 * Waveform visualizer with album art color scheme
 */
export const WaveformAlbumArt: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('waveform');
        store.setSensitivity(50);
        store.setVisualizerOpacity(0.7);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * Frequency analyzer with spectrum color scheme (default)
 */
export const FrequencySpectrum: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(64);
        store.setSensitivity(50);
        store.setSmoothing(0.8);
        store.setVisualizerOpacity(1.0);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * Frequency analyzer with high bar count for detailed view
 */
export const FrequencyHighDetail: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(256);
        store.setSensitivity(60);
        store.setSmoothing(0.5);
        store.setVisualizerOpacity(0.95);
        store.setFftSize(8192);
        return <VisualizerSettings />;
    }
};

/**
 * Frequency analyzer with low bar count for simple view
 */
export const FrequencyLowDetail: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(8);
        store.setSensitivity(40);
        store.setSmoothing(0.95);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(1024);
        return <VisualizerSettings />;
    }
};

/**
 * 3D Geometric visualizer (beta) with default settings
 */
export const ThreeDDefault: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('threed');
        store.setSensitivity(50);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(2048);
        return <VisualizerSettings />;
    }
};

/**
 * 3D Geometric visualizer with high sensitivity for dramatic effects
 */
export const ThreeDHighSensitivity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('threed');
        store.setSensitivity(80);
        store.setVisualizerOpacity(0.9);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * Very high sensitivity for responsive visualization
 */
export const HighSensitivity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(95);
        store.setBarCount(64);
        store.setSmoothing(0.3);
        store.setVisualizerOpacity(1.0);
        store.setFftSize(8192);
        return <VisualizerSettings />;
    }
};

/**
 * Very low sensitivity for subtle visualization
 */
export const LowSensitivity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(10);
        store.setBarCount(32);
        store.setSmoothing(0.95);
        store.setVisualizerOpacity(0.5);
        store.setFftSize(1024);
        return <VisualizerSettings />;
    }
};

/**
 * Maximum smoothing for flowing animation
 */
export const MaxSmoothing: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(50);
        store.setBarCount(64);
        store.setSmoothing(1.0);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * No smoothing for instant responsiveness
 */
export const NoSmoothing: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(50);
        store.setBarCount(64);
        store.setSmoothing(0);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * Lowest FFT size for best performance
 */
export const LowFFTSize: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(50);
        store.setBarCount(32);
        store.setSmoothing(0.8);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(1024);
        return <VisualizerSettings />;
    }
};

/**
 * Highest FFT size for maximum detail
 */
export const HighFFTSize: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(50);
        store.setBarCount(256);
        store.setSmoothing(0.8);
        store.setVisualizerOpacity(0.8);
        store.setFftSize(8192);
        return <VisualizerSettings />;
    }
};

/**
 * Cinema/theater mode - low opacity, high smoothing
 */
export const CinemaMode: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('butterchurn');
        store.setSensitivity(40);
        store.setVisualizerOpacity(0.3);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};

/**
 * Club mode - high opacity, high sensitivity
 */
export const ClubMode: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(85);
        store.setBarCount(128);
        store.setSmoothing(0.6);
        store.setVisualizerOpacity(1.0);
        store.setFftSize(8192);
        return <VisualizerSettings />;
    }
};

/**
 * Immersive mode - 3D with high sensitivity
 */
export const ImmersiveMode: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('threed');
        store.setSensitivity(75);
        store.setVisualizerOpacity(0.85);
        store.setFftSize(4096);
        return <VisualizerSettings />;
    }
};
