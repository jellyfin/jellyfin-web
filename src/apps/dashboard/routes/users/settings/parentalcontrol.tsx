import React, { type FC } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import UserParentalControlForm from 'apps/dashboard/features/users/components/forms/UserParentalControlForm';
import type { UserContextType } from './type';

const UserParentalControl: FC = () => {
    const { user } = useOutletContext<UserContextType>();
    return (
        <Box>
            {user.Id && user.Policy && (
                <UserParentalControlForm currentUserPolicy={user.Policy} currentUserId={user.Id} />
            )}
        </Box>
    );
};

export default UserParentalControl;
