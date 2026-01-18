import React, { useCallback, useRef, useState } from 'react';
import type { ListingsProviderInfo } from '@jellyfin/sdk/lib/generated-client/models/listings-provider-info';
import Avatar from '@mui/material/Avatar/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemLink from 'components/ListItemLink';
import DvrIcon from '@mui/icons-material/Dvr';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import getProviderConfigurationUrl from '../utils/getProviderConfigurationUrl';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import getProviderName from '../utils/getProviderName';
import IconButton from '@mui/material/IconButton/IconButton';
import ConfirmDialog from 'components/ConfirmDialog';
import globalize from 'lib/globalize';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import DeleteIcon from '@mui/icons-material/Delete';
import ChannelMapper from 'components/channelMapper/channelMapper';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useDeleteProvider } from '../api/useDeleteProvider';

interface ProviderProps {
    provider: ListingsProviderInfo
}

const Provider = ({ provider }: ProviderProps) => {
    const [ isDeleteProviderDialogOpen, setIsDeleteProviderDialogOpen ] = useState(false);
    const actionsRef = useRef<HTMLButtonElement | null>(null);
    const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const deleteProvider = useDeleteProvider();

    const showChannelMapper = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        void new ChannelMapper({
            serverId: ServerConnections.currentApiClient()?.serverId(),
            providerId: provider.Id
        }).show();
    }, [ provider ]);

    const showContextMenu = useCallback(() => {
        setAnchorEl(actionsRef.current);
        setIsMenuOpen(true);
    }, []);

    const showDeleteDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsDeleteProviderDialogOpen(true);
    }, []);

    const onDeleteProviderDialogCancel = useCallback(() => {
        setIsDeleteProviderDialogOpen(false);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        if (provider.Id) {
            deleteProvider.mutate({
                id: provider.Id
            }, {
                onSettled: () => {
                    setIsDeleteProviderDialogOpen(false);
                }
            });
        }
    }, [ deleteProvider, provider ]);

    return (
        <>
            <ConfirmDialog
                open={isDeleteProviderDialogOpen}
                title={globalize.translate('HeaderDeleteProvider')}
                text={globalize.translate('MessageConfirmDeleteGuideProvider')}
                onCancel={onDeleteProviderDialogCancel}
                onConfirm={onConfirmDelete}
                confirmButtonText={globalize.translate('Delete')}
                confirmButtonColor='error'
            />
            <ListItem
                disablePadding key={provider.Id}
                secondaryAction={
                    <IconButton ref={actionsRef} onClick={showContextMenu}>
                        <MoreVertIcon />
                    </IconButton>
                }
            >
                <ListItemLink to={getProviderConfigurationUrl(provider.Type || '') + '&id=' + provider.Id}>
                    <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <DvrIcon sx={{ color: '#fff' }} />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={getProviderName(provider.Type)}
                        secondary={provider.Path || provider.ListingsId}
                        slotProps={{
                            primary: {
                                variant: 'h3'
                            },
                            secondary: {
                                variant: 'body1'
                            }
                        }}
                    />
                </ListItemLink>
            </ListItem>

            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                <MenuItem onClick={showChannelMapper}>
                    <ListItemIcon>
                        <LocationSearchingIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('MapChannels')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showDeleteDialog}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('Delete')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Provider;
