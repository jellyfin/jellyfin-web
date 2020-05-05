define(["localassetmanager"], function(localassetmanager) {
    "use strict";

    function processDownloadStatus(apiClient, serverInfo, options) {
        return console.debug("mediasync: begin processDownloadStatus"), localassetmanager.resyncTransfers().then(function() {
            return localassetmanager.getServerItems(serverInfo.Id).then(function(items) {
                console.debug("mediasync: begin processDownloadStatus getServerItems completed");
                var p = Promise.resolve(),
                    cnt = 0;
                return items.filter(function(item) {
                    return "transferring" === item.SyncStatus || "queued" === item.SyncStatus
                }).forEach(function(item) {
                    p = p.then(function() {
                        return reportTransfer(apiClient, item)
                    }), cnt++
                }), p.then(function() {
                    console.debug("mediasync: exit processDownloadStatus");
                    console.debug("items reported: " + cnt.toString());
                    return Promise.resolve();
                })
            })
        })
    }

    function reportTransfer(apiClient, item) {
        return localassetmanager.getItemFileSize(item.LocalPath).then(function(size) {
            return size > 0 ? apiClient.reportSyncJobItemTransferred(item.SyncJobItemId).then(function() {
                return item.SyncStatus = "synced", console.debug("mediasync: reportSyncJobItemTransferred called for " + item.LocalPath), localassetmanager.addOrUpdateLocalItem(item)
            }, function(error) {
                return console.error("mediasync: mediasync error on reportSyncJobItemTransferred", error), item.SyncStatus = "error", localassetmanager.addOrUpdateLocalItem(item)
            }) : localassetmanager.isDownloadFileInQueue(item.LocalPath).then(function(result) {
                return result ? Promise.resolve() : (console.debug("mediasync: reportTransfer: Size is 0 and download no longer in queue. Deleting item."), localassetmanager.removeLocalItem(item).then(function() {
                    return console.debug("mediasync: reportTransfer: Item deleted."), Promise.resolve()
                }, function(err2) {
                    return console.debug("mediasync: reportTransfer: Failed to delete item.", err2), Promise.resolve()
                }))
            })
        }, function(error) {
            return console.error("mediasync: reportTransfer: error on getItemFileSize. Deleting item.", error), localassetmanager.removeLocalItem(item).then(function() {
                return console.debug("mediasync: reportTransfer: Item deleted."), Promise.resolve()
            }, function(err2) {
                return console.error("mediasync: reportTransfer: Failed to delete item.", err2), Promise.resolve()
            })
        })
    }

    function reportOfflineActions(apiClient, serverInfo) {
        return console.debug("mediasync: begin reportOfflineActions"), localassetmanager.getUserActions(serverInfo.Id).then(function(actions) {
            return actions.length ? apiClient.reportOfflineActions(actions).then(function() {
                return localassetmanager.deleteUserActions(actions).then(function() {
                    return console.debug("mediasync: exit reportOfflineActions (actions reported and deleted.)"), Promise.resolve()
                })
            }, function(err) {
                return console.error("mediasync: error on apiClient.reportOfflineActions: " + err.toString()), localassetmanager.deleteUserActions(actions)
            }) : (console.debug("mediasync: exit reportOfflineActions (no actions)"), Promise.resolve())
        })
    }

    function syncData(apiClient, serverInfo) {
        return console.debug("mediasync: begin syncData"), localassetmanager.getServerItems(serverInfo.Id).then(function(items) {
            var completedItems = items.filter(function(item) {
                    return item && ("synced" === item.SyncStatus || "error" === item.SyncStatus)
                }),
                request = {
                    TargetId: apiClient.deviceId(),
                    LocalItemIds: completedItems.map(function(xitem) {
                        return xitem.ItemId
                    })
                };
            return apiClient.syncData(request).then(function(result) {
                return afterSyncData(apiClient, serverInfo, result).then(function() {
                    return console.debug("mediasync: exit syncData"), Promise.resolve()
                }, function(err) {
                    return console.error("mediasync: error in syncData: " + err.toString()), Promise.resolve()
                })
            })
        })
    }

    function afterSyncData(apiClient, serverInfo, syncDataResult) {
        console.debug("mediasync: begin afterSyncData");
        var p = Promise.resolve();
        return syncDataResult.ItemIdsToRemove && syncDataResult.ItemIdsToRemove.length > 0 && syncDataResult.ItemIdsToRemove.forEach(function(itemId) {
            p = p.then(function() {
                return removeLocalItem(itemId, serverInfo.Id)
            })
        }), p = p.then(function() {
            return removeObsoleteContainerItems(serverInfo.Id)
        }), p.then(function() {
            return console.debug("mediasync: exit afterSyncData"), Promise.resolve()
        })
    }

    function removeObsoleteContainerItems(serverId) {
        return console.debug("mediasync: begin removeObsoleteContainerItems"), localassetmanager.removeObsoleteContainerItems(serverId)
    }

    function removeLocalItem(itemId, serverId) {
        return console.debug("mediasync: begin removeLocalItem"), localassetmanager.getLocalItem(serverId, itemId).then(function(item) {
            return item ? localassetmanager.removeLocalItem(item) : Promise.resolve()
        }, function(err2) {
            return console.error("mediasync: removeLocalItem: Failed: ", err2), Promise.resolve()
        })
    }

    function getNewMedia(apiClient, downloadCount) {
        return console.debug("mediasync: begin getNewMedia"), apiClient.getReadySyncItems(apiClient.deviceId()).then(function(jobItems) {
            console.debug("mediasync: getReadySyncItems returned " + jobItems.length + " items");
            var p = Promise.resolve(),
                currentCount = downloadCount;
            return jobItems.forEach(function(jobItem) {
                currentCount++ <= 10 && (p = p.then(function() {
                    return getNewItem(jobItem, apiClient)
                }))
            }), p.then(function() {
                return console.debug("mediasync: exit getNewMedia"), Promise.resolve()
            })
        }, function(err) {
            return console.error("mediasync: getReadySyncItems: Failed: ", err), Promise.resolve()
        })
    }

    function afterMediaDownloaded(apiClient, jobItem, localItem) {
        return console.debug("mediasync: begin afterMediaDownloaded"), getImages(apiClient, jobItem, localItem).then(function() {
            var libraryItem = jobItem.Item;
            return downloadParentItems(apiClient, jobItem, libraryItem).then(function() {
                return getSubtitles(apiClient, jobItem, localItem)
            })
        })
    }

    function createLocalItem(libraryItem, jobItem) {
        console.debug("localassetmanager: begin createLocalItem");
        var item = {
            Item: libraryItem,
            ItemId: libraryItem.Id,
            ServerId: libraryItem.ServerId,
            Id: libraryItem.Id
        };
        return jobItem && (item.SyncJobItemId = jobItem.SyncJobItemId), console.debug("localassetmanager: end createLocalItem"), item
    }

    function getNewItem(jobItem, apiClient) {
        console.debug("mediasync: begin getNewItem");
        var libraryItem = jobItem.Item;
        return localassetmanager.getLocalItem(libraryItem.ServerId, libraryItem.Id).then(function(existingItem) {
            if (existingItem && ("queued" === existingItem.SyncStatus || "transferring" === existingItem.SyncStatus || "synced" === existingItem.SyncStatus) && (console.debug("mediasync: getNewItem: getLocalItem found existing item"), localassetmanager.enableBackgroundCompletion())) return Promise.resolve();
            libraryItem.CanDelete = !1, libraryItem.CanDownload = !1, libraryItem.SupportsSync = !1, libraryItem.People = [], libraryItem.Chapters = [], libraryItem.Studios = [], libraryItem.SpecialFeatureCount = null, libraryItem.LocalTrailerCount = null, libraryItem.RemoteTrailers = [];
            var localItem = createLocalItem(libraryItem, jobItem);
            return localItem.SyncStatus = "queued", downloadMedia(apiClient, jobItem, localItem)
        })
    }

    function downloadParentItems(apiClient, jobItem, libraryItem) {
        var p = Promise.resolve();
        return libraryItem.SeriesId && (p = p.then(function() {
            return downloadItem(apiClient, libraryItem.SeriesId)
        })), libraryItem.SeasonId && (p = p.then(function() {
            return downloadItem(apiClient, libraryItem.SeasonId).then(function(seasonItem) {
                return libraryItem.SeasonPrimaryImageTag = (seasonItem.Item.ImageTags || {}).Primary, Promise.resolve()
            })
        })), libraryItem.AlbumId && (p = p.then(function() {
            return downloadItem(apiClient, libraryItem.AlbumId)
        })), p
    }

    function downloadItem(apiClient, itemId) {
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function(downloadedItem) {
            downloadedItem.CanDelete = !1, downloadedItem.CanDownload = !1, downloadedItem.SupportsSync = !1, downloadedItem.People = [], downloadedItem.SpecialFeatureCount = null, downloadedItem.BackdropImageTags = null, downloadedItem.ParentBackdropImageTags = null, downloadedItem.ParentArtImageTag = null, downloadedItem.ParentLogoImageTag = null;
            var localItem = createLocalItem(downloadedItem, null);
            return localassetmanager.addOrUpdateLocalItem(localItem).then(function() {
                return Promise.resolve(localItem)
            }, function(err) {
                return console.error("mediasync: downloadItem failed: " + err.toString()), Promise.resolve(null)
            })
        })
    }

    function ensureLocalPathParts(localItem, jobItem) {
        if (!localItem.LocalPathParts) {
            var libraryItem = localItem.Item,
                parts = localassetmanager.getDirectoryPath(libraryItem);
            parts.push(localassetmanager.getLocalFileName(libraryItem, jobItem.OriginalFileName)), localItem.LocalPathParts = parts
        }
    }

    function downloadMedia(apiClient, jobItem, localItem) {
        console.debug("mediasync: downloadMedia: start.");
        var url = apiClient.getUrl("Sync/JobItems/" + jobItem.SyncJobItemId + "/File", {
            api_key: apiClient.accessToken()
        });
        return ensureLocalPathParts(localItem, jobItem), localassetmanager.downloadFile(url, localItem).then(function(result) {
            console.debug("mediasync: downloadMedia-downloadFile returned path: " + result.path);
            var localPath = result.path,
                libraryItem = localItem.Item;
            if (localPath && libraryItem.MediaSources)
                for (var i = 0; i < libraryItem.MediaSources.length; i++) {
                    var mediaSource = libraryItem.MediaSources[i];
                    mediaSource.Path = localPath, mediaSource.Protocol = "File"
                }
            return localItem.LocalPath = localPath, localItem.SyncStatus = "transferring", localassetmanager.addOrUpdateLocalItem(localItem).then(function() {
                return afterMediaDownloaded(apiClient, jobItem, localItem).then(function() {
                    return result.isComplete ? (localItem.SyncStatus = "synced", reportTransfer(apiClient, localItem)) : Promise.resolve()
                }, function(err) {
                    return console.debug("mediasync: downloadMedia: afterMediaDownloaded failed: " + err), Promise.reject(err)
                })
            }, function(err) {
                return console.debug("mediasync: downloadMedia: addOrUpdateLocalItem failed: " + err), Promise.reject(err)
            })
        }, function(err) {
            return console.debug("mediasync: downloadMedia: localassetmanager.downloadFile failed: " + err), Promise.reject(err)
        })
    }

    function getImages(apiClient, jobItem, localItem) {
        console.debug("mediasync: begin getImages");
        var p = Promise.resolve(),
            libraryItem = localItem.Item,
            serverId = libraryItem.ServerId,
            mainImageTag = (libraryItem.ImageTags || {}).Primary;
        libraryItem.Id && mainImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.Id, mainImageTag, "Primary")
        }));
        var logoImageTag = (libraryItem.ImageTags || {}).Logo;
        libraryItem.Id && logoImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.Id, logoImageTag, "Logo")
        }));
        var artImageTag = (libraryItem.ImageTags || {}).Art;
        libraryItem.Id && artImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.Id, artImageTag, "Art")
        }));
        var bannerImageTag = (libraryItem.ImageTags || {}).Banner;
        libraryItem.Id && bannerImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.Id, bannerImageTag, "Banner")
        }));
        var thumbImageTag = (libraryItem.ImageTags || {}).Thumb;
        if (libraryItem.Id && thumbImageTag && (p = p.then(function() {
                return downloadImage(localItem, apiClient, serverId, libraryItem.Id, thumbImageTag, "Thumb")
            })), libraryItem.Id && libraryItem.BackdropImageTags)
            for (var i = 0; i < libraryItem.BackdropImageTags.length; i++);
        return libraryItem.SeriesId && libraryItem.SeriesPrimaryImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.SeriesId, libraryItem.SeriesPrimaryImageTag, "Primary")
        })), libraryItem.SeriesId && libraryItem.SeriesThumbImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.SeriesId, libraryItem.SeriesThumbImageTag, "Thumb")
        })), libraryItem.SeasonId && libraryItem.SeasonPrimaryImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.SeasonId, libraryItem.SeasonPrimaryImageTag, "Primary")
        })), libraryItem.AlbumId && libraryItem.AlbumPrimaryImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.AlbumId, libraryItem.AlbumPrimaryImageTag, "Primary")
        })), libraryItem.ParentThumbItemId && libraryItem.ParentThumbImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.ParentThumbItemId, libraryItem.ParentThumbImageTag, "Thumb")
        })), libraryItem.ParentPrimaryImageItemId && libraryItem.ParentPrimaryImageTag && (p = p.then(function() {
            return downloadImage(localItem, apiClient, serverId, libraryItem.ParentPrimaryImageItemId, libraryItem.ParentPrimaryImageTag, "Primary")
        })), p.then(function() {
            return console.debug("mediasync: finished getImages"), localassetmanager.addOrUpdateLocalItem(localItem)
        }, function(err) {
            return console.error("mediasync: error getImages: " + err.toString()), Promise.resolve()
        })
    }

    function downloadImage(localItem, apiClient, serverId, itemId, imageTag, imageType, index) {
        return index = index || 0, localassetmanager.hasImage(serverId, itemId, imageType, index).then(function(hasImage) {
            if (hasImage) return console.debug("mediasync: downloadImage - skip existing: " + itemId + " " + imageType + "_" + index.toString()), Promise.resolve();
            var maxWidth = 400;
            "backdrop" === imageType && (maxWidth = null);
            var imageUrl = apiClient.getScaledImageUrl(itemId, {
                tag: imageTag,
                type: imageType,
                maxWidth: maxWidth,
                api_key: apiClient.accessToken()
            });
            return console.debug("mediasync: downloadImage " + itemId + " " + imageType + "_" + index.toString()), localassetmanager.downloadImage(localItem, imageUrl, serverId, itemId, imageType, index).then(function(result) {
                return Promise.resolve(result)
            }, function(err) {
                return console.error("mediasync: error downloadImage: " + err.toString()), Promise.resolve()
            })
        }, function(err) {
            return console.error("mediasync: error downloadImage: " + err.toString()), Promise.resolve()
        })
    }

    function getSubtitles(apiClient, jobItem, localItem) {
        if (console.debug("mediasync: begin getSubtitles"), !jobItem.Item.MediaSources.length) return console.debug("mediasync: cannot download subtitles because video has no media source info."), Promise.resolve();
        var files = jobItem.AdditionalFiles.filter(function(f) {
                return "Subtitles" === f.Type
            }),
            mediaSource = jobItem.Item.MediaSources[0],
            p = Promise.resolve();
        return files.forEach(function(file) {
            p = p.then(function() {
                return getItemSubtitle(file, apiClient, jobItem, localItem, mediaSource)
            })
        }), p.then(function() {
            return console.debug("mediasync: exit getSubtitles"), Promise.resolve()
        })
    }

    function getItemSubtitle(file, apiClient, jobItem, localItem, mediaSource) {
        console.debug("mediasync: begin getItemSubtitle");
        var subtitleStream = mediaSource.MediaStreams.filter(function(m) {
            return "Subtitle" === m.Type && m.Index === file.Index
        })[0];
        if (!subtitleStream) return console.debug("mediasync: cannot download subtitles because matching stream info was not found."), Promise.resolve();
        var url = apiClient.getUrl("Sync/JobItems/" + jobItem.SyncJobItemId + "/AdditionalFiles", {
                Name: file.Name,
                api_key: apiClient.accessToken()
            }),
            fileName = localassetmanager.getSubtitleSaveFileName(localItem, jobItem.OriginalFileName, subtitleStream.Language, subtitleStream.IsForced, subtitleStream.Codec);
        return localassetmanager.downloadSubtitles(url, fileName).then(function(subtitleResult) {
            return localItem.AdditionalFiles && localItem.AdditionalFiles.forEach(function(item) {
                item.Name === file.Name && (item.Path = subtitleResult.path)
            }), subtitleStream.Path = subtitleResult.path, subtitleStream.DeliveryMethod = "External", localassetmanager.addOrUpdateLocalItem(localItem)
        })
    }

    function checkLocalFileExistence(apiClient, serverInfo, options) {
        return options.checkFileExistence ? (console.debug("mediasync: begin checkLocalFileExistence"), localassetmanager.getServerItems(serverInfo.Id).then(function(items) {
            var completedItems = items.filter(function(item) {
                    return item && ("synced" === item.SyncStatus || "error" === item.SyncStatus)
                }),
                p = Promise.resolve();
            return completedItems.forEach(function(completedItem) {
                p = p.then(function() {
                    return localassetmanager.fileExists(completedItem.LocalPath).then(function(exists) {
                        return exists ? Promise.resolve() : localassetmanager.removeLocalItem(completedItem).then(function() {
                            return Promise.resolve()
                        }, function() {
                            return Promise.resolve()
                        })
                    })
                })
            }), p
        })) : Promise.resolve()
    }
    return function() {
        var self = this;
        "string" == typeof webWorkerBaseUrl && -1 !== webWorkerBaseUrl.indexOf("ms-appx://") ? self.sync = function(apiClient, serverInfo, options) {
            return console.debug("mediasync: start sync"), checkLocalFileExistence(apiClient, serverInfo, options).then(function() {
                return processDownloadStatus(apiClient, serverInfo, options).then(function() {
                    return localassetmanager.getDownloadItemCount().then(function(downloadCount) {
                        return !0 === options.syncCheckProgressOnly && downloadCount > 2 ? Promise.resolve() : reportOfflineActions(apiClient, serverInfo).then(function() {
                            return getNewMedia(apiClient, downloadCount).then(function() {
                                return syncData(apiClient, serverInfo).then(function() {
                                    return console.debug("mediasync: Exit sync"), Promise.resolve()
                                })
                            })
                        })
                    })
                })
            }, function(err) {
                console.error(err.toString())
            })
        } : self.sync = function(apiClient, serverInfo, options) {
            return console.debug("mediasync: Start sync"), checkLocalFileExistence(apiClient, serverInfo, options).then(function() {
                return syncData(apiClient, serverInfo).then(function() {
                    return processDownloadStatus(apiClient, serverInfo, options).then(function() {
                        return localassetmanager.getDownloadItemCount().then(function(downloadCount) {
                            return !0 === options.syncCheckProgressOnly && downloadCount > 2 ? Promise.resolve() : reportOfflineActions(apiClient, serverInfo).then(function() {
                                return getNewMedia(apiClient, downloadCount).then(function() {
                                    return syncData(apiClient, serverInfo)
                                })
                            })
                        })
                    })
                })
            }, function(err) {
                console.error(err.toString())
            })
        }
    }
});
