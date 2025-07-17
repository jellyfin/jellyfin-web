import type { LegacyRoute } from 'components/router/LegacyRoute';
import { AppType } from 'constants/appType';

export const LEGACY_ADMIN_ROUTES: LegacyRoute[] = [
    {
        path: 'networking',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'networking',
            view: 'networking.html'
        }
    }, {
        path: 'libraries',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'library',
            view: 'library.html'
        }
    }, {
        path: 'livetv/guide',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvguideprovider',
            view: 'livetvguideprovider.html'
        }
    }, {
        path: 'livetv',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvstatus',
            view: 'livetvstatus.html'
        }
    }, {
        path: 'livetv/tuner',
        pageProps: {
            appType: AppType.Dashboard,
            controller: 'livetvtuner',
            view: 'livetvtuner.html'
        }
    }
];
