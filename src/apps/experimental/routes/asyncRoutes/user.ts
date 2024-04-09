import { AsyncRoute, AsyncRouteType } from '../../../../components/router/AsyncRoute';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search.html', page: 'search' },
    { path: 'userprofile.html', page: 'user/userprofile' },
    { path: 'home.html', page: 'home', type: AsyncRouteType.Experimental },
    { path: 'movies.html', page: 'movies', type: AsyncRouteType.Experimental },
    { path: 'tv.html', page: 'shows', type: AsyncRouteType.Experimental },
    { path: 'music.html', page: 'music', type: AsyncRouteType.Experimental },
    { path: 'livetv.html', page: 'livetv', type: AsyncRouteType.Experimental },
    { path: 'mypreferencesdisplay.html', page: 'user/display', type: AsyncRouteType.Experimental }
];
