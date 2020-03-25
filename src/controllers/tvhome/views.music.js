define(['cardBuilder', 'focusManager'], function (cardBuilder, focusManager) {
    'use strict';

    function loadLatest(element, apiClient, parentId) {

        var options = {

            IncludeItemTypes: "Audio",
            Limit: 9,
            Fields: "PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getLatestItems(options).then(function (result) {

            var section = element.querySelector('.latestSection');

            cardBuilder.buildCards(result, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadPlaylists(element, apiClient, parentId) {

        var options = {

            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Playlist",
            Recursive: true,
            ParentId: parentId,
            Fields: "PrimaryImageAspectRatio,SortName,CumulativeRunTimeTicks,CanDelete",
            StartIndex: 0,
            Limit: 9
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.playlistsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                showTitle: true,
                overlayText: true,
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadRecentlyPlayed(element, apiClient, parentId) {

        var options = {

            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.recentlyPlayedSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                action: 'instantmix',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadFrequentlyPlayed(element, apiClient, parentId) {

        var options = {

            SortBy: "PlayCount",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.frequentlyPlayedSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                action: 'instantmix',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadFavoriteSongs(element, apiClient, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "Audio",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            Filters: "IsFavorite",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.favoriteSongsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                action: 'instantmix',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadFavoriteAlbums(element, apiClient, parentId) {

        var options = {

            SortBy: "Random",
            IncludeItemTypes: "MusicAlbum",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            Filters: "IsFavorite",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.favoriteAlbumsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function loadFavoriteArtists(element, apiClient, parentId) {

        var options = {

            SortBy: "Random",
            Limit: 6,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio",
            Filters: "IsFavorite",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb"
        };

        return apiClient.getArtists(apiClient.getCurrentUserId(), options).then(function (result) {

            var section = element.querySelector('.favoriteArtistsSection');

            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
                itemsContainer: section.querySelector('.itemsContainer'),
                shape: 'auto',
                rows: {
                    portrait: 2,
                    square: 3,
                    backdrop: 3
                },
                scalable: false
            });
        });
    }

    function view(element, apiClient, parentId, autoFocus) {
        var self = this;

        if (autoFocus) {
            focusManager.autoFocus(element, true);
        }

        self.loadData = function (isRefresh) {

            if (isRefresh) {
                return Promise.resolve();
            }

            return Promise.all([
                loadLatest(element, apiClient, parentId),
                loadPlaylists(element, apiClient, parentId),
                loadRecentlyPlayed(element, apiClient, parentId),
                loadFrequentlyPlayed(element, apiClient, parentId),
                loadFavoriteSongs(element, apiClient, parentId),
                loadFavoriteAlbums(element, apiClient, parentId),
                loadFavoriteArtists(element, apiClient, parentId)
            ]);
        };

        element.querySelector('.artistsCard').addEventListener('click', function () {
            Emby.Page.show('/music.html?serverId=' + apiClient.serverId() + '&tab=2&parentId=' + parentId);
        });

        element.querySelector('.albumsCard').addEventListener('click', function () {
            Emby.Page.show('/music.html?serverId=' + apiClient.serverId() + '&tab=1&parentId=' + parentId);
        });

        element.querySelector('.songCard').addEventListener('click', function () {
            Emby.Page.show('/music.html?serverId=' + apiClient.serverId() + '&tab=5&parentId=' + parentId);
        });

        self.destroy = function () {

        };
    }

    return view;

});
