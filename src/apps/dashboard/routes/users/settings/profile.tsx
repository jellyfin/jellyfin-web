import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { userHooks } from 'hooks/api';
import toast from 'components/toast/toast';
import globalize from 'scripts/globalize';
import UserProfileForm from 'apps/dashboard/components/users/profileForm';

interface UserProfileProps {
    user: UserDto;
}

const UserProfile: FC<UserProfileProps> = ({ user }) => {
    const queryClient = useQueryClient();
    const updateUser = userHooks.useUpdateUser();
    const updateUserPolicy = userHooks.useUpdateUserPolicy();

    const [currentUser, setCurrentUser] = useState<UserDto>(user);

    const handleUpdateUserPolicy = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            e.stopPropagation();

            updateUser.mutate(
                {
                    userId: currentUser?.Id || '',
                    userDto:
                        {
                            ...currentUser,
                            Name: currentUser?.Name
                        }
                },
                {
                    onSuccess: async () => {
                        updateUserPolicy.mutate(
                            {
                                userId: currentUser?.Id || '',
                                userPolicy: {
                                    ...currentUser?.Policy,
                                    AuthenticationProviderId: currentUser.Policy?.AuthenticationProviderId || '',
                                    PasswordResetProviderId: currentUser.Policy?.PasswordResetProviderId || '',
                                    EnableContentDeletionFromFolders: currentUser
                                        ?.Policy?.EnableContentDeletion ?
                                        [] :
                                        currentUser?.Policy
                                            ?.EnableContentDeletionFromFolders
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
                    }
                }
            );
        },
        [currentUser, queryClient, updateUser, updateUserPolicy]
    );

    return (
        <Box>
            <Box
                className='lnkEditUserPreferencesContainer'
                style={{ paddingBottom: '1em' }}
            >
                <Link
                    className='lnkEditUserPreferences button-link'
                    href={`#/mypreferencesmenu.html?userId=${currentUser.Id}`}
                    underline='hover'
                >
                    {globalize.translate('ButtonEditOtherUserPreferences')}
                </Link>
            </Box>

            <UserProfileForm
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onFormSubmit={handleUpdateUserPolicy}
            />
        </Box>
    );
};

export default UserProfile;

