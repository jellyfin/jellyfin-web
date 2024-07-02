import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import { useApi } from 'hooks/useApi';
import UserPasswordForm from 'apps/dashboard/components/users/passwordForm';

interface UserPasswordProps {
    user: UserDto;
}

const UserPassword: FC<UserPasswordProps> = ({ user }) => {
    const { user: loggedInUser } = useApi();
    return (
        <Box className='readOnlyContent'>
            <UserPasswordForm user={user} loggedInUser={loggedInUser} />
        </Box>
    );
};

export default UserPassword;

