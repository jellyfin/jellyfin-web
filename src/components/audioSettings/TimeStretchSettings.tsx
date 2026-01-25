import React, { useState } from 'react';
import { StopwatchIcon, TimerIcon } from '@radix-ui/react-icons';
import { useTimeStretchStore } from 'store/timeStretchStore';
import { Slider } from 'ui-primitives/Slider';
import { Switch } from 'ui-primitives/Switch';
import { RadioGroup, Radio } from 'ui-primitives/RadioGroup';
import { Divider } from 'ui-primitives/Divider';
import { Progress } from 'ui-primitives/Progress';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Card } from 'ui-primitives/Card';
import { vars } from 'styles/tokens.css';

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
        <Box style={{ padding: vars.spacing.md }}>
            <Card>
                <Flex style={{ alignItems: 'center', gap: vars.spacing.sm }}>
                    <StopwatchIcon />
                    <Text size="lg" weight="bold">
                        Time Stretch
                    </Text>
                </Flex>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                    <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Enable Time Stretching</Text>
                        <Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                    </Flex>

                    <Divider />

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        DJ Pause Effect
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                        Smoothly slow playback when pausing, like a DJ bringing the beat to a stop
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
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

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        DJ Resume Effect
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginBottom: vars.spacing.xs }}>
                        Smoothly accelerate back to normal speed when resuming
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
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

                    <Text size="md" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        Transition Curve
                    </Text>
                    <RadioGroup value={transitionCurve} onValueChange={handleTransitionCurveChange}>
                        <Radio value="linear" label="Linear" disabled={!enabled} />
                        <Radio value="easeInOut" label="Ease In-Out" disabled={!enabled} />
                    </RadioGroup>

                    {enabled && (
                        <>
                            <Divider />

                            <Text size="md" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                                Current Status
                            </Text>
                            <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                                <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                    Tempo: {(currentTempo * 100).toFixed(0)}%
                                </Text>
                                <Progress value={currentTempo * 100} />
                                <Flex
                                    style={{ gap: vars.spacing.sm, alignItems: 'center', marginTop: vars.spacing.sm }}
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
