import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import toast from 'components/toast/toast';
import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';
import { useDisplaySettings } from './useDisplaySettings';

type UpdateField = {
    name: keyof DisplaySettingsValues;
    value: string | boolean;
};

export function useDisplaySettingForm() {
    const [urlParams] = useSearchParams();
    const {
        displaySettings,
        loading,
        saveDisplaySettings,
        userSettings
    } = useDisplaySettings({ userId: urlParams.get('userId') });
    const [formValues, setFormValues] = useState<DisplaySettingsValues>();

    useEffect(() => {
        if (!loading && displaySettings && !formValues) {
            setFormValues(displaySettings);
        }
    }, [formValues, loading, displaySettings]);

    const updateField = useCallback(({ name, value }: UpdateField) => {
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

    const saveUserCustomCss = useCallback(async () => {
        if (formValues && userSettings) {
            userSettings.userCustomCss(formValues.customCss);
            toast(globalize.translate('UserCustomCssSaved'));
        }
    }, [formValues, userSettings]);

    return {
        loading,
        values: formValues,
        submitChanges,
        updateField,
        saveUserCustomCss
    };
}
