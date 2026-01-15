import React, { useCallback, useState } from 'react';
import { useUser } from 'apps/dashboard/features/users/api/useUser';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import globalize from 'lib/globalize';
import Stack from '@mui/material/Stack';
import { TabIndex } from 'apps/dashboard/features/users/constants/tabIndex';
import Profile from 'apps/dashboard/features/users/components/Profile';
import Access from 'apps/dashboard/features/users/components/Access';
import ParentalControl from 'apps/dashboard/features/users/components/ParentalControl';
import Password from 'apps/dashboard/features/users/components/Password';
import Alert from '@mui/material/Alert';

export const Component = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const userId = searchParams.get('userId');
    const { data: user, isPending, isError } = useUser(userId ? { userId: userId } : undefined);
    const [ value, setValue ] = useState(parseInt(searchParams.get('index') || '0', 10) || TabIndex.Profile);

    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        setSearchParams((params) => {
            params.set('index', value.toString());
            return params;
        });
    }, [ value, setSearchParams ]);

    if (isPending) return <Loading />;

    return (
        <Page
            id='usersEditPage'
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                {isError ? (
                    <Alert
                        severity='error'
                        sx={{ marginBottom: 2 }}
                    >
                        {globalize.translate('UsersEditPageError')}
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        <Typography variant='h1'>{user?.Name}</Typography>
                        <Tabs value={value} onChange={handleTabChange}>
                            <Tab label={globalize.translate('Profile')} />
                            <Tab label={globalize.translate('TabAccess')} />
                            <Tab label={globalize.translate('TabParentalControl')} />
                            <Tab label={globalize.translate('HeaderPassword')} />
                        </Tabs>

                        {value == TabIndex.Profile && (
                            <Profile userDto={user} />
                        )}
                        {value == TabIndex.Access && (
                            <Access userId={user.Id || ''} />
                        )}
                        {value == TabIndex.ParentalControl && (
                            <ParentalControl userId={user.Id || ''} />
                        )}
                        {value == TabIndex.Password && (
                            <Password user={user} />
                        )}
                    </Stack>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'UsersEditPage';
