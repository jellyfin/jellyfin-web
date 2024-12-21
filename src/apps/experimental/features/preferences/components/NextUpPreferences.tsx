import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface NextUpPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function NextUpPreferences({ onChange, values }: Readonly<NextUpPreferencesProps>) {
    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('NextUp')}</Typography>

            <FormControl fullWidth>
                <TextField
                    aria-describedby='display-settings-max-days-next-up-description'
                    value={values.maxDaysForNextUp}
                    inputProps={{
                        type: 'number',
                        inputMode: 'numeric',
                        max: '1000',
                        min: '0',
                        pattern: '[0-9]',
                        required: true,
                        step: '1'
                    }}
                    label={globalize.translate('LabelMaxDaysForNextUp')}
                    name='maxDaysForNextUp'
                    onChange={onChange}
                />
                <FormHelperText id='display-settings-max-days-next-up-description'>
                    {globalize.translate('LabelMaxDaysForNextUpHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-next-up-rewatching-description'
                    control={
                        <Checkbox
                            checked={values.enableRewatchingInNextUp}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('EnableRewatchingNextUp')}
                    name='enableRewatchingInNextUp'
                />
                <FormHelperText id='display-settings-next-up-rewatching-description'>
                    {globalize.translate('EnableRewatchingNextUpHelp')}
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <FormControlLabel
                    aria-describedby='display-settings-next-up-images-description'
                    control={
                        <Checkbox
                            checked={values.episodeImagesInNextUp}
                            onChange={onChange}
                        />
                    }
                    label={globalize.translate('UseEpisodeImagesInNextUp')}
                    name='episodeImagesInNextUp'
                />
                <FormHelperText id='display-settings-next-up-images-description'>
                    {globalize.translate('UseEpisodeImagesInNextUpHelp')}
                </FormHelperText>
            </FormControl>
        </Stack>
    );
}
