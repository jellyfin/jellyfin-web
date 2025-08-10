import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { useGetItemByType } from '../../hooks/api/useGetItemByType';
import globalize from 'lib/globalize';
import itemContextMenu from 'components/itemContextMenu';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';

import { ItemKind } from 'types/base/models/item-kind';
import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';

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
    let startIndex;

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
    const parentId = item?.SeasonId || item?.SeriesId || item?.ParentId;
    const [ hasCommands, setHasCommands ] = useState(false);

    const playlistItem = useMemo(() => {
        let PlaylistItemId: string | null = null;
        let PlaylistIndex = -1;
        let PlaylistItemCount = 0;

        if (playlistId) {
            PlaylistItemId = itemPlaylistItemId || null;

            if (items?.length) {
                PlaylistItemCount = items.length;
                PlaylistIndex = items.findIndex(listItem => listItem.PlaylistItemId === PlaylistItemId);
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
            playlistId: playlistId,
            collectionId: collectionId,
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
                .then(async function (result) {
                    if (result.command === 'playallfromhere') {
                        console.log('handleItemClick', {
                            item,
                            items: items || [],
                            serverId: item?.ServerId
                        });
                        playAllFromHere({
                            item: item || {},
                            items: items || [],
                            serverId: item?.ServerId
                        }).catch(err => {
                            console.error('[MoreCommandsButton] failed to play', err);
                        });
                    } else if (result.command === 'queueallfromhere') {
                        playAllFromHere({
                            item: item || {},
                            items: items || [],
                            serverId: item?.ServerId,
                            queue: true
                        }).catch(err => {
                            console.error('[MoreCommandsButton] failed to play', err);
                        });
                    } else if (result.deleted) {
                        if (result?.itemId !== itemId) {
                            await queryClient.invalidateQueries({
                                queryKey
                            });
                        } else if (parentId) {
                            appRouter.showItem(parentId, item?.ServerId);
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
        [defaultMenuOptions, item, itemId, items, parentId, queryClient, queryKey]
    );

    useEffect(() => {
        const getCommands = async () => {
            const commands = await itemContextMenu.getCommands(defaultMenuOptions);
            setHasCommands(commands.length > 0);
        };
        void getCommands();
    }, [ defaultMenuOptions ]);

    if (item && hasCommands) {
        return (
            <IconButton
                className='button-flat btnMoreCommands'
                title={globalize.translate('ButtonMore')}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onClick={onMoreCommandsClick}
            >
                <MoreVertIcon />
            </IconButton>
        );
    }

    return null;
};

export default MoreCommandsButton;
