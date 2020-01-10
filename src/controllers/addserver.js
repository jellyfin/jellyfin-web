define(["connectionManager", "appSettings", "loading", "browser", "emby-button"], function(ConnectionManager, appSettings, loading, browser) {
    "use strict";

    function handleConnectionResult(page, result) {
        loading.hide();
        switch (result.State) {
            case "SignedIn":
                var apiClient = result.ApiClient;
                window.Emby.Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                window.Emby.Dashboard.navigate("home.html");
                break;
            case "ServerSignIn":
                window.Emby.Dashboard.navigate("login.html?serverid=" + result.Servers[0].Id, false, "none");
                break;
            case "ServerSelection":
                window.Emby.Dashboard.navigate("selectserver.html", false, "none");
                break;
            case "ServerUpdateNeeded":
                window.Emby.Dashboard.alert({
                    message: Globalize.translate("ServerUpdateNeeded", '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                });
                break;
            case "Unavailable":
                window.Emby.Dashboard.alert({
                    message: Globalize.translate("MessageUnableToConnectToServer"),
                    title: Globalize.translate("HeaderConnectionFailure")
                });
        }
    }

    function submitServer(page) {
        loading.show();
        var host = page.querySelector("#txtServerHost").value;
        ConnectionManager.connectToAddress(host, {
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then(function(result) {
            handleConnectionResult(page, result);
        }, function() {
            handleConnectionResult(page, {
                State: "Unavailable"
            });
        });
    }

    return function(view, params) {
        view.querySelector(".addServerForm").addEventListener("submit", onServerSubmit);
        view.querySelector(".btnCancel").addEventListener("click", goBack);

        require(["autoFocuser"], function (autoFocuser) {
            autoFocuser.autoFocus(view);
        });

        function onServerSubmit(e) {
            submitServer(view);
            e.preventDefault();
            return false;
        }

        function goBack() {
            require(["appRouter"], function(appRouter) {
                appRouter.back();
            });
        }
    };
});
