import { AsyncRoute, AsyncRouteType } from '../../../../components/router/AsyncRoute';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search.html', page: 'search' },
    { path: 'userprofile.html', page: 'user/userprofile' },
    { path: 'home.html', page: 'home', type: AsyncRouteType.Experimental },
    { path: 'movies', page: 'library', type: AsyncRouteType.Experimental },
    { path: 'tv', page: 'library', type: AsyncRouteType.Experimental },
    { path: 'music', page: 'library', type: AsyncRouteType.Experimental },
    { path: 'books', page: 'library', type: AsyncRouteType.Experimental },
    { path: 'livetv', page: 'library', type: AsyncRouteType.Experimental },
    { path: 'homevideos', page: 'library', type: AsyncRouteType.Experimental }
];
