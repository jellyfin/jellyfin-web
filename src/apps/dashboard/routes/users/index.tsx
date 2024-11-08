import React, { type FC, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import { useNavigate } from 'react-router-dom';
import { userHooks } from 'hooks/api';
import Loading from 'components/loading/LoadingComponent';
import globalize from 'lib/globalize';
import Page from 'components/Page';
import UserCardBox from 'apps/dashboard/features/users/components/UserCardBox';
import 'components/cardbuilder/card.scss';
import 'components/indicators/indicators.scss';
import 'styles/flexstyles.scss';

const UserProfiles: FC = () => {
    const navigate = useNavigate();
    const { isLoading, data: users } = userHooks.useGetUsers({});

    const onBtnAddUserClick = useCallback(() => {
        navigate('/dashboard/users/add');
    }, [navigate]);

    if (isLoading) return <Loading />;

    return (
        <Page
            id='userProfilesPage'
            className='mainAnimatedPage type-interior userProfilesPage fullWidthContent'
            title={globalize.translate('HeaderUsers')}
        >
            <Box className='content-primary padded-left padded-right'>
                <Box mb={3}>
                    <Stack
                        direction='row'
                        alignItems='center'
                        spacing={1}
                        useFlexGap
                    >
                        <Typography variant='h2'>
                            {globalize.translate('HeaderUsers')}
                        </Typography>

                        <IconButton
                            title={globalize.translate('ButtonAddUser')}
                            className='emby-button fab submit'
                            onClick={onBtnAddUserClick}
                        >
                            <AddIcon />
                        </IconButton>

                        <Link
                            className='emby-button raised button-alt'
                            href='https://jellyfin.org/docs/general/server/users/adding-managing-users'
                            underline='hover'
                            sx={{
                                py: '0.4em !important'
                            }}
                        >
                            {globalize.translate('Help')}
                        </Link>
                    </Stack>
                </Box>

                <Box className='localUsers itemsContainer vertical-wrap'>
                    {users?.map((user) => (
                        <UserCardBox key={user.Id} user={user} />
                    ))}
                </Box>
            </Box>
        </Page>
    );
};

export default UserProfiles;
