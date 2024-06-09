import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_PUBLIC_ROUTES: LegacyRoute[] = [
    {
        path: 'addserver.html',
        pageProps: {
            controller: 'session/addServer/index',
            view: 'session/addServer/index.html'
        }
    },
    {
        path: 'selectserver.html',
        pageProps: {
            controller: 'session/selectServer/index',
            view: 'session/selectServer/index.html'
        }
    },
    {
        path: 'login.html',
        pageProps: {
            controller: 'session/login/index',
            view: 'session/login/index.html'
        }
    },
    {
        path: 'forgotpassword.html',
        pageProps: {
            controller: 'session/forgotPassword/index',
            view: 'session/forgotPassword/index.html'
        }
    },
    {
        path: 'forgotpasswordpin.html',
        pageProps: {
            controller: 'session/resetPassword/index',
            view: 'session/resetPassword/index.html'
        }
    },
    {
        path: 'wizardremoteaccess.html',
        pageProps: {
            controller: 'wizard/remote/index',
            view: 'wizard/remote/index.html'
        }
    },
    {
        path: 'wizardfinish.html',
        pageProps: {
            controller: 'wizard/finish/index',
            view: 'wizard/finish/index.html'
        }
    },
    {
        path: 'wizardlibrary.html',
        pageProps: {
            controller: 'dashboard/library',
            view: 'wizard/library.html'
        }
    },
    {
        path: 'wizardsettings.html',
        pageProps: {
            controller: 'wizard/settings/index',
            view: 'wizard/settings/index.html'
        }
    },
    {
        path: 'wizardstart.html',
        pageProps: {
            controller: 'wizard/start/index',
            view: 'wizard/start/index.html'
        }
    },
    {
        path: 'wizarduser.html',
        pageProps: {
            controller: 'wizard/user/index',
            view: 'wizard/user/index.html'
        }
    }
];
