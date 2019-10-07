define(["userSettings", "skinManager", "connectionManager", "events"], function (userSettings, skinManager, connectionManager, events) {
    "use strict";

    var currentViewType;
    pageClassOn("viewbeforeshow", "page", function () {
        var classList = this.classList;
        var viewType = classList.contains("type-interior") || classList.contains("wizardPage") ? "a" : "b";

        if (viewType !== currentViewType) {
            currentViewType = viewType;
            var theme;
            var context;

            if ("a" === viewType) {
                theme = userSettings.dashboardTheme();
                context = "serverdashboard";
            } else {
                theme = userSettings.theme();
            }

            skinManager.setTheme(theme, context);
        }
    });
    events.on(connectionManager, "localusersignedin", function (e, user) {
        currentViewType = null;
    });
});
