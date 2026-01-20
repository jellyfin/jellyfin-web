import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Chip from '@mui/joy/Chip';
import LinearProgress from '@mui/joy/LinearProgress';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Tooltip from '@mui/joy/Tooltip';

import { type FullTrackAnalysis } from './autoDJ';

interface AnalysisDisplayProps {
    analysis: FullTrackAnalysis | null;
    compact?: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, compact = false }) => {
    if (!analysis) {
        return (
            <Card variant='outlined' sx={{ minWidth: compact ? 200 : 280 }}>
                <CardContent>
                    <Typography level='title-sm' sx={{ mb: 1 }}>
                        Track Analysis
                    </Typography>
                    <Typography level='body-sm' color='neutral'>
                        No analysis available
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const bpmColor = getBPMColor(analysis.bpm);
    const energyPercent = Math.min(100, Math.round(analysis.energy * 200));
    const brightnessPercent = Math.min(100, Math.round(analysis.brightness * 100));

    if (compact) {
        return (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Tooltip title={`${analysis.bpm.toFixed(1)} BPM`}>
                    <Chip size='sm' variant='soft' color={bpmColor}>
                        {Math.round(analysis.bpm)} BPM
                    </Chip>
                </Tooltip>
                <Tooltip title={analysis.key}>
                    <Chip size='sm' variant='soft' color='primary'>
                        {analysis.camelotKey}
                    </Chip>
                </Tooltip>
                <Tooltip title={`Energy: ${energyPercent}%`}>
                    <Chip
                        size='sm'
                        variant='soft'
                        color={energyPercent > 60 ? 'danger' : energyPercent > 30 ? 'warning' : 'success'}
                    >
                        {energyPercent}% Energy
                    </Chip>
                </Tooltip>
                <Tooltip title={analysis.primaryGenre}>
                    <Chip size='sm' variant='outlined'>
                        {analysis.primaryGenre}
                    </Chip>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Card variant='outlined' sx={{ minWidth: 280, maxWidth: 320 }}>
            <CardContent>
                <Typography level='title-sm' sx={{ mb: 2 }}>
                    Track Analysis
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography level='body-xs'>BPM</Typography>
                            <Typography level='body-xs' fontWeight='bold' color={bpmColor}>
                                {analysis.bpm.toFixed(1)}
                            </Typography>
                        </Box>
                        <LinearProgress
                            value={Math.min(100, (analysis.bpm / 180) * 100)}
                            variant='soft'
                            color={bpmColor}
                            size='sm'
                        />
                    </Box>

                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography level='body-xs'>Key</Typography>
                            <Typography level='body-xs' fontWeight='bold'>
                                {analysis.camelotKey}
                            </Typography>
                        </Box>
                        <Typography level='body-xs' color='neutral'>
                            {analysis.key} ({Math.round(analysis.keyConfidence * 100)}% confidence)
                        </Typography>
                    </Box>

                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography level='body-xs'>Energy</Typography>
                            <Typography
                                level='body-xs'
                                fontWeight='bold'
                                color={energyPercent > 60 ? 'danger' : energyPercent > 30 ? 'warning' : 'success'}
                            >
                                {energyPercent}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            value={energyPercent}
                            variant='soft'
                            color={energyPercent > 60 ? 'danger' : energyPercent > 30 ? 'warning' : 'success'}
                            size='sm'
                        />
                    </Box>

                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography level='body-xs'>Brightness</Typography>
                            <Typography level='body-xs' fontWeight='bold'>
                                {brightnessPercent}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            value={brightnessPercent}
                            variant='soft'
                            color='primary'
                            size='sm'
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography level='body-xs' color='neutral'>
                            Genre
                        </Typography>
                        <Chip size='sm' variant='soft' color='primary'>
                            {analysis.primaryGenre}
                        </Chip>
                    </Box>

                    {analysis.bpmConfidence > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography level='body-xs' color='neutral'>
                                BPM Confidence
                            </Typography>
                            <Typography level='body-xs'>
                                {Math.round(analysis.bpmConfidence * 100)}%
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

function getBPMColor(bpm: number): 'success' | 'warning' | 'danger' | 'primary' {
    if (bpm >= 118 && bpm <= 130) return 'success';
    if (bpm >= 60 && bpm < 100) return 'primary';
    if (bpm >= 160 && bpm <= 180) return 'danger';
    return 'warning';
}

export default AnalysisDisplay;
