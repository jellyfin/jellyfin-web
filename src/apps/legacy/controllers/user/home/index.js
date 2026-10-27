import HomescreenSettings from 'components/homeScreenSettings/homeScreenSettings';
import * as userSettings from 'scripts/settings/userSettings';
import autoFocuser from 'components/autoFocuser';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import 'components/listview/listview.scss';

// Shortcuts
const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let homescreenSettingsInstance;

    const apiClientUserId = ServerConnections.currentApiClient().getCurrentUserId();
    const userId = params.userId || apiClientUserId;
    const currentSettings = userId === apiClientUserId ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (homescreenSettingsInstance) {
            homescreenSettingsInstance.loadData();
        } else {
            homescreenSettingsInstance = new HomescreenSettings({
                serverId: ServerConnections.currentApiClient().serverId(),
                userId: userId,
                element: view.querySelector('.homeScreenSettingsContainer'),
                userSettings: currentSettings,
                enableSaveButton: true,
                enableSaveConfirmation: true,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    });

    view.addEventListener('viewdestroy', function () {
        if (homescreenSettingsInstance) {
            homescreenSettingsInstance.destroy();
            homescreenSettingsInstance = null;
        }
    });
}
