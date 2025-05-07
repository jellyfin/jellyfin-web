import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTrackSelections } from './hooks';
import globalize from 'lib/globalize';

export const MediaSourceSelector = () => {
    const { mediaSources, selectedMediaSourceIndex, handleMediaSourceChange } =
        useTrackSelections();

    if (!mediaSources || mediaSources.length <= 1) return null;

    return (
        <TextField
            className='selectContainer flex-shrink-zero'
            size='small'
            fullWidth
            select
            label={globalize.translate('LabelVersion')}
            value={selectedMediaSourceIndex}
            onChange={handleMediaSourceChange}
        >
            {mediaSources.map((source, index) => (
                <MenuItem key={source.Id || index} value={index}>
                    <Typography component='span'>{source.Name}</Typography>
                </MenuItem>
            ))}
        </TextField>
    );
};
