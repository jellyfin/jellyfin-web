import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';

export function ItemDetailPreferences() {
    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('ItemDetails')}</Typography>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-item-details-banner-description'
                    control={<Checkbox />}
                    label={globalize.translate('EnableDetailsBanner')}
                />
                <FormHelperText id='display-settings-item-details-banner-description'>
                    {globalize.translate('EnableDetailsBannerHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
