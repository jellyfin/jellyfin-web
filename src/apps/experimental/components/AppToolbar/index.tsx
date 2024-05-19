import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import AppToolbar from 'components/toolbar/AppToolbar';
import globalize from 'scripts/globalize';

import AppTabs from '../tabs/AppTabs';
import RemotePlayButton from './RemotePlayButton';
import SyncPlayButton from './SyncPlayButton';
import { isTabPath } from '../tabs/tabRoutes';

interface AppToolbarProps {
    isDrawerAvailable: boolean
    isDrawerOpen: boolean
    onDrawerButtonClick: (event: React.MouseEvent<HTMLElement>) => void
}

const PUBLIC_PATHS = [
    '/addserver.html',
    '/selectserver.html',
    '/login.html',
    '/forgotpassword.html',
    '/forgotpasswordpin.html'
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

                    <Tooltip title={globalize.translate('Search')}>
                        <IconButton
                            size='large'
                            aria-label={globalize.translate('Search')}
                            color='inherit'
                            component={Link}
                            to='/search.html'
                        >
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>
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
