import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisualizerSettings } from '../VisualizerSettings';
import { usePreferencesStore } from 'store/preferencesStore';

const meta: Meta<typeof VisualizerSettings> = {
    title: 'Visualizer/Visualizer Settings',
    component: VisualizerSettings,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ width: '500px', padding: '20px' }}>
                <Story />
            </div>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof VisualizerSettings>;

/**
 * Visualizer disabled (default state).
 * Shows the disable toggle without additional configuration options.
 * This is the default state for new users to reduce resource usage.
 */
export const Disabled: Story = {
    render: () => {
        usePreferencesStore.getState().setVisualizerEnabled(false);
        return <VisualizerSettings />;
    }
};

/**
 * Waveform visualizer enabled.
 * Displays the waveform/oscilloscope style visualization with detailed controls.
 * Shows sensitivity, smoothing, and color scheme options.
 */
export const WaveformEnabled: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('waveform');
        store.setSensitivity(50);
        store.setSmoothing(0.8);
        return <VisualizerSettings />;
    }
};

/**
 * Frequency bars visualizer enabled.
 * Displays the EQ-style frequency bars visualization.
 * Shows bar count, sensitivity, and color customization options.
 */
export const FrequencyEnabled: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(64);
        store.setSensitivity(50);
        return <VisualizerSettings />;
    }
};

/**
 * Butterchurn (liquid effects) visualizer enabled.
 * Displays the liquid/psychedelic preset-based visualization.
 * Shows preset selection and transition speed options.
 */
export const ButterchurmEnabled: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('butterchurn');
        store.setButterchurnPreset('Good');
        return <VisualizerSettings />;
    }
};

/**
 * 3D Geometric visualizer enabled (Beta).
 * Displays the experimental 3D geometric visualization.
 * Limited configuration options as this is a beta feature.
 */
export const ThreeDEnabled: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('threed');
        return <VisualizerSettings />;
    }
};

/**
 * High sensitivity settings.
 * Demonstrates the visualizer with maximum sensitivity for exaggerated response.
 * Useful for seeing how the visualization reacts to strong audio signals.
 */
export const HighSensitivity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(100);
        return <VisualizerSettings />;
    }
};

/**
 * Low sensitivity settings.
 * Demonstrates the visualizer with minimum sensitivity for subtle response.
 * Useful for background visualization during listening.
 */
export const LowSensitivity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setSensitivity(10);
        return <VisualizerSettings />;
    }
};

/**
 * Minimal bar count (low resolution).
 * Shows the frequency visualizer with fewer bars for a simplified display.
 */
export const MinimalBars: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(16);
        return <VisualizerSettings />;
    }
};

/**
 * Maximum bar count (high resolution).
 * Shows the frequency visualizer with maximum bars for detailed frequency analysis.
 */
export const MaximalBars: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setBarCount(128);
        return <VisualizerSettings />;
    }
};

/**
 * All visualizer types comparison.
 * Interactive story allowing switching between different visualizer types.
 * Use this to compare the UI layout across all visualization styles.
 */
export const AllTypes: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        return <VisualizerSettings />;
    }
};

/**
 * Low opacity setting.
 * Demonstrates the visualizer with reduced opacity for subtle background effect.
 * Useful when you want the visualizer to not overwhelm other UI elements.
 */
export const LowOpacity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setVisualizerOpacity(0.3);
        return <VisualizerSettings />;
    }
};

/**
 * High opacity setting.
 * Demonstrates the visualizer with maximum opacity for prominent display.
 * Useful when the visualizer is the primary visual focus.
 */
export const HighOpacity: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setVisualizerEnabled(true);
        store.setVisualizerType('frequency');
        store.setVisualizerOpacity(1.0);
        return <VisualizerSettings />;
    }
};
