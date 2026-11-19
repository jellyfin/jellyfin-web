import PlaybackSettings from 'components/playbackSettings/playbackSettings';
import * as userSettings from 'scripts/settings/userSettings';
import autoFocuser from 'components/autoFocuser';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import 'components/listview/listview.scss';

// Shortcuts
const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let settingsInstance;

    const apiClientUserId = ServerConnections.currentApiClient().getCurrentUserId();
    const userId = params.userId || apiClientUserId;
    const currentSettings = userId === apiClientUserId ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (settingsInstance) {
            settingsInstance.loadData();
        } else {
            settingsInstance = new PlaybackSettings({
                serverId: ServerConnections.currentApiClient().serverId(),
                userId,
                element: view.querySelector('.settingsContainer'),
                userSettings: currentSettings,
                enableSaveButton: true,
                enableSaveConfirmation: true,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    });

    view.addEventListener('viewdestroy', function () {
        if (settingsInstance) {
            settingsInstance.destroy();
            settingsInstance = null;
        }
    });
}
