import * as userSettings from './settings/userSettings';
import * as webSettings from './settings/webSettings';
import skinManager from './themeManager';
import connectionManager from 'jellyfin-apiclient';
import events from 'jellyfin-apiclient';

// set the default theme when loading
skinManager.setTheme(userSettings.theme());

// set the saved theme once a user authenticates
events.on(window.connectionManager, 'localusersignedin', function (e, user) {
    skinManager.setTheme(userSettings.theme());
});

webSettings.getFonts().then(fonts => {
    for (const font of fonts) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.href = font;

        document.getElementsByTagName('head')[0].appendChild(link);
    }
});
