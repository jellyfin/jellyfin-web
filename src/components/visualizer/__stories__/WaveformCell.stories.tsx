import type { Meta, StoryObj } from '@storybook/react';
import { vars } from '../../../styles/tokens.css';
import { Box, Flex } from '../../../ui-primitives/Box';
import { Text } from '../../../ui-primitives/Text';
import { Slider } from '../../../ui-primitives/Slider';
import { WaveformCell } from '../WaveformCell';

const meta: Meta<typeof WaveformCell> = {
    title: 'Visualizer/Waveform Cell',
    component: WaveformCell,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Canvas-based waveform visualization for audio tracks. Shows audio peaks with playback progress overlay.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' },
        duration: { control: 'number' },
        currentTime: { control: 'number' }
    }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockPeaks = Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.2);

function formatDuration(ticks?: number): string {
    if (!ticks || ticks <= 0) return '--:--';
    const seconds = ticks / 10000000;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const Default: Story = {
    render: () => (
        <Box style={{ width: '400px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Waveform with playback progress
            </Text>
            <WaveformCell
                itemId="test-1"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={72000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
            <Text size="xs" color="secondary" style={{ marginTop: vars.spacing.xs }}>
                1:12 / 3:00
            </Text>
        </Box>
    )
};

export const NoProgress: Story = {
    render: () => (
        <Box style={{ width: '400px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Waveform at start (no progress)
            </Text>
            <WaveformCell
                itemId="test-2"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={0}
                isCurrentTrack={true}
                isNextTrack={false}
            />
        </Box>
    )
};

export const NearEnd: Story = {
    render: () => (
        <Box style={{ width: '400px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Waveform near end of track
            </Text>
            <WaveformCell
                itemId="test-3"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={165000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
            <Text size="xs" color="secondary" style={{ marginTop: vars.spacing.xs }}>
                2:45 / 3:00
            </Text>
        </Box>
    )
};

export const Interactive: Story = {
    render: () => {
        const [currentTime, setCurrentTime] = React.useState(72000);
        const duration = 180000;

        return (
            <Box style={{ width: '500px' }}>
                <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                    Interactive waveform - drag to seek
                </Text>
                <Box style={{ marginBottom: vars.spacing.md }}>
                    <WaveformCell
                        itemId="test-4"
                        peaks={[mockPeaks]}
                        duration={duration}
                        currentTime={currentTime}
                        isCurrentTrack={true}
                        isNextTrack={false}
                    />
                </Box>
                <Box style={{ width: '100%' }}>
                    <Slider
                        value={(currentTime / duration) * 100}
                        onChange={(_e, value) => setCurrentTime(((value as number) * duration) / 100)}
                    />
                </Box>
                <Flex justifyContent="space-between" style={{ marginTop: vars.spacing.xs }}>
                    <Text size="xs" color="secondary">
                        {formatDuration(currentTime)}
                    </Text>
                    <Text size="xs" color="secondary">
                        {formatDuration(duration)}
                    </Text>
                </Flex>
            </Box>
        );
    }
};

export const DifferentHeights: Story = {
    render: () => (
        <Flex gap={vars.spacing.lg} direction="column">
            <Box style={{ width: '300px' }}>
                <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                    Small (24px)
                </Text>
                <WaveformCell
                    itemId="test-5"
                    peaks={[mockPeaks]}
                    height={24}
                    duration={180000}
                    currentTime={60000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            </Box>
            <Box style={{ width: '300px' }}>
                <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                    Medium (40px)
                </Text>
                <WaveformCell
                    itemId="test-6"
                    peaks={[mockPeaks]}
                    height={40}
                    duration={180000}
                    currentTime={60000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            </Box>
            <Box style={{ width: '300px' }}>
                <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                    Large (60px)
                </Text>
                <WaveformCell
                    itemId="test-7"
                    peaks={[mockPeaks]}
                    height={60}
                    duration={180000}
                    currentTime={60000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            </Box>
        </Flex>
    )
};

export const ShortClip: Story = {
    render: () => (
        <Box style={{ width: '200px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Short audio clip (30 seconds)
            </Text>
            <WaveformCell
                itemId="test-8"
                peaks={[mockPeaks]}
                duration={30000}
                currentTime={15000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
        </Box>
    )
};

export const LongTrack: Story = {
    render: () => (
        <Box style={{ width: '500px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Long track (10 minutes)
            </Text>
            <WaveformCell
                itemId="test-9"
                peaks={[mockPeaks]}
                duration={600000}
                currentTime={120000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
        </Box>
    )
};

export const Playing: Story = {
    render: () => {
        const [time, setTime] = React.useState(72000);
        const duration = 180000;

        React.useEffect(() => {
            const interval = setInterval(() => {
                setTime(t => {
                    if (t >= duration) return 0;
                    return t + 1000;
                });
            }, 1000);
            return () => clearInterval(interval);
        }, [duration]);

        return (
            <Box style={{ width: '400px' }}>
                <Flex alignItems="center" gap={vars.spacing.sm} style={{ marginBottom: vars.spacing.md }}>
                    <Box
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: vars.colors.success,
                            animation: 'pulse 1s infinite'
                        }}
                    />
                    <Text size="sm" color="success">
                        Playing
                    </Text>
                </Flex>
                <WaveformCell
                    itemId="test-10"
                    peaks={[mockPeaks]}
                    duration={duration}
                    currentTime={time}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
                <Text size="xs" color="secondary" style={{ marginTop: vars.spacing.xs }}>
                    {formatDuration(time)} / {formatDuration(duration)}
                </Text>
            </Box>
        );
    }
};

export const Paused: Story = {
    render: () => (
        <Box style={{ width: '400px' }}>
            <Flex alignItems="center" gap={vars.spacing.sm} style={{ marginBottom: vars.spacing.md }}>
                <Box
                    style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: vars.colors.warning
                    }}
                />
                <Text size="sm" color="warning">
                    Paused
                </Text>
            </Flex>
            <WaveformCell
                itemId="test-11"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={72000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
        </Box>
    )
};

export const MinimalWaveform: Story = {
    render: () => (
        <Box
            style={{
                width: '300px',
                padding: vars.spacing.md,
                backgroundColor: vars.colors.surface,
                borderRadius: vars.borderRadius.md
            }}
        >
            <Text size="sm" style={{ marginBottom: vars.spacing.sm }}>
                Minimal waveform
            </Text>
            <WaveformCell
                itemId="test-12"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={45000}
                isCurrentTrack={true}
                isNextTrack={false}
            />
        </Box>
    )
};

export const NextTrack: Story = {
    render: () => (
        <Box style={{ width: '400px' }}>
            <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.sm }}>
                Next track in queue (not current)
            </Text>
            <WaveformCell
                itemId="test-13"
                peaks={[mockPeaks]}
                duration={180000}
                currentTime={0}
                isCurrentTrack={false}
                isNextTrack={true}
            />
        </Box>
    )
};

import * as React from 'react';
