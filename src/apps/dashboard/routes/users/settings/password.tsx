import React, { type FC } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import UserPasswordForm from 'apps/dashboard/features/users/components/forms/UserPasswordForm';
import type { UserContextType } from './type';

const UserPassword: FC = () => {
    const { user } = useOutletContext<UserContextType>();
    return (
        <Box className='readOnlyContent'>
            <UserPasswordForm currentUser={user} />
        </Box>
    );
};

export default UserPassword;

