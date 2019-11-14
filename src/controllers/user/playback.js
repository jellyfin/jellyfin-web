define(["playbackSettings", "userSettingsBuilder", "dom", "globalize", "loading", "userSettings", "autoFocuser", "listViewStyle"], function (PlaybackSettings, userSettingsBuilder, dom, globalize, loading, currentUserSettings, autoFocuser) {
    "use strict";

    return function (view, params) {
        function onBeforeUnload(e) {
            if (hasChanges) {
                e.returnValue = "You currently have unsaved changes. Are you sure you wish to leave?";
            }
        }

        var settingsInstance;
        var hasChanges;
        var userId = params.userId || ApiClient.getCurrentUserId();
        var userSettings = userId === ApiClient.getCurrentUserId() ? currentUserSettings : new userSettingsBuilder();
        view.addEventListener("viewshow", function () {
            window.addEventListener("beforeunload", onBeforeUnload);

            if (settingsInstance) {
                settingsInstance.loadData();
            } else {
                settingsInstance = new PlaybackSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector(".settingsContainer"),
                    userSettings: userSettings,
                    enableSaveButton: false,
                    enableSaveConfirmation: false,
                    autoFocus: autoFocuser.isEnabled()
                });
            }
        });
        view.addEventListener("change", function () {
            hasChanges = true;
        });
        view.addEventListener("viewbeforehide", function () {
            hasChanges = false;

            if (settingsInstance) {
                settingsInstance.submit();
            }
        });
        view.addEventListener("viewdestroy", function () {
            if (settingsInstance) {
                settingsInstance.destroy();
                settingsInstance = null;
            }
        });
    };
});
