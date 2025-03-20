import { LegacyRoute } from '../../../../components/router/LegacyRoute';

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
    },
    {
        path: 'wizardremoteaccess',
        pageProps: {
            controller: 'wizard/remote/index',
            view: 'wizard/remote/index.html'
        }
    },
    {
        path: 'wizardfinish',
        pageProps: {
            controller: 'wizard/finish/index',
            view: 'wizard/finish/index.html'
        }
    },
    {
        path: 'wizardlibrary',
        pageProps: {
            controller: 'wizard/library',
            view: 'wizard/library.html'
        }
    },
    {
        path: 'wizardsettings',
        pageProps: {
            controller: 'wizard/settings/index',
            view: 'wizard/settings/index.html'
        }
    },
    {
        path: 'wizardstart',
        pageProps: {
            controller: 'wizard/start/index',
            view: 'wizard/start/index.html'
        }
    },
    {
        path: 'wizarduser',
        pageProps: {
            controller: 'wizard/user/index',
            view: 'wizard/user/index.html'
        }
    }
];
