import React, { useState, type SyntheticEvent } from 'react';
import { ActivityLogIcon, MixerHorizontalIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import { useFXStore } from 'store/fxStore';
import { Slider } from 'ui-primitives/Slider';
import { Switch } from 'ui-primitives/Switch';
import { Divider } from 'ui-primitives/Divider';
import { Card } from 'ui-primitives/Card';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const FXSettings: React.FC = () => {
    const {
        notchEnabled,
        setNotchEnabled,
        notchFrequency,
        setNotchFrequency,
        notchResonance,
        setNotchResonance,
        deckAFXSend1,
        setDeckAFXSend1,
        deckAFXSend2,
        setDeckAFXSend2,
        deckBFXSend1,
        setDeckBFXSend1,
        deckBFXSend2,
        setDeckBFXSend2,
        fxBus1WetMix,
        setFXBus1WetMix,
        fxBus2WetMix,
        setFXBus2WetMix,
        fxBus1ReturnLevel,
        setFXBus1ReturnLevel,
        fxBus2ReturnLevel,
        setFXBus2ReturnLevel,
        rubberBandingEnabled,
        setRubberBandingEnabled,
        rubberBandingRate,
        setRubberBandingRate,
        rubberBandingIntensity,
        setRubberBandingIntensity
    } = useFXStore();

    const [expanded, setExpanded] = useState<string | false>('fx-panel');

    const handleAccordionChange = (panel: string) => {
        return (_event: React.SyntheticEvent, isExpanded: boolean | undefined) => {
            setExpanded(isExpanded ? panel : false);
        };
    };

    return (
        <Box style={{ padding: vars.spacing.md }}>
            <Card style={{ marginBottom: vars.spacing.md }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing.sm }}>
                    <MixerHorizontalIcon />
                    <Text size="lg" weight="bold">
                        DJ FX
                    </Text>
                </Flex>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                    <Text size="sm" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        Notch Filter (Hum Removal)
                    </Text>
                    <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>50Hz/60Hz Notch</Text>
                        <Switch checked={notchEnabled} onChange={e => setNotchEnabled(e.target.checked)} />
                    </Flex>
                    {notchEnabled && (
                        <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Frequency: {notchFrequency}Hz
                            </Text>
                            <Slider
                                value={[notchFrequency]}
                                onValueChange={v => setNotchFrequency(v[0])}
                                min={50}
                                max={70}
                                step={1}
                            />
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs, marginTop: vars.spacing.sm }}>
                                Resonance: {notchResonance.toFixed(1)}
                            </Text>
                            <Slider
                                value={[notchResonance]}
                                onValueChange={v => setNotchResonance(v[0])}
                                min={0.1}
                                max={20}
                                step={0.1}
                            />
                        </Box>
                    )}

                    <Divider />

                    <Text size="sm" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        FX Bus 1 - Reverb
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Wet Mix: {Math.round(fxBus1WetMix * 100)}%
                        </Text>
                        <Slider
                            value={[fxBus1WetMix]}
                            onValueChange={v => setFXBus1WetMix(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Return Level: {Math.round(fxBus1ReturnLevel * 100)}%
                        </Text>
                        <Slider
                            value={[fxBus1ReturnLevel]}
                            onValueChange={v => setFXBus1ReturnLevel(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>

                    <Divider />

                    <Text size="sm" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        FX Bus 2 - Echo
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Wet Mix: {Math.round(fxBus2WetMix * 100)}%
                        </Text>
                        <Slider
                            value={[fxBus2WetMix]}
                            onValueChange={v => setFXBus2WetMix(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Return Level: {Math.round(fxBus2ReturnLevel * 100)}%
                        </Text>
                        <Slider
                            value={[fxBus2ReturnLevel]}
                            onValueChange={v => setFXBus2ReturnLevel(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>

                    <Divider />

                    <Text size="sm" weight="medium" style={{ marginBottom: vars.spacing.xs }}>
                        Rubber Banding (Time Stretch)
                    </Text>
                    <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>Enable Time Stretching</Text>
                        <Switch
                            checked={rubberBandingEnabled}
                            onChange={e => setRubberBandingEnabled(e.target.checked)}
                        />
                    </Flex>
                    {rubberBandingEnabled && (
                        <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                                Rate: {rubberBandingRate}x
                            </Text>
                            <Slider
                                value={[rubberBandingRate]}
                                onValueChange={v => setRubberBandingRate(v[0])}
                                min={0.5}
                                max={10}
                                step={0.5}
                            />
                            <Text size="xs" style={{ marginBottom: vars.spacing.xs, marginTop: vars.spacing.sm }}>
                                Intensity: {Math.round(rubberBandingIntensity * 100)}%
                            </Text>
                            <Slider
                                value={[rubberBandingIntensity]}
                                onValueChange={v => setRubberBandingIntensity(v[0])}
                                min={0}
                                max={1}
                                step={0.01}
                            />
                        </Box>
                    )}
                </Flex>
            </Card>

            <Card style={{ marginTop: vars.spacing.md }}>
                <Flex style={{ alignItems: 'center', gap: vars.spacing.sm }}>
                    <SpeakerLoudIcon />
                    <Text size="md" weight="bold">
                        FX Send Levels
                    </Text>
                </Flex>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                    <Text
                        size="sm"
                        weight="medium"
                        style={{ marginBottom: vars.spacing.xs, color: vars.colors.primary }}
                    >
                        Deck A
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Send 1 (Reverb): {Math.round(deckAFXSend1 * 100)}%
                        </Text>
                        <Slider
                            value={[deckAFXSend1]}
                            onValueChange={v => setDeckAFXSend1(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Send 2 (Echo): {Math.round(deckAFXSend2 * 100)}%
                        </Text>
                        <Slider
                            value={[deckAFXSend2]}
                            onValueChange={v => setDeckAFXSend2(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>

                    <Divider />

                    <Text
                        size="sm"
                        weight="medium"
                        style={{ marginBottom: vars.spacing.xs, color: vars.colors.success }}
                    >
                        Deck B
                    </Text>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Send 1 (Reverb): {Math.round(deckBFXSend1 * 100)}%
                        </Text>
                        <Slider
                            value={[deckBFXSend1]}
                            onValueChange={v => setDeckBFXSend1(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>
                    <Box style={{ paddingLeft: vars.spacing.md, paddingRight: vars.spacing.md }}>
                        <Text size="xs" style={{ marginBottom: vars.spacing.xs }}>
                            Send 2 (Echo): {Math.round(deckBFXSend2 * 100)}%
                        </Text>
                        <Slider
                            value={[deckBFXSend2]}
                            onValueChange={v => setDeckBFXSend2(v[0])}
                            min={0}
                            max={1}
                            step={0.01}
                        />
                    </Box>
                </Flex>
            </Card>
        </Box>
    );
};

export default FXSettings;
