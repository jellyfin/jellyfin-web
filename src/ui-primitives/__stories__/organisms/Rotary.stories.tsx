import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { vars } from '../styles/tokens.css';

const meta: Meta = {
    title: 'UI Primitives/Rotary',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function RotaryStory(): ReactElement {
    return (
        <div style={{ padding: vars.spacing.md, textAlign: 'center' }}>
            <h2 style={{ color: vars.colors.text, marginBottom: vars.spacing.md }}>
                Rotary Component (Vinyl Record)
            </h2>
            <p style={{ color: vars.colors.textSecondary, marginBottom: vars.spacing.lg }}>
                The Rotary component displays a rotating vinyl record animation for music playback.
            </p>
            <div
                style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto',
                    backgroundColor: vars.colors.background,
                    borderRadius: '50%',
                    border: `3px solid ${vars.colors.textMuted}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'spin 3s linear infinite',
                    color: vars.colors.text,
                    fontWeight: 'bold'
                }}
            >
                ♫
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export const Default: Story = {
    render: RotaryStory
};

function RotaryStoppedStory(): ReactElement {
    return (
        <div style={{ padding: vars.spacing.md, textAlign: 'center' }}>
            <h2 style={{ color: vars.colors.text, marginBottom: vars.spacing.md }}>
                Rotary (Paused)
            </h2>
            <div
                style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto',
                    backgroundColor: vars.colors.background,
                    borderRadius: '50%',
                    border: `3px solid ${vars.colors.textMuted}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: vars.colors.text,
                    fontWeight: 'bold'
                }}
            >
                ♫
            </div>
        </div>
    );
}

export const Paused: Story = {
    render: RotaryStoppedStory
};
