import React from 'react';
import { ActivityLogIcon, BorderAllIcon } from '@radix-ui/react-icons';
import { usePreferencesStore } from 'store/preferencesStore';
import { Card } from 'ui-primitives/Card';
import { Slider } from 'ui-primitives/Slider';
import { Switch } from 'ui-primitives/FormControl';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const VisualizerSettings: React.FC = () => {
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
        setFftSize
    } = usePreferencesStore();

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

    return (
        <Card style={{ marginBottom: vars.spacing.md }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing.sm }}>
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
                    <Switch checked={enabled} onChange={e => setVisualizerEnabled(e.target.checked)} />
                </Flex>

                {enabled && (
                    <>
                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Visualizer Type
                            </Text>
                            <Flex style={{ gap: vars.spacing.xs, flexWrap: 'wrap' }}>
                                {visualizerTypes.map(t => (
                                    <Box
                                        key={t.value}
                                        onClick={() => setVisualizerType(t.value)}
                                        style={{
                                            padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
                                            borderRadius: vars.borderRadius.sm,
                                            background:
                                                type === t.value ? vars.colors.primary : vars.colors.surfaceVariant,
                                            color: type === t.value ? 'white' : vars.colors.text,
                                            cursor: 'pointer',
                                            fontSize: vars.typography.fontSizeXs
                                        }}
                                    >
                                        {t.label}
                                    </Box>
                                ))}
                            </Flex>
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Opacity: {Math.round(currentOpacity * 100)}%
                            </Text>
                            <Slider
                                value={[currentOpacity * 100]}
                                onValueChange={v => setVisualizerOpacity(v[0] / 100)}
                                min={10}
                                max={100}
                                step={5}
                            />
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                FFT Size (Detail): {advanced.fftSize}
                            </Text>
                            <Flex style={{ gap: vars.spacing.xs }}>
                                {[1024, 2048, 4096, 8192].map(size => (
                                    <Box
                                        key={size}
                                        onClick={() => setFftSize(size)}
                                        style={{
                                            padding: `4px 8px`,
                                            borderRadius: vars.borderRadius.none,
                                            background:
                                                advanced.fftSize === size
                                                    ? vars.colors.primary
                                                    : vars.colors.surfaceVariant,
                                            color: advanced.fftSize === size ? 'white' : vars.colors.text,
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }}
                                    >
                                        {size}
                                    </Box>
                                ))}
                            </Flex>
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Sensitivity: {sensitivity}%
                            </Text>
                            <Slider
                                value={[sensitivity]}
                                onValueChange={v => setSensitivity(v[0])}
                                min={1}
                                max={100}
                                step={1}
                            />
                        </Box>

                        {type === 'frequency' && (
                            <Box>
                                <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                    Bar Count: {barCount}
                                </Text>
                                <Slider
                                    value={[barCount]}
                                    onValueChange={v => setBarCount(v[0])}
                                    min={8}
                                    max={256}
                                    step={8}
                                />
                            </Box>
                        )}

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Smoothing: {Math.round(smoothing * 100)}%
                            </Text>
                            <Slider
                                value={[smoothing * 100]}
                                onValueChange={v => setSmoothing(v[0] / 100)}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </Box>
                    </>
                )}
            </Flex>
        </Card>
    );
};

export default VisualizerSettings;
