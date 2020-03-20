define(["appRouter", "cardBuilder", "dom", "globalize", "connectionManager", "apphost", "layoutManager", "focusManager", "emby-itemscontainer", "emby-scroller"], function (appRouter, cardBuilder, dom, globalize, connectionManager, appHost, layoutManager, focusManager) {
    "use strict";

    function enableScrollX() {
        return true;
    }

    function getThumbShape() {
        return enableScrollX() ? "overflowBackdrop" : "backdrop";
    }

    function getPosterShape() {
        return enableScrollX() ? "overflowPortrait" : "portrait";
    }

    function getSquareShape() {
        return enableScrollX() ? "overflowSquare" : "square";
    }

    function getSections() {
        return [{
            name: "HeaderFavoriteMovies",
            types: "Movie",
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: "HeaderFavoriteShows",
            types: "Series",
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: "HeaderFavoriteEpisodes",
            types: "Episode",
            shape: getThumbShape(),
            preferThumb: false,
            showTitle: true,
            showParentTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: "HeaderFavoriteVideos",
            types: "Video",
            shape: getThumbShape(),
            preferThumb: true,
            showTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: "HeaderFavoriteCollections",
            types: "BoxSet",
            shape: getPosterShape(),
            showTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }, {
            name: "HeaderFavoritePlaylists",
            types: "Playlist",
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: "HeaderFavoritePeople",
            types: "Person",
            shape: getPosterShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: "HeaderFavoriteArtists",
            types: "MusicArtist",
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: false,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: "HeaderFavoriteAlbums",
            types: "MusicAlbum",
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: true,
            centerText: true,
            overlayPlayButton: true,
            coverImage: true
        }, {
            name: "HeaderFavoriteSongs",
            types: "Audio",
            shape: getSquareShape(),
            preferThumb: false,
            showTitle: true,
            overlayText: false,
            showParentTitle: true,
            centerText: true,
            overlayMoreButton: true,
            action: "instantmix",
            coverImage: true
        }, {
            name: "HeaderFavoriteBooks",
            types: "Book",
            shape: getPosterShape(),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }];
    }

    function getFetchDataFn(section) {
        return function () {
            var apiClient = this.apiClient;
            var options = {
                SortBy: (section.types, "SeriesName,SortName"),
                SortOrder: "Ascending",
                Filters: "IsFavorite",
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                CollapseBoxSetItems: false,
                ExcludeLocationTypes: "Virtual",
                EnableTotalRecordCount: false
            };
            options.Limit = 20;
            var userId = apiClient.getCurrentUserId();

            if ("MusicArtist" === section.types) {
                return apiClient.getArtists(userId, options);
            }

            if ("Person" === section.types) {
                return apiClient.getPeople(userId, options);
            }

            options.IncludeItemTypes = section.types;
            return apiClient.getItems(userId, options);
        };
    }

    function getRouteUrl(section, serverId) {
        return appRouter.getRouteUrl("list", {
            serverId: serverId,
            itemTypes: section.types,
            isFavorite: true
        });
    }

    function getItemsHtmlFn(section) {
        return function (items) {
            var supportsImageAnalysis = appHost.supports("imageanalysis");
            var cardLayout = (appHost.preferVisualCards || supportsImageAnalysis) && section.autoCardLayout && section.showTitle;
            cardLayout = false;
            var serverId = this.apiClient.serverId();
            var leadingButtons = layoutManager.tv ? [{
                name: globalize.translate("All"),
                id: "more",
                icon: "favorite",
                routeUrl: getRouteUrl(section, serverId)
            }] : null;
            var lines = 0;

            if (section.showTitle) {
                lines++;
            }

            if (section.showYear) {
                lines++;
            }

            if (section.showParentTitle) {
                lines++;
            }

            return cardBuilder.getCardsHtml({
                items: items,
                preferThumb: section.preferThumb,
                shape: section.shape,
                centerText: section.centerText && !cardLayout,
                overlayText: false !== section.overlayText,
                showTitle: section.showTitle,
                showYear: section.showYear,
                showParentTitle: section.showParentTitle,
                scalable: true,
                coverImage: section.coverImage,
                overlayPlayButton: section.overlayPlayButton,
                overlayMoreButton: section.overlayMoreButton && !cardLayout,
                action: section.action,
                allowBottomPadding: !enableScrollX(),
                cardLayout: cardLayout,
                leadingButtons: leadingButtons,
                lines: lines
            });
        };
    }

    function FavoritesTab(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = connectionManager.currentApiClient();
        this.sectionsContainer = view.querySelector(".sections");
        createSections(this, this.sectionsContainer, this.apiClient);
    }

    function createSections(instance, elem, apiClient) {
        var i;
        var length;
        var sections = getSections();
        var html = "";

        for (i = 0, length = sections.length; i < length; i++) {
            var section = sections[i];
            var sectionClass = "verticalSection";

            if (!section.showTitle) {
                sectionClass += " verticalSection-extrabottompadding";
            }

            html += '<div class="' + sectionClass + ' hide">';
            html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';

            if (layoutManager.tv) {
                html += '<h2 class="sectionTitle sectionTitle-cards">' + globalize.translate(section.name) + "</h2>";
            } else {
                html += '<a is="emby-linkbutton" href="' + getRouteUrl(section, apiClient.serverId()) + '" class="more button-flat button-flat-mini sectionTitleTextButton">';
                html += '<h2 class="sectionTitle sectionTitle-cards">';
                html += globalize.translate(section.name);
                html += "</h2>";
                html += '<i class="material-icons chevron_right"></i>';
                html += "</a>";
            }

            html += "</div>";
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true"><div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x" data-monitor="markfavorite"></div></div>';
            html += "</div>";
        }

        elem.innerHTML = html;
        var elems = elem.querySelectorAll(".itemsContainer");

        for (i = 0, length = elems.length; i < length; i++) {
            var itemsContainer = elems[i];
            itemsContainer.fetchData = getFetchDataFn(sections[i]).bind(instance);
            itemsContainer.getItemsHtml = getItemsHtmlFn(sections[i]).bind(instance);
            itemsContainer.parentContainer = dom.parentWithClass(itemsContainer, "verticalSection");
        }
    }

    FavoritesTab.prototype.onResume = function (options) {
        var promises = (this.apiClient, []);
        var view = this.view;
        var elems = this.sectionsContainer.querySelectorAll(".itemsContainer");

        for (var i = 0, length = elems.length; i < length; i++) {
            promises.push(elems[i].resume(options));
        }

        Promise.all(promises).then(function () {
            if (options.autoFocus) {
                focusManager.autoFocus(view);
            }
        });
    };

    FavoritesTab.prototype.onPause = function () {
        var elems = this.sectionsContainer.querySelectorAll(".itemsContainer");

        for (var i = 0, length = elems.length; i < length; i++) {
            elems[i].pause();
        }
    };

    FavoritesTab.prototype.destroy = function () {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        var elems = this.sectionsContainer.querySelectorAll(".itemsContainer");

        for (var i = 0, length = elems.length; i < length; i++) {
            elems[i].fetchData = null;
            elems[i].getItemsHtml = null;
            elems[i].parentContainer = null;
        }

        this.sectionsContainer = null;
    };

    return FavoritesTab;
});
