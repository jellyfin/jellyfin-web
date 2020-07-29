import * as userSettings from 'userSettings';
import skinManager from 'skinManager';
import connectionManager from 'connectionManager';
import events from 'events';

let currentViewType;
pageClassOn('viewbeforeshow', 'page', function () {
    const classList = this.classList;
    const viewType = classList.contains('type-interior') || classList.contains('wizardPage') ? 'a' : 'b';

    if (viewType !== currentViewType) {
        currentViewType = viewType;
        let theme;
        let context;

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
