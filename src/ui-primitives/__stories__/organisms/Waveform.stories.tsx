import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { vars } from '../../styles/tokens.css';

const meta: Meta = {
    title: 'UI Primitives/Waveform',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function WaveformStory(): ReactElement {
    return (
        <div style={{ padding: vars.spacing.md, maxWidth: '600px' }}>
            <h2 style={{ color: vars.colors.text, marginBottom: vars.spacing.md }}>
                Waveform Component
            </h2>
            <p style={{ color: vars.colors.textSecondary, marginBottom: vars.spacing.md }}>
                The Waveform component is used to display audio waveforms for music playback visualization.
            </p>
            <div
                style={{
                    width: '100%',
                    height: '100px',
                    backgroundColor: vars.colors.background,
                    borderRadius: vars.borderRadius.md,
                    border: `1px solid ${vars.colors.textMuted}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: vars.colors.textMuted
                }}
            >
                Audio waveform visualization
            </div>
        </div>
    );
}

export const Default: Story = {
    render: WaveformStory
};
