import { AsyncRoute, AsyncRouteType } from '../../../../components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'usernew.html', page: 'user/usernew', type: AsyncRouteType.Experimental },
    { path: 'userprofiles.html', page: 'user/userprofiles', type: AsyncRouteType.Experimental },
    { path: 'useredit.html', page: 'user/useredit', type: AsyncRouteType.Experimental },
    { path: 'userlibraryaccess.html', page: 'user/userlibraryaccess', type: AsyncRouteType.Experimental },
    { path: 'userparentalcontrol.html', page: 'user/userparentalcontrol', type: AsyncRouteType.Experimental },
    { path: 'userpassword.html', page: 'user/userpassword', type: AsyncRouteType.Experimental }
];
