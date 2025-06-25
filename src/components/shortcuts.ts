/**
 * Module shortcuts.
 * @module components/shortcuts
 */
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';

import { playbackManager } from './playback/playbackmanager';
import inputManager from '../scripts/inputManager';
import { appRouter } from './router/appRouter';
import globalize from '../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from '../scripts/dom';
import recordingHelper from './recordingcreator/recordinghelper';
import toast from './toast/toast';
import * as userSettings from '../scripts/settings/userSettings';
import { toApi } from 'utils/jellyfin-apiclient/compat';

function playAllFromHere(card, serverId, queue) {
    const parent = card.parentNode;
    const className = card.classList.length ? (`.${card.classList[0]}`) : '';
    const cards = parent.querySelectorAll(`${className}[data-id]`);

    const ids = [];

    let foundCard = false;
    let startIndex;

    for (let i = 0, length = cards.length; i < length; i++) {
        if (cards[i] === card) {
            foundCard = true;
            startIndex = i;
        }
        if (foundCard || !queue) {
            ids.push(cards[i].getAttribute('data-id'));
        }
    }

    const itemsContainer = dom.parentWithClass(card, 'itemsContainer');
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

function showProgramDialog(item) {
    import('./recordingcreator/recordingcreator').then(({ default:recordingCreator }) => {
        recordingCreator.show(item.Id, item.ServerId);
    });
}

function getItem(button) {
    button = dom.parentWithAttribute(button, 'data-id');
    const serverId = button.getAttribute('data-serverid');
    const id = button.getAttribute('data-id');
    const type = button.getAttribute('data-type');

    const apiClient = ServerConnections.getApiClient(serverId);

    if (type === 'Timer') {
        return apiClient.getLiveTvTimer(id);
    }
    if (type === 'SeriesTimer') {
        return apiClient.getLiveTvSeriesTimer(id);
    }
    return apiClient.getItem(apiClient.getCurrentUserId(), id);
}

function notifyRefreshNeeded(childElement, itemsContainer) {
    itemsContainer = itemsContainer || dom.parentWithAttribute(childElement, 'is', 'emby-itemscontainer');

    if (itemsContainer) {
        itemsContainer.notifyRefreshNeeded(true);
    }
}

function showContextMenu(card, options = {}) {
    getItem(card).then(item => {
        const playlistId = card.getAttribute('data-playlistid');
        const collectionId = card.getAttribute('data-collectionid');

        if (playlistId) {
            const elem = dom.parentWithAttribute(card, 'data-playlistitemid');
            item.PlaylistItemId = elem ? elem.getAttribute('data-playlistitemid') : null;

            const itemsContainer = dom.parentWithAttribute(card, 'is', 'emby-itemscontainer');
            if (itemsContainer) {
                let index = 0;
                for (const listItem of itemsContainer.querySelectorAll('.listItem')) {
                    const playlistItemId = listItem.getAttribute('data-playlistitemid');
                    if (playlistItemId == item.PlaylistItemId) {
                        item.PlaylistIndex = index;
                    }
                    index++;
                }
                item.PlaylistItemCount = index;
            }
        }

        const apiClient = ServerConnections.getApiClient(item.ServerId);
        const api = toApi(apiClient);

        Promise.all([
            // Import the item menu component
            import('./itemContextMenu'),
            // Fetch the current user
            apiClient.getCurrentUser(),
            // Fetch playlist perms if item is a child of a playlist
            playlistId ?
                getPlaylistsApi(api)
                    .getPlaylistUser({
                        playlistId,
                        userId: apiClient.getCurrentUserId()
                    })
                    .then(({ data }) => data)
                    .catch(err => {
                        // If a user doesn't have access, then the request will 404 and throw
                        console.info('[Shortcuts] Failed to fetch playlist permissions', err);
                        return { CanEdit: false };
                    }) :
                // Not a playlist item
                Promise.resolve({ CanEdit: false })
        ])
            .then(([
                itemContextMenu,
                user,
                playlistPerms
            ]) => {
                return itemContextMenu.show({
                    item,
                    play: true,
                    queue: true,
                    playAllFromHere: item.Type === 'Season' || !item.IsFolder,
                    queueAllFromHere: !item.IsFolder,
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
            .catch(() => { /* no-op */ });
    });
}

function getItemInfoFromCard(card) {
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

function showPlayMenu(card, target) {
    const item = getItemInfoFromCard(card);

    import('./playmenu').then((playMenu) => {
        playMenu.show({

            item: item,
            positionTo: target
        });
    });
}

function executeAction(card, target, action) {
    target = target || card;

    let id = card.getAttribute('data-id');

    if (!id) {
        card = dom.parentWithAttribute(card, 'data-id');
        id = card.getAttribute('data-id');
    }

    const item = getItemInfoFromCard(card);

    const itemsContainer = dom.parentWithClass(card, 'itemsContainer');

    const sortParentId = 'items-' + (item.IsFolder ? item.Id : itemsContainer?.getAttribute('data-parentid')) + '-Folder';

    const serverId = item.ServerId;
    const type = item.Type;

    const playableItemId = type === 'Program' ? item.ChannelId : item.Id;

    if (item.MediaType === 'Photo' && action === 'link') {
        action = 'play';
    }

    if (action === 'link') {
        appRouter.showItem(item, {
            context: card.getAttribute('data-context'),
            parentId: card.getAttribute('data-parentid')
        });
    } else if (action === 'programdialog') {
        showProgramDialog(item);
    } else if (action === 'instantmix') {
        playbackManager.instantMix({
            Id: playableItemId,
            ServerId: serverId
        });
    } else if (action === 'play' || action === 'resume') {
        const startPositionTicks = parseInt(card.getAttribute('data-positionticks') || '0', 10);
        const sortValues = userSettings.getSortValuesLegacy(sortParentId, 'SortName');

        if (playbackManager.canPlay(item)) {
            playbackManager.play({
                ids: [playableItemId],
                startPositionTicks: startPositionTicks,
                serverId: serverId,
                queryOptions: {
                    SortBy: sortValues.sortBy,
                    SortOrder: sortValues.sortOrder
                }
            });
        } else {
            console.warn('Unable to play item', item);
        }
    } else if (action === 'queue') {
        if (playbackManager.isPlaying()) {
            playbackManager.queue({
                ids: [playableItemId],
                serverId: serverId
            });
            toast(globalize.translate('MediaQueued'));
        } else {
            playbackManager.queue({
                ids: [playableItemId],
                serverId: serverId
            });
        }
    } else if (action === 'playallfromhere') {
        playAllFromHere(card, serverId);
    } else if (action === 'queueallfromhere') {
        playAllFromHere(card, serverId, true);
    } else if (action === 'setplaylistindex') {
        playbackManager.setCurrentPlaylistItem(card.getAttribute('data-playlistitemid'));
    } else if (action === 'record') {
        onRecordCommand(serverId, id, type, card.getAttribute('data-timerid'), card.getAttribute('data-seriestimerid'));
    } else if (action === 'menu') {
        const options = target.getAttribute('data-playoptions') === 'false' ?
            {
                shuffle: false,
                instantMix: false,
                play: false,
                playAllFromHere: false,
                queue: false,
                queueAllFromHere: false
            } :
            {};

        options.positionTo = target;

        showContextMenu(card, options);
    } else if (action === 'playmenu') {
        showPlayMenu(card, target);
    } else if (action === 'edit') {
        getItem(target).then(itemToEdit => {
            editItem(itemToEdit, serverId);
        });
    } else if (action === 'playtrailer') {
        getItem(target).then(playTrailer);
    } else if (action === 'addtoplaylist') {
        getItem(target).then(addToPlaylist);
    } else if (action === 'custom') {
        const customAction = target.getAttribute('data-customaction');

        card.dispatchEvent(new CustomEvent(`action-${customAction}`, {
            detail: {
                playlistItemId: card.getAttribute('data-playlistitemid')
            },
            cancelable: false,
            bubbles: true
        }));
    }
}

function addToPlaylist(item) {
    import('./playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
        const playlistEditor = new PlaylistEditor();
        playlistEditor.show({
            items: [item.Id],
            serverId: item.ServerId
        }).catch(() => {
            // Dialog closed
        });
    }).catch(err => {
        console.error('[addToPlaylist] failed to load playlist editor', err);
    });
}

function playTrailer(item) {
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id).then(trailers => {
        playbackManager.play({ items: trailers });
    });
}

function editItem(item, serverId) {
    const apiClient = ServerConnections.getApiClient(serverId);

    return new Promise((resolve, reject) => {
        const currentServerId = apiClient.serverInfo().Id;

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
            import('./metadataEditor/metadataEditor').then(({ default: metadataEditor }) => {
                metadataEditor.show(item.Id, currentServerId).then(resolve, reject);
            });
        }
    });
}

function onRecordCommand(serverId, id, type, timerId, seriesTimerId) {
    if (type === 'Program' || timerId || seriesTimerId) {
        const programId = type === 'Program' ? id : null;
        recordingHelper.toggleRecording(serverId, programId, timerId, seriesTimerId);
    }
}

export function onClick(e) {
    const card = dom.parentWithClass(e.target, 'itemAction');

    if (card) {
        let actionElement = card;
        let action = actionElement.getAttribute('data-action');

        if (!action) {
            actionElement = dom.parentWithAttribute(actionElement, 'data-action');
            if (actionElement) {
                action = actionElement.getAttribute('data-action');
            }
        }

        if (action) {
            executeAction(card, actionElement, action);

            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
}

function onCommand(e) {
    const cmd = e.detail.command;

    if (cmd === 'play' || cmd === 'resume' || cmd === 'record' || cmd === 'menu' || cmd === 'info') {
        const target = e.target;
        const card = dom.parentWithClass(target, 'itemAction') || dom.parentWithAttribute(target, 'data-id');

        if (card) {
            e.preventDefault();
            e.stopPropagation();
            executeAction(card, card, cmd);
        }
    }
}

export function on(context, options) {
    options = options || {};

    if (options.click !== false) {
        context.addEventListener('click', onClick);
    }

    if (options.command !== false) {
        inputManager.on(context, onCommand);
    }
}

export function off(context, options) {
    options = options || {};

    context.removeEventListener('click', onClick);

    if (options.command !== false) {
        inputManager.off(context, onCommand);
    }
}

export function getShortcutAttributesHtml(item, serverId) {
    let html = `data-id="${item.Id}" data-serverid="${serverId || item.ServerId}" data-type="${item.Type}" data-mediatype="${item.MediaType}" data-channelid="${item.ChannelId}" data-isfolder="${item.IsFolder}"`;

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
