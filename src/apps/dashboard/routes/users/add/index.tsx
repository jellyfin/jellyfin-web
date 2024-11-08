import React, { type FC } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import globalize from 'lib/globalize';
import Page from 'components/Page';
import UserForm from 'apps/dashboard/features/users/components/forms/UserAddForm';

const UserNew: FC = () => {
    return (
        <Page id='newUserPage' className='mainAnimatedPage type-interior'>
            <Box className='content-primary padded-left padded-right'>
                <Box mb={3}>
                    <Stack direction='row' alignItems='center' spacing={1} useFlexGap>
                        <Typography variant='h2'>
                            {globalize.translate('HeaderAddUser')}
                        </Typography>
                        <Link
                            className='emby-button raised button-alt'
                            href='https://jellyfin.org/docs/general/server/users/'
                            underline='hover'
                            sx={{ py: '0.4em !important' }}
                        >
                            {globalize.translate('Help')}
                        </Link>
                    </Stack>
                </Box>
                <UserForm />
            </Box>
        </Page>
    );
};

export default UserNew;
