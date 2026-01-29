import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import itemContextMenu from 'components/itemContextMenu';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';
import { IconButton } from 'ui-primitives';
import { logger } from 'utils/logger';
import { useGetItemByType } from '../../hooks/api/useGetItemByType';

interface PlayAllFromHereOptions {
    item: ItemDto;
    items: ItemDto[];
    serverId: NullableString;
    queue?: boolean;
}

function playAllFromHere(opts: PlayAllFromHereOptions) {
    const { item, items, serverId, queue } = opts;

    const ids = [];

    let foundCard = false;
    let startIndex: number | undefined;

    for (let i = 0, length = items?.length; i < length; i++) {
        if (items[i] === item) {
            foundCard = true;
            startIndex = i;
        }
        if (foundCard || !queue) {
            ids.push(items[i].Id);
        }
    }

    if (!ids.length) {
        return Promise.resolve();
    }

    if (queue) {
        return playbackManager.queue({
            ids,
            serverId
        });
    } else {
        return playbackManager.play({
            ids,
            serverId,
            startIndex
        });
    }
}

export interface ContextMenuOpts {
    open?: boolean;
    play?: boolean;
    playAllFromHere?: boolean;
    queueAllFromHere?: boolean;
    cancelTimer?: boolean;
    record?: boolean;
    deleteItem?: boolean;
    shuffle?: boolean;
    instantMix?: boolean;
    share?: boolean;
    stopPlayback?: boolean;
    clearQueue?: boolean;
    queue?: boolean;
    playlist?: boolean;
    edit?: boolean;
    editImages?: boolean;
    editSubtitles?: boolean;
    identify?: boolean;
    moremediainfo?: boolean;
    openAlbum?: boolean;
    openArtist?: boolean;
    openLyrics?: boolean;
}

interface MoreCommandsButtonProps {
    itemType: ItemKind;
    selectedItemId?: string;
    itemId?: string;
    items?: ItemDto[] | null;
    collectionId?: NullableString;
    playlistId?: NullableString;
    canEditPlaylist?: boolean;
    itemPlaylistItemId?: NullableString;
    contextMenuOpts?: ContextMenuOpts;
    queryKey?: string[];
}

const MoreCommandsButton: FC<MoreCommandsButtonProps> = ({
    itemType,
    selectedItemId,
    itemId,
    collectionId,
    playlistId,
    canEditPlaylist,
    itemPlaylistItemId,
    contextMenuOpts,
    items,
    queryKey
}) => {
    const { user } = useApi();
    const queryClient = useQueryClient();
    const { data: item } = useGetItemByType({
        itemType,
        itemId: selectedItemId || itemId || ''
    });
    const parentId = [item?.SeasonId, item?.SeriesId, item?.ParentId].find(
        (id): id is string => typeof id === 'string'
    ) as string | undefined;
    const parentIdString = parentId;
    const [hasCommands, setHasCommands] = useState(false);

    const playlistItem = useMemo(() => {
        let PlaylistItemId: string | null = null;
        let PlaylistIndex = -1;
        let PlaylistItemCount = 0;

        if (playlistId) {
            PlaylistItemId = itemPlaylistItemId || null;

            if (items?.length) {
                PlaylistItemCount = items.length;
                PlaylistIndex = items.findIndex(
                    (listItem) => listItem.PlaylistItemId === PlaylistItemId
                );
            }
        }
        return { PlaylistItemId, PlaylistIndex, PlaylistItemCount };
    }, [itemPlaylistItemId, items, playlistId]);

    const defaultMenuOptions = useMemo(() => {
        return {
            item: {
                ...item,
                ...playlistItem
            },
            user: user,
            play: true,
            queue: true,
            playAllFromHere: item?.Type === ItemKind.Season || !item?.IsFolder,
            queueAllFromHere: !item?.IsFolder,
            canEditPlaylist: canEditPlaylist,
            playlistId: playlistId ?? undefined,
            collectionId: collectionId ?? undefined,
            ...contextMenuOpts
        };
    }, [canEditPlaylist, collectionId, contextMenuOpts, item, playlistId, playlistItem, user]);

    const onMoreCommandsClick = useCallback(
        async (e: React.MouseEvent<HTMLElement>) => {
            itemContextMenu
                .show({
                    ...defaultMenuOptions,
                    positionTo: e.currentTarget
                })
                .then(async (result) => {
                    if (!result) return;
                    if (result.command === 'playallfromhere') {
                        logger.debug('Handling playallfromhere', {
                            component: 'MoreCommandsButton',
                            item,
                            items: items || [],
                            serverId: item?.ServerId
                        });
                        playAllFromHere({
                            item: (item as any) || {},
                            items: (items as any) || [],
                            serverId: item?.ServerId
                        }).catch((err: unknown) => {
                            logger.error(
                                'Failed to play items',
                                { component: 'MoreCommandsButton' },
                                err as Error
                            );
                        });
                    } else if (result.command === 'queueallfromhere') {
                        playAllFromHere({
                            item: (item as any) || {},
                            items: (items as any) || [],
                            serverId: item?.ServerId,
                            queue: true
                        }).catch((err: unknown) => {
                            logger.error(
                                'Failed to queue items',
                                { component: 'MoreCommandsButton' },
                                err as Error
                            );
                        });
                    } else if (result.deleted) {
                        // Assuming if result.deleted is true, the item being managed by this button is deleted
                        await queryClient.invalidateQueries({
                            queryKey
                        });
                        if (parentIdString) {
                            appRouter.showItem(parentIdString, item?.ServerId ?? undefined);
                        } else {
                            await appRouter.goHome();
                        }
                    } else if (result.updated) {
                        await queryClient.invalidateQueries({
                            queryKey
                        });
                    }
                })
                .catch(() => {
                    /* no-op */
                });
        },
        [defaultMenuOptions, item, itemId, items, parentIdString, queryClient, queryKey]
    );

    useEffect(() => {
        const getCommands = async () => {
            const commands = await itemContextMenu.getCommands(defaultMenuOptions);
            setHasCommands(commands.length > 0);
        };
        void getCommands();
    }, [defaultMenuOptions]);

    if (item && hasCommands) {
        return (
            <IconButton
                className="button-flat btnMoreCommands"
                title={globalize.translate('ButtonMore')}
                onClick={onMoreCommandsClick}
            >
                <DotsVerticalIcon />
            </IconButton>
        );
    }

    return null;
};

export default MoreCommandsButton;
