import browser from '../scripts/browser';
import { copy } from '../scripts/clipboard';
import dom from '../scripts/dom';
import globalize from '../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import actionsheet from './actionSheet/actionSheet';
import { appHost } from './apphost';
import { appRouter } from './router/appRouter';
import itemHelper, { canEditPlaylist } from './itemHelper';
import { playbackManager } from './playback/playbackmanager';
import toast from './toast/toast';
import * as userSettings from '../scripts/settings/userSettings';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { AppFeature } from 'constants/appFeature';

function getDeleteLabel(type) {
    switch (type) {
        case BaseItemKind.Series:
            return globalize.translate('DeleteSeries');

        case BaseItemKind.Episode:
            return globalize.translate('DeleteEpisode');

        case BaseItemKind.Playlist:
        case BaseItemKind.BoxSet:
            return globalize.translate('Delete');

        default:
            return globalize.translate('DeleteMedia');
    }
}

export async function getCommands(options) {
    const item = options.item;
    const user = options.user;

    const canPlay = playbackManager.canPlay(item);

    const commands = [];

    if (canPlay && item.MediaType !== 'Photo') {
        if (options.play !== false) {
            commands.push({
                name: globalize.translate('Play'),
                id: 'resume',
                icon: 'play_arrow'
            });
        }

        if (options.playAllFromHere && item.Type !== 'Program' && item.Type !== 'TvChannel') {
            commands.push({
                name: globalize.translate('PlayAllFromHere'),
                id: 'playallfromhere',
                icon: 'play_arrow'
            });
        }
    }

    if (playbackManager.getCurrentPlayer() !== null) {
        if (options.stopPlayback) {
            commands.push({
                name: globalize.translate('StopPlayback'),
                id: 'stopPlayback',
                icon: 'stop'
            });
        }
        if (options.clearQueue) {
            commands.push({
                name: globalize.translate('ClearQueue'),
                id: 'clearQueue',
                icon: 'clear_all'
            });
        }
    }

    if (playbackManager.canQueue(item)) {
        if (options.queue !== false) {
            commands.push({
                name: globalize.translate('AddToPlayQueue'),
                id: 'queue',
                icon: 'playlist_add'
            });
        }

        if (options.queue !== false) {
            commands.push({
                name: globalize.translate('PlayNext'),
                id: 'queuenext',
                icon: 'playlist_add'
            });
        }
    }

    if ((item.IsFolder || item.Type === 'MusicArtist' || item.Type === 'MusicGenre')
            && item.CollectionType !== 'livetv'
            && options.shuffle !== false
    ) {
        commands.push({
            name: globalize.translate('Shuffle'),
            id: 'shuffle',
            icon: 'shuffle'
        });
    }

    if ((item.MediaType === 'Audio' || item.Type === 'MusicAlbum' || item.Type === 'MusicArtist' || item.Type === 'MusicGenre')
            && options.instantMix !== false && !itemHelper.isLocalItem(item)
    ) {
        commands.push({
            name: globalize.translate('InstantMix'),
            id: 'instantmix',
            icon: 'explore'
        });
    }

    if (commands.length) {
        commands.push({
            divider: true
        });
    }

    if (!browser.tv) {
        // Multiselect is currrently only ran on long clicks of card components
        // This disables Select on any context menu not originating from a card i.e songs
        if (options.positionTo && (dom.parentWithClass(options.positionTo, 'card') !== null)) {
            commands.push({
                name:  globalize.translate('Select'),
                id: 'multiSelect',
                icon: 'library_add_check'
            });
        }

        if (itemHelper.supportsAddingToCollection(item) && (user.Policy.IsAdministrator || user.Policy.EnableCollectionManagement)) {
            commands.push({
                name: globalize.translate('AddToCollection'),
                id: 'addtocollection',
                icon: 'playlist_add'
            });
        }

        if (itemHelper.supportsAddingToPlaylist(item) && options.playlist !== false) {
            commands.push({
                name: globalize.translate('AddToPlaylist'),
                id: 'addtoplaylist',
                icon: 'playlist_add'
            });
        }
    }

    if ((item.Type === 'Timer') && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
        commands.push({
            name: globalize.translate('CancelRecording'),
            id: 'canceltimer',
            icon: 'cancel'
        });
    }

    if ((item.Type === 'Recording' && item.Status === 'InProgress') && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
        commands.push({
            name: globalize.translate('CancelRecording'),
            id: 'canceltimer',
            icon: 'cancel'
        });
    }

    if ((item.Type === 'SeriesTimer') && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
        commands.push({
            name: globalize.translate('CancelSeries'),
            id: 'cancelseriestimer',
            icon: 'cancel'
        });
    }

    if (appHost.supports(AppFeature.FileDownload)) {
        // CanDownload should probably be updated to return true for these items?
        if (user.Policy.EnableContentDownloading && (item.Type === 'Season' || item.Type == 'Series')) {
            commands.push({
                name: globalize.translate('DownloadAll'),
                id: 'downloadall',
                icon: 'file_download'
            });
        }

        // Books are promoted to major download Button and therefor excluded in the context menu
        if (item.CanDownload && item.Type !== 'Book') {
            commands.push({
                name: globalize.translate('Download'),
                id: 'download',
                icon: 'file_download'
            });

            commands.push({
                name: globalize.translate('CopyStreamURL'),
                id: 'copy-stream',
                icon: 'content_copy'
            });
        }
    }

    if (item.CanDelete && options.deleteItem !== false) {
        commands.push({
            name: getDeleteLabel(item.Type),
            id: 'delete',
            icon: 'delete'
        });
    }

    if (commands.length) {
        commands.push({
            divider: true
        });
    }

    if (item.Type === BaseItemKind.Playlist) {
        const _canEditPlaylist = await canEditPlaylist(user, item);
        if (_canEditPlaylist) {
            commands.push({
                name: globalize.translate('Edit'),
                id: 'editplaylist',
                icon: 'edit'
            });
        }
    }

    const canEdit = itemHelper.canEdit(user, item);
    if (canEdit && options.edit !== false && item.Type !== 'SeriesTimer') {
        const text = (item.Type === 'Timer' || item.Type === 'SeriesTimer') ? globalize.translate('Edit') : globalize.translate('EditMetadata');
        commands.push({
            name: text,
            id: 'edit',
            icon: 'edit'
        });
    }

    if (itemHelper.canEditImages(user, item) && options.editImages !== false) {
        commands.push({
            name: globalize.translate('EditImages'),
            id: 'editimages',
            icon: 'image'
        });
    }

    if (itemHelper.canEditSubtitles(user, item) && options.editSubtitles !== false) {
        commands.push({
            name: globalize.translate('EditSubtitles'),
            id: 'editsubtitles',
            icon: 'closed_caption'
        });
    }

    if (itemHelper.canEditLyrics(user, item)) {
        commands.push({
            name: globalize.translate('EditLyrics'),
            id: 'editlyrics',
            icon: 'lyrics'
        });
    }

    if (options.identify !== false && itemHelper.canIdentify(user, item)) {
        commands.push({
            name: globalize.translate('Identify'),
            id: 'identify',
            icon: 'edit'
        });
    }

    if (item.MediaSources && options.moremediainfo !== false) {
        commands.push({
            name: globalize.translate('MoreMediaInfo'),
            id: 'moremediainfo',
            icon: 'info'
        });
    }

    if (item.Type === 'Program' && options.record !== false) {
        if (item.TimerId) {
            commands.push({
                name: globalize.translate('ManageRecording'),
                id: 'record',
                icon: 'fiber_manual_record'
            });
        } else {
            commands.push({
                name: globalize.translate('Record'),
                id: 'record',
                icon: 'fiber_manual_record'
            });
        }
    }

    if (itemHelper.canRefreshMetadata(item, user)) {
        commands.push({
            name: globalize.translate('RefreshMetadata'),
            id: 'refresh',
            icon: 'refresh'
        });
    }

    if (item.PlaylistItemId && options.playlistId && options.canEditPlaylist) {
        commands.push({
            name: globalize.translate('RemoveFromPlaylist'),
            id: 'removefromplaylist',
            icon: 'playlist_remove'
        });
    }

    if (item.PlaylistItemId && options.playlistId && item.PlaylistIndex > 0) {
        commands.push({
            name: globalize.translate('MoveToTop'),
            id: 'movetotop',
            icon: 'vertical_align_top'
        });
    }

    if (item.PlaylistItemId && options.playlistId && item.PlaylistIndex < (item.PlaylistItemCount - 1)) {
        commands.push({
            name: globalize.translate('MoveToBottom'),
            id: 'movetobottom',
            icon: 'vertical_align_bottom'
        });
    }

    if (options.collectionId) {
        commands.push({
            name: globalize.translate('RemoveFromCollection'),
            id: 'removefromcollection',
            icon: 'playlist_remove'
        });
    }

    if (!browser.tv && options.share === true && itemHelper.canShare(item, user)) {
        commands.push({
            name: globalize.translate('Share'),
            id: 'share',
            icon: 'share'
        });
    }

    if (options.openAlbum !== false && item.AlbumId && item.MediaType !== 'Photo') {
        commands.push({
            name: globalize.translate('ViewAlbum'),
            id: 'album',
            icon: 'album'
        });
    }
    // Show Album Artist by default, as a song can have multiple artists, which specific one would this option refer to?
    // Although some albums can have multiple artists, it's not as common as songs.
    if (options.openArtist !== false && item.AlbumArtists?.length) {
        commands.push({
            name: globalize.translate('ViewAlbumArtist'),
            id: 'artist',
            icon: 'person'
        });
    }

    if (item.HasLyrics) {
        commands.push({
            name: globalize.translate('ViewLyrics'),
            id: 'lyrics',
            icon: 'lyrics'
        });
    }

    return commands;
}

function getResolveFunction(resolve, commandId, changed, deleted, itemId) {
    return function () {
        resolve({
            command: commandId,
            updated: changed,
            deleted: deleted,
            itemId: itemId
        });
    };
}

function executeCommand(item, id, options) {
    const itemId = item.Id;
    const serverId = item.ServerId;
    const apiClient = ServerConnections.getApiClient(serverId);

    return new Promise(function (resolve, reject) {
        // eslint-disable-next-line sonarjs/max-switch-cases
        switch (id) {
            case 'addtocollection':
                import('./collectionEditor/collectionEditor').then(({ default: CollectionEditor }) => {
                    const collectionEditor = new CollectionEditor();
                    collectionEditor.show({
                        items: [itemId],
                        serverId: serverId
                    }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'addtoplaylist':
                import('./playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
                    const playlistEditor = new PlaylistEditor();
                    playlistEditor.show({
                        items: [itemId],
                        serverId: serverId
                    }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'download':
                import('../scripts/fileDownloader').then((fileDownloader) => {
                    const downloadHref = apiClient.getItemDownloadUrl(itemId);
                    fileDownloader.download([{
                        url: downloadHref,
                        item,
                        itemId,
                        serverId,
                        title: item.Name,
                        filename: item.Path.replace(/^.*[\\/]/, '')
                    }]);
                    getResolveFunction(getResolveFunction(resolve, id), id)();
                });
                break;
            case 'downloadall': {
                const downloadEpisodes = episodes => {
                    import('../scripts/fileDownloader').then((fileDownloader) => {
                        const downloads = episodes.map(episode => {
                            const downloadHref = apiClient.getItemDownloadUrl(episode.Id);
                            return {
                                url: downloadHref,
                                item: episode,
                                itemId: episode.Id,
                                serverId: serverId,
                                title: episode.Name,
                                filename: episode.Path.replace(/^.*[\\/]/, '')
                            };
                        });

                        fileDownloader.download(downloads);
                    });
                };
                const downloadSeasons = seasons => {
                    Promise.all(seasons.map(seasonItem => {
                        return apiClient.getEpisodes(seasonItem.SeriesId, {
                            seasonId: seasonItem.Id,
                            userId: options.user.Id,
                            Fields: 'CanDownload,Path'
                        });
                    }
                    )).then(seasonData => {
                        downloadEpisodes(seasonData.map(season => season.Items).flat());
                    });
                };

                if (item.Type === 'Season') {
                    downloadSeasons([item]);
                } else if (item.Type === 'Series') {
                    apiClient.getSeasons(item.Id, {
                        userId: options.user.Id,
                        Fields: 'ItemCounts'
                    }).then(seasons => downloadSeasons(seasons.Items));
                }

                getResolveFunction(getResolveFunction(resolve, id), id)();
                break;
            }
            case 'copy-stream': {
                const downloadHref = apiClient.getItemDownloadUrl(itemId);
                copy(downloadHref).then(() => {
                    toast(globalize.translate('CopyStreamURLSuccess'));
                }).catch(() => {
                    prompt(globalize.translate('CopyStreamURL'), downloadHref);
                });
                getResolveFunction(resolve, id)();
                break;
            }
            case 'editsubtitles':
                import('./subtitleeditor/subtitleeditor').then(({ default: subtitleEditor }) => {
                    subtitleEditor.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'editlyrics':
                import('./lyricseditor/lyricseditor').then(({ default: lyricseditor }) => {
                    lyricseditor.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'edit':
                editItem(apiClient, item).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                break;
            case 'editplaylist':
                import('./playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
                    const playlistEditor = new PlaylistEditor();
                    playlistEditor.show({
                        id: itemId,
                        serverId
                    }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'editimages':
                import('./imageeditor/imageeditor').then((imageEditor) => {
                    imageEditor.show({
                        itemId: itemId,
                        serverId: serverId
                    }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'identify':
                import('./itemidentifier/itemidentifier').then((itemIdentifier) => {
                    itemIdentifier.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'moremediainfo':
                import('./itemMediaInfo/itemMediaInfo').then((itemMediaInfo) => {
                    itemMediaInfo.show(itemId, serverId).then(getResolveFunction(resolve, id), getResolveFunction(resolve, id));
                });
                break;
            case 'multiSelect':
                import('./multiSelect/multiSelect').then(({ startMultiSelect }) => {
                    const card = dom.parentWithClass(options.positionTo, 'card');
                    startMultiSelect(card);
                });
                break;
            case 'refresh':
                refresh(apiClient, item);
                getResolveFunction(resolve, id)();
                break;
            case 'open':
                appRouter.showItem(item);
                getResolveFunction(resolve, id)();
                break;
            case 'play':
                play(item, false);
                getResolveFunction(resolve, id)();
                break;
            case 'resume':
                play(item, true);
                getResolveFunction(resolve, id)();
                break;
            case 'queue':
                play(item, false, true);
                getResolveFunction(resolve, id)();
                break;
            case 'queuenext':
                play(item, false, true, true);
                getResolveFunction(resolve, id)();
                break;
            case 'stopPlayback':
                playbackManager.stop();
                break;
            case 'clearQueue':
                playbackManager.clearQueue();
                break;
            case 'record':
                import('./recordingcreator/recordingcreator').then(({ default: recordingCreator }) => {
                    recordingCreator.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                });
                break;
            case 'shuffle':
                playbackManager.shuffle(item);
                getResolveFunction(resolve, id)();
                break;
            case 'instantmix':
                playbackManager.instantMix(item);
                getResolveFunction(resolve, id)();
                break;
            case 'delete':
                deleteItem(apiClient, item).then(getResolveFunction(resolve, id, true, true, itemId), getResolveFunction(resolve, id));
                break;
            case 'share':
                navigator.share({
                    title: item.Name,
                    text: item.Overview,
                    url: `${apiClient.serverAddress()}/web/${appRouter.getRouteUrl(item)}`
                });
                break;
            case 'album':
                appRouter.showItem(item.AlbumId, item.ServerId);
                getResolveFunction(resolve, id)();
                break;
            case 'artist':
                appRouter.showItem(item.AlbumArtists[0].Id, item.ServerId);
                getResolveFunction(resolve, id)();
                break;
            case 'lyrics': {
                if (options.isMobile) {
                    appRouter.show('lyrics');
                } else {
                    appRouter.showItem(item.Id, item.ServerId);
                }
                getResolveFunction(resolve, id)();
                break;
            }
            case 'playallfromhere':
                getResolveFunction(resolve, id)();
                break;
            case 'queueallfromhere':
                getResolveFunction(resolve, id)();
                break;
            case 'removefromplaylist':
                apiClient.ajax({
                    url: apiClient.getUrl('Playlists/' + options.playlistId + '/Items', {
                        EntryIds: [item.PlaylistItemId].join(',')
                    }),
                    type: 'DELETE'
                }).then(function () {
                    getResolveFunction(resolve, id, true)();
                });
                break;
            case 'movetotop':
                apiClient.ajax({
                    url: apiClient.getUrl('Playlists/' + options.playlistId + '/Items/' + item.PlaylistItemId + '/Move/0'),
                    type: 'POST'
                }).then(function () {
                    getResolveFunction(resolve, id, true)();
                });
                break;
            case 'movetobottom':
                apiClient.ajax({
                    url: apiClient.getUrl('Playlists/' + options.playlistId + '/Items/' + item.PlaylistItemId + '/Move/' + (item.PlaylistItemCount - 1)),
                    type: 'POST'
                }).then(function () {
                    getResolveFunction(resolve, id, true)();
                });
                break;
            case 'removefromcollection':
                apiClient.ajax({
                    type: 'DELETE',
                    url: apiClient.getUrl('Collections/' + options.collectionId + '/Items', {

                        Ids: [item.Id].join(',')
                    })
                }).then(function () {
                    getResolveFunction(resolve, id, true)();
                });
                break;
            case 'canceltimer':
                deleteTimer(apiClient, item, resolve, id);
                break;
            case 'cancelseriestimer':
                deleteSeriesTimer(apiClient, item, resolve, id);
                break;
            default:
                reject(new Error('ExecuteCommandError'));
                break;
        }
    });
}

function deleteTimer(apiClient, item, resolve, command) {
    import('./recordingcreator/recordinghelper').then(({ default: recordingHelper }) => {
        const timerId = item.TimerId || item.Id;
        recordingHelper.cancelTimerWithConfirmation(timerId, item.ServerId).then(function () {
            getResolveFunction(resolve, command, true)();
        });
    });
}

function deleteSeriesTimer(apiClient, item, resolve, command) {
    import('./recordingcreator/recordinghelper').then(({ default: recordingHelper }) => {
        recordingHelper.cancelSeriesTimerWithConfirmation(item.Id, item.ServerId).then(function () {
            getResolveFunction(resolve, command, true)();
        });
    });
}

function play(item, resume, queue, queueNext) {
    let method = 'play';
    if (queue) {
        if (queueNext) {
            method = 'queueNext';
        } else {
            method = 'queue';
        }
    }

    let startPosition = 0;
    if (resume && item.UserData?.PlaybackPositionTicks) {
        startPosition = item.UserData.PlaybackPositionTicks;
    }

    if (item.Type === 'Program') {
        playbackManager[method]({
            ids: [item.ChannelId],
            startPositionTicks: startPosition,
            serverId: item.ServerId
        });
    } else {
        const sortParentId = 'items-' + (item.IsFolder ? item.Id : item.ParentId) + '-Folder';
        const sortValues = userSettings.getSortValuesLegacy(sortParentId);

        playbackManager[method]({
            items: [item],
            startPositionTicks: startPosition,
            queryOptions: {
                SortBy: sortValues.sortBy,
                SortOrder: sortValues.sortOrder
            }
        });
    }
}

function editItem(apiClient, item) {
    return new Promise(function (resolve, reject) {
        const serverId = apiClient.serverInfo().Id;

        if (item.Type === 'Timer') {
            import('./recordingcreator/recordingeditor').then(({ default: recordingEditor }) => {
                recordingEditor.show(item.Id, serverId).then(resolve, reject);
            });
        } else if (item.Type === 'SeriesTimer') {
            import('./recordingcreator/seriesrecordingeditor').then(({ default: recordingEditor }) => {
                recordingEditor.show(item.Id, serverId).then(resolve, reject);
            });
        } else {
            import('./metadataEditor/metadataEditor').then(({ default: metadataEditor }) => {
                metadataEditor.show(item.Id, serverId).then(resolve, reject);
            });
        }
    });
}

function deleteItem(apiClient, item) {
    return new Promise(function (resolve, reject) {
        import('../scripts/deleteHelper').then((deleteHelper) => {
            deleteHelper.deleteItem({
                item: item,
                navigate: false
            }).then(function () {
                resolve(true);
            }, reject);
        });
    });
}

function refresh(apiClient, item) {
    import('./refreshdialog/refreshdialog').then(({ default: RefreshDialog }) => {
        new RefreshDialog({
            itemIds: [item.Id],
            serverId: apiClient.serverInfo().Id,
            mode: item.Type === 'CollectionFolder' ? 'scan' : null
        }).show();
    });
}

export async function show(options) {
    const commands = await getCommands(options);
    if (!commands.length) {
        throw new Error('No item commands present');
    }

    const id = await actionsheet.show({
        items: commands,
        positionTo: options.positionTo,
        resolveOnClick: ['share']
    });

    return executeCommand(options.item, id, options);
}

export default {
    getCommands,
    show
};
