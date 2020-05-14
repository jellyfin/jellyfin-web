define(['subtitleSettings', 'userSettings', 'autoFocuser'], function (SubtitleSettings, userSettings, autoFocuser) {
    'use strict';

    return function (view, params) {
        function onBeforeUnload(e) {
            if (hasChanges) {
                e.returnValue = 'You currently have unsaved changes. Are you sure you wish to leave?';
            }
        }

        var subtitleSettingsInstance;
        var hasChanges;
        var userId = params.userId || ApiClient.getCurrentUserId();
        var currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new userSettings();
        view.addEventListener('viewshow', function () {
            window.addEventListener('beforeunload', onBeforeUnload);

            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.loadData();
            } else {
                subtitleSettingsInstance = new SubtitleSettings({
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
            hasChanges = false;

            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.submit();
            }
        });
        view.addEventListener('viewdestroy', function () {
            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.destroy();
                subtitleSettingsInstance = null;
            }
        });
    };
});
