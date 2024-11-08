import React, { type FC } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import UserProfileForm from 'apps/dashboard/features/users/components/forms/UserProfileForm';
import type { UserContextType } from './type';

const UserProfile: FC = () => {
    const { user } = useOutletContext<UserContextType>();

    return (
        <Box>
            <UserProfileForm
                currentUser={user}
            />
        </Box>
    );
};

export default UserProfile;

