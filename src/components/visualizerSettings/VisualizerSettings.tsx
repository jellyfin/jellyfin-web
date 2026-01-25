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
        visualizer: { enabled, type, colorScheme, sensitivity, barCount, smoothing },
        setVisualizerEnabled,
        setVisualizerType,
        setVisualizerColorScheme,
        setSensitivity,
        setBarCount,
        setSmoothing
    } = usePreferencesStore();

    const visualizerTypes = [
        { value: 'butterchurn', label: 'Butterchurn (Liquid)' },
        { value: 'waveform', label: 'Waveform' },
        { value: 'frequency', label: 'Frequency Bars' }
    ] as const;

    const colorSchemes = [
        { value: 'default', label: 'Default' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'neon', label: 'Neon' },
        { value: 'warm', label: 'Warm' },
        { value: 'cool', label: 'Cool' }
    ] as const;

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
                                    <Switch
                                        key={t.value}
                                        checked={type === t.value}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setVisualizerType(t.value);
                                            }
                                        }}
                                    />
                                ))}
                            </Flex>
                            <Text size="xs" color="secondary">
                                {visualizerTypes.find(t => t.value === type)?.label}
                            </Text>
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Color Scheme
                            </Text>
                            <Flex style={{ gap: vars.spacing.xs, flexWrap: 'wrap' }}>
                                {colorSchemes.map(c => (
                                    <Switch
                                        key={c.value}
                                        checked={colorScheme === c.value}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setVisualizerColorScheme(c.value);
                                            }
                                        }}
                                    />
                                ))}
                            </Flex>
                            <Text size="xs" color="secondary">
                                {colorSchemes.find(c => c.value === colorScheme)?.label}
                            </Text>
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
