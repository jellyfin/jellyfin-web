import { LegacyRoute } from '../../../../components/router/LegacyRoute';

export const LEGACY_USER_ROUTES: LegacyRoute[] = [
    {
        path: 'details',
        pageProps: {
            controller: 'itemDetails/index',
            view: 'itemDetails/index.html'
        }
    }, {
        path: 'list.html',
        pageProps: {
            controller: 'list',
            view: 'list.html'
        }
    }, {
        path: 'livetv.html',
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
        path: 'music.html',
        pageProps: {
            controller: 'music/musicrecommended',
            view: 'music/music.html'
        }
    }, {
        path: 'mypreferencesmenu.html',
        pageProps: {
            controller: 'user/menu/index',
            view: 'user/menu/index.html'
        }
    }, {
        path: 'mypreferencescontrols.html',
        pageProps: {
            controller: 'user/controls/index',
            view: 'user/controls/index.html'
        }
    }, {
        path: 'mypreferencesdisplay.html',
        pageProps: {
            controller: 'user/display/index',
            view: 'user/display/index.html'
        }
    }, {
        path: 'mypreferenceshome.html',
        pageProps: {
            controller: 'user/home/index',
            view: 'user/home/index.html'
        }
    }, {
        path: 'mypreferencesplayback.html',
        pageProps: {
            controller: 'user/playback/index',
            view: 'user/playback/index.html'
        }
    }, {
        path: 'mypreferencessubtitles.html',
        pageProps: {
            controller: 'user/subtitles/index',
            view: 'user/subtitles/index.html'
        }
    }, {
        path: 'tv.html',
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
        path: 'home.html',
        pageProps: {
            controller: 'home',
            view: 'home.html'
        }
    }, {
        path: 'movies.html',
        pageProps: {
            controller: 'movies/moviesrecommended',
            view: 'movies/movies.html'
        }
    }
];
