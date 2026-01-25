import * as userSettings from './settings/userSettings';
import themeManager from './themeManager';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import { pageClassOn } from '../utils/dashboard';
import Events from '../utils/events';

themeManager.setTheme((userSettings as any).theme()).then(() => document.body.classList.add('force-scroll'));

Events.on(ServerConnections, 'localusersignedin', () => {
    themeManager.setTheme((userSettings as any).theme());
});

pageClassOn('viewbeforeshow', 'page', function (this: HTMLElement) {
    if (this.classList.contains('type-interior')) {
        themeManager.setTheme((userSettings as any).dashboardTheme());
    } else {
        themeManager.setTheme((userSettings as any).theme());
    }
});
