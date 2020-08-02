import * as userSettings from 'userSettings';
import skinManager from 'skinManager';
import connectionManager from 'connectionManager';
import events from 'events';

events.on(connectionManager, 'localusersignedin', function (e, user) {
    skinManager.setTheme(userSettings.theme());
});
