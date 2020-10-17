import * as userSettings from './settings/userSettings';
import * as webSettings from './settings/webSettings';
import skinManager from './themeManager';
import { Events } from 'jellyfin-apiclient';
import ServerConnections from '../components/ServerConnections';

// set the default theme when loading
skinManager.setTheme(userSettings.theme());

// set the saved theme once a user authenticates
Events.on(ServerConnections, 'localusersignedin', function (e, user) {
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
