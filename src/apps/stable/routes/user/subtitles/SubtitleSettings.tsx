/**
 * Subtitle Settings View
 *
 * React-based subtitle settings page for user preferences.
 */

import { SubtitleSettings } from 'components/subtitlesettings/SubtitleSettings';
import React from 'react';
import * as userSettings from 'scripts/settings/userSettings';
import { useServerStore } from 'store/serverStore';

export const SubtitleSettingsPage: React.FC = () => {
    const { currentServer } = useServerStore();

    const currentUserId = (globalThis as any).ApiClient?.getCurrentUserId();
    const serverId = currentServer?.id || (globalThis as any).ApiClient?.serverId?.();

    if (!serverId || !currentUserId) {
        return null;
    }

    const isLocalUser = true;
    const currentSettings = isLocalUser ? userSettings : new userSettings.UserSettings();

    return (
        <SubtitleSettings
            userId={currentUserId}
            serverId={serverId}
            userSettings={currentSettings}
        />
    );
};

export default SubtitleSettingsPage;
