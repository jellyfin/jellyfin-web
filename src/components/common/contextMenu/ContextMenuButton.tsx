import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { useGetItemByType } from './api/useGetItemByType';
import globalize from 'lib/globalize';
import itemContextMenu from 'components/itemContextMenu';
import { playAllFromHere } from './utils/playAllFromHere';
import { appRouter } from 'components/router/appRouter';

import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { ContextMenuOpts } from './type/ContextMenuOpts';

interface ContextMenuButtonProps {
    itemType: ItemKind;
    itemId: string;
    mediaSourceId?: string | null;
    items?: ItemDto[] | null;
    className?: string;
    iconClassName?: string;
    contextMenuOpts?: ContextMenuOpts;
    queryKey?: string[];
}

const ContextMenuButton: FC<ContextMenuButtonProps> = ({
    itemType,
    itemId,
    mediaSourceId,
    className,
    iconClassName,
    contextMenuOpts,
    items,
    queryKey
}) => {
    const { user } = useApi();
    const queryClient = useQueryClient();
    const { data: item } = useGetItemByType({
        itemType,
        itemId: mediaSourceId || itemId
    });
    const parentId = item?.SeasonId || item?.SeriesId || item?.ParentId;
    const [ hasCommands, setHasCommands ] = useState(false);

    const playlistItem = useMemo(() => {
        let PlaylistItemId: string | null = null;
        let PlaylistIndex = -1;
        let PlaylistItemCount = 0;

        if (contextMenuOpts?.playlistId) {
            PlaylistItemId = contextMenuOpts?.playlistItemId || null;

            if (items?.length) {
                PlaylistItemCount = items.length;
                PlaylistIndex = items.findIndex(listItem => listItem.PlaylistItemId === PlaylistItemId);
            }
        }
        return { PlaylistItemId, PlaylistIndex, PlaylistItemCount };
    }, [contextMenuOpts?.playlistItemId, contextMenuOpts?.playlistId, items]);

    const defaultMenuOpts = useMemo(() => {
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
            ...contextMenuOpts
        };
    }, [contextMenuOpts, item, playlistItem, user]);

    const onMoreButtonClick = useCallback(
        async (e: React.MouseEvent<HTMLElement>) => {
            itemContextMenu
                .show({
                    ...defaultMenuOpts,
                    positionTo: e.currentTarget
                })
                .then(async function (result) {
                    if (result.command === 'playallfromhere') {
                        playAllFromHere({
                            itemId: item?.Id || itemId,
                            items: items || [],
                            serverId: item?.ServerId
                        }).catch(err => {
                            console.error('[MoreCommandsButton] failed to play', err);
                        });
                    } else if (result.command === 'queueallfromhere') {
                        playAllFromHere({
                            itemId: item?.Id || itemId,
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
        [defaultMenuOpts, item?.Id, item?.ServerId, itemId, items, parentId, queryClient, queryKey]
    );

    useEffect(() => {
        const getCommands = async () => {
            const commands = await itemContextMenu.getCommands(defaultMenuOpts);
            setHasCommands(commands.length > 0);
        };
        void getCommands();
    }, [ defaultMenuOpts ]);

    if (item && hasCommands) {
        return (
            <IconButton
                className={classNames(
                    'button-flat btnMoreCommands',
                    className
                )}

                title={globalize.translate('ButtonMore')}
                onClick={onMoreButtonClick}
            >
                <MoreVertIcon className={iconClassName} />
            </IconButton>
        );
    }

    return null;
};

export default ContextMenuButton;
