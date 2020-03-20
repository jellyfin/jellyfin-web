(function (globalScope, document) {

    if (!globalScope.Emby) {
        globalScope.Emby = {};
    }

    function normalizeOptions(options) {

        // Just put this on every query
        options.Fields = options.Fields ? (options.Fields + ",PrimaryImageAspectRatio") : "PrimaryImageAspectRatio";
        options.ImageTypeLimit = 1;
    }

    function liveTvRecordings(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                options = options || {};
                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                options.UserId = apiClient.getCurrentUserId();

                apiClient.getLiveTvRecordings(options).then(resolve, reject);
            });
        });
    }

    function item(id) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getItem(apiClient.getCurrentUserId(), id).then(resolve, reject);
            });
        });
    }

    function playlists(options) {

        options = options || {};
        options.parentId = null;
        delete options.parentId;
        options.recursive = true;

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options.IncludeItemTypes = "Playlist";
                normalizeOptions(options);

                apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items', options)).then(resolve, reject);
            });
        });
    }

    function channels() {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getChannels({

                    UserId: apiClient.getCurrentUserId()

                }).then(resolve, reject);
            });
        });
    }

    function latestChannelItems(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                options.UserId = apiClient.getCurrentUserId();
                options.Filters = "IsUnplayed";

                apiClient.getJSON(apiClient.getUrl("Channels/Items/Latest", options)).then(resolve, reject);
            });
        });
    }

    function liveTvRecommendedPrograms(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                options.UserId = apiClient.getCurrentUserId();

                apiClient.getLiveTvRecommendedPrograms(options).then(resolve, reject);
            });
        });
    }

    function items(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};

                normalizeOptions(options);

                apiClient.getItems(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function collections(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                options.ParentId = null;
                options.IncludeItemTypes = "BoxSet";
                options.Recursive = true;

                normalizeOptions(options);

                apiClient.getItems(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function artists(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                normalizeOptions(options);

                apiClient.getArtists(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function logoImageUrl(item, options) {

        options = options || {};
        options.type = "Logo";

        if (item.ImageTags && item.ImageTags.Logo) {

            options.tag = item.ImageTags.Logo;
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.Id, options);
        }

        if (item.ParentLogoImageTag) {
            options.tag = item.ParentLogoImageTag;
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.ParentLogoItemId, options);
        }

        return null;
    }

    function thumbImageUrl(item, options) {

        options = options || {};
        options.type = "Thumb";

        if (item.ImageTags && item.ImageTags.Thumb) {

            options.tag = item.ImageTags.Thumb;
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.Id, options);
        }

        if (item.ParentThumbImageTag) {
            options.tag = item.ParentThumbImageTag;
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options);
        }

        return null;
    }

    function imageUrl(item, options) {

        options = options || {};
        options.type = options.type || "Primary";

        if (typeof (item) === 'string') {
            return getConnectionManager().currentApiClient().getScaledImageUrl(item, options);
        }

        if (item.ImageTags && item.ImageTags[options.type]) {

            options.tag = item.ImageTags[options.type];
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.Id, options);
        }

        if (options.type == 'Primary') {
            if (item.AlbumId && item.AlbumPrimaryImageTag) {

                options.tag = item.AlbumPrimaryImageTag;
                return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
            }

            //else if (item.AlbumId && item.SeriesPrimaryImageTag) {

            //    imgUrl = ApiClient.getScaledImageUrl(item.SeriesId, {
            //        type: "Primary",
            //        width: downloadWidth,
            //        tag: item.SeriesPrimaryImageTag,
            //        minScale: minScale
            //    });

            //}
            //else if (item.ParentPrimaryImageTag) {

            //    imgUrl = ApiClient.getImageUrl(item.ParentPrimaryImageItemId, {
            //        type: "Primary",
            //        width: downloadWidth,
            //        tag: item.ParentPrimaryImageTag,
            //        minScale: minScale
            //    });
            //}
        }

        return null;
    }

    function backdropImageUrl(item, options) {

        options = options || {};
        options.type = options.type || "Backdrop";

        options.width = null;
        delete options.width;
        options.maxWidth = null;
        delete options.maxWidth;
        options.maxHeight = null;
        delete options.maxHeight;
        options.height = null;
        delete options.height;

        // If not resizing, get the original image
        if (!options.maxWidth && !options.width && !options.maxHeight && !options.height) {
            options.quality = 100;
            options.format = 'jpg';
        }

        if (item.BackdropImageTags && item.BackdropImageTags.length) {

            options.tag = item.BackdropImageTags[0];
            return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.Id, options);
        }

        return null;
    }

    var myConnectionManager;
    function getConnectionManager() {
        return myConnectionManager;
    }

    require(['connectionManager'], function (connectionManager) {
        myConnectionManager = connectionManager;
    });

    globalScope.Emby.Models = {
        liveTvRecordings: liveTvRecordings,
        item: item,
        playlists: playlists,
        channels: channels,
        latestChannelItems: latestChannelItems,
        liveTvRecommendedPrograms: liveTvRecommendedPrograms,
        items: items,
        collections: collections,
        artists: artists,
        logoImageUrl: logoImageUrl,
        imageUrl: imageUrl,
        thumbImageUrl: thumbImageUrl,
        backdropImageUrl: backdropImageUrl
    };

})(this, document);
