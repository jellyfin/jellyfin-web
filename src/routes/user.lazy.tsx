import { lazyRouteComponent } from '@tanstack/react-router';

export const SettingsPage = lazyRouteComponent(
    () => import('apps/stable/routes/user/settings/index'),
    'default'
);

export function UserProfilePage() {
    return <div>User Profile Page</div>;
}

export function SearchPage() {
    return <div>Search Page</div>;
}

export function QuickConnectPage() {
    return <div>Quick Connect Page</div>;
}
