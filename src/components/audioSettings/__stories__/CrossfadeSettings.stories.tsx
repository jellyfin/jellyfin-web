import type { Meta, StoryObj } from '@storybook/react-vite';
import { CrossfadeSettings } from '../CrossfadeSettings';
import { usePreferencesStore } from 'store/preferencesStore';

const meta: Meta<typeof CrossfadeSettings> = {
    title: 'Audio/Crossfade Settings',
    component: CrossfadeSettings,
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
type Story = StoryObj<typeof CrossfadeSettings>;

/**
 * Default crossfade settings with all features enabled.
 * Shows the complete settings panel for configuring track-to-track transitions.
 */
export const Default: Story = {
    render: () => <CrossfadeSettings />
};

/**
 * Crossfade disabled - shows minimal controls.
 * When disabled, the duration slider and advanced options are not available.
 */
export const Disabled: Story = {
    render: () => {
        // Set crossfade to disabled
        usePreferencesStore.getState().setCrossfadeEnabled(false);
        return <CrossfadeSettings />;
    }
};

/**
 * Auto-detect network latency mode (default).
 * Displays the automatically detected latency value based on network conditions.
 */
export const AutoLatencyMode: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setCrossfadeEnabled(true);
        store.setNetworkLatencyMode('auto');
        return <CrossfadeSettings />;
    }
};

/**
 * Manual network latency mode.
 * Allows user to manually set a custom latency offset in seconds.
 */
export const ManualLatencyMode: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setCrossfadeEnabled(true);
        store.setNetworkLatencyMode('manual');
        store.setManualLatencyOffset(0.5);
        return <CrossfadeSettings />;
    }
};

/**
 * Long crossfade duration (20 seconds).
 * Demonstrates the crossfade duration slider at a high value for extended transitions.
 */
export const LongCrossfade: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setCrossfadeEnabled(true);
        store.setCrossfadeDuration(20);
        return <CrossfadeSettings />;
    }
};

/**
 * Short crossfade duration (2 seconds).
 * Demonstrates the crossfade duration slider at a low value for quick transitions.
 */
export const ShortCrossfade: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setCrossfadeEnabled(true);
        store.setCrossfadeDuration(2);
        return <CrossfadeSettings />;
    }
};

/**
 * All settings at non-default values.
 * Useful for testing the UI with various configurations.
 */
export const FullyConfigured: Story = {
    render: () => {
        const store = usePreferencesStore.getState();
        store.setCrossfadeEnabled(true);
        store.setCrossfadeDuration(8);
        store.setNetworkLatencyMode('manual');
        store.setManualLatencyOffset(1.2);
        return <CrossfadeSettings />;
    }
};
