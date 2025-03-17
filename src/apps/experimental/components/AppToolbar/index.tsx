import React, { type FC } from 'react';
import { useLocation } from 'react-router-dom';
import AppToolbar from 'components/toolbar/AppToolbar';
import AppTabs from '../tabs/AppTabs';
import RemotePlayButton from './RemotePlayButton';
import SyncPlayButton from './SyncPlayButton';
import SearchButton from './SearchButton';
import { isTabPath } from '../tabs/tabRoutes';

interface AppToolbarProps {
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const PUBLIC_PATHS = [
    '/addserver',
    '/selectserver',
    '/login',
    '/forgotpassword',
    '/forgotpasswordpin'
];

const ExperimentalAppToolbar: FC<AppToolbarProps> = ({
    isDrawerAvailable,
    isDrawerOpen,
    onDrawerButtonClick
}) => {
    const location = useLocation();

    // The video osd does not show the standard toolbar
    if (location.pathname === '/video') return null;

    const isTabsAvailable = isTabPath(location.pathname);
    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

    return (
        <AppToolbar
            buttons={!isPublicPath && (
                <>
                    <SyncPlayButton />
                    <RemotePlayButton />
                    <SearchButton isTabsAvailable={isTabsAvailable} />
                </>
            )}
            isDrawerAvailable={isDrawerAvailable}
            isDrawerOpen={isDrawerOpen}
            onDrawerButtonClick={onDrawerButtonClick}
            isUserMenuAvailable={!isPublicPath}
        >
            {isTabsAvailable && (<AppTabs isDrawerOpen={isDrawerOpen} />)}
        </AppToolbar>
    );
};

export default ExperimentalAppToolbar;
