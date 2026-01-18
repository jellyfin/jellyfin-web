import Checkbox from '@mui/material/Checkbox/Checkbox';
import FormControl from '@mui/material/FormControl/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText/FormHelperText';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import React from 'react';

import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface ItemDetailPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function ItemDetailPreferences({ onChange, values }: Readonly<ItemDetailPreferencesProps>) {
    return (
        <Stack spacing={2}>
            <Typography variant='h2'>{globalize.translate('ItemDetails')}</Typography>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-item-details-banner-description'
                    control={
                        <Checkbox
                            checked={values.enableItemDetailsBanner}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('EnableDetailsBanner')}
                    name='enableItemDetailsBanner'
                />
                <FormHelperText id='display-settings-item-details-banner-description'>
                    {globalize.translate('EnableDetailsBannerHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
