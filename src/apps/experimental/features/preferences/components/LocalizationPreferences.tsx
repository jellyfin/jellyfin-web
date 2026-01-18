import FormControl from '@mui/material/FormControl/FormControl';
import FormHelperText from '@mui/material/FormHelperText/FormHelperText';
import InputLabel from '@mui/material/InputLabel/InputLabel';
import Link from '@mui/material/Link/Link';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select/Select';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import React from 'react';

import { DATE_LOCALE_OPTIONS, LANGUAGE_OPTIONS } from 'apps/experimental/features/preferences/constants/locales';
import { safeAppHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import datetime from 'scripts/datetime';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface LocalizationPreferencesProps {
    onChange: (event: SelectChangeEvent) => void;
    values: DisplaySettingsValues;
}

export function LocalizationPreferences({ onChange, values }: Readonly<LocalizationPreferencesProps>) {
    if (!safeAppHost.supports(AppFeature.DisplayLanguage) && !datetime.supportsLocalization()) {
        return null;
    }
    return (
        <Stack spacing={3}>
            <Typography variant='h2'>{globalize.translate('Localization')}</Typography>

            { safeAppHost.supports(AppFeature.DisplayLanguage) && (
                <FormControl fullWidth>
                    <InputLabel id='display-settings-language-label'>{globalize.translate('LabelDisplayLanguage')}</InputLabel>
                    <Select
                        aria-describedby='display-settings-language-description'
                        inputProps={{
                            name: 'language'
                        }}
                        labelId='display-settings-language-label'
                        onChange={onChange}
                        value={values.language}
                    >
                        {LANGUAGE_OPTIONS.map(({ value, label }) => (
                            <MenuItem key={value } value={value}>{ label }</MenuItem>
                        ))}
                    </Select>
                    <FormHelperText component={Stack} id='display-settings-language-description'>
                        <span>{globalize.translate('LabelDisplayLanguageHelp')}</span>
                        { safeAppHost.supports(AppFeature.ExternalLinks) && (
                            <Link
                                href='https://github.com/jellyfin/jellyfin'
                                rel='noopener noreferrer'
                                target='_blank'
                            >
                                {globalize.translate('LearnHowYouCanContribute')}
                            </Link>
                        ) }
                    </FormHelperText>
                </FormControl>
            ) }

            { datetime.supportsLocalization() && (
                <FormControl fullWidth>
                    <InputLabel id='display-settings-locale-label'>{globalize.translate('LabelDateTimeLocale')}</InputLabel>
                    <Select
                        inputProps={{
                            name: 'dateTimeLocale'
                        }}
                        labelId='display-settings-locale-label'
                        onChange={onChange}
                        value={values.dateTimeLocale}
                    >
                        {...DATE_LOCALE_OPTIONS.map(({ value, label }) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) }
        </Stack>
    );
}
