import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Switch from '@mui/joy/Switch';
import Slider from '@mui/joy/Slider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Divider from '@mui/joy/Divider';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import LinearProgress from '@mui/joy/LinearProgress';
import Accordion from '@mui/joy/Accordion';
import AccordionSummary from '@mui/joy/AccordionSummary';
import AccordionDetails from '@mui/joy/AccordionDetails';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History';

import { useAutoDJStore } from 'store/autoDJStore';

export const AutoDJSettings: React.FC = () => {
    const {
        enabled,
        setEnabled,
        crossfadeDuration,
        setCrossfadeDuration,
        getTransitionStats,
    } = useAutoDJStore();

    const stats = getTransitionStats();

    return (
        <Accordion defaultExpanded>
            <AccordionSummary>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon />
                    <Typography level='title-sm'>Auto-DJ</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Card variant='outlined' sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography level='body-sm' fontWeight='bold'>
                                    Enable Auto-DJ
                                </Typography>
<Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                                    Automatically manage track transitions with smart mixing
                                </Typography>
                            </Box>
                            <Switch
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                color='primary'
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                            <Typography level='body-xs' sx={{ mb: 1 }}>
                                Default Crossfade Duration: {crossfadeDuration}s
                            </Typography>
                            <Slider
                                value={crossfadeDuration}
                                onChange={(_, v) => setCrossfadeDuration(v as number)}
                                min={4}
                                max={60}
                                step={2}
                                disabled={!enabled}
                                size='sm'
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card variant='outlined'>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <HistoryIcon fontSize='small' />
                            <Typography level='body-sm' fontWeight='bold'>
                                Transition History
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography level='body-xs'>Total Transitions</Typography>
                                    <Typography level='body-xs' fontWeight='bold'>
                                        {stats.totalTransitions}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <ChipStat label='Harmonic' value={stats.harmonicMixes} />
                                <ChipStat label='Energy' value={stats.energyMixes} />
                                <ChipStat label='Tempo' value={stats.tempoChanges} />
                                <ChipStat label='Standard' value={stats.standardMixes} />
                            </Box>

                            <Divider />

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography level='body-xs'>Avg Compatibility</Typography>
                                    <Typography level='body-xs' fontWeight='bold'>
                                        {Math.round(stats.averageCompatibility * 100)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    value={stats.averageCompatibility * 100}
                                    variant='soft'
                                    color='primary'
                                    size='sm'
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography level='body-xs'>Variety Score</Typography>
                                    <Typography level='body-xs' fontWeight='bold'>
                                        {Math.round(stats.varietyScore * 100)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    value={stats.varietyScore * 100}
                                    variant='soft'
                                    color={stats.varietyScore > 0.5 ? 'success' : 'warning'}
                                    size='sm'
                                />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </AccordionDetails>
        </Accordion>
    );
};

const ChipStat: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography level='body-xs' fontWeight='bold'>
                {value}
            </Typography>
            <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                {label}
            </Typography>
        </Box>
    );
};

export default AutoDJSettings;
