import * as userSettings from 'userSettings';
import * as webSettings from 'webSettings';
import skinManager from 'skinManager';
import events from 'events';

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
