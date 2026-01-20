import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_USER_ROUTES: LegacyRoute[] = [
    {
        path: 'lyrics',
        pageProps: {
            controller: 'lyrics',
            view: 'lyrics.html'
        }
    }, {
        path: 'mypreferencescontrols',
        pageProps: {
            controller: 'user/controls/index',
            view: 'user/controls/index.html'
        }
    }, {
        path: 'mypreferencesdisplay',
        pageProps: {
            controller: 'user/display/index',
            view: 'user/display/index.html'
        }
    }, {
        path: 'mypreferenceshome',
        pageProps: {
            controller: 'user/home/index',
            view: 'user/home/index.html'
        }
    }, {
        path: 'mypreferencesplayback',
        pageProps: {
            controller: 'user/playback/index',
            view: 'user/playback/index.html'
        }
    }, {
        path: 'mypreferencessubtitles',
        pageProps: {
            controller: 'user/subtitles/index',
            view: 'user/subtitles/index.html'
        }
    }
];
