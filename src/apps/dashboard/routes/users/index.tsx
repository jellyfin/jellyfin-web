import React, { useCallback, useState } from 'react';
import globalize from '../../../../lib/globalize';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Grid from '@mui/joy/Grid';
import AddIcon from '@mui/icons-material/Add';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUsers } from 'hooks/useUsers';
import Loading from 'components/loading/LoadingComponent';
import { useDeleteUser } from 'apps/dashboard/features/users/api/useDeleteUser';
import Page from 'components/Page';
import UserCardBox from 'components/dashboard/users/UserCardBox';
import ConfirmDialog from 'components/ConfirmDialog';
import ActionMenu, { ActionMenuItem } from 'components/joy-ui/action/ActionMenu';

const UserProfiles = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: users, isPending } = useUsers();
    const deleteUser = useDeleteUser();

    const [ deleteConfirmOpen, setDeleteConfirmOpen ] = useState(false);
    const [ selectedUser, setSelectedUser ] = useState<{ id: string; name?: string | null } | null>(null);
    
    const [ menuOpen, setMenuOpen ] = useState(false);
    const [ menuAnchor, setMenuAnchor ] = useState<HTMLElement | null>(null);
    const [ activeUser, setActiveUser ] = useState<string | null>(null);

    const onAddUserClick = useCallback(() => {
        navigate('/dashboard/users/add');
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

    const handleMenuSelect = useCallback((id: string) => {
        if (!activeUser) return;

        switch (id) {
            case 'open':
                navigate(`/dashboard/users/profile?userId=${activeUser}`);
                break;
            case 'access':
                navigate(`/dashboard/users/access?userId=${activeUser}`);
                break;
            case 'parentalcontrol':
                navigate(`/dashboard/users/parentalcontrol?userId=${activeUser}`);
                break;
            case 'delete':
                const user = users?.find(u => u.Id === activeUser);
                setSelectedUser({ id: activeUser, name: user?.Name });
                setDeleteConfirmOpen(true);
                break;
        }
    }, [activeUser, navigate, users]);

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
        { name: globalize.translate('ButtonParentalControl'), id: 'parentalcontrol', icon: 'person' },
        { divider: true },
        { name: globalize.translate('Delete'), id: 'delete', icon: 'delete' }
    ];

    return (
        <Page
            id='userProfilesPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('HeaderUsers')}
        >
            <ConfirmDialog
                open={deleteConfirmOpen}
                title={selectedUser?.name ? globalize.translate('DeleteName', selectedUser.name) : globalize.translate('DeleteUser')}
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

            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
                <Stack spacing={4}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography level='h2'>{globalize.translate('HeaderUsers')}</Typography>
                        <Button
                            startDecorator={<AddIcon />}
                            onClick={onAddUserClick}
                        >
                            {globalize.translate('ButtonAddUser')}
                        </Button>
                    </Stack>

                    <Grid container spacing={3}>
                        {users?.map(user => (
                            <Grid key={user.Id} xs={12} sm={6} md={4} lg={3}>
                                <UserCardBox
                                    user={user}
                                    onMenuClick={(e) => handleMenuOpen(e, user.Id!)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
            </Box>
        </Page>
    );
};

export default UserProfiles;