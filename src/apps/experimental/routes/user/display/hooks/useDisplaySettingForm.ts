import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import toast from 'components/toast/toast';
import globalize from 'scripts/globalize';
import { DisplaySettingsValues } from '../types';
import { useDisplaySettings } from './useDisplaySettings';

export function useDisplaySettingForm() {
    const [urlParams] = useSearchParams();
    const {
        displaySettings,
        loading,
        saveDisplaySettings
    } = useDisplaySettings({ userId: urlParams.get('userId') });
    const [formValues, setFormValues] = useState<DisplaySettingsValues>();

    useEffect(() => {
        if (!loading && displaySettings && !formValues) {
            setFormValues(displaySettings);
        }
    }, [formValues, loading, displaySettings]);

    const updateField = useCallback(({ name, value }) => {
        if (formValues) {
            setFormValues({
                ...formValues,
                [name]: value
            });
        }
    }, [formValues, setFormValues]);

    const submitChanges = useCallback(async () => {
        if (formValues) {
            await saveDisplaySettings(formValues);
            toast(globalize.translate('SettingsSaved'));
        }
    }, [formValues, saveDisplaySettings]);

    return {
        loading,
        values: formValues,
        submitChanges,
        updateField
    };
}
