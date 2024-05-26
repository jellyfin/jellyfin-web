import { useCallback, useEffect, useState } from 'react';

import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Events from 'utils/events';

import { useApi } from './useApi';
import { useThemes } from './useThemes';

const THEME_FIELD_NAMES = [ 'appTheme', 'dashboardTheme' ];

export function useUserTheme() {
    const [ theme, setTheme ] = useState<string>();
    const [ dashboardTheme, setDashboardTheme ] = useState<string>();

    const { user } = useApi();
    const { defaultTheme } = useThemes();

    useEffect(() => {
        if (defaultTheme) {
            if (!theme) setTheme(defaultTheme.id);
            if (!dashboardTheme) setDashboardTheme(defaultTheme.id);
        }
    }, [ dashboardTheme, defaultTheme, theme ]);

    // Update the current themes with values from user settings
    const updateThemesFromSettings = useCallback(() => {
        const userTheme = userSettings.theme();
        if (userTheme) setTheme(userTheme);
        const userDashboardTheme = userSettings.dashboardTheme();
        if (userDashboardTheme) setDashboardTheme(userDashboardTheme);
    }, []);

    const onUserSettingsChange = useCallback((_e, name?: string) => {
        if (name && THEME_FIELD_NAMES.includes(name)) {
            updateThemesFromSettings();
        }
    }, [ updateThemesFromSettings ]);

    // Handle user settings changes
    useEffect(() => {
        Events.on(userSettings, 'change', onUserSettingsChange);

        return () => {
            Events.off(userSettings, 'change', onUserSettingsChange);
        };
    }, [ onUserSettingsChange ]);

    // Update the theme if the user changes
    useEffect(() => {
        updateThemesFromSettings();
    }, [ updateThemesFromSettings, user ]);

    return {
        theme,
        dashboardTheme
    };
}
