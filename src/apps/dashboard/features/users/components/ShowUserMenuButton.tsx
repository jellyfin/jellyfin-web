import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { type FC, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Icon from '@mui/material/Icon';
import { useQueryClient } from '@tanstack/react-query';
import { userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import ConfirmDialog from 'components/ConfirmDialog';

const userMenuOpts = [
    { label: 'Profile', id: 'profile', icon: 'person' },
    {
        label: 'ButtonLibraryAccess',
        id: 'access',
        icon: 'lock'
    },
    {
        label: 'ButtonParentalControl',
        id: 'parentalcontrol',
        icon: 'supervisor_account'
    },
    { label: 'Delete', id: 'delete', icon: 'delete' }
];

interface ShowUserMenuButtonProps {
    user: UserDto;
}

const ShowUserMenuButton: FC<ShowUserMenuButtonProps> = ({ user }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const deleteUser = userHooks.useDeleteUser();
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [userMenuAnchorEl, setUserMenuAnchorEl] =
        useState<null | HTMLElement>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const isUserMenuOpen = Boolean(userMenuAnchorEl);
    const userId = user.Id;
    const userName = user.Name;

    const handleUserButtonClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            setUserMenuAnchorEl(event.currentTarget);
        },
        []
    );

    const handleUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, []);

    const handleDeleteClick = useCallback(() => {
        setConfirmDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setConfirmDialogOpen(false);
    }, []);

    const handleConfirmDeleteUser = useCallback(() => {
        if (!userId) {
            throw new Error('Unexpected null user id');
        }

        deleteUser.mutate(
            { userId },
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

        setConfirmDialogOpen(false);
    }, [deleteUser, queryClient, userId]);

    const handleUserMenuAction = useCallback(
        (commandId: string) => {
            setUserMenuAnchorEl(null);

            switch (commandId) {
                case 'profile':
                    navigate(
                        `/dashboard/users/settings/profile?userId=${userId}`
                    );
                    break;
                case 'access':
                    navigate(
                        `/dashboard/users/settings/access?userId=${userId}`
                    );
                    break;
                case 'parentalcontrol':
                    navigate(
                        `/dashboard/users/settings/parentalcontrol?userId=${userId}`
                    );
                    break;
                case 'delete':
                    handleDeleteClick();
                    break;
            }
        },
        [navigate, userId, handleDeleteClick]
    );

    return (
        <Box>
            <IconButton
                aria-controls={isUserMenuOpen ? 'context-user-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={isUserMenuOpen ? 'true' : undefined}
                onClick={handleUserButtonClick}
                className='paper-icon-button-light btnUserMenu flex-shrink-zero'
            >
                <MoreVertIcon />
            </IconButton>

            <Menu
                id='context-user-menu'
                anchorEl={userMenuAnchorEl}
                open={isUserMenuOpen}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
                {userMenuOpts.map((option) => (
                    <MenuItem
                        key={option.id}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => handleUserMenuAction(option.id)}
                    >
                        <ListItemIcon>
                            <Icon>{option.icon}</Icon>
                        </ListItemIcon>
                        {globalize.translate(option.label)}
                    </MenuItem>
                ))}
            </Menu>

            <ConfirmDialog
                fullScreen={fullScreen}
                fullWidth
                maxWidth='sm'
                open={confirmDialogOpen}
                title={
                    userName ?
                        globalize.translate('DeleteName', userName) :
                        globalize.translate('DeleteUser')
                }
                text={globalize.translate('DeleteUserConfirmation')}
                onCancel={handleCloseDialog}
                onConfirm={handleConfirmDeleteUser}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
        </Box>
    );
};

export default ShowUserMenuButton;
