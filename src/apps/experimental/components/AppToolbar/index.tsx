import { IconButton, Stack, Tooltip } from '@mui/material';
import React, { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import AppToolbar from 'components/toolbar/AppToolbar';

import AppTabs from '../tabs/AppTabs';
import RemotePlayButton from './RemotePlayButton';
import SyncPlayButton from './SyncPlayButton';
import SearchButton from './SearchButton';
import { useSystemInfo } from 'hooks/useSystemInfo';
import UserViewNav from './userViews/UserViewNav';

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
    const { data: systemInfo } = useSystemInfo();

    // The video osd does not show the standard toolbar
    if (location.pathname === '/video') return null;

    // const isTabsAvailable = isTabPath(location.pathname);
    const isTabsAvailable = false;
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
            {!isDrawerAvailable && (
                <Stack
                    direction='row'
                    spacing={0.5}
                >
                    <Tooltip title={systemInfo?.ServerName || 'Jellyfin'}>
                        <IconButton
                            size='large'
                            aria-label={systemInfo?.ServerName || 'Jellyfin'}
                            color='inherit'
                            component={Link}
                            to='/'
                        >
                            <img
                                src='assets/img/icon-transparent.png'
                                alt=''
                                aria-hidden
                                style={{
                                    maxHeight: '1em',
                                    maxWidth: '1em'
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                    {!isPublicPath && (
                        // <>
                        //     <Tooltip title={globalize.translate('Favorites')}>
                        //         <IconButton
                        //             size='large'
                        //             aria-label={globalize.translate('Favorites')}
                        //             color='inherit'
                        //             component={Link}
                        //             to='/home.html?tab=1'
                        //         >
                        //             <Favorite />
                        //         </IconButton>
                        //     </Tooltip>
                        //     <Divider orientation='vertical' flexItem variant='middle' />
                        <UserViewNav />
                        // </>
                    )}
                </Stack>
            )}

            {isTabsAvailable && (<AppTabs isDrawerOpen={isDrawerOpen} />)}
        </AppToolbar>
    );
};

export default ExperimentalAppToolbar;
