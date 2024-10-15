import React, { type FC, type PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { FALLBACK_CULTURE } from 'lib/globalize';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Events, { type Event } from 'utils/events';

import { useApi } from './useApi';

interface UserSettings {
    theme?: string
    dashboardTheme?: string
    dateTimeLocale?: string
    language?: string
}

// NOTE: This is an incomplete list of only the settings that are currently being used
const UserSettingField = {
    // Theme settings
    Theme: 'appTheme',
    DashboardTheme: 'dashboardTheme',
    // Locale settings
    DateTimeLocale: 'datetimelocale',
    Language: 'language'
};

const UserSettingsContext = createContext<UserSettings>({});

export const useUserSettings = () => useContext(UserSettingsContext);

export const UserSettingsProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [ theme, setTheme ] = useState<string>();
    const [ dashboardTheme, setDashboardTheme ] = useState<string>();
    const [ dateTimeLocale, setDateTimeLocale ] = useState<string>();
    const [ language, setLanguage ] = useState<string | undefined>(FALLBACK_CULTURE);

    const { user } = useApi();

    const context = useMemo<UserSettings>(() => ({
        theme,
        dashboardTheme,
        dateTimeLocale,
        locale: language
    }), [ theme, dashboardTheme, dateTimeLocale, language ]);

    // Update the values of the user settings
    const updateUserSettings = useCallback(() => {
        setTheme(userSettings.theme());
        setDashboardTheme(userSettings.dashboardTheme());
        setDateTimeLocale(userSettings.dateTimeLocale());
        setLanguage(userSettings.language());
    }, []);

    const onUserSettingsChange = useCallback((_e: Event, name?: string) => {
        if (name && Object.values(UserSettingField).includes(name)) {
            updateUserSettings();
        }
    }, [ updateUserSettings ]);

    // Handle user settings changes
    useEffect(() => {
        Events.on(userSettings, 'change', onUserSettingsChange);

        return () => {
            Events.off(userSettings, 'change', onUserSettingsChange);
        };
    }, [ onUserSettingsChange ]);

    // Update the settings if the user changes
    useEffect(() => {
        updateUserSettings();
    }, [ updateUserSettings, user ]);

    return (
        <UserSettingsContext.Provider value={context}>
            {children}
        </UserSettingsContext.Provider>
    );
};
