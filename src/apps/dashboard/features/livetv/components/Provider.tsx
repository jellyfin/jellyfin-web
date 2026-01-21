import React, { useCallback, useState } from 'react';
import type { ListingsProviderInfo } from '@jellyfin/sdk/lib/generated-client/models/listings-provider-info';
import { Avatar } from 'ui-primitives/Avatar';
import { List, ListItem, ListItemContent, ListItemDecorator } from 'ui-primitives/List';
import { Text } from 'ui-primitives/Text';
import { Menu, MenuItem } from 'ui-primitives/Menu';
import { IconButton } from 'ui-primitives/IconButton';
import ListItemLink from 'components/ListItemLink';
import getProviderConfigurationUrl from '../utils/getProviderConfigurationUrl';
import getProviderName from '../utils/getProviderName';
import ConfirmDialog from 'components/ConfirmDialog';
import globalize from 'lib/globalize';
import ChannelMapper from 'components/channelMapper/channelMapper';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useDeleteProvider } from '../api/useDeleteProvider';

// Inline SVG icons
const DvrIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>DVR</title>
        <path d='M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zm-10.5-9.5h3v3h-3zM5 8h3v3H5zm0 6h3v3H5zm12-6h3v3h-3zm0 6h3v3h-3z'/>
    </svg>
);

const MoreVertIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>Options</title>
        <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'/>
    </svg>
);

const LocationSearchingIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>Map Channels</title>
        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11 10.07 7.5 12 7.5s3.5 1.57 3.5 3.5z'/>
    </svg>
);

const DeleteIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>Delete</title>
        <path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z'/>
    </svg>
);

interface ProviderProps {
    provider: ListingsProviderInfo
}

const Provider = ({ provider }: ProviderProps) => {
    const [ isDeleteProviderDialogOpen, setIsDeleteProviderDialogOpen ] = useState(false);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const deleteProvider = useDeleteProvider();

    const showChannelMapper = useCallback(() => {
        setIsMenuOpen(false);
        void new ChannelMapper({
            serverId: ServerConnections.currentApiClient()?.serverId(),
            providerId: provider.Id
        }).show();
    }, [ provider ]);

    const showDeleteDialog = useCallback(() => {
        setIsMenuOpen(false);
        setIsDeleteProviderDialogOpen(true);
    }, []);

    const onDeleteProviderDialogCancel = useCallback(() => {
        setIsDeleteProviderDialogOpen(false);
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
                confirmButtonColor='danger'
            />
            <List size='md'>
                <ListItem
                    key={provider.Id}
                    endAction={
                        <IconButton
                            onClick={() => setIsMenuOpen(true)}
                            variant='ghost'
                            size='sm'
                            title={globalize.translate('Options')}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    }
                >
                    <ListItemLink to={getProviderConfigurationUrl(provider.Type || '') + '&id=' + provider.Id}>
                        <ListItemDecorator>
                            <Avatar color='primary'>
                                <DvrIcon />
                            </Avatar>
                        </ListItemDecorator>
                        <ListItemContent>
                            <Text weight='bold'>{getProviderName(provider.Type)}</Text>
                            <Text size='sm' color='secondary'>{provider.Path || provider.ListingsId}</Text>
                        </ListItemContent>
                    </ListItemLink>
                </ListItem>
            </List>

            <Menu
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                trigger={<div />}
            >
                <MenuItem onClick={showChannelMapper}>
                    <LocationSearchingIcon />
                    <span>{globalize.translate('MapChannels')}</span>
                </MenuItem>
                <MenuItem onClick={showDeleteDialog} variant='danger'>
                    <DeleteIcon />
                    <span>{globalize.translate('Delete')}</span>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Provider;
