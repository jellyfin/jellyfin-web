import * as userSettings from 'userSettings';
import skinManager from 'skinManager';
import connectionManager from 'connectionManager';
import events from 'events';

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
        }

        skinManager.setTheme(theme, context);
    }
});

events.on(connectionManager, 'localusersignedin', function (e, user) {
    currentViewType = null;
});
