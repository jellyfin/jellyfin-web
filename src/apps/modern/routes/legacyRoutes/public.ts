import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_PUBLIC_ROUTES: LegacyRoute[] = [
    {
        path: 'forgotpasswordpin',
        pageProps: {
            controller: 'session/resetPassword/index',
            view: 'session/resetPassword/index.html'
        }
    }
];
