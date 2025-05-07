import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import { MediaSourceSelector } from './mediasource-selector';
import { TrackSelector } from './track-selector';

interface TrackSelectionsProps {
    className?: string;
}

export const TrackSelections: FC<TrackSelectionsProps> = ({ className }) => {
    return (
        <Box component='form' className={className}>
            <MediaSourceSelector />
            <TrackSelector type='Video' label='Video' />
            <TrackSelector type='Audio' label='Audio' />
            <TrackSelector type='Subtitle' label='Subtitles' />
        </Box>
    );
};
