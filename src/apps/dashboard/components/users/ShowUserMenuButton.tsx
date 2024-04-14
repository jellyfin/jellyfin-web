import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import { useQueryClient } from '@tanstack/react-query';
import { userHooks } from 'hooks/api';
import globalize from 'scripts/globalize';
import confirm from 'components/confirm/confirm';

type MenuEntry = {
    name?: string;
    id?: string;
    icon?: string;
};

interface ShowUserMenuButtonProps {
    user: UserDto;
}

const ShowUserMenuButton: FC<ShowUserMenuButtonProps> = ({ user }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const deleteUser = userHooks.useDeleteUser();

    const onDeleteUserClick = useCallback(() => {
        const userId = user.Id;
        const userName = user.Name;

        if (!userId) {
            throw new Error('Unexpected null user id');
        }
        const title = userName ? globalize.translate('DeleteName', userName) : globalize.translate('DeleteUser');
        const text = globalize.translate('DeleteUserConfirmation');

        confirm({
            title,
            text,
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        })
            .then(function () {
                deleteUser.mutate(
                    {
                        userId
                    },
                    {
                        onSuccess: async () => {
                            await queryClient.invalidateQueries({
                                queryKey: ['Users']
                            });
                        },
                        onError: (err) => {
                            console.error('[userprofiles] failed to delete user', err);
                        }
                    }
                );
            })
            .catch(() => {
                // confirm dialog closed
            });
    },
    [deleteUser, queryClient, user.Id, user.Name]
    );

    const showUserMenu = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (!user.Id) {
                console.error('Unexpected null user id');
                return;
            }

            const menuItems: MenuEntry[] = [];

            menuItems.push({
                name: globalize.translate('Profile'),
                id: 'profile',
                icon: 'person'
            });
            menuItems.push({
                name: globalize.translate('ButtonLibraryAccess'),
                id: 'access',
                icon: 'lock'
            });
            menuItems.push({
                name: globalize.translate('ButtonParentalControl'),
                id: 'parentalcontrol',
                icon: 'supervisor_account'
            });
            menuItems.push({
                name: globalize.translate('Delete'),
                id: 'delete',
                icon: 'delete'
            });

            import('components/actionSheet/actionSheet')
                .then(({ default: actionsheet }) => {
                    actionsheet
                        .show({
                            items: menuItems,
                            positionTo: event.target as HTMLDivElement,
                            callback: (id: string) => {
                                switch (id) {
                                    case 'profile':
                                        navigate(
                                            `/dashboard/users/settings?userId=${user.Id}&tab=profile`
                                        );
                                        break;

                                    case 'access':
                                        navigate(
                                            `/dashboard/users/settings?userId=${user.Id}&tab=access`
                                        );
                                        break;

                                    case 'parentalcontrol':
                                        navigate(
                                            `/dashboard/users/settings?userId=${user.Id}&tab=parentalcontrol`
                                        );
                                        break;

                                    case 'delete':
                                        onDeleteUserClick();
                                }
                            }
                        })
                        .catch(() => {
                            // action sheet closed
                        });
                })
                .catch((err) => {
                    console.error(
                        '[userprofiles] failed to load action sheet',
                        err
                    );
                });
        },
        [navigate, onDeleteUserClick, user.Id]
    );

    return (
        <IconButton
            className='paper-icon-button-light btnUserMenu flex-shrink-zero'
            onClick={showUserMenu}
        >
            <MoreVertIcon />
        </IconButton>
    );
};

export default ShowUserMenuButton;
