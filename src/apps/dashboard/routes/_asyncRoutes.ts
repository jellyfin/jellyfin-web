import type { AsyncRoute } from 'components/router/AsyncRoute';

export const ASYNC_ADMIN_ROUTES: AsyncRoute[] = [
    { path: 'activity', page: 'dashboard/activity' },
    { path: 'notifications', page: 'dashboard/notifications' },
    { path: 'users/new', page: 'user/usernew' },
    { path: 'users', page: 'user/userprofiles' },
    { path: 'users/profile', page: 'user/useredit' },
    { path: 'users/access', page: 'user/userlibraryaccess' },
    { path: 'users/parentalcontrol', page: 'user/userparentalcontrol' },
    { path: 'users/password', page: 'user/userpassword' }
];
