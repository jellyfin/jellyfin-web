/**
 * @deprecated This module is deprecated in favor of React event handlers.
 *
 * Migration:
     - Shortcut handlers → React onKeyDown handlers
     - Global keyboard events → useKeyboard shortcut hook
     - Item actions → Zustand store actions
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

/**
 * "Shortcut" action handlers for BaseItems.
 */

import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';

import { ItemAction } from 'constants/itemAction';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import { playbackManager } from './playback/playbackmanager';
import inputManager from '../scripts/inputManager';
import { appRouter } from './router/appRouter';
import globalize from '../lib/globalize';
import dom from '../utils/dom';
import recordingHelper from './recordingcreator/recordinghelper';
import toast from './toast/toast';
import * as userSettings from '../scripts/settings/userSettings';
import { logger } from '../utils/logger';

interface ShortcutItemInfo {
    Type: string | null;
    Id: string | null;
    TimerId: string | null;
    CollectionType: string | null;
    ChannelId: string | null;
    SeriesId: string | null;
    ServerId: string | null;
    MediaType: string | null;
    Path: string | null;
    IsFolder: boolean;
    StartDate: string | null;
    EndDate: string | null;
    UserData: {
        PlaybackPositionTicks: number;
    };
}

interface ShowContextMenuOptions {
    positionTo?: HTMLElement;
    itemsContainer?: HTMLElement & { notifyRefreshNeeded?: (refresh: boolean) => void };
    shuffle?: boolean;
    instantMix?: boolean;
    play?: boolean;
    playAllFromHere?: boolean;
    queue?: boolean;
    queueAllFromHere?: boolean;
}

interface ShortcutContextOptions {
    click?: boolean;
    command?: boolean;
}

interface SortValues {
    sortBy: string;
    sortOrder: string;
}

function playAllFromHere(card: HTMLElement, serverId: string, queue?: boolean): Promise<void> | undefined {
    const parent = card.parentNode as HTMLElement;
    const className = card.classList.length ? `.${card.classList[0]}` : '';
    const cards = parent.querySelectorAll<HTMLElement>(`${className}[data-id]`);

    const ids: string[] = [];

    let foundCard = false;
    let startIndex: number | undefined;

    for (let i = 0, length = cards.length; i < length; i++) {
        if (cards[i] === card) {
            foundCard = true;
            startIndex = i;
        }
        if (foundCard || !queue) {
            const dataId = cards[i].getAttribute('data-id');
            if (dataId) ids.push(dataId);
        }
    }

    const itemsContainer = dom.parentWithClass(card, 'itemsContainer') as HTMLElement & {
        fetchData?: (options: Record<string, unknown>) => Promise<{ Items: unknown[] }>;
    };
    if (itemsContainer?.fetchData) {
        const queryOptions = queue ? { StartIndex: startIndex } : {};

        return itemsContainer.fetchData(queryOptions).then(result => {
            if (queue) {
                return playbackManager.queue({
                    items: result.Items
                });
            } else {
                return playbackManager.play({
                    items: result.Items,
                    startIndex: startIndex
                });
            }
        });
    }

    if (!ids.length) {
        return;
    }

    if (queue) {
        return playbackManager.queue({
            ids: ids,
            serverId: serverId
        });
    } else {
        return playbackManager.play({
            ids: ids,
            serverId: serverId,
            startIndex: startIndex
        });
    }
}

function showProgramDialog(item: ShortcutItemInfo): void {
    if (item.Id && item.ServerId) {
        import('./recordingcreator/recordingcreator').then(({ default: recordingCreator }) => {
            recordingCreator.show(item.Id, item.ServerId);
        });
    }
}

function getItem(button: HTMLElement): Promise<unknown> {
    button = dom.parentWithAttribute(button, 'data-id') as HTMLElement;
    const serverId = button.getAttribute('data-serverid');
    const id = button.getAttribute('data-id');
    const type = button.getAttribute('data-type');

    if (!serverId || !id) {
        return Promise.reject(new Error('Missing serverId or id'));
    }

    const apiClient = ServerConnections.getApiClient(serverId);
    if (!apiClient) {
        return Promise.reject(new Error('Missing apiClient'));
    }
    if (type === 'SeriesTimer') {
        return apiClient.getLiveTvSeriesTimer(id);
    }
    return apiClient.getItem(apiClient.getCurrentUserId(), id);
}

function notifyRefreshNeeded(
    childElement: HTMLElement,
    itemsContainer?: HTMLElement & { notifyRefreshNeeded?: (refresh: boolean) => void }
): void {
    itemsContainer =
        itemsContainer ||
        (dom.parentWithAttribute(childElement, 'is', 'emby-itemscontainer') as HTMLElement & {
            notifyRefreshNeeded?: (refresh: boolean) => void;
        });

    if (itemsContainer && itemsContainer.notifyRefreshNeeded) {
        itemsContainer.notifyRefreshNeeded(true);
    }
}

function showContextMenu(card: HTMLElement, options: ShowContextMenuOptions = {}): void {
    getItem(card).then(item => {
        const playlistId = card.getAttribute('data-playlistid');
        const collectionId = card.getAttribute('data-collectionid');

        const itemWithData = item as Record<string, unknown>;
        if (playlistId) {
            const elem = dom.parentWithAttribute(card, 'data-playlistitemid') as HTMLElement;
            itemWithData.PlaylistItemId = elem ? elem.getAttribute('data-playlistitemid') : null;

            const itemsContainer = dom.parentWithAttribute(card, 'is', 'emby-itemscontainer') as HTMLElement;
            if (itemsContainer) {
                let index = 0;
                for (const listItem of itemsContainer.querySelectorAll('.listItem')) {
                    const playlistItemId = listItem.getAttribute('data-playlistitemid');
                    if (playlistItemId === itemWithData.PlaylistItemId) {
                        itemWithData.PlaylistIndex = index;
                    }
                    index++;
                }
                itemWithData.PlaylistItemCount = index;
            }
        }

        const itemWithServerId = itemWithData as { ServerId: string };
        const apiClient = ServerConnections.getApiClient(itemWithServerId.ServerId);
        const api = toApi(apiClient);

        Promise.all([
            import('./itemContextMenu'),
            apiClient.getCurrentUser(),
            playlistId
                ? getPlaylistsApi(api)
                      .getPlaylistUser({
                          playlistId,
                          userId: apiClient.getCurrentUserId()
                      })
                      .then(({ data }) => data)
                      .catch(err => {
                          console.info('[Shortcuts] Failed to fetch playlist permissions', err);
                          return { CanEdit: false };
                      })
                : Promise.resolve({ CanEdit: false })
        ])
            .then(([itemContextMenu, user, playlistPerms]) => {
                return (
                    itemContextMenu as unknown as {
                        show: (
                            options: Record<string, unknown>
                        ) => Promise<{ command: string; updated?: boolean; deleted?: boolean }>;
                    }
                ).show({
                    item: itemWithData,
                    play: true,
                    queue: true,
                    playAllFromHere: itemWithData.Type === 'Season' || !itemWithData.IsFolder,
                    queueAllFromHere: !itemWithData.IsFolder,
                    playlistId,
                    canEditPlaylist: !!playlistPerms.CanEdit,
                    collectionId,
                    user,
                    ...options
                });
            })
            .then(result => {
                if (result.command === 'playallfromhere' || result.command === 'queueallfromhere') {
                    executeAction(card, options.positionTo, result.command);
                } else if (result.updated || result.deleted) {
                    notifyRefreshNeeded(card, options.itemsContainer);
                }
            })
            .catch(() => {
                /* no-op */
            });
    });
}

function getItemInfoFromCard(card: HTMLElement): ShortcutItemInfo {
    return {
        Type: card.getAttribute('data-type'),
        Id: card.getAttribute('data-id'),
        TimerId: card.getAttribute('data-timerid'),
        CollectionType: card.getAttribute('data-collectiontype'),
        ChannelId: card.getAttribute('data-channelid'),
        SeriesId: card.getAttribute('data-seriesid'),
        ServerId: card.getAttribute('data-serverid'),
        MediaType: card.getAttribute('data-mediatype'),
        Path: card.getAttribute('data-path'),
        IsFolder: card.getAttribute('data-isfolder') === 'true',
        StartDate: card.getAttribute('data-startdate'),
        EndDate: card.getAttribute('data-enddate'),
        UserData: {
            PlaybackPositionTicks: parseInt(card.getAttribute('data-positionticks') || '0', 10)
        }
    };
}

function showPlayMenu(card: HTMLElement, target: HTMLElement): void {
    const item = getItemInfoFromCard(card);

    import('./playmenu').then(playMenu => {
        (playMenu as { show: (options: { item: ShortcutItemInfo; positionTo: HTMLElement }) => void }).show({
            item: item,
            positionTo: target
        });
    });
}

function addToPlaylist(item: { Id: string; ServerId: string }): void {
    import('./playlisteditor/playlisteditor')
        .then(({ default: PlaylistEditor }) => {
            const playlistEditor = new PlaylistEditor();
            playlistEditor
                .show({
                    items: [item.Id],
                    serverId: item.ServerId
                })
                .catch(() => {
                    // Dialog closed
                });
        })
        .catch(err => {
            logger.error('Failed to load playlist editor', { component: 'Shortcuts' }, err);
        });
}

function playTrailer(item: { Id: string; ServerId: string }): void {
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id).then(trailers => {
        playbackManager.play({ items: trailers });
    });
}

function editItem(item: { Type: string; ProgramId?: string; Id: string }, serverId: string): Promise<any> {
    const apiClient = ServerConnections.getApiClient(serverId);

    return new Promise<any>((resolve, reject) => {
        const serverInfo = (apiClient as unknown as { serverInfo: () => { Id: string } }).serverInfo();
        const currentServerId = serverInfo.Id;

        if (item.Type === 'Timer') {
            if (item.ProgramId) {
                import('./recordingcreator/recordingcreator').then(({ default: recordingCreator }) => {
                    recordingCreator.show(item.ProgramId, currentServerId).then(resolve, reject);
                });
            } else {
                import('./recordingcreator/recordingeditor').then(({ default: recordingEditor }) => {
                    recordingEditor.show(item.Id, currentServerId).then(resolve, reject);
                });
            }
        } else {
            import('./metadataEditor/MetadataEditorWrapper').then(({ default: metadataEditor }) => {
                (metadataEditor as unknown as { show: (id: string, serverId: string) => Promise<void> })
                    .show(item.Id, currentServerId)
                    .then(resolve, reject);
            });
        }
    });
}

function onRecordCommand(
    serverId: string,
    id: string,
    type: string | null,
    timerId: string | null,
    seriesTimerId: string | null
): void {
    if (type === 'Program' || timerId || seriesTimerId) {
        const programId = type === 'Program' ? id : null;
        recordingHelper.toggleRecording(serverId, programId, timerId, seriesTimerId);
    }
}

function executeAction(card: HTMLElement, target: HTMLElement | undefined, action: string): void {
    target = target || card;

    let id = card.getAttribute('data-id');

    if (!id) {
        card = dom.parentWithAttribute(card, 'data-id') as HTMLElement;
        id = card.getAttribute('data-id');
    }

    const item = getItemInfoFromCard(card);

    const itemsContainer = dom.parentWithClass(card, 'itemsContainer') as HTMLElement & {
        getAttribute: (name: string) => string | null;
    };

    const sortParentId =
        'items-' + (item.IsFolder ? item.Id : itemsContainer?.getAttribute('data-parentid')) + '-Folder';

    const serverId = item.ServerId;
    const type = item.Type;

    const playableItemId = type === 'Program' ? item.ChannelId : item.Id;

    if (item.MediaType === 'Photo' && action === ItemAction.Link) {
        action = ItemAction.Play;
    }

    switch (action) {
        case ItemAction.Link: {
            interface RouteOptions {
                context?: string;
                parentId?: string;
            }
            (appRouter as unknown as { showItem: (item: unknown, options: RouteOptions) => void }).showItem(item, {
                context: card.getAttribute('data-context') || undefined,
                parentId: card.getAttribute('data-parentid') || undefined
            });
            break;
        }
        case ItemAction.ProgramDialog:
            showProgramDialog(item);
            break;
        case ItemAction.InstantMix:
            playbackManager.instantMix({
                Id: playableItemId || '',
                ServerId: serverId || ''
            });
            break;
        case ItemAction.Play:
        case ItemAction.Resume: {
            const startPositionTicks = parseInt(card.getAttribute('data-positionticks') || '0', 10);
            const sortValues = userSettings.getSortValuesLegacy(sortParentId);

            if (playbackManager.canPlay(item)) {
                playbackManager.play({
                    ids: [playableItemId || ''],
                    startPositionTicks: startPositionTicks,
                    serverId: serverId || '',
                    queryOptions: {
                        SortBy: sortValues.sortBy,
                        SortOrder: sortValues.sortOrder
                    }
                });
            } else {
                logger.warn('Unable to play item', { component: 'Shortcuts', item });
            }
            break;
        }
        case ItemAction.Queue:
            if (playbackManager.isPlaying()) {
                playbackManager.queue({
                    ids: [playableItemId || ''],
                    serverId: serverId || ''
                });
                toast(globalize.translate('MediaQueued'));
            } else {
                playbackManager.queue({
                    ids: [playableItemId || ''],
                    serverId: serverId || ''
                });
            }
            break;
        case ItemAction.PlayAllFromHere: {
            const playResult = playAllFromHere(card, serverId || '');
            if (playResult) {
                playResult.catch(error => {
                    import('../utils/logger').then(({ logger: moduleLogger }) => {
                        moduleLogger.error(
                            'Play all from here failed',
                            { component: 'Shortcuts', error: error.message || String(error) },
                            error
                        );
                    });
                });
            }
            break;
        }
        case ItemAction.QueueAllFromHere: {
            const queueResult = playAllFromHere(card, serverId || '', true);
            if (queueResult) {
                queueResult.catch(error => {
                    logger.error('Queue all from here failed', { component: 'Shortcuts' }, error);
                });
            }
            break;
        }
        case ItemAction.SetPlaylistIndex:
            (playbackManager as unknown as { setCurrentPlaylistItem: (id: string) => void }).setCurrentPlaylistItem(
                card.getAttribute('data-playlistitemid') || ''
            );
            break;
        case ItemAction.Record:
            onRecordCommand(
                serverId || '',
                id || '',
                type,
                card.getAttribute('data-timerid'),
                card.getAttribute('data-seriestimerid')
            );
            break;
        case ItemAction.Menu: {
            const options: Record<string, unknown> =
                target.getAttribute('data-playoptions') === 'false'
                    ? {
                          shuffle: false,
                          instantMix: false,
                          play: false,
                          playAllFromHere: false,
                          queue: false,
                          queueAllFromHere: false
                      }
                    : {};

            options.positionTo = target;

            showContextMenu(card, options as ShowContextMenuOptions);
            break;
        }
        case ItemAction.PlayMenu:
            showPlayMenu(card, target);
            break;
        case ItemAction.Edit:
            getItem(target).then(itemToEdit => {
                editItem(itemToEdit as { Type: string; ProgramId?: string; Id: string }, serverId || '');
            });
            break;
        case ItemAction.PlayTrailer:
            getItem(target).then(item => {
                playTrailer(item as { Id: string; ServerId: string });
            });
            break;
        case ItemAction.AddToPlaylist:
            getItem(target).then(item => {
                addToPlaylist(item as { Id: string; ServerId: string });
            });
            break;
        case ItemAction.Custom: {
            const customAction = target.getAttribute('data-customaction');

            card.dispatchEvent(
                new CustomEvent(`action-${customAction}`, {
                    detail: {
                        playlistItemId: card.getAttribute('data-playlistitemid')
                    },
                    cancelable: false,
                    bubbles: true
                })
            );
        }
    }
}

export function onClick(e: MouseEvent): boolean | undefined {
    const card = dom.parentWithClass(e.target as HTMLElement, 'itemAction') as HTMLElement | null;

    if (card) {
        let actionElement: HTMLElement | null = card;
        let action = actionElement.getAttribute('data-action');

        if (!action) {
            actionElement = dom.parentWithAttribute(actionElement, 'data-action') as HTMLElement | null;
            if (actionElement) {
                action = actionElement.getAttribute('data-action');
            }
        }

        if (action && action !== ItemAction.None) {
            executeAction(card, actionElement ?? undefined, action);

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
}

interface CommandEventDetail {
    command: string;
}

function onCommand(e: CustomEvent<CommandEventDetail>): void {
    const cmd = e.detail.command;

    if (cmd === 'play' || cmd === 'resume' || cmd === 'record' || cmd === 'menu' || cmd === 'info') {
        const target = e.target as HTMLElement;
        const card = dom.parentWithClass(target, 'itemAction') || dom.parentWithAttribute(target, 'data-id');

        if (card) {
            e.preventDefault();
            e.stopPropagation();
            executeAction(card as HTMLElement, card as HTMLElement, cmd);
        }
    }
}

export function on(context: EventTarget, options?: ShortcutContextOptions): void {
    options = options || {};

    if (options.click !== false) {
        context.addEventListener('click', onClick as EventListener);
    }

    if (options.command !== false) {
        inputManager.on(context, onCommand as EventListener);
    }
}

export function off(context: EventTarget, options?: ShortcutContextOptions): void {
    options = options || {};

    context.removeEventListener('click', onClick as EventListener);

    if (options.command !== false) {
        inputManager.off(context, onCommand as EventListener);
    }
}

interface ShortcutItemAttributes {
    Id: string;
    ServerId: string;
    Type: string;
    MediaType: string;
    ChannelId: string | null;
    IsFolder: boolean;
    CollectionType?: string | null;
}

export function getShortcutAttributesHtml(item: ShortcutItemAttributes, serverId?: string): string {
    let html = `data-id="${item.Id}" data-serverid="${serverId || item.ServerId}" data-type="${item.Type}" data-mediatype="${item.MediaType}" data-channelid="${item.ChannelId || ''}" data-isfolder="${item.IsFolder}"`;

    const collectionType = item.CollectionType;
    if (collectionType) {
        html += ` data-collectiontype="${collectionType}"`;
    }

    return html;
}

export default {
    on,
    off,
    onClick,
    getShortcutAttributesHtml
};
