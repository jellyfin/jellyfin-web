import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_PUBLIC_ROUTES: LegacyRoute[] = [
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
        path: 'forgotpassword',
        pageProps: {
            controller: 'session/forgotPassword/index',
            view: 'session/forgotPassword/index.html'
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
