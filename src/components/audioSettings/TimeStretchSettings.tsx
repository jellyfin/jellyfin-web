import React, { useState } from 'react';
import { StopwatchIcon, TimerIcon } from '@radix-ui/react-icons';
import { useTimeStretchStore } from 'store/timeStretchStore';
import { Slider } from 'ui-primitives';
import { Switch } from 'ui-primitives';
import { RadioGroup, Radio } from 'ui-primitives';
import { Divider } from 'ui-primitives';
import { Progress } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Card } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

export const TimeStretchSettings: React.FC = () => {
    const {
        enabled,
        setEnabled,
        pauseDuration,
        setPauseDuration,
        resumeDuration,
        setResumeDuration,
        transitionCurve,
        setTransitionCurve,
        currentTempo,
        setCurrentTempo,
        isTransitioning,
        isStopped
    } = useTimeStretchStore();

    const [expanded, setExpanded] = useState<string | false>('time-stretch');

    const handleAccordionChange = (panel: string) => {
        return (_event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : false);
        };
    };

    const handleTransitionCurveChange = (newValue: string) => {
        setTransitionCurve(newValue as 'linear' | 'easeInOut');
    };

    return (
        <Box style={{ padding: vars.spacing['5'] }}>
            <Card>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                    <StopwatchIcon />
                    <Text size="lg" weight="bold">
                        Time Stretch
                    </Text>
                </Flex>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                    <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Enable Time Stretching</Text>
                        <Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                    </Flex>

                    <Divider />

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing['2'] }}>
                        DJ Pause Effect
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing['2'] }}>
                        Smoothly slow playback when pausing, like a DJ bringing the beat to a stop
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing['5'], paddingRight: vars.spacing['5'] }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                            Pause Duration: {pauseDuration.toFixed(1)}s
                        </Text>
                        <Slider
                            value={[pauseDuration]}
                            onValueChange={v => setPauseDuration(v[0])}
                            min={0.5}
                            max={5}
                            step={0.1}
                            disabled={!enabled}
                        />
                    </Box>

                    <Divider />

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing['2'] }}>
                        DJ Resume Effect
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing['2'] }}>
                        Smoothly accelerate back to normal speed when resuming
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing['5'], paddingRight: vars.spacing['5'] }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                            Resume Duration: {resumeDuration.toFixed(1)}s
                        </Text>
                        <Slider
                            value={[resumeDuration]}
                            onValueChange={v => setResumeDuration(v[0])}
                            min={0.1}
                            max={2}
                            step={0.1}
                            disabled={!enabled}
                        />
                    </Box>

                    <Divider />

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing['2'] }}>
                        Transition Curve
                    </Text>
                    <RadioGroup value={transitionCurve} onValueChange={handleTransitionCurveChange}>
                        <Radio value="linear" label="Linear" disabled={!enabled} />
                        <Radio value="easeInOut" label="Ease In-Out" disabled={!enabled} />
                    </RadioGroup>

                    {enabled && (
                        <>
                            <Divider />

                            <Text size="md" weight="medium" style={{ marginBottom: vars.spacing['2'] }}>
                                Current Status
                            </Text>
                            <Box style={{ paddingLeft: vars.spacing['5'], paddingRight: vars.spacing['5'] }}>
                                <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                    Tempo: {(currentTempo * 100).toFixed(0)}%
                                </Text>
                                <Progress value={currentTempo * 100} />
                                <Flex
                                    style={{ gap: vars.spacing['4'], alignItems: 'center', marginTop: vars.spacing['4'] }}
                                >
                                    <TimerIcon />
                                    <Text size="xs">
                                        {isTransitioning
                                            ? 'Transitioning...'
                                            : isStopped
                                              ? 'Stopped'
                                              : 'Normal playback'}
                                    </Text>
                                </Flex>
                            </Box>
                        </>
                    )}
                </Flex>
            </Card>
        </Box>
    );
};

export default TimeStretchSettings;
