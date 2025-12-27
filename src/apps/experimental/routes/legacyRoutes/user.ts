import { LegacyRoute } from '@/components/router/LegacyRoute';

export const LEGACY_USER_ROUTES: LegacyRoute[] = [
    {
        path: 'details',
        pageProps: {
            controller: 'itemDetails/index',
            view: 'itemDetails/index.html'
        }
    }, {
        path: 'list',
        pageProps: {
            controller: 'list',
            view: 'list.html'
        }
    }, {
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
    }, {
        path: 'queue',
        pageProps: {
            controller: 'playback/queue/index',
            view: 'playback/queue/index.html',
            isFullscreen: true,
            isNowPlayingBarEnabled: false,
            isThemeMediaSupported: true
        }
    }
];
