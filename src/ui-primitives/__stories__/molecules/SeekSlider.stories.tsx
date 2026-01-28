import { type ReactElement, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { vars } from 'styles/tokens.css.ts';

const meta: Meta = {
    title: 'UI Primitives/SeekSlider',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function SeekSliderStory(): ReactElement {
    const [position, setPosition] = useState(30);
    const duration = 240; // 4 minutes

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ padding: vars.spacing['5'], maxWidth: '500px' }}>
            <div style={{ marginBottom: vars.spacing['5'] }}>
                <p style={{ color: vars.colors.text, marginBottom: vars.spacing['4'] }}>
                    Music Player Seek Slider
                </p>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: vars.spacing['4']
                    }}
                >
                    <span style={{ color: vars.colors.textSecondary, fontSize: vars.typography['3'].fontSize }}>
                        {formatTime(position)}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm,
                            margin: `0 ${vars.spacing['5']}`,
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            setPosition(Math.round(percent * duration));
                        }}
                    >
                        {/* Progress bar */}
                        <div
                            style={{
                                height: '100%',
                                backgroundColor: vars.colors.primary,
                                borderRadius: vars.borderRadius.sm,
                                width: `${(position / duration) * 100}%`
                            }}
                        />
                        {/* Thumb */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${(position / duration) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '14px',
                                height: '14px',
                                backgroundColor: vars.colors.primary,
                                borderRadius: '50%',
                                boxShadow: vars.shadows.md,
                                cursor: 'grab'
                            }}
                        />
                    </div>
                    <span style={{ color: vars.colors.textSecondary, fontSize: vars.typography['3'].fontSize }}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export const Default: Story = {
    render: SeekSliderStory
};

function BufferedSeekSliderStory(): ReactElement {
    const [position, setPosition] = useState(60);
    const duration = 300; // 5 minutes
    const buffered = 180; // 3 minutes buffered

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ padding: vars.spacing['5'], maxWidth: '500px' }}>
            <div style={{ marginBottom: vars.spacing['5'] }}>
                <p style={{ color: vars.colors.text, marginBottom: vars.spacing['4'] }}>
                    Seek Slider with Buffering
                </p>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: vars.spacing['4']
                    }}
                >
                    <span style={{ color: vars.colors.textSecondary, fontSize: vars.typography['3'].fontSize }}>
                        {formatTime(position)}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm,
                            margin: `0 ${vars.spacing['5']}`,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            setPosition(Math.round(percent * duration));
                        }}
                    >
                        {/* Buffered bar */}
                        <div
                            style={{
                                position: 'absolute',
                                height: '100%',
                                backgroundColor: vars.colors.textMuted,
                                borderRadius: vars.borderRadius.sm,
                                width: `${(buffered / duration) * 100}%`
                            }}
                        />
                        {/* Progress bar */}
                        <div
                            style={{
                                height: '100%',
                                backgroundColor: vars.colors.primary,
                                borderRadius: vars.borderRadius.sm,
                                width: `${(position / duration) * 100}%`
                            }}
                        />
                        {/* Thumb */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${(position / duration) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '14px',
                                height: '14px',
                                backgroundColor: vars.colors.primary,
                                borderRadius: '50%',
                                boxShadow: vars.shadows.md,
                                cursor: 'grab',
                                zIndex: 10
                            }}
                        />
                    </div>
                    <span style={{ color: vars.colors.textSecondary, fontSize: vars.typography['3'].fontSize }}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export const WithBuffering: Story = {
    render: BufferedSeekSliderStory
};
