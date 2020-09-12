import HomescreenSettings from 'homescreenSettings';
import * as userSettings from 'userSettings';
import autoFocuser from 'autoFocuser';
import 'listViewStyle';

/* eslint-disable indent */

    // Shortcuts
    const UserSettings = userSettings.UserSettings;

    export default function (view, params) {
        let homescreenSettingsInstance;
        let hasChanges;

        const userId = params.userId || ApiClient.getCurrentUserId();
        const currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();

        view.addEventListener('viewshow', function () {
            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.loadData();
            } else {
                homescreenSettingsInstance = new HomescreenSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.homeScreenSettingsContainer'),
                    userSettings: currentSettings,
                    enableSaveButton: true,
                    enableSaveConfirmation: true,
                    autoFocus: autoFocuser.isEnabled()
                });
            }
        });

        view.addEventListener('change', function () {
            hasChanges = true;
        });

        view.addEventListener('viewdestroy', function () {
            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.destroy();
                homescreenSettingsInstance = null;
            }
        });
    }

/* eslint-enable indent */
