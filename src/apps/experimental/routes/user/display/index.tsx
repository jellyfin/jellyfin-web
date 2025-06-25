import Button from '@mui/material/Button';
import { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { useCallback } from 'react';

import { DisplayPreferences } from 'apps/experimental/features/preferences/components/DisplayPreferences';
import { ItemDetailPreferences } from 'apps/experimental/features/preferences/components/ItemDetailPreferences';
import { LibraryPreferences } from 'apps/experimental/features/preferences/components/LibraryPreferences';
import { useDisplaySettingForm } from 'apps/experimental/features/preferences/hooks/useDisplaySettingForm';
import { LocalizationPreferences } from 'apps/experimental/features/preferences/components/LocalizationPreferences';
import { NextUpPreferences } from 'apps/experimental/features/preferences/components/NextUpPreferences';
import type { DisplaySettingsValues } from 'apps/experimental/features/preferences/types/displaySettingsValues';
import LoadingComponent from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';

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
                            size='large'
                        >
                            {globalize.translate('Save')}
                        </Button>
                    </Stack>
                </form>
            </div>
        </Page>
    );
}
