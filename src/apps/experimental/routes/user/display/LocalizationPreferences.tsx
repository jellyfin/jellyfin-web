import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import globalize from 'scripts/globalize';
import { DATE_LOCALE_OPTIONS, LANGUAGE_OPTIONS } from './constants';

export function LocalizationPreferences() {
    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('Localization')}</Typography>

            <FormControl fullWidth>
                <Select
                    aria-describedby='display-settings-language-description'
                    label={globalize.translate('LabelDisplayLanguage')}
                >
                    { ...LANGUAGE_OPTIONS.map(({ value, label }) => (
                        <MenuItem key={value } value={value}>{ label }</MenuItem>
                    ))}
                </Select>
                <FormHelperText component={Stack} id='display-settings-language-description'>
                    <span>{globalize.translate('LabelDisplayLanguageHelp')}</span>
                    <Link
                        href='https://github.com/jellyfin/jellyfin'
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        {globalize.translate('LearnHowYouCanContribute')}
                    </Link>
                </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
                <Select label={globalize.translate('LabelDateTimeLocale')}>
                    {...DATE_LOCALE_OPTIONS.map(({ value, label }) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    );
}
