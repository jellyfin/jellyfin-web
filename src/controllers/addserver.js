define(["appSettings", "loading", "browser", "emby-button"], function(appSettings, loading, browser) {
    "use strict";

    function handleConnectionResult(page, result) {
        loading.hide();
        switch (result.State) {
            case "SignedIn":
                var apiClient = result.ApiClient;
                Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient), Dashboard.navigate("home.html");
                break;
            case "ServerSignIn":
                Dashboard.navigate("login.html?serverid=" + result.Servers[0].Id, false, "none");
                break;
            case "ServerSelection":
                Dashboard.navigate("selectserver.html", false, "none");
                break;
            case "ServerUpdateNeeded":
                Dashboard.alert({
                    message: Globalize.translate("ServerUpdateNeeded", '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                });
                break;
            case "Unavailable":
                Dashboard.alert({
                    message: Globalize.translate("MessageUnableToConnectToServer"),
                    title: Globalize.translate("HeaderConnectionFailure")
                });
        }
    }

    function submitManualServer(page) {
        var host = page.querySelector("#txtServerHost").value;
        var port = page.querySelector("#txtServerPort").value;
        if (port) {
            host += ":" + port;
        }

        loading.show();
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
        view.querySelector(".manualServerForm").addEventListener("submit", onManualServerSubmit);
        view.querySelector(".btnCancelManualServer").addEventListener("click", goBack);

        function onManualServerSubmit(e) {
            submitManualServer(view);
            e.preventDefault();
            return false;
        }

        function goBack() {
            require(["appRouter"], function(appRouter) {
                appRouter.back();
            });
        }
    }
});
