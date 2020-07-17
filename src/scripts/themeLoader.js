define(['userSettings', 'skinManager', 'connectionManager', 'apphost', 'events'], function (userSettings, skinManager, connectionManager, appHost, events) {
    'use strict';

    var currentViewType;
    pageClassOn('viewbeforeshow', 'page', function () {
        var classList = this.classList;
        var viewType = classList.contains('type-interior') || classList.contains('wizardPage') ? 'a' : 'b';

        if (viewType !== currentViewType) {
            currentViewType = viewType;
            var theme;
            var context;

            if ('a' === viewType) {
                theme = userSettings.dashboardTheme();
                context = 'serverdashboard';
            } else {
                theme = userSettings.theme();
                if (userSettings.followSystemTheme() === true && appHost.useDarkTheme() === true) {
                    theme = userSettings.darkTheme();
                }
            }

            skinManager.setTheme(theme, context);
        }
    });
    events.on(connectionManager, 'localusersignedin', function (e, user) {
        currentViewType = null;
    });
});
