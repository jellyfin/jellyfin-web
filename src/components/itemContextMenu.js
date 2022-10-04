import browser from '../scripts/browser';
import { copy } from '../scripts/clipboard';
import globalize from '../scripts/globalize';
import actionsheet from './actionSheet/actionSheet';
import { appHost } from './apphost';
import { appRouter } from './appRouter';
import itemHelper from './itemHelper';
import { playbackManager } from './playback/playbackmanager';
import ServerConnections from './ServerConnections';
import toast from './toast/toast';

/* eslint-disable indent */
    export function getCommands(options) {
        const item = options.item;
        const user = options.user;

        const canPlay = playbackManager.canPlay(item);
        const restrictOptions = (browser.operaTv || browser.web0s) && !user.Policy.IsAdministrator;

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

        if (!restrictOptions) {
            if (itemHelper.supportsAddingToCollection(item)) {
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

        if (item.CanDelete && options.deleteItem !== false) {
            if (item.Type === 'Playlist' || item.Type === 'BoxSet') {
                commands.push({
                    name: globalize.translate('Delete'),
                    id: 'delete',
                    icon: 'delete'
                });
            } else {
                commands.push({
                    name: globalize.translate('DeleteMedia'),
                    id: 'delete',
                    icon: 'delete'
                });
            }
        }

        // Books are promoted to major download Button and therefor excluded in the context menu
        if ((item.CanDownload && appHost.supports('filedownload')) && item.Type !== 'Book') {
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

        if (commands.length) {
            commands.push({
                divider: true
            });
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

        if (canEdit && item.MediaType === 'Video' && item.Type !== 'TvChannel' && item.Type !== 'Program'
            && item.LocationType !== 'Virtual'
            && !(item.Type === 'Recording' && item.Status !== 'Completed')
            && options.editSubtitles !== false
        ) {
            commands.push({
                name: globalize.translate('EditSubtitles'),
                id: 'editsubtitles',
                icon: 'closed_caption'
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

        if (item.PlaylistItemId && options.playlistId) {
            commands.push({
                name: globalize.translate('RemoveFromPlaylist'),
                id: 'removefromplaylist',
                icon: 'remove'
            });
        }

        if (options.collectionId) {
            commands.push({
                name: globalize.translate('RemoveFromCollection'),
                id: 'removefromcollection',
                icon: 'remove'
            });
        }

        if (!restrictOptions && options.share === true && itemHelper.canShare(item, user)) {
            commands.push({
                name: globalize.translate('Share'),
                id: 'share',
                icon: 'share'
            });
        }

        if (options.sync !== false && itemHelper.canSync(user, item)) {
            commands.push({
                name: globalize.translate('Sync'),
                id: 'sync',
                icon: 'sync'
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
        if (options.openArtist !== false && item.AlbumArtists && item.AlbumArtists.length) {
            commands.push({
                name: globalize.translate('ViewAlbumArtist'),
                id: 'artist',
                icon: 'person'
            });
        }

        return commands;
    }

    function getResolveFunction(resolve, id, changed, deleted) {
        return function () {
            resolve({
                command: id,
                updated: changed,
                deleted: deleted
            });
        };
    }

    function executeCommand(item, id, options) {
        const itemId = item.Id;
        const serverId = item.ServerId;
        const apiClient = ServerConnections.getApiClient(serverId);

        return new Promise(function (resolve, reject) {
            switch (id) {
                case 'addtocollection':
                    import('./collectionEditor/collectionEditor').then(({default: collectionEditor}) => {
                        new collectionEditor({
                            items: [itemId],
                            serverId: serverId
                        }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case 'addtoplaylist':
                    import('./playlisteditor/playlisteditor').then(({default: playlistEditor}) => {
                        new playlistEditor({
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
                            itemId: itemId,
                            serverId: serverId,
                            title: item.Name,
                            filename: item.Path.replace(/^.*[\\/]/, '')
                        }]);
                        getResolveFunction(getResolveFunction(resolve, id), id)();
                    });
                    break;
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
                    import('./subtitleeditor/subtitleeditor').then(({default: subtitleEditor}) => {
                        subtitleEditor.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case 'edit':
                    editItem(apiClient, item).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
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
                    import('./recordingcreator/recordingcreator').then(({default: recordingCreator}) => {
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
                    deleteItem(apiClient, item).then(getResolveFunction(resolve, id, true, true), getResolveFunction(resolve, id));
                    break;
                case 'share':
                    navigator.share({
                        title: item.Name,
                        text: item.Overview,
                        url: `${apiClient.serverAddress()}/web/index.html${appRouter.getRouteUrl(item)}`
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
                    reject();
                    break;
            }
        });
    }

    function deleteTimer(apiClient, item, resolve, command) {
        import('./recordingcreator/recordinghelper').then(({default: recordingHelper}) => {
            const timerId = item.TimerId || item.Id;
            recordingHelper.cancelTimerWithConfirmation(timerId, item.ServerId).then(function () {
                getResolveFunction(resolve, command, true)();
            });
        });
    }

    function deleteSeriesTimer(apiClient, item, resolve, command) {
        import('./recordingcreator/recordinghelper').then(({default: recordingHelper}) => {
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
        if (resume && item.UserData && item.UserData.PlaybackPositionTicks) {
            startPosition = item.UserData.PlaybackPositionTicks;
        }

        if (item.Type === 'Program') {
            playbackManager[method]({
                ids: [item.ChannelId],
                startPositionTicks: startPosition,
                serverId: item.ServerId
            });
        } else {
            playbackManager[method]({
                items: [item],
                startPositionTicks: startPosition
            });
        }
    }

    function editItem(apiClient, item) {
        return new Promise(function (resolve, reject) {
            const serverId = apiClient.serverInfo().Id;

            if (item.Type === 'Timer') {
                import('./recordingcreator/recordingeditor').then(({default: recordingEditor}) => {
                    recordingEditor.show(item.Id, serverId).then(resolve, reject);
                });
            } else if (item.Type === 'SeriesTimer') {
                import('./recordingcreator/seriesrecordingeditor').then(({default: recordingEditor}) => {
                    recordingEditor.show(item.Id, serverId).then(resolve, reject);
                });
            } else {
                import('./metadataEditor/metadataEditor').then(({default: metadataEditor}) => {
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
        import('./refreshdialog/refreshdialog').then(({default: refreshDialog}) => {
            new refreshDialog({
                itemIds: [item.Id],
                serverId: apiClient.serverInfo().Id,
                mode: item.Type === 'CollectionFolder' ? 'scan' : null
            }).show();
        });
    }

    export function show(options) {
        const commands = getCommands(options);
        if (!commands.length) {
            return Promise.reject();
        }

        return actionsheet.show({
            items: commands,
            positionTo: options.positionTo,
            resolveOnClick: ['share']
        }).then(function (id) {
            return executeCommand(options.item, id, options);
        });
    }

/* eslint-enable indent */

export default {
    getCommands: getCommands,
    show: show
};
