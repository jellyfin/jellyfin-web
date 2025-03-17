import { LegacyRoute } from '../../../../components/router/LegacyRoute';

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
        path: 'livetv',
        pageProps: {
            controller: 'livetv/livetvsuggested',
            view: 'livetv.html'
        }
    }, {
        path: 'lyrics',
        pageProps: {
            controller: 'lyrics',
            view: 'lyrics.html'
        }
    }, {
        path: 'music',
        pageProps: {
            controller: 'music/musicrecommended',
            view: 'music/music.html'
        }
    }, {
        path: 'mypreferencesmenu',
        pageProps: {
            controller: 'user/menu/index',
            view: 'user/menu/index.html'
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
    }, {
        path: 'tv',
        pageProps: {
            controller: 'shows/tvrecommended',
            view: 'shows/tvrecommended.html'
        }
    }, {
        path: 'video',
        pageProps: {
            controller: 'playback/video/index',
            view: 'playback/video/index.html',
            type: 'video-osd',
            isFullscreen: true,
            isNowPlayingBarEnabled: false,
            isThemeMediaSupported: true
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
    }, {
        path: 'home',
        pageProps: {
            controller: 'home',
            view: 'home.html'
        }
    }, {
        path: 'movies',
        pageProps: {
            controller: 'movies/moviesrecommended',
            view: 'movies/movies.html'
        }
    }
];
