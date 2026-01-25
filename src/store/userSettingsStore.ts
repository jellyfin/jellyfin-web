/**
 * User Settings Store
 *
 * Zustand store for user settings with localStorage persistence.
 * Integrates with legacy userSettings script.
 */

import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserSettings {
    customCss?: string;
    disableCustomCss: boolean;
    theme?: string;
    dashboardTheme?: string;
    dateTimeLocale?: string;
    language?: string;
}

export interface UserSettingsState {
    settings: UserSettings;
    isLoading: boolean;

    // Actions
    setCustomCss: (css?: string) => void;
    setDisableCustomCss: (disabled: boolean) => void;
    setTheme: (theme?: string) => void;
    setDashboardTheme: (theme?: string) => void;
    setDateTimeLocale: (locale?: string) => void;
    setLanguage: (language?: string) => void;
    updateFromLegacy: () => void;
    reset: () => void;
}

const defaultSettings: UserSettings = {
    disableCustomCss: false
};

const USER_SETTINGS_STORAGE_KEY = 'jellyfin-user-settings';

export const useUserSettingsStore = create<UserSettingsState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                settings: { ...defaultSettings },
                isLoading: false,

                setCustomCss: css =>
                    set(state => ({
                        settings: { ...state.settings, customCss: css }
                    })),

                setDisableCustomCss: disabled =>
                    set(state => ({
                        settings: { ...state.settings, disableCustomCss: disabled }
                    })),

                setTheme: theme =>
                    set(state => ({
                        settings: { ...state.settings, theme }
                    })),

                setDashboardTheme: theme =>
                    set(state => ({
                        settings: { ...state.settings, dashboardTheme: theme }
                    })),

                setDateTimeLocale: locale =>
                    set(state => ({
                        settings: { ...state.settings, dateTimeLocale: locale }
                    })),

                setLanguage: language =>
                    set(state => ({
                        settings: { ...state.settings, language }
                    })),

                updateFromLegacy: () => {
                    // Import legacy userSettings dynamically to avoid circular deps
                    import('scripts/settings/userSettings')
                        .then(({ currentSettings: userSettings }) => {
                            set(state => ({
                                settings: {
                                    ...state.settings,
                                    customCss: userSettings.customCss() ?? undefined,
                                    disableCustomCss: Boolean(userSettings.disableCustomCss()),
                                    theme: userSettings.theme() ?? undefined,
                                    dashboardTheme: userSettings.dashboardTheme() ?? undefined,
                                    dateTimeLocale: userSettings.dateTimeLocale() ?? undefined,
                                    language: userSettings.language() ?? undefined
                                }
                            }));
                        })
                        .catch(err => {
                            console.warn('[UserSettingsStore] Failed to load legacy settings', err);
                        });
                },

                reset: () => set({ settings: { ...defaultSettings } })
            }),
            {
                name: USER_SETTINGS_STORAGE_KEY,
                storage: createJSONStorage(() => localStorage),
                partialize: state => ({ settings: state.settings }),
                merge: (persisted, current) => ({
                    ...current,
                    settings: { ...current.settings, ...(persisted as any)?.settings }
                })
            }
        )
    )
);

// Hook for useUserSettings
export const useUserSettings = () => useUserSettingsStore(state => state.settings);
