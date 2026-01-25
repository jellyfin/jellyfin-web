import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { type ApiClient } from 'jellyfin-apiclient';
import { useCallback, useEffect, useState } from 'react';
import { LayoutMode } from 'constants/layoutMode';

import { safeAppHost } from 'components/apphost';
import layoutManager from 'components/layoutManager';
import { AppFeature } from 'constants/appFeature';
import { useApi } from 'hooks/useApi';
import themeManager from 'scripts/themeManager';
import { currentSettings, UserSettings } from 'scripts/settings/userSettings';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';
import { useThemes } from 'hooks/useThemes';
import { type Theme } from 'types/webConfig';
import { FALLBACK_THEME_ID } from 'hooks/useUserTheme';

interface UseDisplaySettingsParams {
    userId?: string | null;
}

export function useDisplaySettings({ userId }: UseDisplaySettingsParams) {
    const [loading, setLoading] = useState(true);
    const [userSettings, setUserSettings] = useState<UserSettings>();
    const [displaySettings, setDisplaySettings] = useState<DisplaySettingsValues>();
    const { __legacyApiClient__, user: currentUser } = useApi();
    const { defaultTheme } = useThemes();

    const loadSettings = useCallback(async () => {
        if (!userId || !currentUser || !__legacyApiClient__) {
            return;
        }

        setLoading(true);

        const loadedSettings = await loadDisplaySettings({
            api: __legacyApiClient__,
            currentUser,
            userId,
            defaultTheme
        });

        setDisplaySettings(loadedSettings.displaySettings);
        setUserSettings(loadedSettings.userSettings);

        setLoading(false);
    }, [__legacyApiClient__, currentUser, userId, defaultTheme]);

    useEffect(() => {
        loadSettings();

        return () => {
            setLoading(false);
        };
    }, [loadSettings]);

    const saveSettings = useCallback(
        async (newSettings: DisplaySettingsValues) => {
            if (!userId || !userSettings || !__legacyApiClient__) {
                return;
            }
            return await saveDisplaySettings({
                api: __legacyApiClient__,
                newDisplaySettings: newSettings,
                userSettings,
                userId
            });
        },
        [__legacyApiClient__, userSettings, userId]
    );

    return {
        displaySettings,
        loading,
        saveDisplaySettings: saveSettings
    };
}

interface LoadDisplaySettingsParams {
    currentUser: UserDto;
    userId?: string;
    api: ApiClient;
    defaultTheme?: Theme;
}

async function loadDisplaySettings({ currentUser, userId, api, defaultTheme }: LoadDisplaySettingsParams) {
    const settings = !userId || userId === currentUser?.Id ? currentSettings : new UserSettings();
    const user = !userId || userId === currentUser?.Id ? currentUser : await api.getUser(userId);

    await settings.setUserInfo(userId ?? null, api);

    const displaySettings: DisplaySettingsValues = {
        customCss: settings.customCss() || '',
        dashboardTheme: settings.dashboardTheme() || defaultTheme?.id || FALLBACK_THEME_ID,
        dateTimeLocale: settings.dateTimeLocale() || 'auto',
        disableCustomCss: Boolean(settings.disableCustomCss()),
        displayMissingEpisodes: user?.Configuration?.DisplayMissingEpisodes ?? false,
        enableBlurHash: settings.enableBlurhash ? Boolean(settings.enableBlurhash()) : false,
        enableFasterAnimation: settings.enableFastFadein ? Boolean(settings.enableFastFadein()) : false,
        enableItemDetailsBanner: settings.detailsBanner ? Boolean(settings.detailsBanner()) : false,
        enableLibraryBackdrops: settings.enableBackdrops ? Boolean(settings.enableBackdrops()) : false,
        enableLibraryThemeSongs: settings.enableThemeSongs ? Boolean(settings.enableThemeSongs()) : false,
        enableLibraryThemeVideos: settings.enableThemeVideos ? Boolean(settings.enableThemeVideos()) : false,
        enableRewatchingInNextUp: settings.enableRewatchingInNextUp
            ? Boolean(settings.enableRewatchingInNextUp())
            : false,
        episodeImagesInNextUp: settings.useEpisodeImagesInNextUpAndResume
            ? Boolean(settings.useEpisodeImagesInNextUpAndResume())
            : false,
        language: settings.language && typeof settings.language === 'function' ? settings.language() || 'auto' : 'auto',
        layout: layoutManager.getSavedLayout() || 'auto',
        libraryPageSize: settings.libraryPageSize ? settings.libraryPageSize() : 0,
        maxDaysForNextUp: settings.maxDaysForNextUp ? settings.maxDaysForNextUp() : 0,
        screensaver: settings.screensaver ? settings.screensaver() || 'none' : 'none',
        screensaverInterval: settings.backdropScreensaverInterval ? settings.backdropScreensaverInterval() : 0,
        slideshowInterval: settings.slideshowInterval ? settings.slideshowInterval() : 0,
        theme: settings.theme() || defaultTheme?.id || FALLBACK_THEME_ID
    };

    return {
        displaySettings,
        userSettings: settings
    };
}

interface SaveDisplaySettingsParams {
    api: ApiClient;
    newDisplaySettings: DisplaySettingsValues;
    userSettings: UserSettings;
    userId: string;
}

async function saveDisplaySettings({ api, newDisplaySettings, userSettings, userId }: SaveDisplaySettingsParams) {
    const user = await api.getUser(userId);

    if (safeAppHost.supports(AppFeature.DisplayLanguage)) {
        userSettings.language(normalizeValue(newDisplaySettings.language));
    }
    userSettings.customCss(normalizeValue(newDisplaySettings.customCss));
    userSettings.dashboardTheme(newDisplaySettings.dashboardTheme);
    userSettings.dateTimeLocale(normalizeValue(newDisplaySettings.dateTimeLocale));
    userSettings.disableCustomCss(newDisplaySettings.disableCustomCss);
    userSettings.enableBlurhash(newDisplaySettings.enableBlurHash);
    userSettings.enableFastFadein(newDisplaySettings.enableFasterAnimation);
    userSettings.detailsBanner(newDisplaySettings.enableItemDetailsBanner);
    userSettings.enableBackdrops(newDisplaySettings.enableLibraryBackdrops);
    userSettings.enableThemeSongs(newDisplaySettings.enableLibraryThemeSongs);
    userSettings.enableThemeVideos(newDisplaySettings.enableLibraryThemeVideos);
    userSettings.enableRewatchingInNextUp(newDisplaySettings.enableRewatchingInNextUp);
    userSettings.useEpisodeImagesInNextUpAndResume(newDisplaySettings.episodeImagesInNextUp);
    userSettings.libraryPageSize(newDisplaySettings.libraryPageSize);
    userSettings.maxDaysForNextUp(newDisplaySettings.maxDaysForNextUp);
    userSettings.screensaver(normalizeValue(newDisplaySettings.screensaver));
    userSettings.backdropScreensaverInterval(newDisplaySettings.screensaverInterval);
    userSettings.theme(newDisplaySettings.theme);

    layoutManager.setLayout(normalizeValue(newDisplaySettings.layout || '') as LayoutMode);

    const promises = [themeManager.setTheme(userSettings.theme() || '')];

    if (user.Id && user.Configuration) {
        user.Configuration.DisplayMissingEpisodes = newDisplaySettings.displayMissingEpisodes;
        promises.push(api.updateUserConfiguration(user.Id, user.Configuration));
    }

    await Promise.all(promises);
}

function normalizeValue(value: string) {
    return /^(auto|none)$/.test(value) ? '' : value;
}
