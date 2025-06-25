import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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
