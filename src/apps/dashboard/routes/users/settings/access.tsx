import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import UserLibraryAccessForm from 'apps/dashboard/features/users/components/accessForm';
import type { UserContextType } from './type';

const UserLibraryAccess: FC = () => {
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
                        AuthenticationProviderId:
                            currentUser.Policy?.AuthenticationProviderId || '',
                        PasswordResetProviderId:
                            currentUser.Policy?.PasswordResetProviderId || '',
                        EnableAllFolders: currentUser?.Policy?.EnableAllFolders,
                        EnabledFolders: currentUser?.Policy?.EnableAllFolders ?
                            [] :
                            currentUser?.Policy?.EnabledFolders,
                        EnableAllChannels:
                            currentUser?.Policy?.EnableAllChannels,
                        EnabledChannels: currentUser?.Policy?.EnableAllChannels ?
                            [] :
                            currentUser?.Policy?.EnabledChannels,
                        EnableAllDevices: currentUser?.Policy?.EnableAllDevices,
                        EnabledDevices: currentUser?.Policy?.EnableAllDevices ?
                            [] :
                            currentUser?.Policy?.EnabledDevices,
                        BlockedChannels: null,
                        BlockedMediaFolders: null
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
            <UserLibraryAccessForm
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onFormSubmit={handleUpdateUserPolicy}
            />
        </Box>
    );
};

export default UserLibraryAccess;
