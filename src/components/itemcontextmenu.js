define(["apphost", "globalize", "connectionManager", "itemHelper", "appRouter", "playbackManager", "loading", "appSettings", "browser", "actionsheet"], function (appHost, globalize, connectionManager, itemHelper, appRouter, playbackManager, loading, appSettings, browser, actionsheet) {
    "use strict";

    function getCommands(options) {
        var item = options.item;
        var user = options.user;

        var canPlay = playbackManager.canPlay(item);
        var restrictOptions = (browser.operaTv || browser.web0s) && !user.Policy.IsAdministrator;

        var commands = [];

        if (canPlay && item.MediaType !== "Photo") {
            if (options.play !== false) {
                commands.push({
                    name: globalize.translate("Play"),
                    id: "resume",
                    icon: "&#xE037;"
                });
            }

            if (options.playAllFromHere && item.Type !== "Program" && item.Type !== "TvChannel") {
                commands.push({
                    name: globalize.translate("PlayAllFromHere"),
                    id: "playallfromhere",
                    icon: "&#xE037;"
                });
            }
        }

        if (playbackManager.canQueue(item)) {
            if (options.queue !== false) {
                commands.push({
                    name: globalize.translate("AddToPlayQueue"),
                    id: "queue",
                    icon: "playlist_add"
                });
            }

            if (options.queue !== false) {
                commands.push({
                    name: globalize.translate("PlayNext"),
                    id: "queuenext",
                    icon: "playlist_add"
                });
            }

            //if (options.queueAllFromHere) {
            //    commands.push({
            //        name: globalize.translate("QueueAllFromHere"),
            //        id: "queueallfromhere"
            //    });
            //}
        }

        if (item.IsFolder || item.Type === "MusicArtist" || item.Type === "MusicGenre") {
            if (item.CollectionType !== "livetv") {
                if (options.shuffle !== false) {
                    commands.push({
                        name: globalize.translate("Shuffle"),
                        id: "shuffle",
                        icon: "shuffle"
                    });
                }
            }
        }

        if (item.MediaType === "Audio" || item.Type === "MusicAlbum" || item.Type === "MusicArtist" || item.Type === "MusicGenre") {
            if (options.instantMix !== false && !itemHelper.isLocalItem(item)) {
                commands.push({
                    name: globalize.translate("InstantMix"),
                    id: "instantmix",
                    icon: "explore"
                });
            }
        }

        if (commands.length) {
            commands.push({
                divider: true
            });
        }

        if (!restrictOptions) {
            if (itemHelper.supportsAddingToCollection(item)) {
                commands.push({
                    name: globalize.translate("AddToCollection"),
                    id: "addtocollection",
                    icon: "playlist_add"
                });
            }

            if (itemHelper.supportsAddingToPlaylist(item)) {
                commands.push({
                    name: globalize.translate("AddToPlaylist"),
                    id: "addtoplaylist",
                    icon: "playlist_add"
                });
            }
        }

        if ((item.Type === "Timer") && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
            commands.push({
                name: globalize.translate("CancelRecording"),
                id: "canceltimer",
                icon: "cancel"
            });
        }

        if ((item.Type === "Recording" && item.Status === "InProgress") && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
            commands.push({
                name: globalize.translate("CancelRecording"),
                id: "canceltimer",
                icon: "cancel"
            });
        }

        if ((item.Type === "SeriesTimer") && user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
            commands.push({
                name: globalize.translate("CancelSeries"),
                id: "cancelseriestimer",
                icon: "cancel"
            });
        }

        if (item.CanDelete && options.deleteItem !== false) {

            if (item.Type === "Playlist" || item.Type === "BoxSet") {
                commands.push({
                    name: globalize.translate("Delete"),
                    id: "delete",
                    icon: "delete"
                });
            } else {
                commands.push({
                    name: globalize.translate("DeleteMedia"),
                    id: "delete",
                    icon: "delete"
                });
            }
        }

        // Books are promoted to major download Button and therefor excluded in the context menu
        if ((item.CanDownload && appHost.supports("filedownload")) && item.Type !== "Book") {
            commands.push({
                name: globalize.translate("Download"),
                id: "download",
                icon: "file_download"
            });

            commands.push({
                name: globalize.translate("CopyStreamURL"),
                id: "copy-stream",
                icon: "content_copy"
            });
        }

        if (commands.length) {
            commands.push({
                divider: true
            });
        }

        var canEdit = itemHelper.canEdit(user, item);
        if (canEdit) {
            if (options.edit !== false && item.Type !== "SeriesTimer") {
                var text = (item.Type === "Timer" || item.Type === "SeriesTimer") ? globalize.translate("Edit") : globalize.translate("EditMetadata");
                commands.push({
                    name: text,
                    id: "edit",
                    icon: "edit"
                });
            }
        }

        if (itemHelper.canEditImages(user, item)) {
            if (options.editImages !== false) {
                commands.push({
                    name: globalize.translate("EditImages"),
                    id: "editimages",
                    icon: "image"
                });
            }
        }

        if (canEdit) {
            if (item.MediaType === "Video" && item.Type !== "TvChannel" && item.Type !== "Program" && item.LocationType !== "Virtual" && !(item.Type === "Recording" && item.Status !== "Completed")) {
                if (options.editSubtitles !== false) {
                    commands.push({
                        name: globalize.translate("EditSubtitles"),
                        id: "editsubtitles",
                        icon: "closed_caption"
                    });
                }
            }
        }

        if (options.identify !== false) {
            if (itemHelper.canIdentify(user, item)) {
                commands.push({
                    name: globalize.translate("Identify"),
                    id: "identify",
                    icon: "edit"
                });
            }
        }

        if (item.MediaSources) {
            if (options.moremediainfo !== false) {
                commands.push({
                    name: globalize.translate("MoreMediaInfo"),
                    id: "moremediainfo",
                    icon: "info"
                });
            }
        }

        if (item.Type === "Program" && options.record !== false) {
            if (item.TimerId) {
                commands.push({
                    name: Globalize.translate("ManageRecording"),
                    id: "record",
                    icon: "fiber_manual_record"
                });
            }
        }

        if (item.Type === "Program" && options.record !== false) {
            if (!item.TimerId) {
                commands.push({
                    name: Globalize.translate("Record"),
                    id: "record",
                    icon: "fiber_manual_record"
                });
            }
        }

        if (itemHelper.canRefreshMetadata(item, user)) {
            commands.push({
                name: globalize.translate("RefreshMetadata"),
                id: "refresh",
                icon: "refresh"
            });
        }

        if (item.PlaylistItemId && options.playlistId) {
            commands.push({
                name: globalize.translate("RemoveFromPlaylist"),
                id: "removefromplaylist",
                icon: "remove"
            });
        }

        if (options.collectionId) {
            commands.push({
                name: globalize.translate("RemoveFromCollection"),
                id: "removefromcollection",
                icon: "remove"
            });
        }

        if (!restrictOptions) {
            if (options.share === true) {
                if (itemHelper.canShare(item, user)) {
                    commands.push({
                        name: globalize.translate("Share"),
                        id: "share",
                        icon: "share"
                    });
                }
            }
        }

        if (options.sync !== false) {
            if (itemHelper.canSync(user, item)) {
                commands.push({
                    name: globalize.translate("Sync"),
                    id: "sync",
                    icon: "sync"
                });
            }
        }

        if (options.openAlbum !== false && item.AlbumId && item.MediaType !== "Photo") {
            commands.push({
                name: Globalize.translate("ViewAlbum"),
                id: "album",
                icon: "album"
            });
        }

        if (options.openArtist !== false && item.ArtistItems && item.ArtistItems.length) {
            commands.push({
                name: Globalize.translate("ViewArtist"),
                id: "artist",
                icon: "person"
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
        var itemId = item.Id;
        var serverId = item.ServerId;
        var apiClient = connectionManager.getApiClient(serverId);

        return new Promise(function (resolve, reject) {
            switch (id) {
                case "addtocollection":
                    require(["collectionEditor"], function (collectionEditor) {
                        new collectionEditor().show({
                            items: [itemId],
                            serverId: serverId
                        }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "addtoplaylist":
                    require(["playlistEditor"], function (playlistEditor) {
                        new playlistEditor().show({
                            items: [itemId],
                            serverId: serverId
                        }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "download":
                    require(["fileDownloader"], function (fileDownloader) {
                        var downloadHref = apiClient.getItemDownloadUrl(itemId);
                        fileDownloader.download([{
                            url: downloadHref,
                            itemId: itemId,
                            serverId: serverId
                        }]);
                        getResolveFunction(getResolveFunction(resolve, id), id)();
                    });
                    break;
                case "copy-stream":
                    var downloadHref = apiClient.getItemDownloadUrl(itemId);
                    var textAreaCopy = function () {
                        var textArea = document.createElement("textarea");
                        textArea.value = downloadHref;
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        if (document.execCommand("copy")) {
                            require(["toast"], function (toast) {
                                toast(globalize.translate("CopyStreamURLSuccess"));
                            });
                        } else {
                            prompt(globalize.translate("CopyStreamURL"), downloadHref);
                        }
                        document.body.removeChild(textArea);
                    };
                    if (navigator.clipboard === undefined) {
                        textAreaCopy();
                    } else {
                        navigator.clipboard.writeText(downloadHref).then(function () {
                            require(["toast"], function (toast) {
                                toast(globalize.translate("CopyStreamURLSuccess"));
                            });
                        }, textAreaCopy);
                    }
                    getResolveFunction(resolve, id)();
                    break;
                case "editsubtitles":
                    require(["subtitleEditor"], function (subtitleEditor) {
                        subtitleEditor.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "edit":
                    editItem(apiClient, item).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    break;
                case "editimages":
                    require(["imageEditor"], function (imageEditor) {
                        imageEditor.show({
                            itemId: itemId,
                            serverId: serverId
                        }).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "identify":
                    require(["itemIdentifier"], function (itemIdentifier) {
                        itemIdentifier.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "moremediainfo":
                    require(["itemMediaInfo"], function (itemMediaInfo) {
                        itemMediaInfo.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "refresh":
                    refresh(apiClient, item);
                    getResolveFunction(resolve, id)();
                    break;
                case "open":
                    appRouter.showItem(item);
                    getResolveFunction(resolve, id)();
                    break;
                case "play":
                    play(item, false);
                    getResolveFunction(resolve, id)();
                    break;
                case "resume":
                    play(item, true);
                    getResolveFunction(resolve, id)();
                    break;
                case "queue":
                    play(item, false, true);
                    getResolveFunction(resolve, id)();
                    break;
                case "queuenext":
                    play(item, false, true, true);
                    getResolveFunction(resolve, id)();
                    break;
                case "record":
                    require(["recordingCreator"], function (recordingCreator) {
                        recordingCreator.show(itemId, serverId).then(getResolveFunction(resolve, id, true), getResolveFunction(resolve, id));
                    });
                    break;
                case "shuffle":
                    playbackManager.shuffle(item);
                    getResolveFunction(resolve, id)();
                    break;
                case "instantmix":
                    playbackManager.instantMix(item);
                    getResolveFunction(resolve, id)();
                    break;
                case "delete":
                    deleteItem(apiClient, item).then(getResolveFunction(resolve, id, true, true), getResolveFunction(resolve, id));
                    break;
                case "share":
                    navigator.share({
                        title: item.Name,
                        text: item.Overview,
                        url: "https://github.com/jellyfin/jellyfin"
                    });
                    break;
                case "album":
                    appRouter.showItem(item.AlbumId, item.ServerId);
                    getResolveFunction(resolve, id)();
                    break;
                case "artist":
                    appRouter.showItem(item.ArtistItems[0].Id, item.ServerId);
                    getResolveFunction(resolve, id)();
                    break;
                case "playallfromhere":
                    getResolveFunction(resolve, id)();
                    break;
                case "queueallfromhere":
                    getResolveFunction(resolve, id)();
                    break;
                case "removefromplaylist":
                    apiClient.ajax({
                        url: apiClient.getUrl("Playlists/" + options.playlistId + "/Items", {
                            EntryIds: [item.PlaylistItemId].join(",")
                        }),
                        type: "DELETE"
                    }).then(function () {
                        getResolveFunction(resolve, id, true)();
                    });
                    break;
                case "removefromcollection":
                    apiClient.ajax({
                        type: "DELETE",
                        url: apiClient.getUrl("Collections/" + options.collectionId + "/Items", {

                            Ids: [item.Id].join(",")
                        })
                    }).then(function () {
                        getResolveFunction(resolve, id, true)();
                    });
                    break;
                case "canceltimer":
                    deleteTimer(apiClient, item, resolve, id);
                    break;
                case "cancelseriestimer":
                    deleteSeriesTimer(apiClient, item, resolve, id);
                    break;
                default:
                    reject();
                    break;
            }
        });
    }

    function deleteTimer(apiClient, item, resolve, command) {
        require(["recordingHelper"], function (recordingHelper) {
            var timerId = item.TimerId || item.Id;
            recordingHelper.cancelTimerWithConfirmation(timerId, item.ServerId).then(function () {
                getResolveFunction(resolve, command, true)();
            });
        });
    }

    function deleteSeriesTimer(apiClient, item, resolve, command) {
        require(["recordingHelper"], function (recordingHelper) {
            recordingHelper.cancelSeriesTimerWithConfirmation(item.Id, item.ServerId).then(function () {
                getResolveFunction(resolve, command, true)();
            });
        });
    }

    function play(item, resume, queue, queueNext) {
        var method = queue ? (queueNext ? "queueNext" : "queue") : "play";

        var startPosition = 0;
        if (resume && item.UserData && item.UserData.PlaybackPositionTicks) {
            startPosition = item.UserData.PlaybackPositionTicks;
        }

        if (item.Type === "Program") {
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
            var serverId = apiClient.serverInfo().Id;

            if (item.Type === "Timer") {
                require(["recordingEditor"], function (recordingEditor) {
                    recordingEditor.show(item.Id, serverId).then(resolve, reject);
                });
            } else if (item.Type === "SeriesTimer") {
                require(["seriesRecordingEditor"], function (recordingEditor) {
                    recordingEditor.show(item.Id, serverId).then(resolve, reject);
                });
            } else {
                require(["metadataEditor"], function (metadataEditor) {
                    metadataEditor.show(item.Id, serverId).then(resolve, reject);
                });
            }
        });
    }

    function deleteItem(apiClient, item) {
        return new Promise(function (resolve, reject) {
            require(["deleteHelper"], function (deleteHelper) {
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
        require(["refreshDialog"], function (refreshDialog) {
            new refreshDialog({
                itemIds: [item.Id],
                serverId: apiClient.serverInfo().Id,
                mode: item.Type === "CollectionFolder" ? "scan" : null
            }).show();
        });
    }

    function show(options) {
        var commands = getCommands(options);
        if (!commands.length) {
            return Promise.reject();
        }

        return actionsheet.show({
            items: commands,
            positionTo: options.positionTo,
            resolveOnClick: ["share"]
        }).then(function (id) {
            return executeCommand(options.item, id, options);
        });
    }

    return {
        getCommands: getCommands,
        show: show
    };
});
