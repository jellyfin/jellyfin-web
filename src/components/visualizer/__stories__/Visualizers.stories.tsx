import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { vars } from '../../../styles/tokens.css';
import { Box, Flex } from '../../../ui-primitives/Box';
import { Text, Heading } from '../../../ui-primitives/Text';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from '../../../ui-primitives/Button';
import { IconButton } from '../../../ui-primitives/IconButton';
import { Toggle } from '../../../ui-primitives/Toggle';
import { Slider } from '../../../ui-primitives/Slider';
import { WaveformCell } from '../WaveformCell';

const meta: Meta = {
    title: 'Visualizer/Integration',
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Visualizer integration showing how WaveformCell, WaveSurfer, and visualizer controls work together.'
            }
        }
    },
    tags: ['autodocs']
} as any;

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

export const PlaybackWithVisualizer: Story = {
    render: () => {
        const [isPlaying, setIsPlaying] = React.useState(false);
        const [currentTime, setCurrentTime] = React.useState(72000);
        const [volume, setVolume] = React.useState(80);
        const duration = 180000;
        const progress = currentTime / duration;

        React.useEffect(() => {
            if (!isPlaying) return;
            const interval = setInterval(() => {
                setCurrentTime(t => {
                    if (t >= duration) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return t + 1000;
                });
            }, 1000);
            return () => clearInterval(interval);
        }, [isPlaying, duration]);

        return (
            <Box
                style={{
                    height: '100vh',
                    backgroundColor: vars.colors.background,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${vars.colors.surface} 0%, ${vars.colors.background} 100%)`
                    }}
                >
                    <Box
                        style={{
                            width: '200px',
                            height: '200px',
                            borderRadius: vars.borderRadius.lg,
                            backgroundColor: vars.colors.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: vars.shadows.xl
                        }}
                    >
                        <Box
                            style={{
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                background: `conic-gradient(${vars.colors.primary} ${progress * 360}deg, ${vars.colors.surface} 0deg)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Box
                                style={{
                                    width: '140px',
                                    height: '140px',
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.surface,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text size="xl" weight="bold" style={{ color: vars.colors.primary }}>
                                    {formatDuration(currentTime)}
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.lg,
                        backgroundColor: vars.colors.surface,
                        borderTop: `1px solid ${vars.colors.border}`
                    }}
                >
                    <Box style={{ marginBottom: vars.spacing.md }}>
                        <WaveformCell
                            itemId="current-track"
                            peaks={[mockPeaks]}
                            duration={duration}
                            currentTime={currentTime}
                            isCurrentTrack={true}
                            isNextTrack={false}
                            height={48}
                        />
                    </Box>

                    <Flex align="center" gap={vars.spacing.md} style={{ marginBottom: vars.spacing.md }}>
                        <IconButton
                            variant="ghost"
                            size="lg"
                            onClick={() => setCurrentTime(Math.max(0, currentTime - 10000))}
                        >
                            ↺10
                        </IconButton>
                        <IconButton variant="soft" size="lg" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? '⏸' : '▶'}
                        </IconButton>
                        <IconButton
                            variant="ghost"
                            size="lg"
                            onClick={() => setCurrentTime(Math.min(duration, currentTime + 10000))}
                        >
                            ↻10
                        </IconButton>
                        <Box style={{ flex: 1 }} />
                        <Text size="sm" color="secondary" style={{ width: '40px', textAlign: 'right' }}>
                            {Math.round(volume)}%
                        </Text>
                        <Box style={{ width: '100px' }}>
                            <Slider
                                min={0}
                                max={100}
                                value={[volume]}
                                onValueChange={(value) => setVolume(value[0])}
                            />
                        </Box>
                    </Flex>

                    <Flex justify="space-between" align="center">
                        <Box>
                            <Text weight="bold">Track Title</Text>
                            <Text size="sm" color="secondary">
                                Artist Name
                            </Text>
                        </Box>
                        <Flex align="center" gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: isPlaying ? vars.colors.success : vars.colors.warning
                                }}
                            />
                            <Text size="sm" color="secondary">
                                {isPlaying ? 'Playing' : 'Paused'}
                            </Text>
                        </Flex>
                    </Flex>
                </Box>
            </Box>
        );
    }
} as any;

export const VisualizerControlsDemo: Story = {
    render: () => {
        const [settings, setSettings] = React.useState({
            butterchurn: false,
            threeJs: false,
            frequencyAnalyzer: true,
            waveSurfer: true
        });

        return (
            <Box style={{ padding: vars.spacing.lg }}>
                <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Visualizer Controls</Heading.H3>
                <Text color="secondary" style={{ marginBottom: vars.spacing.lg }}>
                    Control which visualizer components are active. Each visualizer renders in the visualizer container
                    when enabled.
                </Text>

                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    <Box
                        style={{
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: vars.spacing.sm }}
                        >
                            <Text size="sm" weight="bold">
                                Butterchurn
                            </Text>
                            <Toggle
                                pressed={settings.butterchurn}
                                onPressedChange={pressed => setSettings(s => ({ ...s, butterchurn: pressed }))}
                            >
                                {settings.butterchurn ? 'ON' : 'OFF'}
                            </Toggle>
                        </Flex>
                        <Text size="xs" color="secondary">
                            MilkDrop-compatible audio reactive visualizer with presets and customization.
                        </Text>
                    </Box>

                    <Box
                        style={{
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: vars.spacing.sm }}
                        >
                            <Text size="sm" weight="bold">
                                3D Visualizer
                            </Text>
                            <Toggle
                                pressed={settings.threeJs}
                                onPressedChange={pressed => setSettings(s => ({ ...s, threeJs: pressed }))}
                            >
                                {settings.threeJs ? 'ON' : 'OFF'}
                            </Toggle>
                        </Flex>
                        <Text size="xs" color="secondary">
                            Three.js based 3D visualizer with geometric shapes and camera effects.
                        </Text>
                    </Box>

                    <Box
                        style={{
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: vars.spacing.sm }}
                        >
                            <Text size="sm" weight="bold">
                                Frequency Analyzer
                            </Text>
                            <Toggle
                                pressed={settings.frequencyAnalyzer}
                                onPressedChange={pressed => setSettings(s => ({ ...s, frequencyAnalyzer: pressed }))}
                            >
                                {settings.frequencyAnalyzer ? 'ON' : 'OFF'}
                            </Toggle>
                        </Flex>
                        <Text size="xs" color="secondary">
                            Real-time frequency data visualization using Web Audio API analyzer node.
                        </Text>
                    </Box>

                    <Box
                        style={{
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md
                        }}
                    >
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ marginBottom: vars.spacing.sm }}
                        >
                            <Text size="sm" weight="bold">
                                WaveSurfer
                            </Text>
                            <Toggle
                                pressed={settings.waveSurfer}
                                onPressedChange={pressed => setSettings(s => ({ ...s, waveSurfer: pressed }))}
                            >
                                {settings.waveSurfer ? 'ON' : 'OFF'}
                            </Toggle>
                        </Flex>
                        <Text size="xs" color="secondary">
                            Interactive waveform display with zoom, timeline, and minimap plugins.
                        </Text>
                    </Box>
                </Box>

                <Box style={{ marginTop: vars.spacing.xl }}>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Active visualizers will render below in the visualizer container:
                    </Text>
                    <Box
                        style={{
                            height: '200px',
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px dashed ${vars.colors.border}`
                        }}
                    >
                        {settings.frequencyAnalyzer && (
                            <Box style={{ margin: vars.spacing.md }}>
                                <Flex gap={vars.spacing.xs} align="end" style={{ height: '80px' }}>
                                    {Array.from({ length: 32 }, (_, i) => (
                                        <Box
                                            key={i}
                                            style={{
                                                width: '8px',
                                                height: `${20 + Math.random() * 60}%`,
                                                backgroundColor: vars.colors.primary,
                                                borderRadius: '2px',
                                                opacity: 0.7
                                            }}
                                        />
                                    ))}
                                </Flex>
                            </Box>
                        )}
                        {settings.waveSurfer && (
                            <Box style={{ margin: vars.spacing.md }}>
                                <WaveformCell
                                    itemId="demo-waveform"
                                    peaks={[mockPeaks]}
                                    duration={180000}
                                    currentTime={72000}
                                    isCurrentTrack={true}
                                    isNextTrack={false}
                                    height={60}
                                />
                            </Box>
                        )}
                        {!settings.frequencyAnalyzer && !settings.waveSurfer && (
                            <Text size="sm" color="secondary">
                                Enable a visualizer above to see it here
                            </Text>
                        )}
                    </Box>
                </Box>
            </Box>
        );
    }
} as any;

export const AudioEngineIntegration: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Audio Engine Integration</Heading.H3>

            <Flex direction="column" gap={vars.spacing.lg}>
                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Signal Flow</Heading.H4>
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: vars.spacing.md,
                            padding: vars.spacing.md,
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm,
                            overflowX: 'auto'
                        }}
                    >
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.primary,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Media Element</Text>
                        </Box>
                        <Text size="lg" color="secondary">
                            →
                        </Text>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Gain Node</Text>
                        </Box>
                        <Text size="lg" color="secondary">
                            →
                        </Text>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Crossfade</Text>
                        </Box>
                        <Text size="lg" color="secondary">
                            →
                        </Text>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Mixer</Text>
                        </Box>
                        <Text size="lg" color="secondary">
                            →
                        </Text>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Limiter</Text>
                        </Box>
                        <Text size="lg" color="secondary">
                            →
                        </Text>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.success,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="xs">Output</Text>
                        </Box>
                    </Box>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Visualizer Connections</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Visualizers connect to the audio engine at specific points in the signal chain:
                    </Text>
                    <Flex direction="column" gap={vars.spacing.sm}>
                        <Flex align="center" gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '120px',
                                    padding: vars.spacing.xs,
                                    backgroundColor: vars.colors.background,
                                    borderRadius: vars.borderRadius.sm
                                }}
                            >
                                <Text size="xs">FrequencyAnalyzer</Text>
                            </Box>
                            <Text size="sm" color="secondary">
                                Connects to: Mixer node for real-time frequency data
                            </Text>
                        </Flex>
                        <Flex align="center" gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '120px',
                                    padding: vars.spacing.xs,
                                    backgroundColor: vars.colors.background,
                                    borderRadius: vars.borderRadius.sm
                                }}
                            >
                                <Text size="xs">Butterchurn</Text>
                            </Box>
                            <Text size="sm" color="secondary">
                                Connects to: Post-gain node for audio-reactive visuals
                            </Text>
                        </Flex>
                        <Flex align="center" gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '120px',
                                    padding: vars.spacing.xs,
                                    backgroundColor: vars.colors.background,
                                    borderRadius: vars.borderRadius.sm
                                }}
                            >
                                <Text size="xs">WaveSurfer</Text>
                            </Box>
                            <Text size="sm" color="secondary">
                                Connects to: MediaElement for waveform extraction
                            </Text>
                        </Flex>
                    </Flex>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Key Components</Heading.H4>
                    <Box
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: vars.spacing.md
                        }}
                    >
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.background,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="sm" weight="bold" style={{ marginBottom: vars.spacing.xs }}>
                                masterAudioOutput
                            </Text>
                            <Text size="xs" color="secondary">
                                Central audio output manager that coordinates the audio chain and provides access to
                                AudioContext, mixer node, and limiter.
                            </Text>
                        </Box>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.background,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="sm" weight="bold" style={{ marginBottom: vars.spacing.xs }}>
                                audioStore
                            </Text>
                            <Text size="xs" color="secondary">
                                Zustand store for audio playback state (playing, currentTime, volume, etc.)
                            </Text>
                        </Box>
                        <Box
                            style={{
                                padding: vars.spacing.sm,
                                backgroundColor: vars.colors.background,
                                borderRadius: vars.borderRadius.sm
                            }}
                        >
                            <Text size="sm" weight="bold" style={{ marginBottom: vars.spacing.xs }}>
                                visualizerSettings
                            </Text>
                            <Text size="xs" color="secondary">
                                Global settings for visualizer enabled/disabled state and configuration.
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Flex>
        </Box>
    )
} as any;

export const PerformanceOptimization: Story = {
    render: () => (
        <Box style={{ padding: vars.spacing.lg }}>
            <Heading.H3 style={{ marginBottom: vars.spacing.lg }}>Performance Optimization</Heading.H3>

            <Flex direction="column" gap={vars.spacing.lg}>
                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Lazy Loading</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Visualizer components use React.lazy() to reduce initial bundle size. They are only loaded when
                        enabled in settings.
                    </Text>
                    <Box
                        style={{
                            padding: vars.spacing.sm,
                            backgroundColor: vars.colors.background,
                            borderRadius: vars.borderRadius.sm
                        }}
                    >
                        <Text size="xs" style={{ fontFamily: 'monospace' }}>
                            {`const ButterchurnVisualizer = lazy(() =>
    import('./Butterchurn').catch(error => {
        logger.error('Failed to load Butterchurn', { component: 'Visualizers' }, error);
        return { default: () => <div>Visualizer unavailable</div> };
    })
);`}
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
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Peak Caching</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        WaveSurfer caches extracted audio peaks to avoid re-processing the same audio.
                    </Text>
                </Box>

                <Box
                    style={{
                        padding: vars.spacing.md,
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Heading.H4 style={{ marginBottom: vars.spacing.sm }}>Audio Processing</Heading.H4>
                    <Text size="sm" color="secondary" style={{ marginBottom: vars.spacing.md }}>
                        Audio processing optimizations:
                    </Text>
                    <Flex direction="column" gap={vars.spacing.sm}>
                        <Flex gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.success,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text size="xs">✓</Text>
                            </Box>
                            <Text size="sm">Sample rate: 6000 Hz for waveform, 3000 Hz for minimap</Text>
                        </Flex>
                        <Flex gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.success,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text size="xs">✓</Text>
                            </Box>
                            <Text size="sm">Touch event debouncing at 20ms intervals</Text>
                        </Flex>
                        <Flex gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.success,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text size="xs">✓</Text>
                            </Box>
                            <Text size="sm">Canvas operations use device pixel ratio</Text>
                        </Flex>
                        <Flex gap={vars.spacing.sm}>
                            <Box
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.success,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Text size="xs">✓</Text>
                            </Box>
                            <Text size="sm">RequestAnimationFrame for smooth animations</Text>
                        </Flex>
                    </Flex>
                </Box>
            </Flex>
        </Box>
    )
} as any;