import { Button, Stack } from '@mui/material';
import React, { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import AppToolbar from 'components/toolbar/AppToolbar';
import { useSystemInfo } from 'hooks/useSystemInfo';

import RemotePlayButton from './RemotePlayButton';
import SyncPlayButton from './SyncPlayButton';
import SearchButton from './SearchButton';
import UserViewNav from './userViews/UserViewNav';

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
    const { data: systemInfo } = useSystemInfo();

    // The video osd does not show the standard toolbar
    if (location.pathname === '/video') return null;

    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

    return (
        <AppToolbar
            buttons={!isPublicPath && (
                <>
                    <SyncPlayButton />
                    <RemotePlayButton />
                    <SearchButton />
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
                    <Button
                        variant='text'
                        size='large'
                        color='inherit'
                        startIcon={
                            <img
                                src='assets/img/icon-transparent.png'
                                alt=''
                                aria-hidden
                                style={{
                                    maxHeight: '1.25em',
                                    maxWidth: '1.25em'
                                }}
                            />
                        }
                        component={Link}
                        to='/'
                    >
                        {systemInfo?.ServerName || 'Jellyfin'}
                    </Button>

                    {!isPublicPath && (
                        <UserViewNav />
                    )}
                </Stack>
            )}
        </AppToolbar>
    );
};

export default ExperimentalAppToolbar;
