/**
 * Playback Settings View
 *
 * React-based playback settings page for user preferences.
 */

import React from 'react';
import { PlaybackSettings } from 'components/playbackSettings/playbackSettings';
import * as userSettings from 'scripts/settings/userSettings';
import { useServerStore } from 'store/serverStore';

export const PlaybackSettingsPage: React.FC = () => {
    const { currentServer } = useServerStore();

    const currentUserId = (globalThis as any).ApiClient?.getCurrentUserId();
    const serverId = currentServer?.id || (globalThis as any).ApiClient?.serverId?.();

    if (!serverId || !currentUserId) {
        return null;
    }

    const isLocalUser = true;
    const currentSettings = isLocalUser ? userSettings : new userSettings.UserSettings();

    return (
        <PlaybackSettings
            userId={currentUserId}
            serverId={serverId}
            userSettings={currentSettings}
            onSave={() => {
                // Settings are auto-saved by the component
            }}
        />
    );
};

export default PlaybackSettingsPage;
