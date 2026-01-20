import React, { useState, type SyntheticEvent } from 'react';
import Box from '@mui/joy/Box';
import Slider from '@mui/joy/Slider';
import Typography from '@mui/joy/Typography';
import Switch from '@mui/joy/Switch';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Divider from '@mui/joy/Divider';
import Accordion from '@mui/joy/Accordion';
import AccordionSummary from '@mui/joy/AccordionSummary';
import AccordionDetails from '@mui/joy/AccordionDetails';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import WavesIcon from '@mui/icons-material/Waves';

import { useFXStore } from 'store/fxStore';

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
        <Box sx={{ p: 2 }}>
            <Accordion
                expanded={expanded === 'fx-panel'}
                onChange={handleAccordionChange('fx-panel')}
            >
                <AccordionSummary>
                    <GraphicEqIcon sx={{ marginRight: 8 }} />
                    <Typography level="title-md">DJ FX</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            Notch Filter (Hum Removal)
                        </Typography>
                        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                            <FormLabel>50Hz/60Hz Notch</FormLabel>
                            <Switch
                                checked={notchEnabled}
                                onChange={(e) => setNotchEnabled(e.target.checked)}
                            />
                        </FormControl>
                        {notchEnabled && (
                            <Box sx={{ px: 2 }}>
                                <Typography level="body-xs" sx={{ mb: 1 }}>
                                    Frequency: {notchFrequency}Hz
                                </Typography>
                                <Slider
                                    value={notchFrequency}
                                    onChange={(_, v) => setNotchFrequency(v as number)}
                                    min={50}
                                    max={70}
                                    step={1}
                                    marks={[
                                        { value: 50, label: '50Hz' },
                                        { value: 60, label: '60Hz' }
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <Typography level="body-xs" sx={{ mb: 1, mt: 1 }}>
                                    Resonance: {notchResonance.toFixed(1)}
                                </Typography>
                                <Slider
                                    value={notchResonance}
                                    onChange={(_, v) => setNotchResonance(v as number)}
                                    min={0.1}
                                    max={20}
                                    step={0.1}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        )}

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            FX Bus 1 - Reverb
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Wet Mix: {Math.round(fxBus1WetMix * 100)}%
                            </Typography>
                            <Slider
                                value={fxBus1WetMix}
                                onChange={(_, v) => setFXBus1WetMix(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Return Level: {Math.round(fxBus1ReturnLevel * 100)}%
                            </Typography>
                            <Slider
                                value={fxBus1ReturnLevel}
                                onChange={(_, v) => setFXBus1ReturnLevel(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            FX Bus 2 - Echo
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Wet Mix: {Math.round(fxBus2WetMix * 100)}%
                            </Typography>
                            <Slider
                                value={fxBus2WetMix}
                                onChange={(_, v) => setFXBus2WetMix(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Return Level: {Math.round(fxBus2ReturnLevel * 100)}%
                            </Typography>
                            <Slider
                                value={fxBus2ReturnLevel}
                                onChange={(_, v) => setFXBus2ReturnLevel(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            Rubber Banding (Time Stretch)
                        </Typography>
                        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between' }}>
                            <FormLabel>Enable Time Stretching</FormLabel>
                            <Switch
                                checked={rubberBandingEnabled}
                                onChange={(e) => setRubberBandingEnabled(e.target.checked)}
                            />
                        </FormControl>
                        {rubberBandingEnabled && (
                            <Box sx={{ px: 2 }}>
                                <Typography level="body-xs" sx={{ mb: 1 }}>
                                    Rate: {rubberBandingRate}x
                                </Typography>
                                <Slider
                                    value={rubberBandingRate}
                                    onChange={(_, v) => setRubberBandingRate(v as number)}
                                    min={0.5}
                                    max={10}
                                    step={0.5}
                                    marks={[
                                        { value: 0.5, label: '0.5x' },
                                        { value: 1, label: '1x' },
                                        { value: 2, label: '2x' }
                                    ]}
                                    valueLabelDisplay="auto"
                                />
                                <Typography level="body-xs" sx={{ mb: 1, mt: 1 }}>
                                    Intensity: {Math.round(rubberBandingIntensity * 100)}%
                                </Typography>
                                <Slider
                                    value={rubberBandingIntensity}
                                    onChange={(_, v) => setRubberBandingIntensity(v as number)}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Accordion
                expanded={expanded === 'send-levels'}
                onChange={handleAccordionChange('send-levels')}
                sx={{ mt: 1 }}
            >
                <AccordionSummary>
                    <WavesIcon sx={{ mr: 1 }} />
                    <Typography level="title-md">FX Send Levels</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography level="title-sm" sx={{ mb: 1, color: 'primary.plainColor' }}>
                            Deck A
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Send 1 (Reverb): {Math.round(deckAFXSend1 * 100)}%
                            </Typography>
                            <Slider
                                value={deckAFXSend1}
                                onChange={(_, v) => setDeckAFXSend1(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                color="primary"
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Send 2 (Echo): {Math.round(deckAFXSend2 * 100)}%
                            </Typography>
                            <Slider
                                value={deckAFXSend2}
                                onChange={(_, v) => setDeckAFXSend2(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                color="success"
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1, color: 'success.plainColor' }}>
                            Deck B
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Send 1 (Reverb): {Math.round(deckBFXSend1 * 100)}%
                            </Typography>
                            <Slider
                                value={deckBFXSend1}
                                onChange={(_, v) => setDeckBFXSend1(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                color="primary"
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Send 2 (Echo): {Math.round(deckBFXSend2 * 100)}%
                            </Typography>
                            <Slider
                                value={deckBFXSend2}
                                onChange={(_, v) => setDeckBFXSend2(v as number)}
                                min={0}
                                max={1}
                                step={0.01}
                                color="success"
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default FXSettings;
