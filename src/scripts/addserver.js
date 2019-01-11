define(["appSettings", "loading", "browser", "emby-linkbutton"], function(appSettings, loading, browser) {
    "use strict";

    function handleConnectionResult(page, result) {
        switch (loading.hide(), result.State) {
            case "SignedIn":
                var apiClient = result.ApiClient;
                Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient), Dashboard.navigate("home.html");
                break;
            case "ServerSignIn":
                Dashboard.navigate("login.html?serverid=" + result.Servers[0].Id, !1, "none");
                break;
            case "ServerSelection":
                Dashboard.navigate("selectserver.html", !1, "none");
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
                })
        }
    }

    function submitManualServer(page) {
        var host = page.querySelector("#txtServerHost").value,
            port = page.querySelector("#txtServerPort").value;
        port && (host += ":" + port), loading.show(), ConnectionManager.connectToAddress(host, {
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then(function(result) {
            handleConnectionResult(page, result)
        }, function() {
            handleConnectionResult(page, {
                State: "Unavailable"
            })
        })
    }

    return function(view, params) {
        view.querySelector(".manualServerForm").addEventListener("submit", onManualServerSubmit)
        function onManualServerSubmit(e) {
            return submitManualServer(view), e.preventDefault(), !1
        }

        function goBack() {
            require(["appRouter"], function(appRouter) {
                appRouter.back()
            })
        }
    }
});
