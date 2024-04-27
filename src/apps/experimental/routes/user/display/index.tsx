import Button from '@mui/material/Button';
import { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import React, { useCallback } from 'react';

import Page from 'components/Page';
import globalize from 'scripts/globalize';
import theme from 'themes/theme';
import { DisplayPreferences } from './DisplayPreferences';
import { ItemDetailPreferences } from './ItemDetailPreferences';
import { LibraryPreferences } from './LibraryPreferences';
import { LocalizationPreferences } from './LocalizationPreferences';
import { NextUpPreferences } from './NextUpPreferences';
import { useDisplaySettingForm } from './hooks/useDisplaySettingForm';
import { DisplaySettingsValues } from './types';
import LoadingComponent from 'components/loading/LoadingComponent';

export default function UserDisplayPreferences() {
    const {
        loading,
        submitChanges,
        updateField,
        values
    } = useDisplaySettingForm();

    const handleSubmitForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void submitChanges();
    }, [submitChanges]);

    const handleFieldChange = useCallback((e: SelectChangeEvent | React.SyntheticEvent) => {
        const target = e.target as HTMLInputElement;
        const fieldName = target.name as keyof DisplaySettingsValues;
        const fieldValue = target.type === 'checkbox' ? target.checked : target.value;

        if (values?.[fieldName] !== fieldValue) {
            updateField({
                name: fieldName,
                value: fieldValue
            });
        }
    }, [updateField, values]);

    if (loading || !values) {
        return <LoadingComponent />;
    }

    return (
        <Page
            className='libraryPage userPreferencesPage noSecondaryNavPage'
            id='displayPreferencesPage'
            title={globalize.translate('Display')}
        >
            <div className='settingsContainer padded-left padded-right padded-bottom-page'>
                <form
                    onSubmit={handleSubmitForm}
                    style={{ margin: 'auto' }}
                >
                    <Stack spacing={4}>
                        <LocalizationPreferences
                            onChange={handleFieldChange}
                            values={values}
                        />
                        <DisplayPreferences
                            onChange={handleFieldChange}
                            values={values}
                        />
                        <LibraryPreferences
                            onChange={handleFieldChange}
                            values={values}
                        />
                        <NextUpPreferences
                            onChange={handleFieldChange}
                            values={values}
                        />
                        <ItemDetailPreferences
                            onChange={handleFieldChange}
                            values={values}
                        />

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
