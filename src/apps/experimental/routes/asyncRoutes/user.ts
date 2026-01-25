import { type AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'details', page: 'lazyRoutes/DetailsPage', type: AppType.Experimental },
    { path: 'home', type: AppType.Experimental },
    { path: 'homevideos', type: AppType.Experimental },
    { path: 'livetv', type: AppType.Experimental },
    { path: 'list', page: 'lazyRoutes/ListPage', type: AppType.Experimental },
    { path: 'lyrics', page: 'lazyRoutes/LyricsPage', type: AppType.Experimental },
    { path: 'movies', type: AppType.Experimental },
    { path: 'music', type: AppType.Experimental },
    { path: 'mypreferencescontrols', page: 'user/controls', type: AppType.Experimental },
    { path: 'mypreferencesdisplay', page: 'user/display', type: AppType.Experimental },
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'mypreferencesplayback', page: 'user/playback', type: AppType.Experimental },
    { path: 'mypreferencessubtitles', page: 'user/subtitles', type: AppType.Experimental },
    { path: 'nowplaying', page: 'lazyRoutes/NowPlayingPage', type: AppType.Experimental },
    { path: 'queue', page: 'lazyRoutes/QueuePage', type: AppType.Experimental },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search' },
    { path: 'tv', page: 'shows', type: AppType.Experimental },
    { path: 'userprofile', page: 'user/userprofile', type: AppType.Experimental }
];
