import React, { useState } from 'react';
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
import RadioGroup from '@mui/joy/RadioGroup';
import Radio from '@mui/joy/Radio';
import LinearProgress from '@mui/joy/LinearProgress';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';

import { useTimeStretchStore } from 'store/timeStretchStore';

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

    const handleTransitionCurveChange = (_event: React.ChangeEvent<HTMLInputElement>, newValue: string | null) => {
        if (newValue) {
            setTransitionCurve(newValue as 'linear' | 'easeInOut');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Accordion
                expanded={expanded === 'time-stretch'}
                onChange={handleAccordionChange('time-stretch')}
            >
                <AccordionSummary>
                    <SpeedIcon sx={{ marginRight: 8 }} />
                    <Typography level="title-md">Time Stretch</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormLabel>Enable Time Stretching</FormLabel>
                            <Switch
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                        </FormControl>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            DJ Pause Effect
                        </Typography>
                        <Typography level="body-xs" sx={{ mb: 1, color: 'text.secondary' }}>
                            Smoothly slow playback when pausing, like a DJ bringing the beat to a stop
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Pause Duration: {pauseDuration.toFixed(1)}s
                            </Typography>
                            <Slider
                                value={pauseDuration}
                                onChange={(_, v) => setPauseDuration(v as number)}
                                min={0.5}
                                max={5}
                                step={0.1}
                                marks={[
                                    { value: 0.5, label: '0.5s' },
                                    { value: 2, label: '2s' },
                                    { value: 5, label: '5s' }
                                ]}
                                valueLabelDisplay="auto"
                                disabled={!enabled}
                            />
                        </Box>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            DJ Resume Effect
                        </Typography>
                        <Typography level="body-xs" sx={{ mb: 1, color: 'text.secondary' }}>
                            Smoothly accelerate back to normal speed when resuming
                        </Typography>
                        <Box sx={{ px: 2 }}>
                            <Typography level="body-xs" sx={{ mb: 1 }}>
                                Resume Duration: {resumeDuration.toFixed(1)}s
                            </Typography>
                            <Slider
                                value={resumeDuration}
                                onChange={(_, v) => setResumeDuration(v as number)}
                                min={0.1}
                                max={2}
                                step={0.1}
                                marks={[
                                    { value: 0.1, label: '0.1s' },
                                    { value: 0.5, label: '0.5s' },
                                    { value: 2, label: '2s' }
                                ]}
                                valueLabelDisplay="auto"
                                disabled={!enabled}
                            />
                        </Box>

                        <Divider />

                        <Typography level="title-sm" sx={{ mb: 1 }}>
                            Transition Curve
                        </Typography>
                        <RadioGroup
                            value={transitionCurve}
                            onChange={handleTransitionCurveChange}
                        >
                            <Radio value="linear" label="Linear" disabled={!enabled} />
                            <Radio value="easeInOut" label="Ease In-Out" disabled={!enabled} />
                        </RadioGroup>

                        {enabled && (
                            <>
                                <Divider />

                                <Typography level="title-sm" sx={{ mb: 1 }}>
                                    Current Status
                                </Typography>
                                <Box sx={{ px: 2 }}>
                                    <Typography level="body-xs" sx={{ mb: 1 }}>
                                        Tempo: {(currentTempo * 100).toFixed(0)}%
                                    </Typography>
                                    <LinearProgress
                                        value={currentTempo * 100}
                                        variant="soft"
                                        sx={{ mb: 1 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <TimerIcon fontSize="small" />
                                        <Typography level="body-xs">
                                            {isTransitioning
                                                ? 'Transitioning...'
                                                : isStopped
                                                ? 'Stopped'
                                                : 'Normal playback'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default TimeStretchSettings;
