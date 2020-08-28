import * as userSettings from 'userSettings';
import skinManager from 'skinManager';
import connectionManager from 'connectionManager';
import events from 'events';

// Set the default theme when loading
skinManager.setTheme(userSettings.theme());

// Set the user's prefered theme when signing in
events.on(connectionManager, 'localusersignedin', function (e, user) {
    skinManager.setTheme(userSettings.theme());
});
