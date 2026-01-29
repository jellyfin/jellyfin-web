import {
    DATE_LOCALE_OPTIONS,
    LANGUAGE_OPTIONS
} from 'apps/experimental/features/preferences/constants/locales';
import { safeAppHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import globalize from 'lib/globalize';
import React from 'react';
import datetime from 'scripts/datetime';
import {
    Box,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from 'ui-primitives';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface LocalizationPreferencesProps {
    onChange: (event: React.SyntheticEvent) => void;
    values: DisplaySettingsValues;
}

export function LocalizationPreferences({
    onChange,
    values
}: Readonly<LocalizationPreferencesProps>) {
    if (!safeAppHost.supports(AppFeature.DisplayLanguage) && !datetime.supportsLocalization()) {
        return null;
    }

    const handleSelectChange = (name: string) => (value: string) => {
        onChange({
            target: { name, value }
        } as unknown as React.SyntheticEvent);
    };

    return (
        <Flex direction="column" gap="24px">
            <Heading.H2>{globalize.translate('Localization')}</Heading.H2>

            {safeAppHost.supports(AppFeature.DisplayLanguage) && (
                <FormControl>
                    <FormLabel>{globalize.translate('LabelDisplayLanguage')}</FormLabel>
                    <Select
                        value={values.language || ''}
                        onValueChange={handleSelectChange('language')}
                    >
                        <SelectTrigger>
                            <SelectValue
                                placeholder={globalize.translate('LabelDisplayLanguage')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGE_OPTIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormHelperText>
                        <span>{globalize.translate('LabelDisplayLanguageHelp')}</span>
                        {safeAppHost.supports(AppFeature.ExternalLinks) && (
                            <Box
                                as="a"
                                href="https://github.com/jellyfin/jellyfin"
                                rel="noopener noreferrer"
                                target="_blank"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                            >
                                {globalize.translate('LearnHowYouCanContribute')}
                            </Box>
                        )}
                    </FormHelperText>
                </FormControl>
            )}

            {datetime.supportsLocalization() && (
                <FormControl>
                    <FormLabel>{globalize.translate('LabelDateTimeLocale')}</FormLabel>
                    <Select
                        value={values.dateTimeLocale || ''}
                        onValueChange={handleSelectChange('dateTimeLocale')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={globalize.translate('LabelDateTimeLocale')} />
                        </SelectTrigger>
                        <SelectContent>
                            {DATE_LOCALE_OPTIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>
            )}
        </Flex>
    );
}
