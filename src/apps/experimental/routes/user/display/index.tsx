import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import React from 'react';

import Page from 'components/Page';
import globalize from 'scripts/globalize';
import theme from 'themes/theme';
import { DisplayPreferences } from './DisplayPreferences';
import { LibraryPreferences } from './LibraryPreferences';
import { LocalizationPreferences } from './LocalizationPreferences';
import { NextUpPreferences } from './NextUpPreferences';

export default function UserDisplayPreferences() {
    return (
        <Page
            className='libraryPage userPreferencesPage noSecondaryNavPage'
            id='displayPreferencesPage'
            title={globalize.translate('Display')}
        >
            <div className='settingsContainer padded-left padded-right padded-bottom-page'>
                <form style={{ margin: 'auto' }}>
                    <Stack spacing={4}>
                        <LocalizationPreferences />
                        <DisplayPreferences />
                        <LibraryPreferences />
                        <NextUpPreferences />

                        <Button
                            type='submit'
                            sx={{
                                color: theme.palette.text.primary,
                                fontSize: theme.typography.htmlFontSize,
                                fontWeight: theme.typography.fontWeightBold
                            }}
                        >
                            {globalize.translate('Save')}
                        </Button>
                    </Stack>
                </form>
            </div>
        </Page>
    );
}
