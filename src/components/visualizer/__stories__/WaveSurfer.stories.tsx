import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { vars } from '../../../styles/tokens.css';
import { Box, Flex } from '../../../ui-primitives/Box';
import { Text, Heading } from '../../../ui-primitives/Text';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from '../../../ui-primitives/Button';
import { Slider } from '../../../ui-primitives/Slider';
import { DEFAULT_WAVESURFER_COLORS, createWaveSurferChannelStyle, WaveSurferColorScheme } from '../WaveSurferOptions';

const meta: Meta = {
    title: 'Visualizer/WaveSurfer',
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'WaveSurfer.js integration for audio visualization with timeline, zoom, and minimap plugins.'
            }
        }
    },
    tags: ['autodocs']
} as any;

export default meta;
type Story = StoryObj<typeof meta>;

const colorSchemes: Record<string, WaveSurferColorScheme> = {
    default: DEFAULT_WAVESURFER_COLORS,
    cyan: { left: 'rgb(0, 180, 180)', right: 'rgb(180, 0, 180)', cursor: 'rgb(25, 213, 11)' },
    amber: { left: 'rgb(255, 180, 0)', right: 'rgb(180, 100, 0)', cursor: 'rgb(255, 220, 0)' },
    green: { left: 'rgb(0, 200, 100)', right: 'rgb(100, 200, 0)', cursor: 'rgb(50, 255, 50)' },
    sunset: { left: 'rgb(255, 100, 50)', right: 'rgb(200, 50, 100)', cursor: 'rgb(255, 150, 100)' }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const Overview: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.md }}>WaveSurfer Configuration</Heading.H3>
            <Text color="secondary" style={{ marginBottom: vars.spacing.lg }}>
                WaveSurfer.js provides advanced audio visualization with real-time waveform display, zoom controls,
                timeline, and minimap plugins. The component adapts its display mode based on zoom level: whole song
                view, single channel, or dual channel stereo.
            </Text>

            <Flex gap={vars.spacing.xl} wrap="wrap">
                <Box style={{ flex: 1, minWidth: '300px' }}>
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Zoom Levels</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        WaveSurfer switches display modes based on zoom level:
                    </Text>
                    <Box
                        style={{
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md
                        }}
                    >
                        <Flex direction="column" gap={vars.spacing.sm}>
                            <Flex justify="space-between">
                                <Text size="sm">0-70 px/sec</Text>
                                <Text size="sm" color="secondary">
                                    Whole song
                                </Text>
                            </Flex>
                            <Flex justify="space-between">
                                <Text size="sm">71-129 px/sec</Text>
                                <Text size="sm" color="secondary">
                                    Single channel
                                </Text>
                            </Flex>
                            <Flex justify="space-between">
                                <Text size="sm">130+ px/sec</Text>
                                <Text size="sm" color="secondary">
                                    Dual channels
                                </Text>
                            </Flex>
                        </Flex>
                    </Box>
                </Box>

                <Box style={{ flex: 1, minWidth: '300px' }}>
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Color Schemes</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Colors adapt to album art for visual harmony.
                    </Text>
                    <Flex gap={vars.spacing.sm} wrap="wrap">
                        {Object.entries(colorSchemes).map(([name, colors]) => (
                            <Box key={name} style={{ display: 'flex', alignItems: 'center', gap: vars.spacing.xs }}>
                                <Box
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        backgroundColor: colors.left
                                    }}
                                />
                                <Box
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        backgroundColor: colors.right
                                    }}
                                />
                                <Text size="xs" color="secondary">
                                    {name}
                                </Text>
                            </Box>
                        ))}
                    </Flex>
                </Box>
            </Flex>
        </Box>
    )
} as any;

export const ColorSchemes: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Color Schemes</Heading.H3>
            <Flex direction="column" gap={vars.spacing.lg}>
                {Object.entries(colorSchemes).map(([name, colors]) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _style = createWaveSurferChannelStyle(colors);
                    return (
                        <Box
                            key={name}
                            style={{
                                padding: vars.spacing.md,
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.md
                            }}
                        >
                            <Text size="sm" style={{ marginBottom: vars.spacing.sm, fontWeight: 'bold' }}>
                                {name}
                            </Text>
                            <Flex gap={vars.spacing.lg}>
                                <Flex align="center" gap={vars.spacing.xs}>
                                    <Box
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            backgroundColor: colors.left
                                        }}
                                    />
                                    <Text size="xs" color="secondary">
                                        Left: {colors.left}
                                    </Text>
                                </Flex>
                                <Flex align="center" gap={vars.spacing.xs}>
                                    <Box
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            backgroundColor: colors.right
                                        }}
                                    />
                                    <Text size="xs" color="secondary">
                                        Right: {colors.right}
                                    </Text>
                                </Flex>
                                <Flex align="center" gap={vars.spacing.xs}>
                                    <Box
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '4px',
                                            backgroundColor: colors.cursor
                                        }}
                                    />
                                    <Text size="xs" color="secondary">
                                        Cursor: {colors.cursor}
                                    </Text>
                                </Flex>
                            </Flex>
                            <Box
                                style={{
                                    marginTop: vars.spacing.md,
                                    padding: vars.spacing.sm,
                                    backgroundColor: vars.colors.background,
                                    borderRadius: vars.borderRadius.sm
                                }}
                            >
                                <Text size="xs" color="secondary">
                                    Sample waveform representation
                                </Text>
                                <Flex style={{ height: '40px', marginTop: vars.spacing.xs, gap: '2px' }}>
                                    {Array.from({ length: 50 }, (_, i) => (
                                        <Box
                                            key={i}
                                            style={{
                                                flex: 1,
                                                backgroundColor: i < 25 ? colors.left : colors.right,
                                                borderRadius: '2px',
                                                opacity: 0.6 + Math.random() * 0.4
                                            }}
                                        />
                                    ))}
                                </Flex>
                            </Box>
                        </Box>
                    );
                })}
            </Flex>
        </Box>
    )
} as any;

export const PluginConfiguration: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Plugin Configuration</Heading.H3>

            <Flex direction="column" gap={vars.spacing.lg}>
                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Timeline Plugin</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Displays time markers along the waveform for easy navigation.
                    </Text>
                    <Box
                        style={{
                            padding: vars.spacing.sm,
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm
                        }}
                    >
                        <Text size="xs" color="secondary" style={{ fontFamily: 'monospace' }}>
                            {`timelineOptions: {
  primaryLabelInterval: 30,
  secondaryLabelInterval: 5,
  height: 18,
  secondaryLabelOpacity: 0.37
}`}
                        </Text>
                    </Box>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Zoom Plugin</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Enables pinch-to-zoom and scroll-to-zoom functionality.
                    </Text>
                    <Box
                        style={{
                            padding: vars.spacing.sm,
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm
                        }}
                    >
                        <Text size="xs" color="secondary" style={{ fontFamily: 'monospace' }}>
                            {`zoomOptions: {
  scale: 0.25,
  maxZoom: 8000,
  deltaThreshold: 10,
  exponentialZooming: true
}`}
                        </Text>
                    </Box>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Minimap Plugin</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Overview waveform showing entire track with current position indicator.
                    </Text>
                    <Box
                        style={{
                            padding: vars.spacing.sm,
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm
                        }}
                    >
                        <Text size="xs" color="secondary" style={{ fontFamily: 'monospace' }}>
                            {`minimapOptions: {
  cursorColor: colors.cursor,
  cursorWidth: 1,
  autoScroll: false,
  autoCenter: false,
  minPxPerSec: 1,
  dragToSeek: true
}`}
                        </Text>
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
} as any;

export const InteractiveZoom: Story = {
    render: () => {
        const [zoom, setZoom] = React.useState(105);
        const [progress, setProgress] = React.useState(0.4);

        const minPxPerSec = zoom;
        let displayMode = 'Whole Song';
        if (minPxPerSec > 129) {
            displayMode = 'Dual Channels';
        } else if (minPxPerSec > 70) {
            displayMode = 'Single Channel';
        }

        return (
            <Box style={{ padding: vars.spacing.lg }}>
                <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Interactive Zoom Demo</Heading.H3>
                <Text color="secondary" style={{ marginBottom: vars.spacing.lg }}>
                    Adjust zoom level to see how WaveSurfer adapts its display mode. The waveform representation below
                    is a simplified visualization for Storybook.
                </Text>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md,
                        marginBottom: vars.spacing.lg
                    }}
                >
                    <Flex justify="space-between" align="center" style={{ marginBottom: vars.spacing.md }}>
                        <Text size="sm">Zoom Level</Text>
                        <Text size="sm" color="secondary">
                            {minPxPerSec} px/sec
                        </Text>
                    </Flex>
                    <Slider
                        min={1}
                        max={200}
                        step={1}
                        value={[zoom]}
                        onValueChange={(value) => setZoom(value[0])}
                    />
                    <Flex justify="space-between" style={{ marginTop: vars.spacing.xs }}>
                        <Text size="xs" color="secondary">
                            1
                        </Text>
                        <Text size="xs" color="secondary">
                            200
                        </Text>
                    </Flex>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md,
                        marginBottom: vars.spacing.lg
                    }}
                >
                    <Flex justify="space-between" align="center" style={{ marginBottom: vars.spacing.md }}>
                        <Text size="sm">Playback Progress</Text>
                        <Text size="sm" color="secondary">
                            {Math.round(progress * 100)}%
                        </Text>
                    </Flex>
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[progress * 100]}
                        onValueChange={(value) => setProgress(value[0] / 100)}
                    />
                </Box>

                <Box style={{ marginBottom: vars.spacing.md }}>
                    <Flex align="center" gap={vars.spacing.sm} style={{ marginBottom: vars.spacing.sm }}>
                        <Box
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: vars.colors.primary
                            }}
                        />
                        <Text size="sm">
                            Display Mode: <strong>{displayMode}</strong>
                        </Text>
                    </Flex>
                    <Text size="xs" color="secondary">
                        {displayMode === 'Whole Song' && 'Shows entire track at once. Best for navigation.'}
                        {displayMode === 'Single Channel' && 'Merged stereo view with center cursor.'}
                        {displayMode === 'Dual Channels' && 'Separate left/right channels for detailed analysis.'}
                    </Text>
                </Box>

                <Box
                    style={{
                        height: '120px',
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md,
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    <Box style={{ padding: vars.spacing.sm }}>
                        <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                            Waveform visualization
                        </Text>
                        <Flex style={{ height: '60px', gap: '2px', align: 'center' }}>
                            {Array.from({ length: 100 }, (_, i) => (
                                <Box
                                    key={i}
                                    style={{
                                        flex: 1,
                                        backgroundColor:
                                            i / 100 < progress ? vars.colors.primary : vars.colors.textSecondary,
                                        borderRadius: '2px',
                                        opacity: 0.5 + Math.random() * 0.5,
                                        transition: 'background-color 0.2s'
                                    }}
                                />
                            ))}
                        </Flex>
                    </Box>
                </Box>

                <Box
                    style={{
                        height: '40px',
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md,
                        marginTop: vars.spacing.sm,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        style={{
                            width: `${progress * 100}%`,
                            height: '100%',
                            backgroundColor: vars.colors.primary,
                            opacity: 0.3,
                            transition: 'width 0.2s'
                        }}
                    />
                </Box>
                <Text size="xs" color="secondary" style={{ marginTop: vars.spacing.xs }}>
                    Minimap overview
                </Text>
            </Box>
        );
    }
} as any;

export const Features: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Features</Heading.H3>

            <Flex direction="column" gap={vars.spacing.lg}>
                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm, color: vars.colors.primary }}>
                        Peak Caching
                    </Heading.H4>
                    <Text size="sm" color="secondary">
                        WaveSurfer caches extracted audio peaks in an LRU cache (max 10 entries) to avoid re-processing
                        the same audio files. This significantly improves performance when switching between tracks.
                    </Text>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm, color: vars.colors.primary }}>
                        Touch Gestures
                    </Heading.H4>
                    <Text size="sm" color="secondary">
                        Supports pinch-to-zoom on mobile devices with debounced touch events for smooth performance.
                        Single-finger tap seeks to position, dual-finger gesture controls zoom.
                    </Text>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm, color: vars.colors.primary }}>
                        Album Art Colors
                    </Heading.H4>
                    <Text size="sm" color="secondary">
                        Dynamically extracts dominant colors from album art to create a custom color scheme for the
                        waveform, providing visual harmony between artwork and visualization.
                    </Text>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm, color: vars.colors.primary }}>
                        Media Element Backend
                    </Heading.H4>
                    <Text size="sm" color="secondary">
                        Uses MediaElement backend (instead of WebAudio) for streaming compatibility with Jellyfin's
                        audio streaming. This ensures proper support for various audio formats and streaming protocols.
                    </Text>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm, color: vars.colors.primary }}>
                        Drag-to-Seek
                    </Heading.H4>
                    <Text size="sm" color="secondary">
                        Click and drag on the waveform to seek to any position. The cursor shows the current playback
                        position and updates in real-time during playback.
                    </Text>
                </Box>
            </Flex>
        </Box>
    )
} as any;

export const Performance: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Performance Considerations</Heading.H3>

            <Box
                style={{
                    padding: vars.spacing.md,
                    backgroundColor: vars.colors.surface,
                    borderRadius: vars.borderRadius.md
                }}
            >
                <Heading.H4 style={{ marginBottom: vars.spacing.md }}>Optimization Strategies</Heading.H4>

                <Flex direction="column" gap={vars.spacing.md}>
                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold', marginBottom: vars.spacing.xs }}>
                            Sample Rate
                        </Text>
                        <Text size="sm" color="secondary">
                            Uses 6000 Hz sample rate (whole song) to 3000 Hz (minimap) for reduced memory usage. Canvas
                            operations are optimized with device pixel ratio handling.
                        </Text>
                    </Box>

                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold', marginBottom: vars.spacing.xs }}>
                            Color Extraction
                        </Text>
                        <Text size="sm" color="secondary">
                            Album art colors are extracted on a 100x100 pixel canvas for fast processing. Results are
                            cached per track to avoid repeated extraction.
                        </Text>
                    </Box>

                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold', marginBottom: vars.spacing.xs }}>
                            Touch Debouncing
                        </Text>
                        <Text size="sm" color="secondary">
                            Touch move events are debounced at 20ms intervals to prevent excessive zoom calculations
                            during pinch gestures.
                        </Text>
                    </Box>

                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold', marginBottom: vars.spacing.xs }}>
                            Peak Processing
                        </Text>
                        <Text size="sm" color="secondary">
                            Audio peaks are computed once and cached. Peak extraction uses pixel striding for faster
                            processing of large audio files.
                        </Text>
                    </Box>
                </Flex>
            </Box>
        </Box>
    )
} as any;