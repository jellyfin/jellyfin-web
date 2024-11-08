import React, { type FC } from 'react';
import { useOutletContext } from 'react-router-dom';
import Box from '@mui/material/Box';
import UserAccessForm from 'apps/dashboard/features/users/components/forms/UserAccessForm';
import type { UserContextType } from './type';

const UserLibraryAccess: FC = () => {
    const { user } = useOutletContext<UserContextType>();

    return (
        <Box>
            {user.Id && user.Policy && (
                <UserAccessForm currentUserPolicy={user.Policy} currentUserId={user.Id} />
            )}
        </Box>
    );
};

export default UserLibraryAccess;
