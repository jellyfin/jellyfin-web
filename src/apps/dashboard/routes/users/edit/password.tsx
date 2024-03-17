import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import UserPasswordForm from 'components/dashboard/users/form/UserPasswordForm';

interface UserPasswordProps {
    user: UserDto;
}

const UserPassword: FC<UserPasswordProps> = ({ user }) => {
    return (
        <Box className='readOnlyContent'>
            <UserPasswordForm user={user} />
        </Box>
    );
};

export default UserPassword;

