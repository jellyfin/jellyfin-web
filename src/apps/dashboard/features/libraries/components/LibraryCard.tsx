import React, { useCallback, useMemo, useState } from 'react';
import type { VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client/models/virtual-folder-info';
import BaseCard from 'components/cardbuilder/Card/BaseCard';
import getCollectionTypeOptions from '../utils/collectionTypeOptions';
import globalize from 'lib/globalize';
import { getLibraryIcon } from 'utils/image';
import MediaLibraryEditor from 'components/mediaLibraryEditor/mediaLibraryEditor';
import { queryClient } from 'utils/query/queryClient';
import { Menu, MenuItem } from 'ui-primitives/Menu';
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
import { vars } from 'styles/tokens.css';

// Inline SVG icons
const ImageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>Edit Images</title>
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
);

const FolderIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>Manage Library</title>
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
);

const EditIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>Rename</title>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>Scan Library</title>
        <path d="M1 4v6h6M23 20v-6h-6" />
        <path
            d="M20.3 13.89A8 8 0 0 0 3.7 10.11M3.7 10.11A8 8 0 0 0 20.3 13.89"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
        />
    </svg>
);

const DeleteIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>Remove</title>
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
    </svg>
);

interface LibraryCardProps {
    virtualFolder: VirtualFolderInfo;
}

const LibraryCard = ({ virtualFolder }: LibraryCardProps) => {
    const { api } = useApi();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenameLibraryDialogOpen, setIsRenameLibraryDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const renameVirtualFolder = useRenameVirtualFolder();
    const removeVirtualFolder = useRemoveVirtualFolder();

    const imageUrl = useMemo(() => {
        if (virtualFolder.PrimaryImageItemId && virtualFolder.ItemId && api) {
            return getImageApi(api).getItemImageUrlById(virtualFolder.ItemId, ImageType.Primary, {
                maxWidth: Math.round(dom.getScreenWidth() * 0.4)
            });
        }
    }, [api, virtualFolder]);

    const typeName =
        getCollectionTypeOptions().filter(t => {
            return t.value === virtualFolder.CollectionType;
        })[0]?.name || globalize.translate('Other');

    const openRenameDialog = useCallback(() => {
        setIsMenuOpen(false);
        setIsRenameLibraryDialogOpen(true);
    }, []);

    const hideRenameLibraryDialog = useCallback(() => {
        setIsRenameLibraryDialogOpen(false);
    }, []);

    const renameLibrary = useCallback(
        (newName: string) => {
            if (virtualFolder.Name) {
                renameVirtualFolder.mutate(
                    {
                        refreshLibrary: true,
                        newName: newName,
                        name: virtualFolder.Name
                    },
                    {
                        onSettled: () => {
                            hideRenameLibraryDialog();
                        }
                    }
                );
            }
        },
        [renameVirtualFolder, virtualFolder, hideRenameLibraryDialog]
    );

    const showRefreshDialog = useCallback(() => {
        setIsMenuOpen(false);

        void new RefreshDialog({
            itemIds: [virtualFolder.ItemId],
            serverId: ServerConnections.currentApiClient()?.serverId(),
            mode: 'scan'
        }).show();
    }, [virtualFolder]);

    const showMediaLibraryEditor = useCallback(() => {
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
    }, [virtualFolder]);

    const showImageEditor = useCallback(() => {
        setIsMenuOpen(false);

        void imageeditor
            .show({
                itemId: String(virtualFolder.ItemId ?? ''),
                serverId: String(ServerConnections.currentApiClient()?.serverId() ?? '')
            })
            .then(() => {
                void queryClient.invalidateQueries({
                    queryKey: ['VirtualFolders']
                });
            })
            .catch(() => {
                /* pop up closed */
            });
    }, [virtualFolder]);

    const showDeleteLibraryDialog = useCallback(() => {
        setIsMenuOpen(false);
        setIsConfirmDeleteDialogOpen(true);
    }, []);

    const onCancelDeleteLibrary = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
    }, []);

    const onConfirmDeleteLibrary = useCallback(() => {
        if (virtualFolder.Name) {
            removeVirtualFolder.mutate(
                {
                    name: virtualFolder.Name,
                    refreshLibrary: true
                },
                {
                    onSettled: () => {
                        setIsConfirmDeleteDialogOpen(false);
                    }
                }
            );
        }
    }, [virtualFolder, removeVirtualFolder]);

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
                    globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder') +
                    '\n\n' +
                    globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') +
                    '\n\n' +
                    virtualFolder.Locations?.join('\n')
                }
                confirmButtonText={globalize.translate('Delete')}
                confirmButtonColor="danger"
                onConfirm={onConfirmDeleteLibrary}
                onCancel={onCancelDeleteLibrary}
            />

            <BaseCard
                title={virtualFolder.Name || ''}
                text={typeName}
                image={imageUrl}
                icon={
                    <div
                        style={{
                            fontSize: vars.typography['9'].fontSize,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {getLibraryIcon(virtualFolder.CollectionType)}
                    </div>
                }
                action={true}
                onActionClick={() => setIsMenuOpen(true)}
                onClick={showMediaLibraryEditor}
                height={260}
            />
            <Menu open={isMenuOpen} onOpenChange={setIsMenuOpen} trigger={<div />}>
                <MenuItem onClick={showImageEditor}>
                    <ImageIcon />
                    <span>{globalize.translate('EditImages')}</span>
                </MenuItem>
                <MenuItem onClick={showMediaLibraryEditor}>
                    <FolderIcon />
                    <span>{globalize.translate('ManageLibrary')}</span>
                </MenuItem>
                <MenuItem onClick={openRenameDialog}>
                    <EditIcon />
                    <span>{globalize.translate('ButtonRename')}</span>
                </MenuItem>
                <MenuItem onClick={showRefreshDialog}>
                    <RefreshIcon />
                    <span>{globalize.translate('ScanLibrary')}</span>
                </MenuItem>
                <MenuItem onClick={showDeleteLibraryDialog} variant="danger">
                    <DeleteIcon />
                    <span>{globalize.translate('ButtonRemove')}</span>
                </MenuItem>
            </Menu>
        </>
    );
};

export default LibraryCard;
