define(["quickConnectSettings", "dom", "globalize", "loading", "userSettings", "autoFocuser", "listViewStyle"], function (QuickConnectSettings, dom, globalize, loading, userSettings, autoFocuser) {
    "use strict";

    return function (view, params) {
        var quickConnectSettingsInstance = null;
        var hasChanges;
        var userId = params.userId || ApiClient.getCurrentUserId();
        var currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new userSettings();
        view.addEventListener("viewshow", function () {
            console.debug("defining instance");
            
            quickConnectSettingsInstance = new QuickConnectSettings({
                serverId: ApiClient.serverId(),
                userId: userId,
                element: view.querySelector(".quickConnectSettingsContainer"),
                userSettings: currentSettings,
                enableSaveButton: false,
                enableSaveConfirmation: false,
                autoFocus: autoFocuser.isEnabled()
            });
            
            quickConnectSettingsInstance.loadData();
        });
        view.addEventListener("change", function () {
            hasChanges = true;
        });
        view.addEventListener("viewbeforehide", function () {
            hasChanges = false;

            if (quickConnectSettingsInstance) {
                quickConnectSettingsInstance.submit();
            }
        });
        view.addEventListener("viewdestroy", function () {
            if (quickConnectSettingsInstance) {
                quickConnectSettingsInstance.destroy();
                quickConnectSettingsInstance = null;
            }
        });
    };
});
