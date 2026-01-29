import { PlusIcon } from '@radix-ui/react-icons';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useDeleteUser } from 'apps/dashboard/features/users/api/useDeleteUser';
import ConfirmDialog from 'components/ConfirmDialog';
import UserCardBox from 'components/dashboard/users/UserCardBox';
import ActionMenu, { type ActionMenuItem } from 'components/dialogs/ActionMenu';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useUsers } from 'hooks/useUsers';
import React, { useCallback, useState } from 'react';
import {
    Box,
    Button,
    Flex,
    Grid,
    gridContainer,
    gridGap,
    gridLg,
    gridMd,
    gridSm,
    gridXs,
    Heading,
    Text
} from 'ui-primitives';
import globalize from '../../../../lib/globalize';

const UserProfiles = (): React.ReactElement => {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: users, isPending } = useUsers();
    const deleteUser = useDeleteUser();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name?: string | null } | null>(
        null
    );

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [activeUser, setActiveUser] = useState<string | null>(null);

    const onAddUserClick = useCallback(() => {
        navigate({ to: '/dashboard/users/add' } as any);
    }, [navigate]);

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, userId: string) => {
        setMenuAnchor(event.currentTarget);
        setActiveUser(userId);
        setMenuOpen(true);
    }, []);

    const handleMenuClose = useCallback(() => {
        setMenuOpen(false);
        setMenuAnchor(null);
    }, []);

    const handleMenuSelect = useCallback(
        (id: string) => {
            if (!activeUser) return;

            switch (id) {
                case 'open':
                    navigate({ to: `/dashboard/users/profile?userId=${activeUser}` });
                    break;
                case 'access':
                    navigate({ to: `/dashboard/users/access?userId=${activeUser}` });
                    break;
                case 'parentalcontrol':
                    navigate({ to: `/dashboard/users/parentalcontrol?userId=${activeUser}` });
                    break;
                case 'delete': {
                    const user = users?.find((u) => u.Id === activeUser);
                    setSelectedUser({ id: activeUser, name: user?.Name });
                    setDeleteConfirmOpen(true);
                    break;
                }
            }
        },
        [activeUser, navigate, users]
    );

    const handleConfirmDelete = useCallback(() => {
        if (selectedUser) {
            deleteUser.mutate({ userId: selectedUser.id });
            setDeleteConfirmOpen(false);
            setSelectedUser(null);
        }
    }, [deleteUser, selectedUser]);

    if (isPending) {
        return <Loading />;
    }

    const menuItems: ActionMenuItem[] = [
        { name: globalize.translate('ButtonEditUser'), id: 'open', icon: 'mode_edit' },
        { name: globalize.translate('ButtonLibraryAccess'), id: 'access', icon: 'lock' },
        {
            name: globalize.translate('ButtonParentalControl'),
            id: 'parentalcontrol',
            icon: 'person'
        },
        { divider: true },
        { name: globalize.translate('Delete'), id: 'delete', icon: 'delete' }
    ];

    return (
        <Page
            id="userProfilesPage"
            className="mainAnimatedPage type-interior"
            title={globalize.translate('HeaderUsers')}
        >
            <ConfirmDialog
                open={deleteConfirmOpen}
                title={
                    selectedUser?.name
                        ? globalize.translate('DeleteName', selectedUser.name)
                        : globalize.translate('DeleteUser')
                }
                text={globalize.translate('DeleteUserConfirmation')}
                confirmButtonText={globalize.translate('Delete')}
                confirmButtonColor="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
            />

            <ActionMenu
                open={menuOpen}
                anchorEl={menuAnchor}
                items={menuItems}
                onClose={handleMenuClose}
                onSelect={handleMenuSelect}
            />

            <Box style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
                <Box className={`${Flex} ${Flex.col}`} style={{ gap: 32 }}>
                    <Box
                        className={`${Flex} ${Flex.row}`}
                        style={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <Heading.H2 style={{ margin: 0 }}>
                            {globalize.translate('HeaderUsers')}
                        </Heading.H2>
                        <Button startDecorator={<PlusIcon />} onClick={onAddUserClick}>
                            {globalize.translate('ButtonAddUser')}
                        </Button>
                    </Box>

                    <Grid className={`${gridContainer} ${gridGap.lg}`}>
                        {users?.map((user) => (
                            <Grid
                                key={user.Id}
                                className={`${gridXs[12]} ${gridSm[6]} ${gridMd[4]} ${gridLg[3]}`}
                            >
                                <UserCardBox
                                    user={user}
                                    onMenuClick={(e) => handleMenuOpen(e, user.Id!)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Page>
    );
};

export default UserProfiles;
