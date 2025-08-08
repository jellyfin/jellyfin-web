import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client/models/virtual-folder-info';
import BaseCard from 'apps/dashboard/components/BaseCard';
import getCollectionTypeOptions from '../utils/collectionTypeOptions';
import globalize from 'lib/globalize';
import Icon from '@mui/material/Icon';
import { getLibraryIcon } from 'utils/image';
import MediaLibraryEditor from 'components/mediaLibraryEditor/mediaLibraryEditor';
import { queryClient } from 'utils/query/queryClient';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Folder from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemText from '@mui/material/ListItemText';
import imageeditor from 'components/imageeditor/imageeditor';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import InputDialog from 'components/InputDialog';
import { useRenameVirtualFolder } from '../api/useRenameVirtualFolder';
import RefreshDialog from 'components/refreshdialog/refreshdialog';
import ConfirmDialog from 'components/ConfirmDialog';
import { useRemoveVirtualFolder } from '../api/useRemoveVirtualFolder';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useApi } from 'hooks/useApi';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import dom from 'utils/dom';

type LibraryCardProps = {
    virtualFolder: VirtualFolderInfo;
};

const LibraryCard = ({ virtualFolder }: LibraryCardProps) => {
    const { api } = useApi();
    const actionRef = useRef<HTMLButtonElement | null>(null);
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const [ isRenameLibraryDialogOpen, setIsRenameLibraryDialogOpen ] = useState(false);
    const [ isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen ] = useState(false);
    const renameVirtualFolder = useRenameVirtualFolder();
    const removeVirtualFolder = useRemoveVirtualFolder();

    const imageUrl = useMemo(() => {
        if (virtualFolder.PrimaryImageItemId && virtualFolder.ItemId && api) {
            return getImageApi(api)
                .getItemImageUrlById(virtualFolder.ItemId, ImageType.Primary, {
                    maxWidth: Math.round(dom.getScreenWidth() * 0.40)
                });
        }
    }, [ api, virtualFolder ]);

    const typeName = getCollectionTypeOptions().filter(function (t) {
        return t.value == virtualFolder.CollectionType;
    })[0]?.name || globalize.translate('Other');

    const openRenameDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsRenameLibraryDialogOpen(true);
    }, []);

    const hideRenameLibraryDialog = useCallback(() => {
        setIsRenameLibraryDialogOpen(false);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    const onActionClick = useCallback(() => {
        setAnchorEl(actionRef.current);
        setIsMenuOpen(true);
    }, []);

    const renameLibrary = useCallback((newName: string) => {
        if (virtualFolder.Name) {
            renameVirtualFolder.mutate({
                refreshLibrary: true,
                newName: newName,
                name: virtualFolder.Name
            }, {
                onSettled: () => {
                    hideRenameLibraryDialog();
                }
            });
        }
    }, [ renameVirtualFolder, virtualFolder, hideRenameLibraryDialog ]);

    const showRefreshDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);

        void new RefreshDialog({
            itemIds: [ virtualFolder.ItemId ],
            serverId: ServerConnections.currentApiClient()?.serverId(),
            mode: 'scan'
        }).show();
    }, [ virtualFolder ]);

    const showMediaLibraryEditor = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);

        const mediaLibraryEditor = new MediaLibraryEditor({
            library: virtualFolder
        }) as Promise<boolean>;

        void mediaLibraryEditor.then((hasChanges: boolean) => {
            if (hasChanges) {
                void queryClient.invalidateQueries({
                    queryKey: ['VirtualFolders']
                });
            }
        });
    }, [ virtualFolder ]);

    const showImageEditor = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);

        void imageeditor.show({
            itemId: virtualFolder.ItemId,
            serverId: ServerConnections.currentApiClient()?.serverId()
        }).then(() => {
            void queryClient.invalidateQueries({
                queryKey: ['VirtualFolders']
            });
        }).catch(() => {
            /* pop up closed */
        });
    }, [ virtualFolder ]);

    const showDeleteLibraryDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsConfirmDeleteDialogOpen(true);
    }, []);

    const onCancelDeleteLibrary = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
    }, []);

    const onConfirmDeleteLibrary = useCallback(() => {
        if (virtualFolder.Name) {
            removeVirtualFolder.mutate({
                name: virtualFolder.Name,
                refreshLibrary: true
            }, {
                onSettled: () => {
                    setIsConfirmDeleteDialogOpen(false);
                }
            });
        }
    }, [ virtualFolder, removeVirtualFolder ]);

    return (
        <>
            <InputDialog
                title={globalize.translate('ButtonRename')}
                open={isRenameLibraryDialogOpen}
                onClose={hideRenameLibraryDialog}
                label={globalize.translate('LabelNewName')}
                helperText={globalize.translate('MessageRenameMediaFolder')}
                initialText={virtualFolder.Name || ''}
                confirmButtonText={globalize.translate('ButtonRename')}
                onConfirm={renameLibrary}
            />

            <ConfirmDialog
                open={isConfirmDeleteDialogOpen}
                title={globalize.translate('HeaderRemoveMediaFolder')}
                text={
                    globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder') + '\n\n'
                    + globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') + '\n\n'
                    + virtualFolder.Locations?.join('\n')
                }
                confirmButtonText={globalize.translate('Delete')}
                confirmButtonColor='error'
                onConfirm={onConfirmDeleteLibrary}
                onCancel={onCancelDeleteLibrary}
            />

            <BaseCard
                title={virtualFolder.Name || ''}
                text={typeName}
                image={imageUrl}
                icon={<Icon sx={{ fontSize: 70 }}>{getLibraryIcon(virtualFolder.CollectionType)}</Icon>}
                action={true}
                actionRef={actionRef}
                onActionClick={onActionClick}
                onClick={showMediaLibraryEditor}
                height={260}
            />
            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                <MenuItem onClick={showImageEditor}>
                    <ListItemIcon>
                        <ImageIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('EditImages')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showMediaLibraryEditor}>
                    <ListItemIcon>
                        <Folder />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ManageLibrary')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={openRenameDialog}>
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ButtonRename')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showRefreshDialog}>
                    <ListItemIcon>
                        <RefreshIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ScanLibrary')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showDeleteLibraryDialog}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ButtonRemove')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default LibraryCard;
