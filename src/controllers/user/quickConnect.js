define(["quickConnectSettings", "dom", "globalize", "loading", "userSettings", "autoFocuser", "listViewStyle"], function (QuickConnectSettings, dom, globalize, loading, userSettings, autoFocuser) {
    "use strict";

    return function (view) {
        let quickConnectSettingsInstance = null;

        view.addEventListener("viewshow", function () {
            quickConnectSettingsInstance = new QuickConnectSettings({
                page: view,
                interval: 0
            });

            view.querySelector("#btnQuickConnectActivate").addEventListener("click", () => {
                quickConnectSettingsInstance.activate(quickConnectSettingsInstance);
            });

            quickConnectSettingsInstance.loadData();

            ApiClient.getQuickConnect("Status").then((status) => {
                let btn = view.querySelector("#btnQuickConnectActivate");

                if (status === "Unavailable") {
                    btn.textContent = globalize.translate("QuickConnectNotAvailable");
                    btn.disabled = true;
                    return false;
                } else if (status === "Available") {
                    return false;
                }

                btn.style.display = "none";
                return true;
            }).catch((e) => {
                throw e;
            });
        });
        view.addEventListener("viewbeforehide", function () {
            if (quickConnectSettingsInstance) {
                quickConnectSettingsInstance.submit();
            }
            onDestroy();
        });
        view.addEventListener("viewdestroy", function () {
            onDestroy();
        });

        function onDestroy() {
            if (quickConnectSettingsInstance) {
                quickConnectSettingsInstance.destroy();
                quickConnectSettingsInstance = null;
            }
        }
    };
});
