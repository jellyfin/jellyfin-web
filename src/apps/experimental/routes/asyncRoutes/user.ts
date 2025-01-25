import { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home.html', page: 'home', type: AppType.Experimental },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search.html', page: 'search' },
    { path: 'userprofile.html', page: 'user/userprofile' },
    { path: 'movies.html', page: 'movies', type: AppType.Experimental },
    { path: 'tv.html', page: 'shows', type: AppType.Experimental },
    { path: 'music.html', page: 'music', type: AppType.Experimental },
    { path: 'livetv.html', page: 'livetv', type: AppType.Experimental },
    { path: 'mypreferencesdisplay.html', page: 'user/display', type: AppType.Experimental },
    { path: 'homevideos.html', page: 'homevideos', type: AppType.Experimental }
];
