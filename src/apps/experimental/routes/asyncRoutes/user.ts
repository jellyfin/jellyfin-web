import { AsyncRoute } from 'components/router/AsyncRoute';
import { AppType } from 'constants/appType';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home', page: 'home', type: AppType.Experimental },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'userprofile', page: 'user/userprofile' },
    { path: 'movies', page: 'movies', type: AppType.Experimental },
    { path: 'tv', page: 'shows', type: AppType.Experimental },
    { path: 'music', page: 'music', type: AppType.Experimental },
    { path: 'livetv', page: 'livetv', type: AppType.Experimental },
    { path: 'mypreferencesdisplay', page: 'user/display', type: AppType.Experimental },
    { path: 'homevideos', page: 'homevideos', type: AppType.Experimental }
];
