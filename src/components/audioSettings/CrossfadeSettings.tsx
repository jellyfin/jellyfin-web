import React from 'react';
import { ClockIcon, ReloadIcon } from '@radix-ui/react-icons';
import { usePreferencesStore } from 'store/preferencesStore';
import { Card } from 'ui-primitives/Card';
import { Slider } from 'ui-primitives/Slider';
import { Switch } from 'ui-primitives/FormControl';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const CrossfadeSettings: React.FC = () => {
    const {
        crossfade: {
            crossfadeDuration,
            crossfadeEnabled,
            networkLatencyCompensation,
            networkLatencyMode,
            manualLatencyOffset
        },
        setCrossfadeDuration,
        setCrossfadeEnabled,
        setNetworkLatencyCompensation,
        setNetworkLatencyMode,
        setManualLatencyOffset
    } = usePreferencesStore();

    return (
        <Card style={{ marginBottom: vars.spacing['5'] }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                    <ClockIcon />
                    <Text size="sm" style={{ fontWeight: 'bold' }}>
                        Crossfade
                    </Text>
                </Flex>

                <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Text size="sm" style={{ fontWeight: 'bold' }}>
                            Enable Crossfade
                        </Text>
                        <Text size="xs" color="secondary">
                            Smooth transitions between tracks
                        </Text>
                    </Box>
                    <Switch checked={crossfadeEnabled} onChange={e => setCrossfadeEnabled(e.target.checked)} />
                </Flex>

                <Box>
                    <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                        Crossfade Duration: {crossfadeDuration}s
                    </Text>
                    <Slider
                        value={[crossfadeDuration]}
                        onValueChange={v => setCrossfadeDuration(v[0])}
                        min={0}
                        max={30}
                        step={0.5}
                        disabled={!crossfadeEnabled}
                    />
                </Box>

                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                    <ReloadIcon />
                    <Text size="sm" style={{ fontWeight: 'bold' }}>
                        Network Latency Compensation
                    </Text>
                </Flex>

                <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Text size="sm">Latency Mode</Text>
                        <Text size="xs" color="secondary">
                            {networkLatencyMode === 'auto' ? 'Auto-detect network delay' : 'Manual offset'}
                        </Text>
                    </Box>
                    <Switch
                        checked={networkLatencyMode === 'auto'}
                        onChange={e => setNetworkLatencyMode(e.target.checked ? 'auto' : 'manual')}
                    />
                </Flex>

                {networkLatencyMode === 'auto' ? (
                    <Box>
                        <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                            Detected Latency: {networkLatencyCompensation}s
                        </Text>
                        <Text size="xs" color="secondary">
                            Automatically adjusts based on network conditions
                        </Text>
                    </Box>
                ) : (
                    <Box>
                        <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                            Manual Offset: {manualLatencyOffset}s
                        </Text>
                        <Slider
                            value={[manualLatencyOffset]}
                            onValueChange={v => setManualLatencyOffset(v[0])}
                            min={0}
                            max={5}
                            step={0.1}
                        />
                    </Box>
                )}
            </Flex>
        </Card>
    );
};

export default CrossfadeSettings;
