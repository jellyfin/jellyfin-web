import type { Redirect } from 'components/router/Redirect';

export const REDIRECTS: Redirect[] = [
    { from: 'mypreferencesquickconnect.html', to: '/quickconnect' },
    { from: 'serveractivity.html', to: '/dashboard/activity' }
];
