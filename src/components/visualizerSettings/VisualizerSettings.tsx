import { ActivityLogIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import { usePreferencesStore } from 'store/preferencesStore';
import { vars } from 'styles/tokens.css.ts';
import { Box, Card, Flex, Slider, Switch, Text } from 'ui-primitives';

export const VisualizerSettings: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

    const {
        visualizer: {
            enabled,
            type,
            sensitivity,
            barCount,
            smoothing,
            frequencyAnalyzer,
            waveSurfer,
            butterchurn,
            advanced
        },
        setVisualizerEnabled,
        setVisualizerType,
        setVisualizerColorScheme,
        setSensitivity,
        setBarCount,
        setSmoothing,
        setVisualizerOpacity,
        setFftSize,
        setButterchurnPreset
    } = usePreferencesStore();

    const toggleSection = (section: string) => {
        const newSections = new Set(expandedSections);
        if (newSections.has(section)) {
            newSections.delete(section);
        } else {
            newSections.add(section);
        }
        setExpandedSections(newSections);
    };

    const visualizerTypes = [
        { value: 'butterchurn', label: 'Butterchurn (Liquid)' },
        { value: 'waveform', label: 'Waveform' },
        { value: 'frequency', label: 'Frequency Bars' },
        { value: 'threed', label: '3D Geometric (Beta)' }
    ] as const;

    const currentOpacity =
        type === 'frequency'
            ? frequencyAnalyzer.opacity
            : type === 'waveform'
              ? waveSurfer.opacity
              : butterchurn.opacity;

    const ColorPickerPreset = ({
        label,
        value,
        onChange
    }: {
        label: string;
        value: string;
        onChange: (color: string) => void;
    }) => (
        <Box style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['3'] }}>
            <Text size="xs">{label}</Text>
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: vars.borderRadius.sm,
                    border: `2px solid ${vars.colors.surfaceVariant}`,
                    cursor: 'pointer'
                }}
            />
            <Text size="xs" style={{ fontFamily: 'monospace' }}>
                {value}
            </Text>
        </Box>
    );

    const SettingSection = ({ title, section }: { title: string; section: string }) => {
        const isExpanded = expandedSections.has(section);
        return (
            <Box
                onClick={() => toggleSection(section)}
                style={{
                    padding: `${vars.spacing['3']} 0`,
                    borderBottom: `1px solid ${vars.colors.surfaceVariant}`,
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <Flex
                    style={{
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Text
                        size="xs"
                        style={{
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {title}
                    </Text>
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </Flex>
            </Box>
        );
    };

    return (
        <Card style={{ marginBottom: vars.spacing['5'] }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                    <ActivityLogIcon />
                    <Text size="sm" style={{ fontWeight: 'bold' }}>
                        Visualizer
                    </Text>
                </Flex>

                <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold' }}>
                            Enable Visualizer
                        </Text>
                        <Text size="xs" color="secondary">
                            Show music visualization during playback
                        </Text>
                    </Box>
                    <Switch
                        checked={enabled}
                        onChange={(e) => setVisualizerEnabled(e.target.checked)}
                    />
                </Flex>

                {enabled && (
                    <>
                        {/* Basic Settings */}
                        <SettingSection title="Basic Settings" section="basic" />
                        {expandedSections.has('basic') && (
                            <Box
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: vars.spacing['4']
                                }}
                            >
                                <Box>
                                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                        Visualizer Type
                                    </Text>
                                    <Flex style={{ gap: vars.spacing['2'], flexWrap: 'wrap' }}>
                                        {visualizerTypes.map((t) => (
                                            <Box
                                                key={t.value}
                                                onClick={() => setVisualizerType(t.value)}
                                                style={{
                                                    padding: `${vars.spacing['2']} ${vars.spacing['4']}`,
                                                    borderRadius: vars.borderRadius.sm,
                                                    background:
                                                        type === t.value
                                                            ? vars.colors.primary
                                                            : vars.colors.surfaceVariant,
                                                    color:
                                                        type === t.value
                                                            ? 'white'
                                                            : vars.colors.text,
                                                    cursor: 'pointer',
                                                    fontSize: vars.typography['1'].fontSize,
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {t.label}
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>

                                <Box>
                                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                        Opacity: {Math.round(currentOpacity * 100)}%
                                    </Text>
                                    <Slider
                                        value={[currentOpacity * 100]}
                                        onValueChange={(v) => setVisualizerOpacity(v[0] / 100)}
                                        min={10}
                                        max={100}
                                        step={5}
                                    />
                                </Box>

                                <Box>
                                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                        Sensitivity: {sensitivity}%
                                    </Text>
                                    <Slider
                                        value={[sensitivity]}
                                        onValueChange={(v) => setSensitivity(v[0])}
                                        min={1}
                                        max={100}
                                        step={1}
                                    />
                                </Box>

                                <Box>
                                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                        Smoothing: {Math.round(smoothing * 100)}%
                                    </Text>
                                    <Slider
                                        value={[smoothing * 100]}
                                        onValueChange={(v) => setSmoothing(v[0] / 100)}
                                        min={0}
                                        max={100}
                                        step={1}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Advanced Settings */}
                        <SettingSection title="Advanced Audio" section="advanced" />
                        {expandedSections.has('advanced') && (
                            <Box
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: vars.spacing['4']
                                }}
                            >
                                <Box>
                                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                        FFT Size (Detail): {advanced.fftSize}
                                    </Text>
                                    <Text
                                        size="xs"
                                        color="secondary"
                                        style={{ marginBottom: vars.spacing['3'] }}
                                    >
                                        Higher = more frequency detail, lower = better performance
                                    </Text>
                                    <Flex style={{ gap: vars.spacing['2'] }}>
                                        {[1024, 2048, 4096, 8192].map((size) => (
                                            <Box
                                                key={size}
                                                onClick={() => setFftSize(size)}
                                                style={{
                                                    flex: 1,
                                                    padding: `${vars.spacing['2']} ${vars.spacing['1']}`,
                                                    borderRadius: vars.borderRadius.sm,
                                                    background:
                                                        advanced.fftSize === size
                                                            ? vars.colors.primary
                                                            : vars.colors.surfaceVariant,
                                                    color:
                                                        advanced.fftSize === size
                                                            ? 'white'
                                                            : vars.colors.text,
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {size}
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            </Box>
                        )}

                        {/* Frequency-specific Settings */}
                        {type === 'frequency' && (
                            <>
                                <SettingSection title="Frequency Bars" section="frequency" />
                                {expandedSections.has('frequency') && (
                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: vars.spacing['4']
                                        }}
                                    >
                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Bar Count: {barCount}
                                            </Text>
                                            <Slider
                                                value={[barCount]}
                                                onValueChange={(v) => setBarCount(v[0])}
                                                min={8}
                                                max={256}
                                                step={8}
                                            />
                                        </Box>

                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Color Scheme
                                            </Text>
                                            <Flex
                                                style={{ gap: vars.spacing['2'], flexWrap: 'wrap' }}
                                            >
                                                {['spectrum', 'solid', 'gradient', 'albumArt'].map(
                                                    (scheme) => (
                                                        <Box
                                                            key={scheme}
                                                            onClick={() =>
                                                                setVisualizerColorScheme(
                                                                    scheme as any
                                                                )
                                                            }
                                                            style={{
                                                                padding: `${vars.spacing['2']} ${vars.spacing['3']}`,
                                                                borderRadius: vars.borderRadius.sm,
                                                                background:
                                                                    frequencyAnalyzer.colorScheme ===
                                                                    scheme
                                                                        ? vars.colors.primary
                                                                        : vars.colors
                                                                              .surfaceVariant,
                                                                color:
                                                                    frequencyAnalyzer.colorScheme ===
                                                                    scheme
                                                                        ? 'white'
                                                                        : vars.colors.text,
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                textTransform: 'capitalize',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            {scheme}
                                                        </Box>
                                                    )
                                                )}
                                            </Flex>
                                        </Box>

                                        {frequencyAnalyzer.colorScheme === 'gradient' && (
                                            <Box
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: vars.spacing['3']
                                                }}
                                            >
                                                <Text size="xs" style={{ fontWeight: 'bold' }}>
                                                    Gradient Colors
                                                </Text>
                                                <ColorPickerPreset
                                                    label="Low"
                                                    value={frequencyAnalyzer.colors.gradient.low}
                                                    onChange={(low) =>
                                                        setVisualizerColorScheme('gradient', {
                                                            ...frequencyAnalyzer.colors.gradient,
                                                            low
                                                        })
                                                    }
                                                />
                                                <ColorPickerPreset
                                                    label="Mid"
                                                    value={frequencyAnalyzer.colors.gradient.mid}
                                                    onChange={(mid) =>
                                                        setVisualizerColorScheme('gradient', {
                                                            ...frequencyAnalyzer.colors.gradient,
                                                            mid
                                                        })
                                                    }
                                                />
                                                <ColorPickerPreset
                                                    label="High"
                                                    value={frequencyAnalyzer.colors.gradient.high}
                                                    onChange={(high) =>
                                                        setVisualizerColorScheme('gradient', {
                                                            ...frequencyAnalyzer.colors.gradient,
                                                            high
                                                        })
                                                    }
                                                />
                                            </Box>
                                        )}

                                        {frequencyAnalyzer.colorScheme === 'solid' && (
                                            <ColorPickerPreset
                                                label="Bar Color"
                                                value={frequencyAnalyzer.colors.solid}
                                                onChange={(color) =>
                                                    setVisualizerColorScheme('solid', {
                                                        solid: color
                                                    })
                                                }
                                            />
                                        )}
                                    </Box>
                                )}
                            </>
                        )}

                        {/* Waveform-specific Settings */}
                        {type === 'waveform' && (
                            <>
                                <SettingSection title="Waveform" section="waveform" />
                                {expandedSections.has('waveform') && (
                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: vars.spacing['4']
                                        }}
                                    >
                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Color Scheme
                                            </Text>
                                            <Flex
                                                style={{ gap: vars.spacing['2'], flexWrap: 'wrap' }}
                                            >
                                                {['albumArt', 'monochrome', 'stereo'].map(
                                                    (scheme) => (
                                                        <Box
                                                            key={scheme}
                                                            onClick={() =>
                                                                setVisualizerColorScheme(
                                                                    scheme as any
                                                                )
                                                            }
                                                            style={{
                                                                padding: `${vars.spacing['2']} ${vars.spacing['3']}`,
                                                                borderRadius: vars.borderRadius.sm,
                                                                background:
                                                                    waveSurfer.colorScheme ===
                                                                    scheme
                                                                        ? vars.colors.primary
                                                                        : vars.colors
                                                                              .surfaceVariant,
                                                                color:
                                                                    waveSurfer.colorScheme ===
                                                                    scheme
                                                                        ? 'white'
                                                                        : vars.colors.text,
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                textTransform: 'capitalize',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            {scheme}
                                                        </Box>
                                                    )
                                                )}
                                            </Flex>
                                        </Box>

                                        {waveSurfer.colorScheme === 'monochrome' && (
                                            <Box
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: vars.spacing['3']
                                                }}
                                            >
                                                <Text size="xs" style={{ fontWeight: 'bold' }}>
                                                    Monochrome Colors
                                                </Text>
                                                <ColorPickerPreset
                                                    label="Wave"
                                                    value={waveSurfer.colors.monochrome.wave}
                                                    onChange={(wave) =>
                                                        setVisualizerColorScheme('monochrome', {
                                                            monochrome: {
                                                                ...waveSurfer.colors.monochrome,
                                                                wave
                                                            }
                                                        })
                                                    }
                                                />
                                                <ColorPickerPreset
                                                    label="Cursor"
                                                    value={waveSurfer.colors.monochrome.cursor}
                                                    onChange={(cursor) =>
                                                        setVisualizerColorScheme('monochrome', {
                                                            monochrome: {
                                                                ...waveSurfer.colors.monochrome,
                                                                cursor
                                                            }
                                                        })
                                                    }
                                                />
                                            </Box>
                                        )}

                                        {waveSurfer.colorScheme === 'stereo' && (
                                            <Box
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: vars.spacing['3']
                                                }}
                                            >
                                                <Text size="xs" style={{ fontWeight: 'bold' }}>
                                                    Stereo Colors
                                                </Text>
                                                <ColorPickerPreset
                                                    label="Left"
                                                    value={waveSurfer.colors.stereo.left}
                                                    onChange={(left) =>
                                                        setVisualizerColorScheme('stereo', {
                                                            stereo: {
                                                                ...waveSurfer.colors.stereo,
                                                                left
                                                            }
                                                        })
                                                    }
                                                />
                                                <ColorPickerPreset
                                                    label="Right"
                                                    value={waveSurfer.colors.stereo.right}
                                                    onChange={(right) =>
                                                        setVisualizerColorScheme('stereo', {
                                                            stereo: {
                                                                ...waveSurfer.colors.stereo,
                                                                right
                                                            }
                                                        })
                                                    }
                                                />
                                                <ColorPickerPreset
                                                    label="Cursor"
                                                    value={waveSurfer.colors.stereo.cursor}
                                                    onChange={(cursor) =>
                                                        setVisualizerColorScheme('stereo', {
                                                            stereo: {
                                                                ...waveSurfer.colors.stereo,
                                                                cursor
                                                            }
                                                        })
                                                    }
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </>
                        )}

                        {/* Butterchurn-specific Settings */}
                        {type === 'butterchurn' && (
                            <>
                                <SettingSection title="Butterchurn" section="butterchurn" />
                                {expandedSections.has('butterchurn') && (
                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: vars.spacing['4']
                                        }}
                                    >
                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Preset Change Interval: {butterchurn.presetInterval}
                                                s
                                            </Text>
                                            <Slider
                                                value={[butterchurn.presetInterval]}
                                                onValueChange={(v) => {
                                                    // You'll need to add this setter to preferencesStore
                                                }}
                                                min={10}
                                                max={120}
                                                step={5}
                                            />
                                        </Box>

                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Transition Speed:{' '}
                                                {butterchurn.transitionSpeed.toFixed(1)}
                                            </Text>
                                            <Slider
                                                value={[butterchurn.transitionSpeed]}
                                                onValueChange={(v) => {
                                                    // You'll need to add this setter to preferencesStore
                                                }}
                                                min={1}
                                                max={5}
                                                step={0.1}
                                            />
                                        </Box>

                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Current Preset
                                            </Text>
                                            <Text
                                                size="xs"
                                                style={{
                                                    padding: vars.spacing['2'],
                                                    background: vars.colors.surfaceVariant,
                                                    borderRadius: vars.borderRadius.sm,
                                                    fontFamily: 'monospace',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {butterchurn.preset}
                                            </Text>
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}

                        {/* 3D Geometric-specific Settings */}
                        {type === 'threed' && (
                            <>
                                <SettingSection title="3D Geometric" section="threed" />
                                {expandedSections.has('threed') && (
                                    <Box
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: vars.spacing['4']
                                        }}
                                    >
                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Visualization Info
                                            </Text>
                                            <Text size="xs" color="secondary">
                                                Audio-reactive 3D wireframe sphere with
                                                bass-synchronized scaling and hue rotation. Perfect
                                                for immersive music visualization.
                                            </Text>
                                        </Box>

                                        <Box>
                                            <Text
                                                size="xs"
                                                style={{ marginBottom: vars.spacing['2'] }}
                                            >
                                                Features
                                            </Text>
                                            <Box as="ul" style={{ paddingLeft: vars.spacing['5'] }}>
                                                {[
                                                    'Real-time bass frequency (20-200Hz) scaling',
                                                    'Audio-intensity synchronized hue rotation',
                                                    'Smooth interpolation of scale changes',
                                                    'Starfield background with 5000+ stars',
                                                    'Orbit controls with auto-rotation'
                                                ].map((feature, idx) => (
                                                    <Box
                                                        key={idx}
                                                        as="li"
                                                        style={{ marginBottom: vars.spacing['2'] }}
                                                    >
                                                        <Text as="span" size="xs" color="secondary">
                                                            {feature}
                                                        </Text>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}
            </Flex>
        </Card>
    );
};

export default VisualizerSettings;
