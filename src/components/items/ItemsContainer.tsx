// @ts-nocheck

import type { LibraryUpdateInfo } from '@jellyfin/sdk/lib/generated-client/models/library-update-info';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { ApiClient } from 'jellyfin-apiclient';
import React, { type FC, type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';
import Sortable from 'sortablejs';
import { useQueryClient } from '@tanstack/react-query';
import { deprecate } from '../../utils/deprecation';

import { usePlaylistsMoveItemMutation } from 'hooks/useFetchItems';
import Events from 'utils/events';
import serverNotifications from 'scripts/serverNotifications';
import inputManager from 'scripts/inputManager';
import dom from 'utils/dom';
import browser from 'scripts/browser';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';

// Legacy component with extensive migration needed
// TODO: Migrate to React + ui-primitives patterns
import { playbackManager } from 'components/playback/playbackmanager';
import itemShortcuts from 'components/shortcuts';
import MultiSelect from 'components/multiSelect/multiSelect';
import loading from 'components/loading/loading';
import focusManager from 'components/focusManager';
import type { ParentId } from 'types/library';
import type { PlaybackStopInfo } from 'types/playbackStopInfo';
import { useNotificationStore } from '../../store/notificationStore';

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
    queryKey?: string[];
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
    deprecate(
        'emby-itemscontainer/ItemsContainer',
        'Box with custom event handling',
        'src/elements/emby-itemscontainer/ItemsContainer.tsx'
    );

    const queryClient = useQueryClient();
    const { mutateAsync: playlistsMoveItemMutation } = usePlaylistsMoveItemMutation();
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const multiSelectref = useRef<typeof MultiSelect | null>(null);
    const sortableref = useRef<Sortable | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onClick = useCallback((e: MouseEvent) => {
        const itemsContainer = itemsContainerRef.current as HTMLDivElement;
        const multiSelect = multiSelectref.current;

        if (multiSelect && (multiSelect as any).onContainerClick.call(itemsContainer, e) === false) {
            return;
        }

        itemShortcuts.onClick.call(itemsContainer, e);
    }, []);

    const onContextMenu = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const card = dom.parentWithAttribute(target, 'data-id');

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

    const initDragReordering = useCallback(
        (itemsContainer: HTMLDivElement) => {
            sortableref.current = Sortable.create(itemsContainer, {
                draggable: '.listItem',
                handle: '.listViewDragHandle',
                onEnd: (evt: Sortable.SortableEvent) => {
                    return onDrop(evt);
                }
            });
        },
        [onDrop]
    );

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

    const onLibraryChanged = useCallback(
        (_e: any, _apiClient: ApiClient, data: LibraryUpdateInfo) => {
            if (eventsToMonitor.includes('seriestimers') || eventsToMonitor.includes('timers')) {
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
                    foldersAddedTo.indexOf(parentId) === -1 &&
                    foldersRemovedFrom.indexOf(parentId) === -1 &&
                    collectionFolders.indexOf(parentId) === -1
                ) {
                    return;
                }
            }

            notifyRefreshNeeded(false);
        },
        [eventsToMonitor, notifyRefreshNeeded, parentId]
    );

    const onPlaybackStopped = useCallback(
        (_e: any, stopInfo: PlaybackStopInfo) => {
            const state = stopInfo.state;

            if (state.NowPlayingItem && state.NowPlayingItem.MediaType === MediaType.Video) {
                if (eventsToMonitor.includes('videoplayback')) {
                    notifyRefreshNeeded(true);
                    return;
                }
            } else if (
                state.NowPlayingItem &&
                state.NowPlayingItem.MediaType === MediaType.Audio &&
                eventsToMonitor.includes('audioplayback')
            ) {
                notifyRefreshNeeded(true);
                return;
            }
        },
        [eventsToMonitor, notifyRefreshNeeded]
    );

    const setFocus = useCallback((itemsContainer: HTMLDivElement, focusId: string | null | undefined) => {
        if (focusId) {
            const newElement = itemsContainer.querySelector('[data-id="' + focusId + '"]');
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
    }, []);

    useEffect(() => {
        const itemsContainer = itemsContainerRef.current;

        if (!itemsContainer) {
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
            return;
        }

        if (layoutManager.desktop || (layoutManager.mobile && isMultiSelectEnabled !== false)) {
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

        const unsubNotifications = useNotificationStore.subscribe(
            state => state.notifications[0],
            notif => {
                if (!notif) return;
                if (notif.type === 'UserDataChanged') invalidateQueries();
                if (notif.type === 'TimerCreated') invalidateQueries();
                if (notif.type === 'TimerCancelled') invalidateQueries();
                if (notif.type === 'SeriesTimerCreated') invalidateQueries();
                if (notif.type === 'SeriesTimerCancelled') invalidateQueries();
            }
        );

        Events.on(serverNotifications, 'LibraryChanged', onLibraryChanged);
        Events.on(playbackManager, 'playbackstop', onPlaybackStopped);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            unsubNotifications();
            destroyMultiSelect();
            destroyDragReordering();
            itemsContainer.removeEventListener('click', onClick);
            itemsContainer.removeEventListener('contextmenu', onContextMenu);
            itemsContainer.removeEventListener('contextmenu', disableEvent);

            itemShortcuts.off(itemsContainer, getShortcutOptions());

            Events.off(serverNotifications, 'LibraryChanged', onLibraryChanged);
            Events.off(playbackManager, 'playbackstop', onPlaybackStopped);
        };
    }, [
        destroyDragReordering,
        destroyMultiSelect,
        initDragReordering,
        initMultiSelect,
        invalidateQueries,
        isContextMenuEnabled,
        isDragreOrderEnabled,
        isMultiSelectEnabled,
        onClick,
        onContextMenu,
        onLibraryChanged,
        onPlaybackStopped
    ]);

    const itemsContainerClass = classNames('itemsContainer', { 'itemsContainer-tv': layoutManager.tv }, className);

    return (
        <Box ref={itemsContainerRef} className={itemsContainerClass}>
            {children}
        </Box>
    );
};

export default ItemsContainer;
