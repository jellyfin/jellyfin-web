import { type LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_USER_ROUTES: LegacyRoute[] = [
    {
        path: 'lyrics',
        pageProps: {
            controller: 'lyrics',
            view: 'lyrics.html'
        }
    },
    {
        path: 'mypreferencesplayback',
        pageProps: {
            controller: 'user/playback/index',
            view: 'user/playback/index.html'
        }
    },
    {
        path: 'mypreferencessubtitles',
        pageProps: {
            controller: 'user/subtitles/index',
            view: 'user/subtitles/index.html'
        }
    }
];
