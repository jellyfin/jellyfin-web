import PlaybackSettings from 'playbackSettings';
import * as userSettings from 'userSettings';
import autoFocuser from 'autoFocuser';
import 'listViewStyle';

/* eslint-disable indent */

    // Shortcuts
    const UserSettings = userSettings.UserSettings;

    export default function (view, params) {
        let settingsInstance;
        let hasChanges;

        const userId = params.userId || ApiClient.getCurrentUserId();
        const currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();

        view.addEventListener('viewshow', function () {
            if (settingsInstance) {
                settingsInstance.loadData();
            } else {
                settingsInstance = new PlaybackSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.settingsContainer'),
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
            if (settingsInstance) {
                settingsInstance.destroy();
                settingsInstance = null;
            }
        });
    }

/* eslint-enable indent */
