import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Divider from '@mui/joy/Divider';
import Tooltip from '@mui/joy/Tooltip';
import Slider from '@mui/joy/Slider';
import Switch from '@mui/joy/Switch';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Accordion from '@mui/joy/Accordion';
import AccordionSummary from '@mui/joy/AccordionSummary';
import AccordionDetails from '@mui/joy/AccordionDetails';
import LinearProgress from '@mui/joy/LinearProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { type TransitionSuggestion, type FullTrackAnalysis } from './autoDJ';
import { useAutoDJ } from 'hooks/useAutoDJ';

interface TransitionPanelProps {
    currentTrackId: string | null;
    nextTrackId: string | null;
    nextAudioBuffer: AudioBuffer | null;
    onApplyTransition: (suggestion: TransitionSuggestion) => void;
    disabled?: boolean;
}

export const TransitionPanel: React.FC<TransitionPanelProps> = ({
    currentTrackId,
    nextTrackId,
    nextAudioBuffer,
    onApplyTransition,
    disabled = false,
}) => {
    const {
        getTransition,
        recordTransition,
        config,
        updateConfig,
        isAnalyzing,
        lastError,
    } = useAutoDJ();

    const [suggestion, setSuggestion] = useState<TransitionSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | false>('transition-panel');

    const handleAnalyze = async () => {
        if (!nextAudioBuffer) return;

        setLoading(true);
        try {
            const result = await getTransition(
                currentTrackId || '',
                nextTrackId || '',
                nextAudioBuffer
            );
            setSuggestion(result);
        } catch (error) {
            console.error('Failed to analyze transition:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (suggestion) {
            recordTransition(suggestion);
            onApplyTransition(suggestion);
        }
    };

    const compatibilityPercent = suggestion
        ? Math.round(suggestion.compatibilityScore * 100)
        : 0;

    const energyMatchPercent = suggestion
        ? Math.round(suggestion.energyMatch * 100)
        : 0;

    return (
        <Card variant='outlined' sx={{ minWidth: 300 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography level='title-sm' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon fontSize='small' />
                        Smart Transition
                    </Typography>
                    <IconButton
                        size='sm'
                        variant='plain'
                        onClick={() => setExpanded(expanded ? false : 'auto-dj-settings')}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>

                {!suggestion && !loading && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography level='body-sm' color='neutral' sx={{ mb: 2 }}>
                            Analyze next track for optimal transition
                        </Typography>
                        <Button
                            onClick={handleAnalyze}
                            disabled={!nextAudioBuffer || disabled || isAnalyzing}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Transition'}
                        </Button>
                        {lastError && (
                            <Typography level='body-xs' color='danger' sx={{ mt: 1 }}>
                                {lastError.message}
                            </Typography>
                        )}
                    </Box>
                )}

                {loading && (
                    <Box sx={{ py: 2 }}>
                        <Typography level='body-sm' color='neutral' sx={{ mb: 1 }}>
                            Analyzing tracks...
                        </Typography>
                        <LinearProgress variant='soft' />
                    </Box>
                )}

                {suggestion && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                                size='lg'
                                variant='soft'
                                color={getTransitionColor(suggestion.transitionType)}
                            >
                                {suggestion.transitionType}
                            </Chip>
                        </Box>

                        <Box sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography level='body-xs'>Compatibility</Typography>
                                    <Typography level='body-xs' fontWeight='bold'>
                                        {compatibilityPercent}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    value={compatibilityPercent}
                                    variant='soft'
                                    color={compatibilityPercent > 70 ? 'success' : compatibilityPercent > 40 ? 'warning' : 'danger'}
                                    size='sm'
                                />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography level='body-xs'>Energy Match</Typography>
                                    <Typography level='body-xs' fontWeight='bold'>
                                        {energyMatchPercent}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    value={energyMatchPercent}
                                    variant='soft'
                                    color={energyMatchPercent > 70 ? 'success' : energyMatchPercent > 40 ? 'warning' : 'danger'}
                                    size='sm'
                                />
                            </Box>
                        </Box>

                        {suggestion.fxRecommendation && suggestion.fxRecommendation !== 'No FX' && (
                            <Box sx={{ mb: 2 }}>
                                <Typography level='body-xs' color='neutral' sx={{ mb: 0.5 }}>
                                    Recommended FX
                                </Typography>
                                <Chip variant='outlined' size='sm'>
                                    {suggestion.fxRecommendation}
                                </Chip>
                            </Box>
                        )}

                        {suggestion.crossfadeDuration > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography level='body-xs' color='neutral'>
                                    Crossfade: {suggestion.crossfadeDuration.toFixed(1)}s
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant='outlined'
                                size='sm'
                                onClick={handleAnalyze}
                                disabled={disabled}
                            >
                                Re-analyze
                            </Button>
                            <Button
                                size='sm'
                                onClick={handleApply}
                                disabled={disabled}
                                sx={{ flex: 1 }}
                            >
                                Apply
                            </Button>
                        </Box>
                    </Box>
                )}

                <Accordion
                    expanded={expanded === 'auto-dj-settings'}
                    onChange={(_, v) => setExpanded(v ? 'auto-dj-settings' : false)}
                    sx={{ mt: 2 }}
                >
                    <AccordionSummary>
                        <Typography level='body-sm'>Auto-DJ Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
                                <FormLabel>
                                    <Typography level='body-xs'>Prefer Harmonic</Typography>
                                </FormLabel>
                                <Switch
                                    checked={config.preferHarmonic}
                                    onChange={(e) => updateConfig({ preferHarmonic: e.target.checked })}
                                />
                            </FormControl>

                            <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
                                <FormLabel>
                                    <Typography level='body-xs'>Prefer Energy Match</Typography>
                                </FormLabel>
                                <Switch
                                    checked={config.preferEnergyMatch}
                                    onChange={(e) => updateConfig({ preferEnergyMatch: e.target.checked })}
                                />
                            </FormControl>

                            <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
                                <FormLabel>
                                    <Typography level='body-xs'>Notch Filter</Typography>
                                </FormLabel>
                                <Switch
                                    checked={config.useNotchFilter}
                                    onChange={(e) => updateConfig({ useNotchFilter: e.target.checked })}
                                />
                            </FormControl>

                            <Box>
                                <Typography level='body-xs' sx={{ mb: 1 }}>
                                    Min Crossfade: {config.minCrossfadeDuration}s
                                </Typography>
                                <Slider
                                    value={config.minCrossfadeDuration}
                                    onChange={(_, v) => updateConfig({ minCrossfadeDuration: v as number })}
                                    min={4}
                                    max={30}
                                    step={2}
                                    size='sm'
                                />
                            </Box>

                            <Box>
                                <Typography level='body-xs' sx={{ mb: 1 }}>
                                    Max Crossfade: {config.maxCrossfadeDuration}s
                                </Typography>
                                <Slider
                                    value={config.maxCrossfadeDuration}
                                    onChange={(_, v) => updateConfig({ maxCrossfadeDuration: v as number })}
                                    min={10}
                                    max={60}
                                    step={2}
                                    size='sm'
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </CardContent>
        </Card>
    );
};

function getTransitionColor(type: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
    switch (type) {
        case 'Harmonic Mix':
            return 'success';
        case 'Energy Mix':
            return 'warning';
        case 'Tempo Change':
            return 'danger';
        case 'Beat Matched':
            return 'primary';
        default:
            return 'neutral';
    }
}

export default TransitionPanel;
