(function (globalScope, document) {

    if (!globalScope.Emby) {
        globalScope.Emby = {};
    }

    function normalizeOptions(options) {

        // Just put this on every query
        options.Fields = options.Fields ? (options.Fields + ",PrimaryImageAspectRatio") : "PrimaryImageAspectRatio";
        options.ImageTypeLimit = 1;
    }

    function resumable(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                options.SortBy = "DatePlayed";
                options.SortOrder = "Descending";
                options.MediaTypes = "Video";
                options.Filters = "IsResumable";
                options.Recursive = true;
                normalizeOptions(options);

                apiClient.getItems(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function nextUp(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                options = options || {};
                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                options.UserId = apiClient.getCurrentUserId();

                apiClient.getNextUpEpisodes(options).then(resolve, reject);
            });
        });
    }

    function upcoming(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                options = options || {};
                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();
                options.UserId = apiClient.getCurrentUserId();

                apiClient.getJSON(apiClient.getUrl('Shows/Upcoming', options)).then(resolve, reject);
            });
        });
    }

    function latestItems(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                options = options || {};
                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items/Latest', options)).then(resolve, reject);
            });
        });
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

    function fillChapterImages(itemId, chapters, image, apiClient) {

        var isPrimary = image.type == 'Primary';

        for (var i = 0, length = chapters.length; i < length; i++) {
            var chapter = chapters[i];

            if (isPrimary && chapter.ImageTag) {

                var imgUrl = apiClient.getScaledImageUrl(itemId, {

                    // TODO: Remove hard-coding
                    maxWidth: 460,
                    tag: chapter.ImageTag,
                    type: "Chapter",
                    index: i
                });

                chapter.images = chapter.images || {};
                chapter.images.primary = imgUrl;
            }
        }
    }

    function fillItemPeopleImages(itemId, people, image, apiClient) {

        var isPrimary = image.type == 'Primary';

        for (var i = 0, length = people.length; i < length; i++) {
            var person = people[i];

            if (isPrimary && person.PrimaryImageTag) {

                var imgUrl = apiClient.getScaledImageUrl(person.Id, {

                    // TODO: Remove hard-coding
                    maxWidth: 260,
                    tag: person.PrimaryImageTag,
                    type: "Primary"
                });

                person.images = person.images || {};
                person.images.primary = imgUrl;
            }
        }
    }

    function chapters(item, options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                var chapters = item.Chapters || [];

                var images = options.images || [];

                for (var i = 0, length = images.length; i < length; i++) {
                    fillChapterImages(item.Id, chapters, images[i], apiClient);
                }

                resolve(chapters);
            });
        });
    }

    function itemPeople(item, options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                var people = item.People || [];

                if (options.limit) {
                    people.length = Math.min(people.length, options.limit);
                }

                people = people.filter(function (p) {
                    return p.PrimaryImageTag;
                });

                var images = options.images || [];

                for (var i = 0, length = images.length; i < length; i++) {
                    fillItemPeopleImages(item.Id, people, images[i], apiClient);
                }

                resolve(people);
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

    function recordings(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                normalizeOptions(options);
                options.UserId = apiClient.getCurrentUserId();

                apiClient.getLiveTvRecordings(options).then(resolve, reject);
            });
        });
    }

    function liveTvChannels(options) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                normalizeOptions(options);
                options.UserId = apiClient.getCurrentUserId();

                apiClient.getLiveTvChannels(options).then(resolve, reject);
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

    function similar(item, options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                options = options || {};
                normalizeOptions(options);

                var apiClient = connectionManager.currentApiClient();

                options.UserId = apiClient.getCurrentUserId();

                var promise;

                promise = apiClient.getSimilarItems(item.Id, options);

                promise.then(resolve, reject);
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

    function children(item, options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};

                if (!options.SortBy) {
                    if (item.Type == "Series") {

                    }
                    else if (item.Type == "Season") {

                    }
                    else if (item.Type == "MusicAlbum") {

                    }
                    else if (item.Type == "BoxSet") {

                    } else {
                        options.SortBy = "SortName";
                    }
                }

                normalizeOptions(options);

                if (item.Type == "Channel") {

                    options.UserId = apiClient.getCurrentUserId();

                    apiClient.getJSON(apiClient.getUrl("Channels/" + item.Id + "/Items", options)).then(resolve, reject);
                } else {

                    options.ParentId = item.Id;

                    apiClient.getItems(apiClient.getCurrentUserId(), options).then(resolve, reject);
                }
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

    function search(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};

                normalizeOptions(options);
                options.UserId = apiClient.getCurrentUserId();

                apiClient.getSearchHints(options).then(resolve, reject);
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

    function genres(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                options.Recursive = true;

                normalizeOptions(options);

                apiClient.getGenres(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function userViews(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                normalizeOptions(options);

                apiClient.getUserViews({}, apiClient.getCurrentUserId()).then(resolve, reject);
            });
        });
    }

    function movieRecommendations(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                normalizeOptions(options);
                options.UserId = apiClient.getCurrentUserId();

                apiClient.getJSON(apiClient.getUrl('Movies/Recommendations', options)).then(resolve, reject);
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

    function intros(itemId) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getJSON(apiClient.getUrl('Users/' + apiClient.getCurrentUserId() + '/Items/' + itemId + '/Intros')).then(resolve, reject);
            });
        });
    }

    function albumArtists(options) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                normalizeOptions(options);

                apiClient.getAlbumArtists(apiClient.getCurrentUserId(), options).then(resolve, reject);
            });
        });
    }

    function instantMix(id, options) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                options = options || {};
                normalizeOptions(options);
                options.UserId = apiClient.getCurrentUserId();

                options.Fields = options.Fields ? (options.Fields + ',MediaSources') : 'MediaSources';

                apiClient.getInstantMixFromItem(id, options).then(resolve, reject);
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

    function seriesImageUrl(item, options) {

        options = options || {};
        options.type = options.type || "Primary";

        if (options.type == 'Primary') {

            if (item.SeriesPrimaryImageTag) {

                options.tag = item.SeriesPrimaryImageTag;

                return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
            }

            //else if (item.ParentPrimaryImageTag) {

            //    imgUrl = ApiClient.getImageUrl(item.ParentPrimaryImageItemId, {
            //        type: "Primary",
            //        width: downloadWidth,
            //        tag: item.ParentPrimaryImageTag,
            //        minScale: minScale
            //    });
            //}
        }

        if (options.type == 'Thumb') {

            if (item.SeriesThumbImageTag) {

                options.tag = item.SeriesThumbImageTag;

                return getConnectionManager().getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
            }

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

    function userImageUrl(item, options) {

        options = options || {};
        options.type = "Primary";

        if (item.PrimaryImageTag) {

            options.tag = item.PrimaryImageTag;
            return getConnectionManager().getApiClient(item.ServerId).getUserImageUrl(item.Id, options);
        }

        return null;
    }

    function likes(id, isLiked) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.updateUserItemRating(apiClient.getCurrentUserId(), id, isLiked).then(resolve, reject);
            });
        });
    }

    function played(id, isPlayed) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                var method = isPlayed ? 'markPlayed' : 'markUnplayed';

                apiClient[method](apiClient.getCurrentUserId(), id, new Date()).then(resolve, reject);
            });
        });
    }

    function favorite(id, isFavorite) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite).then(resolve, reject);
            });
        });
    }

    function clearLike(id) {

        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.clearUserItemRating(apiClient.getCurrentUserId(), id).then(resolve, reject);
            });
        });
    }

    function itemTrailers(id) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getLocalTrailers(apiClient.getCurrentUserId(), id).then(resolve, reject);
            });
        });
    }

    function extras(id) {
        return new Promise(function (resolve, reject) {

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getSpecialFeatures(apiClient.getCurrentUserId(), id).then(resolve, reject);
            });
        });
    }

    var myConnectionManager;
    function getConnectionManager() {
        return myConnectionManager;
    }

    require(['connectionManager'], function (connectionManager) {
        myConnectionManager = connectionManager;
    });

    globalScope.Emby.Models = {
        resumable: resumable,
        nextUp: nextUp,
        upcoming: upcoming,
        latestItems: latestItems,
        liveTvRecordings: liveTvRecordings,
        item: item,
        chapters: chapters,
        playlists: playlists,
        channels: channels,
        latestChannelItems: latestChannelItems,
        similar: similar,
        liveTvRecommendedPrograms: liveTvRecommendedPrograms,
        itemPeople: itemPeople,
        children: children,
        items: items,
        collections: collections,
        genres: genres,
        userViews: userViews,
        movieRecommendations: movieRecommendations,
        artists: artists,
        albumArtists: albumArtists,
        logoImageUrl: logoImageUrl,
        intros: intros,
        imageUrl: imageUrl,
        thumbImageUrl: thumbImageUrl,
        userImageUrl: userImageUrl,
        backdropImageUrl: backdropImageUrl,
        instantMix: instantMix,
        likes: likes,
        played: played,
        favorite: favorite,
        clearLike: clearLike,
        search: search,
        seriesImageUrl: seriesImageUrl,
        recordings: recordings,
        liveTvChannels: liveTvChannels,
        itemTrailers: itemTrailers,
        extras: extras
    };

})(this, document);
