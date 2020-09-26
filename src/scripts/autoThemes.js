import * as userSettings from 'userSettings';
import skinManager from 'skinManager';
import events from 'events';

// Set the default theme when loading
skinManager.setTheme(userSettings.theme())
    /* This keeps the scrollbar always present in all pages, so we avoid clipping while switching between pages
       that need the scrollbar and pages that don't.
     */
    .then(() => document.body.classList.add('force-scroll'));

// Set the user's prefered theme when signing in
events.on(window.connectionManager, 'localusersignedin', function (e, user) {
    skinManager.setTheme(userSettings.theme());
});
