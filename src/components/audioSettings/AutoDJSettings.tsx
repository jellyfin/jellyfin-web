import React from 'react';
import { CounterClockwiseClockIcon, MagicWandIcon } from '@radix-ui/react-icons';
import { useAutoDJStore } from 'store/autoDJStore';
import { usePreferencesStore } from 'store/preferencesStore';
import { Card } from 'ui-primitives/Card';
import { Slider } from 'ui-primitives/Slider';
import { Switch } from 'ui-primitives/FormControl';
import { Divider } from 'ui-primitives/Divider';
import { Progress } from 'ui-primitives/Progress';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const AutoDJSettings: React.FC = () => {
    const { getTransitionStats } = useAutoDJStore();

    const {
        autoDJ: { enabled: prefEnabled, duration, preferHarmonic, preferEnergyMatch, useNotchFilter, notchFrequency },
        setAutoDJEnabled: setPrefEnabled,
        setAutoDJDuration,
        setPreferHarmonic,
        setPreferEnergyMatch,
        setUseNotchFilter,
        setNotchFrequency
    } = usePreferencesStore();

    const stats = getTransitionStats();

    return (
        <Card style={{ marginBottom: vars.spacing['5'] }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                    <MagicWandIcon />
                    <Text size="sm" style={{ fontWeight: 'bold' }}>
                        Auto-DJ
                    </Text>
                </Flex>

                <Card style={{ marginBottom: vars.spacing['5'] }}>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                        <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Text size="sm" style={{ fontWeight: 'bold' }}>
                                    Enable Auto-DJ
                                </Text>
                                <Text size="xs" color="secondary">
                                    Automatically manage track transitions with smart mixing
                                </Text>
                            </Box>
                            <Switch checked={prefEnabled} onChange={e => setPrefEnabled(e.target.checked)} />
                        </Flex>

                        <Divider />

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Default Crossfade Duration: {duration}s
                            </Text>
                            <Slider
                                value={[duration]}
                                onValueChange={v => setAutoDJDuration(v[0])}
                                min={4}
                                max={60}
                                step={2}
                                disabled={!prefEnabled}
                            />
                        </Box>

                        <Divider />

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Prefer Harmonic Transitions
                            </Text>
                            <Switch
                                checked={preferHarmonic}
                                onChange={e => setPreferHarmonic(e.target.checked)}
                                disabled={!prefEnabled}
                            />
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Prefer Energy Match Transitions
                            </Text>
                            <Switch
                                checked={preferEnergyMatch}
                                onChange={e => setPreferEnergyMatch(e.target.checked)}
                                disabled={!prefEnabled}
                            />
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Use Notch Filter
                            </Text>
                            <Switch
                                checked={useNotchFilter}
                                onChange={e => setUseNotchFilter(e.target.checked)}
                                disabled={!prefEnabled}
                            />
                        </Box>

                        {useNotchFilter && (
                            <Box>
                                <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                    Notch Frequency: {notchFrequency}Hz
                                </Text>
                                <Slider
                                    value={[notchFrequency]}
                                    onValueChange={v => setNotchFrequency(v[0])}
                                    min={20}
                                    max={200}
                                    step={5}
                                    disabled={!prefEnabled}
                                />
                            </Box>
                        )}
                    </Flex>
                </Card>

                <Card>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                            <CounterClockwiseClockIcon />
                            <Text size="sm" style={{ fontWeight: 'bold' }}>
                                Transition History
                            </Text>
                        </Flex>

                        <Box style={{ display: 'grid', gap: vars.spacing['4'] }}>
                            <Box>
                                <Flex style={{ justifyContent: 'space-between', marginBottom: vars.spacing['2'] }}>
                                    <Text size="xs" color="secondary">
                                        Total Transitions
                                    </Text>
                                    <Text size="xs" style={{ fontWeight: 'bold' }}>
                                        {stats.totalTransitions}
                                    </Text>
                                </Flex>
                            </Box>

                            <Flex style={{ gap: vars.spacing['5'] }}>
                                <ChipStat label="Harmonic" value={stats.harmonicMixes} />
                                <ChipStat label="Energy" value={stats.energyMixes} />
                                <ChipStat label="Tempo" value={stats.tempoChanges} />
                                <ChipStat label="Standard" value={stats.standardMixes} />
                            </Flex>

                            <Divider />

                            <Box>
                                <Flex style={{ justifyContent: 'space-between', marginBottom: vars.spacing['2'] }}>
                                    <Text size="xs" color="secondary">
                                        Avg Compatibility
                                    </Text>
                                    <Text size="xs" style={{ fontWeight: 'bold' }}>
                                        {Math.round(stats.averageCompatibility * 100)}%
                                    </Text>
                                </Flex>
                                <Progress value={stats.averageCompatibility * 100} />
                            </Box>

                            <Box>
                                <Flex style={{ justifyContent: 'space-between', marginBottom: vars.spacing['2'] }}>
                                    <Text size="xs" color="secondary">
                                        Variety Score
                                    </Text>
                                    <Text size="xs" style={{ fontWeight: 'bold' }}>
                                        {Math.round(stats.varietyScore * 100)}%
                                    </Text>
                                </Flex>
                                <Progress value={stats.varietyScore * 100} />
                            </Box>
                        </Box>
                    </Flex>
                </Card>
            </Flex>
        </Card>
    );
};

const ChipStat: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    return (
        <Box style={{ textAlign: 'center' }}>
            <Text size="xs" style={{ fontWeight: 'bold' }}>
                {value}
            </Text>
            <Text size="xs" color="secondary">
                {label}
            </Text>
        </Box>
    );
};

export default AutoDJSettings;
