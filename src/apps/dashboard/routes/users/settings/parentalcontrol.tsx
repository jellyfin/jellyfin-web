import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { userHooks } from 'hooks/api';
import Box from '@mui/material/Box';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import UserParentalControlForm from 'apps/dashboard/features/users/components/parentalcontrolForm';
import type { UserContextType } from './type';

const UserParentalControl: FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const queryClient = useQueryClient();
    const updateUserPolicy = userHooks.useUpdateUserPolicy();

    const [currentUser, setCurrentUser] = useState<UserDto>(user);

    const handleUpdateUserPolicy = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            updateUserPolicy.mutate(
                {
                    userId: currentUser?.Id || '',
                    userPolicy: {
                        ...currentUser?.Policy,
                        AuthenticationProviderId: currentUser.Policy?.AuthenticationProviderId || '',
                        PasswordResetProviderId: currentUser.Policy?.PasswordResetProviderId || ''
                    }
                },
                {
                    onSuccess: async () => {
                        toast(globalize.translate('SettingsSaved'));
                        await queryClient.invalidateQueries({
                            queryKey: ['UserById', currentUser?.Id || '']
                        });
                    }
                }
            );
        },
        [currentUser?.Id, currentUser?.Policy, queryClient, updateUserPolicy]
    );

    return (
        <Box>
            <UserParentalControlForm
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onFormSubmit={handleUpdateUserPolicy}
            />
        </Box>
    );
};

export default UserParentalControl;
