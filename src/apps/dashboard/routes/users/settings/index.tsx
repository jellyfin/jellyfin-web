import React, { useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { userHooks } from 'hooks/api';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';
import Page from 'components/Page';

const User_Settings_Tabs = [
    {
        index: 0,
        value: 'profile',
        label: 'Profile'
    },
    {
        index: 1,
        value: 'access',
        label: 'TabAccess'
    },
    {
        index: 2,
        value: 'parentalcontrol',
        label: 'TabParentalControl'
    },
    {
        index: 3,
        value: 'password',
        label: 'HeaderPassword'
    }
];

const UserSettings = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // eslint-disable-next-line compat/compat
    const userId = new URLSearchParams(location.search).get('userId');
    const activeTab = location.pathname.split('/').pop() || 'profile';

    const { isLoading, data: user } = userHooks.useGetUserById(userId);

    const onTabChange = useCallback(
        (_e: React.MouseEvent<HTMLElement, MouseEvent>, newTab: string | null) => {
            if (newTab !== null) {
                navigate(`${newTab}?userId=${userId}`);
            }
        },
        [navigate, userId]
    );

    if (isLoading) return <Loading />;

    return (
        <Page id='userSettings' className='mainAnimatedPage type-interior'>
            {user ? (
                <Box className='content-primary padded-left padded-right'>
                    <Box mb={3}>
                        <Stack
                            direction='row'
                            alignItems='center'
                            spacing={1}
                            useFlexGap
                        >
                            <Typography variant='h2'>
                                {user.Name}
                            </Typography>
                            <Link
                                className='emby-button raised'
                                href='https://jellyfin.org/docs/general/server/users/'
                                underline='hover'
                                sx={{
                                    py: '0.4em !important'
                                }}
                            >
                                {globalize.translate('Help')}
                            </Link>
                        </Stack>
                    </Box>
                    <Box>
                        <ToggleButtonGroup
                            color='primary'
                            value={activeTab}
                            exclusive
                            onChange={onTabChange}
                            className='localnav'
                        >
                            {User_Settings_Tabs.map((tab) => (
                                <ToggleButton key={tab.index} value={tab.value}>
                                    {globalize.translate(tab.label)}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>
                    <Box>
                        <Outlet context={{ user }} />
                    </Box>
                </Box>
            ) : null}
        </Page>
    );
};

export default UserSettings;
