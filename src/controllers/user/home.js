define(["homescreenSettings", "userSettingsBuilder", "dom", "globalize", "loading", "userSettings", "autoFocuser", "listViewStyle"], function (HomescreenSettings, userSettingsBuilder, dom, globalize, loading, currentUserSettings, autoFocuser) {
    "use strict";

    return function (view, params) {
        function onBeforeUnload(e) {
            if (hasChanges) {
                e.returnValue = "You currently have unsaved changes. Are you sure you wish to leave?";
            }
        }

        var homescreenSettingsInstance;
        var hasChanges;
        var userId = params.userId || ApiClient.getCurrentUserId();
        var userSettings = userId === ApiClient.getCurrentUserId() ? currentUserSettings : new userSettingsBuilder();
        view.addEventListener("viewshow", function () {
            window.addEventListener("beforeunload", onBeforeUnload);

            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.loadData();
            } else {
                homescreenSettingsInstance = new HomescreenSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector(".homeScreenSettingsContainer"),
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

            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.submit();
            }
        });
        view.addEventListener("viewdestroy", function () {
            if (homescreenSettingsInstance) {
                homescreenSettingsInstance.destroy();
                homescreenSettingsInstance = null;
            }
        });
    };
});
