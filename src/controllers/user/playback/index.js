
import PlaybackSettings from '@/components/playbackSettings/playbackSettings';
import * as userSettings from '@/scripts/settings/userSettings';
import autoFocuser from '@/components/autoFocuser';
import '@/components/listview/listview.scss';

// Shortcuts
const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let settingsInstance;

    const userId = params.userId || ApiClient.getCurrentUserId();
    const currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (settingsInstance) {
            settingsInstance.loadData();
        } else {
            settingsInstance = new PlaybackSettings({
                serverId: ApiClient.serverId(),
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

