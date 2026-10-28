import SubtitleSettings from 'components/subtitlesettings/subtitlesettings';
import * as userSettings from 'scripts/settings/userSettings';
import autoFocuser from 'components/autoFocuser';
import { ServerConnections } from 'lib/jellyfin-apiclient';

// Shortcuts
const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let subtitleSettingsInstance;

    const apiClientUserId = ServerConnections.currentApiClient().getCurrentUserId();
    const userId = params.userId || apiClientUserId;
    const currentSettings = userId === apiClientUserId ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (subtitleSettingsInstance) {
            subtitleSettingsInstance.loadData();
        } else {
            subtitleSettingsInstance = new SubtitleSettings({
                serverId: ServerConnections.currentApiClient().serverId(),
                userId: userId,
                element: view.querySelector('.settingsContainer'),
                userSettings: currentSettings,
                enableSaveButton: true,
                enableSaveConfirmation: true,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    });

    view.addEventListener('viewdestroy', function () {
        if (subtitleSettingsInstance) {
            subtitleSettingsInstance.destroy();
            subtitleSettingsInstance = null;
        }
    });
}
