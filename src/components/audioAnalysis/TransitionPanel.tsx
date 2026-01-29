import { GearIcon, MagicWandIcon } from '@radix-ui/react-icons';
import { useAutoDJ } from 'hooks/useAutoDJ';
import React, { useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Box,
    Button,
    Card,
    Chip,
    Divider,
    Flex,
    IconButton,
    Progress,
    Slider,
    Switch,
    Text
} from 'ui-primitives';
import { type FullTrackAnalysis, type TransitionSuggestion } from './autoDJ';

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
    disabled = false
}) => {
    const { getTransition, recordTransition, config, updateConfig, isAnalyzing, lastError } =
        useAutoDJ();

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

    const compatibilityPercent = suggestion ? Math.round(suggestion.compatibilityScore * 100) : 0;

    const energyMatchPercent = suggestion ? Math.round(suggestion.energyMatch * 100) : 0;

    return (
        <Card style={{ minWidth: 300 }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                        size="sm"
                        style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['2'] }}
                    >
                        <MagicWandIcon />
                        Smart Transition
                    </Text>
                    <IconButton
                        size="sm"
                        variant="plain"
                        onClick={() => setExpanded(expanded ? false : 'auto-dj-settings')}
                    >
                        <GearIcon />
                    </IconButton>
                </Flex>

                {!suggestion && !loading && (
                    <Flex
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: vars.spacing['5']
                        }}
                    >
                        <Text
                            size="sm"
                            color="secondary"
                            style={{ marginBottom: vars.spacing['5'] }}
                        >
                            Analyze next track for optimal transition
                        </Text>
                        <Button
                            onClick={handleAnalyze}
                            disabled={!nextAudioBuffer || disabled || isAnalyzing}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Transition'}
                        </Button>
                        {lastError && (
                            <Text size="xs" color="error" style={{ marginTop: vars.spacing['2'] }}>
                                {lastError.message}
                            </Text>
                        )}
                    </Flex>
                )}

                {loading && (
                    <Flex
                        style={{
                            flexDirection: 'column',
                            gap: vars.spacing['4'],
                            padding: vars.spacing['4']
                        }}
                    >
                        <Text size="sm" color="secondary">
                            Analyzing tracks...
                        </Text>
                        <Progress />
                    </Flex>
                )}

                {suggestion && (
                    <Box>
                        <Flex
                            style={{
                                alignItems: 'center',
                                gap: vars.spacing['4'],
                                marginBottom: vars.spacing['5']
                            }}
                        >
                            <Chip
                                size="lg"
                                variant={getTransitionVariant(suggestion.transitionType)}
                            >
                                {suggestion.transitionType}
                            </Chip>
                        </Flex>

                        <Box
                            style={{
                                display: 'grid',
                                gap: vars.spacing['5'],
                                marginBottom: vars.spacing['5']
                            }}
                        >
                            <Box>
                                <Flex
                                    style={{
                                        justifyContent: 'space-between',
                                        marginBottom: vars.spacing['2']
                                    }}
                                >
                                    <Text size="xs" color="secondary">
                                        Compatibility
                                    </Text>
                                    <Text size="xs" style={{ fontWeight: 'bold' }}>
                                        {compatibilityPercent}%
                                    </Text>
                                </Flex>
                                <Progress value={compatibilityPercent} />
                            </Box>

                            <Box>
                                <Flex
                                    style={{
                                        justifyContent: 'space-between',
                                        marginBottom: vars.spacing['2']
                                    }}
                                >
                                    <Text size="xs" color="secondary">
                                        Energy Match
                                    </Text>
                                    <Text size="xs" style={{ fontWeight: 'bold' }}>
                                        {energyMatchPercent}%
                                    </Text>
                                </Flex>
                                <Progress value={energyMatchPercent} />
                            </Box>
                        </Box>

                        {suggestion.fxRecommendation && suggestion.fxRecommendation !== 'No FX' && (
                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Text
                                    size="xs"
                                    color="secondary"
                                    style={{ marginBottom: vars.spacing['2'] }}
                                >
                                    Recommended FX
                                </Text>
                                <Chip variant="neutral" size="sm">
                                    {suggestion.fxRecommendation}
                                </Chip>
                            </Box>
                        )}

                        {suggestion.crossfadeDuration > 0 && (
                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Text size="xs" color="secondary">
                                    Crossfade: {suggestion.crossfadeDuration.toFixed(1)}s
                                </Text>
                            </Box>
                        )}

                        <Divider />

                        <Flex style={{ gap: vars.spacing['4'] }}>
                            <Button
                                variant="outlined"
                                size="sm"
                                onClick={handleAnalyze}
                                disabled={disabled}
                            >
                                Re-analyze
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                                disabled={disabled}
                                style={{ flex: 1 }}
                            >
                                Apply
                            </Button>
                        </Flex>
                    </Box>
                )}

                <Card style={{ marginTop: vars.spacing['5'] }}>
                    <Text size="sm">Auto-DJ Settings</Text>
                    <Box style={{ display: 'grid', gap: vars.spacing['5'] }}>
                        <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text size="xs">Prefer Harmonic</Text>
                            <Switch
                                checked={config.preferHarmonic}
                                onChange={(e) => updateConfig({ preferHarmonic: e.target.checked })}
                            />
                        </Flex>

                        <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text size="xs">Prefer Energy Match</Text>
                            <Switch
                                checked={config.preferEnergyMatch}
                                onChange={(e) =>
                                    updateConfig({ preferEnergyMatch: e.target.checked })
                                }
                            />
                        </Flex>

                        <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text size="xs">Notch Filter</Text>
                            <Switch
                                checked={config.useNotchFilter}
                                onChange={(e) => updateConfig({ useNotchFilter: e.target.checked })}
                            />
                        </Flex>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Min Crossfade: {config.minCrossfadeDuration}s
                            </Text>
                            <Slider
                                value={[config.minCrossfadeDuration]}
                                onValueChange={(v) => updateConfig({ minCrossfadeDuration: v[0] })}
                                min={4}
                                max={30}
                                step={2}
                            />
                        </Box>

                        <Box>
                            <Text size="xs" style={{ marginBottom: vars.spacing['2'] }}>
                                Max Crossfade: {config.maxCrossfadeDuration}s
                            </Text>
                            <Slider
                                value={[config.maxCrossfadeDuration]}
                                onValueChange={(v) => updateConfig({ maxCrossfadeDuration: v[0] })}
                                min={10}
                                max={60}
                                step={2}
                            />
                        </Box>
                    </Box>
                </Card>
            </Flex>
        </Card>
    );
};

function getTransitionVariant(
    type: string
): 'success' | 'warning' | 'error' | 'primary' | 'neutral' {
    switch (type) {
        case 'Harmonic Mix':
            return 'success';
        case 'Energy Mix':
            return 'warning';
        case 'Tempo Change':
            return 'error';
        case 'Beat Matched':
            return 'primary';
        default:
            return 'neutral';
    }
}

export default TransitionPanel;
