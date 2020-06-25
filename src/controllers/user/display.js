define(['displaySettings', 'userSettings', 'autoFocuser'], function (DisplaySettings, userSettings, autoFocuser) {
    'use strict';

    // Shortcuts
    const UserSettings = userSettings.UserSettings;

    return function (view, params) {
        function onBeforeUnload(e) {
            if (hasChanges) {
                e.returnValue = 'You currently have unsaved changes. Are you sure you wish to leave?';
            }
        }

        var settingsInstance;
        var hasChanges;
        var userId = params.userId || ApiClient.getCurrentUserId();
        var currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();
        view.addEventListener('viewshow', function () {
            window.addEventListener('beforeunload', onBeforeUnload);

            if (settingsInstance) {
                settingsInstance.loadData();
            } else {
                settingsInstance = new DisplaySettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.settingsContainer'),
                    userSettings: currentSettings,
                    enableSaveButton: false,
                    enableSaveConfirmation: false,
                    autoFocus: autoFocuser.isEnabled()
                });
            }
        });
        view.addEventListener('change', function () {
            hasChanges = true;
        });
        view.addEventListener('viewbeforehide', function () {
            window.removeEventListener('beforeunload', onBeforeUnload);
            hasChanges = false;

            if (settingsInstance) {
                settingsInstance.submit();
            }
        });
        view.addEventListener('viewdestroy', function () {
            if (settingsInstance) {
                settingsInstance.destroy();
                settingsInstance = null;
            }
        });
    };
});
