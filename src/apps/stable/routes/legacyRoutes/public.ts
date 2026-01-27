import type { LegacyRoute } from 'components/router/LegacyRoute';

export const LEGACY_PUBLIC_ROUTES: LegacyRoute[] = [
    {
        path: 'addserver',
        pageProps: {
            controller: 'session/addServer/index',
            view: 'session/addServer/index.html'
        }
    },
    {
        path: 'selectserver',
        pageProps: {
            controller: 'session/selectServer/index',
            view: 'session/selectServer/index.html'
        }
    },
    {
        path: 'login',
        pageProps: {
            controller: 'session/login/index',
            view: 'session/login/index.html'
        }
    },
    {
        path: 'forgotpasswordpin',
        pageProps: {
            controller: 'session/resetPassword/index',
            view: 'session/resetPassword/index.html'
        }
    }
];
