import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useCallback, useEffect, useState } from 'react';

import { appHost } from 'components/apphost';
import layoutManager from 'components/layoutManager';
import { AppFeature } from 'constants/appFeature';
import { useApi } from 'hooks/useApi';
import themeManager from 'scripts/themeManager';
import { currentSettings, UserSettings } from 'scripts/settings/userSettings';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';
import { useThemes } from 'hooks/useThemes';
import { Theme } from 'types/webConfig';
import { FALLBACK_THEME_ID } from 'hooks/useUserTheme';

interface UseDisplaySettingsParams {
    userId?: string | null;
}

export function useDisplaySettings({ userId }: UseDisplaySettingsParams) {
    const [loading, setLoading] = useState(true);
    const [userSettings, setUserSettings] = useState<UserSettings>();
    const [displaySettings, setDisplaySettings] = useState<DisplaySettingsValues>();
    const { api, user: currentUser } = useApi();
    const { defaultTheme } = useThemes();

    useEffect(() => {
        if (!userId || !currentUser || !api) {
            return;
        }

        setLoading(true);

        void (async () => {
            const user = userId === currentUser.Id ? currentUser : (await getUserApi(api).getUserById({ userId })).data;
            const settings = userId === currentUser.Id ? currentSettings : new UserSettings();
            const loadedSettings = await loadDisplaySettings({ user, settings, defaultTheme });

            setDisplaySettings(loadedSettings.displaySettings);
            setUserSettings(loadedSettings.userSettings);

            setLoading(false);
        })();

        return () => {
            setLoading(false);
        };
    }, [api, currentUser, userId]);

    const saveSettings = useCallback(async (newSettings: DisplaySettingsValues) => {
        if (!userId || !userSettings || !api) {
            return;
        }
        return saveDisplaySettings({
            api,
            newDisplaySettings: newSettings,
            userSettings,
            userId
        });
    }, [api, userSettings, userId]);

    return {
        displaySettings,
        loading,
        saveDisplaySettings: saveSettings
    };
}

interface LoadDisplaySettingsParams {
    user: UserDto
    settings: UserSettings
    defaultTheme?: Theme
}

async function loadDisplaySettings({
    user,
    settings,
    defaultTheme
}: LoadDisplaySettingsParams) {
    await settings.setUserInfo(user.Id, user.ServerId!);

    const displaySettings = {
        customCss: settings.customCss() || '',
        dashboardTheme: settings.dashboardTheme() || defaultTheme?.id || FALLBACK_THEME_ID,
        dateTimeLocale: settings.dateTimeLocale() || 'auto',
        disableCustomCss: Boolean(settings.disableCustomCss()),
        displayMissingEpisodes: user?.Configuration?.DisplayMissingEpisodes ?? false,
        enableBlurHash: Boolean(settings.enableBlurhash()),
        enableFasterAnimation: Boolean(settings.enableFastFadein()),
        enableItemDetailsBanner: Boolean(settings.detailsBanner()),
        enableLibraryBackdrops: Boolean(settings.enableBackdrops()),
        enableLibraryThemeSongs: Boolean(settings.enableThemeSongs()),
        enableLibraryThemeVideos: Boolean(settings.enableThemeVideos()),
        enableRewatchingInNextUp: Boolean(settings.enableRewatchingInNextUp()),
        episodeImagesInNextUp: Boolean(settings.useEpisodeImagesInNextUpAndResume()),
        language: settings.language() || 'auto',
        layout: layoutManager.getSavedLayout() || 'auto',
        libraryPageSize: settings.libraryPageSize(),
        maxDaysForNextUp: settings.maxDaysForNextUp(),
        screensaver: settings.screensaver() || 'none',
        screensaverTime: settings.screensaverTime(),
        backdropScreensaverInterval: settings.backdropScreensaverInterval(),
        slideshowInterval: settings.slideshowInterval(),
        theme: settings.theme() || defaultTheme?.id || FALLBACK_THEME_ID
    };

    return {
        displaySettings,
        userSettings: settings
    };
}

interface SaveDisplaySettingsParams {
    api: Api;
    newDisplaySettings: DisplaySettingsValues
    userSettings: UserSettings;
    userId: string;
}

async function saveDisplaySettings({
    api,
    newDisplaySettings,
    userSettings,
    userId
}: SaveDisplaySettingsParams) {
    const user = (await getUserApi(api).getUserById({ userId })).data;

    if (appHost.supports(AppFeature.DisplayLanguage)) {
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
    userSettings.screensaverTime(newDisplaySettings.screensaverTime);
    userSettings.backdropScreensaverInterval(newDisplaySettings.backdropScreensaverInterval);
    userSettings.slideshowInterval(newDisplaySettings.slideshowInterval);
    userSettings.theme(newDisplaySettings.theme);

    layoutManager.setLayout(normalizeValue(newDisplaySettings.layout));

    const promises = [
        themeManager.setTheme(userSettings.theme())
    ];

    if (user.Id && user.Configuration) {
        user.Configuration.DisplayMissingEpisodes = newDisplaySettings.displayMissingEpisodes;
        promises.push(getUserApi(api).updateUserConfiguration({
            userId: user.Id,
            userConfiguration: user.Configuration
        }));
    }

    await Promise.all(promises);
}

function normalizeValue(value: string) {
    return /^(auto|none)$/.test(value) ? '' : value;
}
