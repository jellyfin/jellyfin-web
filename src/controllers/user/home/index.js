import HomescreenSettings from '../../../components/homeScreenSettings/homeScreenSettings';
import * as userSettings from '../../../scripts/settings/userSettings';
import autoFocuser from '../../../components/autoFocuser';
import '../../../components/listview/listview.scss';

// Shortcuts
const UserSettings = userSettings.UserSettings;

export default function (view, params) {
    let homescreenSettingsInstance;

    const userId = params.userId || ApiClient.getCurrentUserId();
    const currentSettings =
        userId === ApiClient.getCurrentUserId()
            ? userSettings
            : new UserSettings();

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

    view.addEventListener('viewdestroy', function () {
        if (homescreenSettingsInstance) {
            homescreenSettingsInstance.destroy();
            homescreenSettingsInstance = null;
        }
    });
}
