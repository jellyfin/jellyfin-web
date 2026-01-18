import type { LibraryUpdateInfo } from '@jellyfin/sdk/lib/generated-client/models/library-update-info';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { ApiClient } from 'jellyfin-apiclient';
import React, { type FC, type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import Box from '@mui/material/Box/Box';
import Sortable from 'sortablejs';
import { useQueryClient } from '@tanstack/react-query';

import { usePlaylistsMoveItemMutation } from 'hooks/useFetchItems';
import Events, { type Event } from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import inputManager from 'scripts/inputManager';
import dom from 'utils/dom';
import browser from 'scripts/browser';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import { playbackManager } from 'components/playback/playbackmanager';
import itemShortcuts from 'components/shortcuts';
import MultiSelect from 'components/multiSelect/multiSelect';
import loading from 'components/loading/loading';
import focusManager from 'components/focusManager';
import type { ParentId } from 'types/library';
import type { PlaybackStopInfo } from 'types/playbackStopInfo';

function disableEvent(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function getShortcutOptions() {
    return {
        click: false
    };
}

export interface ItemsContainerProps {
    className?: string;
    isContextMenuEnabled?: boolean;
    isMultiSelectEnabled?: boolean;
    isDragreOrderEnabled?: boolean;
    eventsToMonitor?: string[];
    parentId?: ParentId;
    reloadItems?: () => void;
    getItemsHtml?: () => string;
    queryKey?: string[]
}

const ItemsContainer: FC<PropsWithChildren<ItemsContainerProps>> = ({
    className,
    isContextMenuEnabled,
    isMultiSelectEnabled,
    isDragreOrderEnabled,
    eventsToMonitor = [],
    parentId,
    queryKey,
    reloadItems,
    getItemsHtml,
    children
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: playlistsMoveItemMutation } = usePlaylistsMoveItemMutation();
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const multiSelectref = useRef<MultiSelect | null>(null);
    const sortableref = useRef<Sortable | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onClick = useCallback((e: MouseEvent) => {
        const itemsContainer = itemsContainerRef.current as HTMLDivElement;
        const multiSelect = multiSelectref.current;

        if (
            multiSelect
            && multiSelect.onContainerClick.call(itemsContainer, e) === false
        ) {
            return;
        }

        itemShortcuts.onClick.call(itemsContainer, e);
    }, []);

    const onContextMenu = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const card = dom.parentWithAttribute(target, 'data-id');

        // check for serverId, it won't be present on selectserver
        if (card?.getAttribute('data-serverid')) {
            inputManager.handleCommand('menu', {
                sourceElement: card
            });

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, []);

    const initMultiSelect = useCallback((itemsContainer: HTMLDivElement) => {
        multiSelectref.current = new MultiSelect({
            container: itemsContainer,
            bindOnClick: false
        });
    }, []);

    const destroyMultiSelect = useCallback(() => {
        if (multiSelectref.current) {
            multiSelectref.current.destroy();
            multiSelectref.current = null;
        }
    }, []);

    const onDrop = useCallback(
        async (evt: Sortable.SortableEvent) => {
            const el = evt.item;

            const newIndex = evt.newIndex;
            const itemId = el.getAttribute('data-playlistitemid');
            const playlistId = el.getAttribute('data-playlistid');

            if (!playlistId) {
                const oldIndex = evt.oldIndex;
                el.dispatchEvent(
                    new CustomEvent('itemdrop', {
                        detail: {
                            oldIndex: oldIndex,
                            newIndex: newIndex,
                            playlistItemId: itemId
                        },
                        bubbles: true,
                        cancelable: false
                    })
                );
                return;
            }

            if (!itemId) throw new Error('null itemId');

            try {
                loading.show();
                await playlistsMoveItemMutation({
                    playlistId,
                    itemId,
                    newIndex: newIndex || 0
                });
                loading.hide();
            } catch (error) {
                console.error('[Drag-Drop] error playlists Move Item: ' + error);
                loading.hide();
                if (!reloadItems) return;
                reloadItems();
            }
        },
        [playlistsMoveItemMutation, reloadItems]
    );

    const initDragReordering = useCallback((itemsContainer: HTMLDivElement) => {
        sortableref.current = Sortable.create(itemsContainer, {
            draggable: '.listItem',
            handle: '.listViewDragHandle',

            // dragging ended
            onEnd: (evt: Sortable.SortableEvent) => {
                return onDrop(evt);
            }
        });
    }, [onDrop]);

    const destroyDragReordering = useCallback(() => {
        if (sortableref.current) {
            sortableref.current.destroy();
            sortableref.current = null;
        }
    }, []);

    const invalidateQueries = useCallback(async () => {
        await queryClient.invalidateQueries({
            queryKey,
            type: 'all',
            refetchType: 'active'
        });
    }, [queryClient, queryKey]);

    const notifyRefreshNeeded = useCallback(
        (isInForeground: boolean) => {
            if (!reloadItems) return;
            if (isInForeground === true) {
                reloadItems();
            } else {
                timerRef.current = setTimeout(() => reloadItems(), 10000);
            }
        },
        [reloadItems]
    );

    const onUserDataChanged = useCallback(async () => {
        await invalidateQueries();
    },
    [invalidateQueries]
    );

    const onTimerCreated = useCallback(async () => {
        await invalidateQueries();
    },
    [invalidateQueries]
    );

    const onSeriesTimerCreated = useCallback(async () => {
        await invalidateQueries();
    }, [invalidateQueries]);

    const onTimerCancelled = useCallback(async () => {
        await invalidateQueries();
    },
    [invalidateQueries]
    );

    const onSeriesTimerCancelled = useCallback(async () => {
        await invalidateQueries();
    },
    [invalidateQueries]
    );

    const onLibraryChanged = useCallback(
        (_e: Event, _apiClient: ApiClient, data: LibraryUpdateInfo) => {
            if (eventsToMonitor.includes('seriestimers') || eventsToMonitor.includes('timers')) {
                // yes this is an assumption
                return;
            }

            const itemsAdded = data.ItemsAdded ?? [];
            const itemsRemoved = data.ItemsRemoved ?? [];
            if (!itemsAdded.length && !itemsRemoved.length) {
                return;
            }

            if (parentId) {
                const foldersAddedTo = data.FoldersAddedTo ?? [];
                const foldersRemovedFrom = data.FoldersRemovedFrom ?? [];
                const collectionFolders = data.CollectionFolders ?? [];

                if (
                    foldersAddedTo.indexOf(parentId) === -1
                    && foldersRemovedFrom.indexOf(parentId) === -1
                    && collectionFolders.indexOf(parentId) === -1
                ) {
                    return;
                }
            }

            notifyRefreshNeeded(false);
        },
        [eventsToMonitor, notifyRefreshNeeded, parentId]
    );

    const onPlaybackStopped = useCallback(
        (_e: Event, stopInfo: PlaybackStopInfo) => {
            const state = stopInfo.state;

            if (
                state.NowPlayingItem
                && state.NowPlayingItem.MediaType === MediaType.Video
            ) {
                if (eventsToMonitor.includes('videoplayback')) {
                    notifyRefreshNeeded(true);
                    return;
                }
            } else if (
                state.NowPlayingItem
                && state.NowPlayingItem.MediaType === MediaType.Audio
                && eventsToMonitor.includes('audioplayback')
            ) {
                notifyRefreshNeeded(true);
                return;
            }
        },
        [eventsToMonitor, notifyRefreshNeeded]
    );

    const setFocus = useCallback(
        (
            itemsContainer: HTMLDivElement,
            focusId: string | null | undefined
        ) => {
            if (focusId) {
                const newElement = itemsContainer.querySelector(
                    '[data-id="' + focusId + '"]'
                );
                if (newElement) {
                    try {
                        focusManager.focus(newElement);
                        return;
                    } catch (err) {
                        console.error(err);
                    }
                }
            }

            focusManager.autoFocus(itemsContainer);
        },
        []
    );

    useEffect(() => {
        const itemsContainer = itemsContainerRef.current;

        if (!itemsContainer) {
            console.error('Unexpected null reference');
            return;
        }

        const activeElement = document.activeElement;
        let focusId;
        let hasActiveElement;
        if (itemsContainer?.contains(activeElement)) {
            hasActiveElement = true;
            focusId = activeElement?.getAttribute('data-id');
        }

        if (getItemsHtml) {
            itemsContainer.innerHTML = getItemsHtml();
            imageLoader.lazyChildren(itemsContainer);
        }

        if (hasActiveElement) {
            setFocus(itemsContainer, focusId);
        }
    }, [getItemsHtml, setFocus]);

    useEffect(() => {
        const itemsContainer = itemsContainerRef.current;

        if (!itemsContainer) {
            console.error('Unexpected null reference');
            return;
        }

        if (
            layoutManager.desktop
            || (layoutManager.mobile && isMultiSelectEnabled !== false)
        ) {
            initMultiSelect(itemsContainer);
        }

        if (isDragreOrderEnabled === true) {
            initDragReordering(itemsContainer);
        }

        itemsContainer.addEventListener('click', onClick);

        if (browser.touch) {
            itemsContainer.addEventListener('contextmenu', disableEvent);
        } else if (isContextMenuEnabled !== false) {
            itemsContainer.addEventListener('contextmenu', onContextMenu);
        }

        itemShortcuts.on(itemsContainer, getShortcutOptions());

        Events.on(serverNotifications, 'UserDataChanged', onUserDataChanged);
        Events.on(serverNotifications, 'TimerCreated', onTimerCreated);
        Events.on(serverNotifications, 'TimerCancelled', onTimerCancelled);
        Events.on(serverNotifications, 'SeriesTimerCreated', onSeriesTimerCreated);
        Events.on(serverNotifications, 'SeriesTimerCancelled', onSeriesTimerCancelled);
        Events.on(serverNotifications, 'LibraryChanged', onLibraryChanged);
        Events.on(playbackManager, 'playbackstop', onPlaybackStopped);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            destroyMultiSelect();
            destroyDragReordering();
            itemsContainer.removeEventListener('click', onClick);
            itemsContainer.removeEventListener('contextmenu', onContextMenu);
            itemsContainer.removeEventListener('contextmenu', disableEvent);

            itemShortcuts.off(itemsContainer, getShortcutOptions());

            Events.off(serverNotifications, 'UserDataChanged', onUserDataChanged);
            Events.off(serverNotifications, 'TimerCreated', onTimerCreated);
            Events.off(serverNotifications, 'TimerCancelled', onTimerCancelled);
            Events.off( serverNotifications, 'SeriesTimerCreated', onSeriesTimerCreated);
            Events.off(serverNotifications, 'SeriesTimerCancelled', onSeriesTimerCancelled);
            Events.off(serverNotifications, 'LibraryChanged', onLibraryChanged);
            Events.off(playbackManager, 'playbackstop', onPlaybackStopped);
        };
    }, [
        destroyDragReordering,
        destroyMultiSelect,
        initDragReordering,
        initMultiSelect,
        isContextMenuEnabled,
        isDragreOrderEnabled,
        isMultiSelectEnabled,
        onClick,
        onContextMenu,
        onLibraryChanged,
        onPlaybackStopped,
        onSeriesTimerCancelled,
        onSeriesTimerCreated,
        onTimerCancelled,
        onTimerCreated,
        onUserDataChanged
    ]);

    const itemsContainerClass = classNames(
        'itemsContainer',
        { 'itemsContainer-tv': layoutManager.tv },
        className
    );

    return (
        <Box ref={itemsContainerRef} className={itemsContainerClass}>
            {children}
        </Box>
    );
};

export default ItemsContainer;
