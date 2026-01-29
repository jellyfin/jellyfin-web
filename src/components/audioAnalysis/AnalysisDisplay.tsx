import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Card, Chip, Flex, Progress, Text, Tooltip } from 'ui-primitives';
import { type FullTrackAnalysis } from './autoDJ';

interface AnalysisDisplayProps {
    analysis: FullTrackAnalysis | null;
    compact?: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, compact = false }) => {
    if (!analysis) {
        return (
            <Card style={{ minWidth: compact ? 200 : 280 }}>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                    <Text size="sm" style={{ marginBottom: vars.spacing['2'] }}>
                        Track Analysis
                    </Text>
                    <Text size="sm" color="secondary">
                        No analysis available
                    </Text>
                </Flex>
            </Card>
        );
    }

    const bpmColor = getBPMColor(analysis.bpm);
    const normalizedBpmColor = bpmColor === 'error' ? 'error' : bpmColor;
    const energyPercent = Math.min(100, Math.round(analysis.energy * 200));
    const brightnessPercent = Math.min(100, Math.round(analysis.brightness * 100));

    if (compact) {
        return (
            <Flex style={{ gap: vars.spacing['4'], flexWrap: 'wrap', alignItems: 'center' }}>
                <Tooltip title={`${analysis.bpm.toFixed(1)} BPM`}>
                    <Chip size="sm">{analysis.bpm.toFixed(1)}</Chip>
                </Tooltip>
                <Tooltip title={analysis.key}>
                    <Chip size="sm">{analysis.camelotKey}</Chip>
                </Tooltip>
                <Tooltip title={`Energy: ${energyPercent}%`}>
                    <Chip size="sm">{energyPercent}% Energy</Chip>
                </Tooltip>
                <Tooltip title={analysis.primaryGenre}>
                    <Chip size="sm">{analysis.primaryGenre}</Chip>
                </Tooltip>
            </Flex>
        );
    }

    return (
        <Card style={{ minWidth: 280, maxWidth: 320 }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                <Text size="sm" style={{ marginBottom: vars.spacing['5'] }}>
                    Track Analysis
                </Text>

                <Box style={{ display: 'grid', gap: vars.spacing['4'] }}>
                    <Box>
                        <Flex
                            style={{
                                justifyContent: 'space-between',
                                marginBottom: vars.spacing['2']
                            }}
                        >
                            <Text size="xs" color="secondary">
                                BPM
                            </Text>
                            <Text
                                size="xs"
                                style={{ fontWeight: 'bold' }}
                                color={normalizedBpmColor}
                            >
                                {analysis.bpm.toFixed(1)}
                            </Text>
                        </Flex>
                        <Progress value={Math.min(100, (analysis.bpm / 180) * 100)} />
                    </Box>

                    <Box>
                        <Flex
                            style={{
                                justifyContent: 'space-between',
                                marginBottom: vars.spacing['2']
                            }}
                        >
                            <Text size="xs" color="secondary">
                                Key
                            </Text>
                            <Text size="xs" style={{ fontWeight: 'bold' }}>
                                {analysis.camelotKey}
                            </Text>
                        </Flex>
                        <Text size="xs" color="secondary">
                            {analysis.key} ({Math.round(analysis.keyConfidence * 100)}% confidence)
                        </Text>
                    </Box>

                    <Box>
                        <Flex
                            style={{
                                justifyContent: 'space-between',
                                marginBottom: vars.spacing['2']
                            }}
                        >
                            <Text size="xs" color="secondary">
                                Energy
                            </Text>
                            <Text
                                size="xs"
                                style={{ fontWeight: 'bold' }}
                                color={
                                    energyPercent > 60
                                        ? 'error'
                                        : energyPercent > 30
                                          ? 'warning'
                                          : 'success'
                                }
                            >
                                {energyPercent}%
                            </Text>
                        </Flex>
                        <Progress value={energyPercent} />
                    </Box>

                    <Box>
                        <Flex
                            style={{
                                justifyContent: 'space-between',
                                marginBottom: vars.spacing['2']
                            }}
                        >
                            <Text size="xs" color="secondary">
                                Brightness
                            </Text>
                            <Text size="xs" style={{ fontWeight: 'bold' }}>
                                {brightnessPercent}%
                            </Text>
                        </Flex>
                        <Progress value={brightnessPercent} />
                    </Box>

                    <Flex
                        style={{
                            justifyContent: 'space-between',
                            paddingTop: vars.spacing['4'],
                            borderTop: `1px solid ${vars.colors.border}`
                        }}
                    >
                        <Text size="xs" color="secondary">
                            Genre
                        </Text>
                        <Chip size="sm" variant="primary">
                            {analysis.primaryGenre}
                        </Chip>
                    </Flex>

                    {analysis.bpmConfidence > 0 && (
                        <Flex style={{ justifyContent: 'space-between' }}>
                            <Text size="xs" color="secondary">
                                BPM Confidence
                            </Text>
                            <Text size="xs">{Math.round(analysis.bpmConfidence * 100)}%</Text>
                        </Flex>
                    )}
                </Box>
            </Flex>
        </Card>
    );
};

function getBPMColor(bpm: number): 'success' | 'warning' | 'error' | 'primary' {
    if (bpm >= 118 && bpm <= 130) return 'success';
    if (bpm >= 60 && bpm < 100) return 'primary';
    if (bpm >= 160 && bpm <= 180) return 'error';
    return 'warning';
}

export default AnalysisDisplay;
