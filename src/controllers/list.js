define(["globalize", "listView", "layoutManager", "userSettings", "focusManager", "cardBuilder", "loading", "connectionManager", "alphaNumericShortcuts", "scroller", "playbackManager", "alphaPicker", "emby-itemscontainer", "emby-scroller"], function (globalize, listView, layoutManager, userSettings, focusManager, cardBuilder, loading, connectionManager, AlphaNumericShortcuts, scroller, playbackManager, alphaPicker) {
    "use strict";

    function getInitialLiveTvQuery(instance, params) {
        var query = {
            UserId: connectionManager.getApiClient(params.serverId).getCurrentUserId(),
            StartIndex: 0,
            Fields: "ChannelInfo,PrimaryImageAspectRatio",
            Limit: 300
        };

        if ("Recordings" === params.type) {
            query.IsInProgress = false;
        } else {
            query.HasAired = false;
        }

        if (params.genreId) {
            query.GenreIds = params.genreId;
        }

        if ("true" === params.IsMovie) {
            query.IsMovie = true;
        } else if ("false" === params.IsMovie) {
            query.IsMovie = false;
        }

        if ("true" === params.IsSeries) {
            query.IsSeries = true;
        } else if ("false" === params.IsSeries) {
            query.IsSeries = false;
        }

        if ("true" === params.IsNews) {
            query.IsNews = true;
        } else if ("false" === params.IsNews) {
            query.IsNews = false;
        }

        if ("true" === params.IsSports) {
            query.IsSports = true;
        } else if ("false" === params.IsSports) {
            query.IsSports = false;
        }

        if ("true" === params.IsKids) {
            query.IsKids = true;
        } else if ("false" === params.IsKids) {
            query.IsKids = false;
        }

        if ("true" === params.IsAiring) {
            query.IsAiring = true;
        } else if ("false" === params.IsAiring) {
            query.IsAiring = false;
        }

        return modifyQueryWithFilters(instance, query);
    }

    function modifyQueryWithFilters(instance, query) {
        var sortValues = instance.getSortValues();

        if (!query.SortBy) {
            query.SortBy = sortValues.sortBy;
            query.SortOrder = sortValues.sortOrder;
        }

        query.Fields = query.Fields ? query.Fields + ",PrimaryImageAspectRatio" : "PrimaryImageAspectRatio";
        query.ImageTypeLimit = 1;
        var hasFilters;
        var queryFilters = [];
        var filters = instance.getFilters();

        if (filters.IsPlayed) {
            queryFilters.push("IsPlayed");
            hasFilters = true;
        }

        if (filters.IsUnplayed) {
            queryFilters.push("IsUnplayed");
            hasFilters = true;
        }

        if (filters.IsFavorite) {
            queryFilters.push("IsFavorite");
            hasFilters = true;
        }

        if (filters.IsResumable) {
            queryFilters.push("IsResumable");
            hasFilters = true;
        }

        if (filters.VideoTypes) {
            hasFilters = true;
            query.VideoTypes = filters.VideoTypes;
        }

        if (filters.GenreIds) {
            hasFilters = true;
            query.GenreIds = filters.GenreIds;
        }

        if (filters.Is4K) {
            query.Is4K = true;
            hasFilters = true;
        }

        if (filters.IsHD) {
            query.IsHD = true;
            hasFilters = true;
        }

        if (filters.IsSD) {
            query.IsHD = false;
            hasFilters = true;
        }

        if (filters.Is3D) {
            query.Is3D = true;
            hasFilters = true;
        }

        if (filters.HasSubtitles) {
            query.HasSubtitles = true;
            hasFilters = true;
        }

        if (filters.HasTrailer) {
            query.HasTrailer = true;
            hasFilters = true;
        }

        if (filters.HasSpecialFeature) {
            query.HasSpecialFeature = true;
            hasFilters = true;
        }

        if (filters.HasThemeSong) {
            query.HasThemeSong = true;
            hasFilters = true;
        }

        if (filters.HasThemeVideo) {
            query.HasThemeVideo = true;
            hasFilters = true;
        }

        query.Filters = queryFilters.length ? queryFilters.join(",") : null;
        instance.setFilterStatus(hasFilters);

        if (instance.alphaPicker) {
            query.NameStartsWithOrGreater = instance.alphaPicker.value();
        }

        return query;
    }

    function setSortButtonIcon(btnSortIcon, icon) {
        btnSortIcon.classList.remove("arrow_downward");
        btnSortIcon.classList.remove("arrow_upward");
        btnSortIcon.classList.add(icon);
    }

    function updateSortText(instance) {
        var btnSortText = instance.btnSortText;

        if (btnSortText) {
            var options = instance.getSortMenuOptions();
            var values = instance.getSortValues();
            var sortBy = values.sortBy;

            for (var i = 0, length = options.length; i < length; i++) {
                if (sortBy === options[i].value) {
                    btnSortText.innerHTML = globalize.translate("SortByValue", options[i].name);
                    break;
                }
            }

            var btnSortIcon = instance.btnSortIcon;

            if (btnSortIcon) {
                setSortButtonIcon(btnSortIcon, "Descending" === values.sortOrder ? "arrow_downward" : "arrow_upward");
            }
        }
    }

    function updateItemsContainerForViewType(instance) {
        if ("list" === instance.getViewSettings().imageType) {
            instance.itemsContainer.classList.remove("vertical-wrap");
            instance.itemsContainer.classList.add("vertical-list");
        } else {
            instance.itemsContainer.classList.add("vertical-wrap");
            instance.itemsContainer.classList.remove("vertical-list");
        }
    }

    function updateAlphaPickerState(instance, numItems) {
        if (instance.alphaPicker) {
            var alphaPicker = instance.alphaPickerElement;

            if (alphaPicker) {
                var values = instance.getSortValues();

                if (null == numItems) {
                    numItems = 100;
                }

                if ("SortName" === values.sortBy && "Ascending" === values.sortOrder && numItems > 40) {
                    alphaPicker.classList.remove("hide");
                    instance.itemsContainer.parentNode.classList.add("padded-right-withalphapicker");
                } else {
                    alphaPicker.classList.add("hide");
                    instance.itemsContainer.parentNode.classList.remove("padded-right-withalphapicker");
                }
            }
        }
    }

    function getItems(instance, params, item, sortBy, startIndex, limit) {
        var apiClient = connectionManager.getApiClient(params.serverId);

        instance.queryRecursive = false;
        if ("Recordings" === params.type) {
            return apiClient.getLiveTvRecordings(getInitialLiveTvQuery(instance, params));
        }

        if ("Programs" === params.type) {
            if ("true" === params.IsAiring) {
                return apiClient.getLiveTvRecommendedPrograms(getInitialLiveTvQuery(instance, params));
            }

            return apiClient.getLiveTvPrograms(getInitialLiveTvQuery(instance, params));
        }

        if ("nextup" === params.type) {
            return apiClient.getNextUpEpisodes(modifyQueryWithFilters(instance, {
                Limit: limit,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
                UserId: apiClient.getCurrentUserId(),
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false,
                SortBy: sortBy
            }));
        }

        if (!item) {
            instance.queryRecursive = true;
            var method = "getItems";

            if ("MusicArtist" === params.type) {
                method = "getArtists";
            } else if ("Person" === params.type) {
                method = "getPeople";
            }

            return apiClient[method](apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, {
                StartIndex: startIndex,
                Limit: limit,
                Fields: "PrimaryImageAspectRatio,SortName",
                ImageTypeLimit: 1,
                IncludeItemTypes: "MusicArtist" === params.type || "Person" === params.type ? null : params.type,
                Recursive: true,
                IsFavorite: "true" === params.IsFavorite || null,
                ArtistIds: params.artistId || null,
                SortBy: sortBy
            }));
        }

        if ("Genre" === item.Type || "MusicGenre" === item.Type || "Studio" === item.Type || "Person" === item.Type) {
            instance.queryRecursive = true;
            var query = {
                StartIndex: startIndex,
                Limit: limit,
                Fields: "PrimaryImageAspectRatio,SortName",
                Recursive: true,
                parentId: params.parentId,
                SortBy: sortBy
            };

            if ("Studio" === item.Type) {
                query.StudioIds = item.Id;
            } else if ("Genre" === item.Type || "MusicGenre" === item.Type) {
                query.GenreIds = item.Id;
            } else if ("Person" === item.Type) {
                query.PersonIds = item.Id;
            }

            if ("MusicGenre" === item.Type) {
                query.IncludeItemTypes = "MusicAlbum";
            } else if ("GameGenre" === item.Type) {
                query.IncludeItemTypes = "Game";
            } else if ("movies" === item.CollectionType) {
                query.IncludeItemTypes = "Movie";
            } else if ("tvshows" === item.CollectionType) {
                query.IncludeItemTypes = "Series";
            } else if ("Genre" === item.Type) {
                query.IncludeItemTypes = "Movie,Series,Video";
            } else if ("Person" === item.Type) {
                query.IncludeItemTypes = params.type;
            }

            return apiClient.getItems(apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, query));
        }

        return apiClient.getItems(apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, {
            StartIndex: startIndex,
            Limit: limit,
            Fields: "PrimaryImageAspectRatio,SortName",
            ImageTypeLimit: 1,
            ParentId: item.Id,
            SortBy: sortBy
        }));
    }

    function getItem(params) {
        if ("Recordings" === params.type || "Programs" === params.type || "nextup" === params.type) {
            return Promise.resolve(null);
        }

        var apiClient = connectionManager.getApiClient(params.serverId);
        var itemId = params.genreId || params.musicGenreId || params.studioId || params.personId || params.parentId;

        if (itemId) {
            return apiClient.getItem(apiClient.getCurrentUserId(), itemId);
        }

        return Promise.resolve(null);
    }

    function showViewSettingsMenu() {
        var instance = this;

        require(["viewSettings"], function (ViewSettings) {
            new ViewSettings().show({
                settingsKey: instance.getSettingsKey(),
                settings: instance.getViewSettings(),
                visibleSettings: instance.getVisibleViewSettings()
            }).then(function () {
                updateItemsContainerForViewType(instance);
                instance.itemsContainer.refreshItems();
            });
        });
    }

    function showFilterMenu() {
        var instance = this;

        require(["filterMenu"], function (FilterMenu) {
            new FilterMenu().show({
                settingsKey: instance.getSettingsKey(),
                settings: instance.getFilters(),
                visibleSettings: instance.getVisibleFilters(),
                onChange: instance.itemsContainer.refreshItems.bind(instance.itemsContainer),
                parentId: instance.params.parentId,
                itemTypes: instance.getItemTypes(),
                serverId: instance.params.serverId,
                filterMenuOptions: instance.getFilterMenuOptions()
            }).then(function () {
                instance.itemsContainer.refreshItems();
            });
        });
    }

    function showSortMenu() {
        var instance = this;

        require(["sortMenu"], function (SortMenu) {
            new SortMenu().show({
                settingsKey: instance.getSettingsKey(),
                settings: instance.getSortValues(),
                onChange: instance.itemsContainer.refreshItems.bind(instance.itemsContainer),
                serverId: instance.params.serverId,
                sortOptions: instance.getSortMenuOptions()
            }).then(function () {
                updateSortText(instance);
                updateAlphaPickerState(instance);
                instance.itemsContainer.refreshItems();
            });
        });
    }

    function onNewItemClick() {
        var instance = this;

        require(["playlistEditor"], function (playlistEditor) {
            new playlistEditor().show({
                items: [],
                serverId: instance.params.serverId
            });
        });
    }

    function hideOrShowAll(elems, hide) {
        for (var i = 0, length = elems.length; i < length; i++) {
            if (hide) {
                elems[i].classList.add("hide");
            } else {
                elems[i].classList.remove("hide");
            }
        }
    }

    function bindAll(elems, eventName, fn) {
        for (var i = 0, length = elems.length; i < length; i++) {
            elems[i].addEventListener(eventName, fn);
        }
    }

    function ItemsView(view, params) {
        function fetchData() {
            return getItems(self, params, self.currentItem).then(function (result) {
                if (null == self.totalItemCount) {
                    self.totalItemCount = result.Items ? result.Items.length : result.length;
                }

                updateAlphaPickerState(self, self.totalItemCount);
                return result;
            });
        }

        function getItemsHtml(items) {
            var settings = self.getViewSettings();

            if ("list" === settings.imageType) {
                return listView.getListViewHtml({
                    items: items
                });
            }

            var shape;
            var preferThumb;
            var preferDisc;
            var preferLogo;
            var defaultShape;
            var item = self.currentItem;
            var lines = settings.showTitle ? 2 : 0;

            if ("banner" === settings.imageType) {
                shape = "banner";
            } else if ("disc" === settings.imageType) {
                shape = "square";
                preferDisc = true;
            } else if ("logo" === settings.imageType) {
                shape = "backdrop";
                preferLogo = true;
            } else if ("thumb" === settings.imageType) {
                shape = "backdrop";
                preferThumb = true;
            } else if ("nextup" === params.type) {
                shape = "backdrop";
                preferThumb = "thumb" === settings.imageType;
            } else if ("Programs" === params.type || "Recordings" === params.type) {
                shape = "true" === params.IsMovie ? "portrait" : "autoVertical";
                preferThumb = "true" !== params.IsMovie ? "auto" : false;
                defaultShape = "true" === params.IsMovie ? "portrait" : "backdrop";
            } else {
                shape = "autoVertical";
            }

            var posterOptions = {
                shape: shape,
                showTitle: settings.showTitle,
                showYear: settings.showTitle,
                centerText: true,
                coverImage: true,
                preferThumb: preferThumb,
                preferDisc: preferDisc,
                preferLogo: preferLogo,
                overlayPlayButton: false,
                overlayMoreButton: true,
                overlayText: !settings.showTitle,
                defaultShape: defaultShape,
                action: "Audio" === params.type ? "playallfromhere" : null
            };

            if ("nextup" === params.type) {
                posterOptions.showParentTitle = settings.showTitle;
            } else if ("Person" === params.type) {
                posterOptions.showYear = false;
                posterOptions.showParentTitle = false;
                lines = 1;
            } else if ("Audio" === params.type) {
                posterOptions.showParentTitle = settings.showTitle;
            } else if ("MusicAlbum" === params.type) {
                posterOptions.showParentTitle = settings.showTitle;
            } else if ("Episode" === params.type) {
                posterOptions.showParentTitle = settings.showTitle;
            } else if ("MusicArtist" === params.type) {
                posterOptions.showYear = false;
                lines = 1;
            } else if ("Programs" === params.type) {
                lines = settings.showTitle ? 1 : 0;
                var showParentTitle = settings.showTitle && "true" !== params.IsMovie;

                if (showParentTitle) {
                    lines++;
                }

                var showAirTime = settings.showTitle && "Recordings" !== params.type;

                if (showAirTime) {
                    lines++;
                }

                var showYear = settings.showTitle && "true" === params.IsMovie && "Recordings" === params.type;

                if (showYear) {
                    lines++;
                }

                posterOptions = Object.assign(posterOptions, {
                    inheritThumb: "Recordings" === params.type,
                    context: "livetv",
                    showParentTitle: showParentTitle,
                    showAirTime: showAirTime,
                    showAirDateTime: showAirTime,
                    overlayPlayButton: false,
                    overlayMoreButton: true,
                    showYear: showYear,
                    coverImage: true
                });
            } else {
                posterOptions.showParentTitle = settings.showTitle;
            }

            posterOptions.lines = lines;
            posterOptions.items = items;

            if (item && "folders" === item.CollectionType) {
                posterOptions.context = "folders";
            }

            return cardBuilder.getCardsHtml(posterOptions);
        }

        function initAlphaPicker() {
            self.scroller = view.querySelector(".scrollFrameY");
            var alphaPickerElement = self.alphaPickerElement;

            alphaPickerElement.classList.add("alphaPicker-fixed-right");
            alphaPickerElement.classList.add("focuscontainer-right");
            self.itemsContainer.parentNode.classList.add("padded-right-withalphapicker");

            self.alphaPicker = new alphaPicker({
                element: alphaPickerElement,
                itemsContainer: layoutManager.tv ? self.itemsContainer : null,
                itemClass: "card",
                valueChangeEvent: layoutManager.tv ? null : "click"
            });
            self.alphaPicker.on("alphavaluechanged", onAlphaPickerValueChanged);
        }

        function onAlphaPickerValueChanged() {
            self.alphaPicker.value();
            self.itemsContainer.refreshItems();
        }

        function setTitle(item) {
            Emby.Page.setTitle(getTitle(item) || "");

            if (item && "playlists" === item.CollectionType) {
                hideOrShowAll(view.querySelectorAll(".btnNewItem"), false);
            } else {
                hideOrShowAll(view.querySelectorAll(".btnNewItem"), true);
            }
        }

        function getTitle(item) {
            if ("Recordings" === params.type) {
                return globalize.translate("Recordings");
            }

            if ("Programs" === params.type) {
                if ("true" === params.IsMovie) {
                    return globalize.translate("Movies");
                }

                if ("true" === params.IsSports) {
                    return globalize.translate("Sports");
                }

                if ("true" === params.IsKids) {
                    return globalize.translate("HeaderForKids");
                }

                if ("true" === params.IsAiring) {
                    return globalize.translate("HeaderOnNow");
                }

                if ("true" === params.IsSeries) {
                    return globalize.translate("Shows");
                }

                if ("true" === params.IsNews) {
                    return globalize.translate("News");
                }

                return globalize.translate("Programs");
            }

            if ("nextup" === params.type) {
                return globalize.translate("NextUp");
            }

            if ("favoritemovies" === params.type) {
                return globalize.translate("FavoriteMovies");
            }

            if (item) {
                return item.Name;
            }

            if ("Movie" === params.type) {
                return globalize.translate("Movies");
            }

            if ("Series" === params.type) {
                return globalize.translate("Shows");
            }

            if ("Season" === params.type) {
                return globalize.translate("Seasons");
            }

            if ("Episode" === params.type) {
                return globalize.translate("Episodes");
            }

            if ("MusicArtist" === params.type) {
                return globalize.translate("Artists");
            }

            if ("MusicAlbum" === params.type) {
                return globalize.translate("Albums");
            }

            if ("Audio" === params.type) {
                return globalize.translate("Songs");
            }

            if ("Video" === params.type) {
                return globalize.translate("Videos");
            }

            return void 0;
        }

        function play() {
            var currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                playbackManager.play({
                    items: [currentItem]
                });
            } else {
                getItems(self, self.params, currentItem, null, null, 300).then(function (result) {
                    playbackManager.play({
                        items: result.Items
                    });
                });
            }
        }

        function queue() {
            var currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                playbackManager.queue({
                    items: [currentItem]
                });
            } else {
                getItems(self, self.params, currentItem, null, null, 300).then(function (result) {
                    playbackManager.queue({
                        items: result.Items
                    });
                });
            }
        }

        function shuffle() {
            var currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                playbackManager.shuffle(currentItem);
            } else {
                getItems(self, self.params, currentItem, "Random", null, 300).then(function (result) {
                    playbackManager.play({
                        items: result.Items
                    });
                });
            }
        }

        var self = this;
        self.params = params;
        this.itemsContainer = view.querySelector(".itemsContainer");

        if (params.parentId) {
            this.itemsContainer.setAttribute("data-parentid", params.parentId);
        } else if ("nextup" === params.type) {
            this.itemsContainer.setAttribute("data-monitor", "videoplayback");
        } else if ("favoritemovies" === params.type) {
            this.itemsContainer.setAttribute("data-monitor", "markfavorite");
        } else if ("Programs" === params.type) {
            this.itemsContainer.setAttribute("data-refreshinterval", "300000");
        }

        var i;
        var length;
        var btnViewSettings = view.querySelectorAll(".btnViewSettings");

        for (i = 0, length = btnViewSettings.length; i < length; i++) {
            btnViewSettings[i].addEventListener("click", showViewSettingsMenu.bind(this));
        }

        var filterButtons = view.querySelectorAll(".btnFilter");
        this.filterButtons = filterButtons;
        var hasVisibleFilters = this.getVisibleFilters().length;

        for (i = 0, length = filterButtons.length; i < length; i++) {
            var btnFilter = filterButtons[i];
            btnFilter.addEventListener("click", showFilterMenu.bind(this));

            if (hasVisibleFilters) {
                btnFilter.classList.remove("hide");
            } else {
                btnFilter.classList.add("hide");
            }
        }

        var sortButtons = view.querySelectorAll(".btnSort");

        for (this.sortButtons = sortButtons, i = 0, length = sortButtons.length; i < length; i++) {
            var sortButton = sortButtons[i];
            sortButton.addEventListener("click", showSortMenu.bind(this));

            if ("nextup" !== params.type) {
                sortButton.classList.remove("hide");
            }
        }

        this.btnSortText = view.querySelector(".btnSortText");
        this.btnSortIcon = view.querySelector(".btnSortIcon");
        bindAll(view.querySelectorAll(".btnNewItem"), "click", onNewItemClick.bind(this));
        this.alphaPickerElement = view.querySelector(".alphaPicker");
        self.itemsContainer.fetchData = fetchData;
        self.itemsContainer.getItemsHtml = getItemsHtml;
        view.addEventListener("viewshow", function (e) {
            var isRestored = e.detail.isRestored;

            if (!isRestored) {
                loading.show();
                updateSortText(self);
                updateItemsContainerForViewType(self);
            }

            setTitle(null);
            getItem(params).then(function (item) {
                setTitle(item);
                self.currentItem = item;
                var refresh = !isRestored;
                self.itemsContainer.resume({
                    refresh: refresh
                }).then(function () {
                    loading.hide();

                    if (refresh) {
                        focusManager.autoFocus(self.itemsContainer);
                    }
                });

                if (!isRestored && item && "PhotoAlbum" !== item.Type) {
                    initAlphaPicker();
                }

                var itemType = item ? item.Type : null;

                if ("MusicGenre" === itemType || "Programs" !== params.type && "Channel" !== itemType) {
                    hideOrShowAll(view.querySelectorAll(".btnPlay"), false);
                } else {
                    hideOrShowAll(view.querySelectorAll(".btnPlay"), true);
                }

                if ("MusicGenre" === itemType || "Programs" !== params.type && "nextup" !== params.type && "Channel" !== itemType) {
                    hideOrShowAll(view.querySelectorAll(".btnShuffle"), false);
                } else {
                    hideOrShowAll(view.querySelectorAll(".btnShuffle"), true);
                }

                if (item && playbackManager.canQueue(item)) {
                    hideOrShowAll(view.querySelectorAll(".btnQueue"), false);
                } else {
                    hideOrShowAll(view.querySelectorAll(".btnQueue"), true);
                }
            });

            if (!isRestored) {
                bindAll(view.querySelectorAll(".btnPlay"), "click", play);
                bindAll(view.querySelectorAll(".btnQueue"), "click", queue);
                bindAll(view.querySelectorAll(".btnShuffle"), "click", shuffle);
            }

            this.alphaNumericShortcuts = new AlphaNumericShortcuts({
                itemsContainer: self.itemsContainer
            });
        });
        view.addEventListener("viewhide", function (e) {
            var itemsContainer = self.itemsContainer;

            if (itemsContainer) {
                itemsContainer.pause();
            }

            var alphaNumericShortcuts = self.alphaNumericShortcuts;

            if (alphaNumericShortcuts) {
                alphaNumericShortcuts.destroy();
                self.alphaNumericShortcuts = null;
            }
        });
        view.addEventListener("viewdestroy", function () {
            if (self.listController) {
                self.listController.destroy();
            }

            if (self.alphaPicker) {
                self.alphaPicker.off("alphavaluechanged", onAlphaPickerValueChanged);
                self.alphaPicker.destroy();
            }

            self.currentItem = null;
            self.scroller = null;
            self.itemsContainer = null;
            self.filterButtons = null;
            self.sortButtons = null;
            self.btnSortText = null;
            self.btnSortIcon = null;
            self.alphaPickerElement = null;
        });
    }

    ItemsView.prototype.getFilters = function () {
        var basekey = this.getSettingsKey();
        return {
            IsPlayed: "true" === userSettings.getFilter(basekey + "-filter-IsPlayed"),
            IsUnplayed: "true" === userSettings.getFilter(basekey + "-filter-IsUnplayed"),
            IsFavorite: "true" === userSettings.getFilter(basekey + "-filter-IsFavorite"),
            IsResumable: "true" === userSettings.getFilter(basekey + "-filter-IsResumable"),
            Is4K: "true" === userSettings.getFilter(basekey + "-filter-Is4K"),
            IsHD: "true" === userSettings.getFilter(basekey + "-filter-IsHD"),
            IsSD: "true" === userSettings.getFilter(basekey + "-filter-IsSD"),
            Is3D: "true" === userSettings.getFilter(basekey + "-filter-Is3D"),
            VideoTypes: userSettings.getFilter(basekey + "-filter-VideoTypes"),
            SeriesStatus: userSettings.getFilter(basekey + "-filter-SeriesStatus"),
            HasSubtitles: userSettings.getFilter(basekey + "-filter-HasSubtitles"),
            HasTrailer: userSettings.getFilter(basekey + "-filter-HasTrailer"),
            HasSpecialFeature: userSettings.getFilter(basekey + "-filter-HasSpecialFeature"),
            HasThemeSong: userSettings.getFilter(basekey + "-filter-HasThemeSong"),
            HasThemeVideo: userSettings.getFilter(basekey + "-filter-HasThemeVideo"),
            GenreIds: userSettings.getFilter(basekey + "-filter-GenreIds")
        };
    };

    ItemsView.prototype.getSortValues = function () {
        var basekey = this.getSettingsKey();
        return {
            sortBy: userSettings.getFilter(basekey + "-sortby") || this.getDefaultSortBy(),
            sortOrder: "Descending" === userSettings.getFilter(basekey + "-sortorder") ? "Descending" : "Ascending"
        };
    };

    ItemsView.prototype.getDefaultSortBy = function () {
        var params = this.params;
        var sortNameOption = this.getNameSortOption(params);

        if (params.type) {
            return sortNameOption.value;
        }

        return "IsFolder," + sortNameOption.value;
    };

    ItemsView.prototype.getSortMenuOptions = function () {
        var sortBy = [];
        var params = this.params;

        if ("Programs" === params.type) {
            sortBy.push({
                name: globalize.translate("AirDate"),
                value: "StartDate,SortName"
            });
        }

        var option = this.getNameSortOption(params);

        if (option) {
            sortBy.push(option);
        }

        option = this.getCommunityRatingSortOption();

        if (option) {
            sortBy.push(option);
        }

        option = this.getCriticRatingSortOption();

        if (option) {
            sortBy.push(option);
        }

        if ("Programs" !== params.type) {
            sortBy.push({
                name: globalize.translate("DateAdded"),
                value: "DateCreated,SortName"
            });
        }

        option = this.getDatePlayedSortOption();

        if (option) {
            sortBy.push(option);
        }

        if (!params.type) {
            option = this.getNameSortOption(params);
            sortBy.push({
                name: globalize.translate("Folders"),
                value: "IsFolder," + option.value
            });
        }

        sortBy.push({
            name: globalize.translate("ParentalRating"),
            value: "OfficialRating,SortName"
        });
        option = this.getPlayCountSortOption();

        if (option) {
            sortBy.push(option);
        }

        sortBy.push({
            name: globalize.translate("ReleaseDate"),
            value: "ProductionYear,PremiereDate,SortName"
        });
        sortBy.push({
            name: globalize.translate("Runtime"),
            value: "Runtime,SortName"
        });
        return sortBy;
    };

    ItemsView.prototype.getNameSortOption = function (params) {
        if ("Episode" === params.type) {
            return {
                name: globalize.translate("Name"),
                value: "SeriesName,SortName"
            };
        }

        return {
            name: globalize.translate("Name"),
            value: "SortName"
        };
    };

    ItemsView.prototype.getPlayCountSortOption = function () {
        if ("Programs" === this.params.type) {
            return null;
        }

        return {
            name: globalize.translate("PlayCount"),
            value: "PlayCount,SortName"
        };
    };

    ItemsView.prototype.getDatePlayedSortOption = function () {
        if ("Programs" === this.params.type) {
            return null;
        }

        return {
            name: globalize.translate("DatePlayed"),
            value: "DatePlayed,SortName"
        };
    };

    ItemsView.prototype.getCriticRatingSortOption = function () {
        if ("Programs" === this.params.type) {
            return null;
        }

        return {
            name: globalize.translate("CriticRating"),
            value: "CriticRating,SortName"
        };
    };

    ItemsView.prototype.getCommunityRatingSortOption = function () {
        return {
            name: globalize.translate("CommunityRating"),
            value: "CommunityRating,SortName"
        };
    };

    ItemsView.prototype.getVisibleFilters = function () {
        var filters = [];
        var params = this.params;

        if (!("nextup" === params.type)) {
            if ("Programs" === params.type) {
                filters.push("Genres");
            } else {
                params.type;
                filters.push("IsUnplayed");
                filters.push("IsPlayed");

                if (!params.IsFavorite) {
                    filters.push("IsFavorite");
                }

                filters.push("IsResumable");
                filters.push("VideoType");
                filters.push("HasSubtitles");
                filters.push("HasTrailer");
                filters.push("HasSpecialFeature");
                filters.push("HasThemeSong");
                filters.push("HasThemeVideo");
            }
        }

        return filters;
    };

    ItemsView.prototype.setFilterStatus = function (hasFilters) {
        this.hasFilters = hasFilters;
        var filterButtons = this.filterButtons;

        if (filterButtons.length) {
            for (var i = 0, length = filterButtons.length; i < length; i++) {
                var btnFilter = filterButtons[i];
                var bubble = btnFilter.querySelector(".filterButtonBubble");

                if (!bubble) {
                    if (!hasFilters) {
                        continue;
                    }

                    btnFilter.insertAdjacentHTML("afterbegin", '<div class="filterButtonBubble">!</div>');
                    btnFilter.classList.add("btnFilterWithBubble");
                    bubble = btnFilter.querySelector(".filterButtonBubble");
                }

                if (hasFilters) {
                    bubble.classList.remove("hide");
                } else {
                    bubble.classList.add("hide");
                }
            }
        }
    };

    ItemsView.prototype.getFilterMenuOptions = function () {
        var params = this.params;
        return {
            IsAiring: params.IsAiring,
            IsMovie: params.IsMovie,
            IsSports: params.IsSports,
            IsKids: params.IsKids,
            IsNews: params.IsNews,
            IsSeries: params.IsSeries,
            Recursive: this.queryRecursive
        };
    };

    ItemsView.prototype.getVisibleViewSettings = function () {
        var item = (this.params, this.currentItem);
        var fields = ["showTitle"];

        if (!item || "PhotoAlbum" !== item.Type && "ChannelFolderItem" !== item.Type) {
            fields.push("imageType");
        }

        fields.push("viewType");
        return fields;
    };

    ItemsView.prototype.getViewSettings = function () {
        var basekey = this.getSettingsKey();
        var params = this.params;
        var item = this.currentItem;
        var showTitle = userSettings.get(basekey + "-showTitle");

        if ("true" === showTitle) {
            showTitle = true;
        } else if ("false" === showTitle) {
            showTitle = false;
        } else if ("Programs" === params.type || "Recordings" === params.type || "Person" === params.type || "nextup" === params.type || "Audio" === params.type || "MusicAlbum" === params.type || "MusicArtist" === params.type) {
            showTitle = true;
        } else if (item && "PhotoAlbum" !== item.Type) {
            showTitle = true;
        }

        var imageType = userSettings.get(basekey + "-imageType");

        if (!imageType && "nextup" === params.type) {
            imageType = "thumb";
        }

        return {
            showTitle: showTitle,
            showYear: "false" !== userSettings.get(basekey + "-showYear"),
            imageType: imageType || "primary",
            viewType: userSettings.get(basekey + "-viewType") || "images"
        };
    };

    ItemsView.prototype.getItemTypes = function () {
        var params = this.params;

        if ("nextup" === params.type) {
            return ["Episode"];
        }

        if ("Programs" === params.type) {
            return ["Program"];
        }

        return [];
    };

    ItemsView.prototype.getSettingsKey = function () {
        var values = [];
        values.push("items");
        var params = this.params;

        if (params.type) {
            values.push(params.type);
        } else if (params.parentId) {
            values.push(params.parentId);
        }

        if (params.IsAiring) {
            values.push("IsAiring");
        }

        if (params.IsMovie) {
            values.push("IsMovie");
        }

        if (params.IsKids) {
            values.push("IsKids");
        }

        if (params.IsSports) {
            values.push("IsSports");
        }

        if (params.IsNews) {
            values.push("IsNews");
        }

        if (params.IsSeries) {
            values.push("IsSeries");
        }

        if (params.IsFavorite) {
            values.push("IsFavorite");
        }

        if (params.genreId) {
            values.push("Genre");
        }

        if (params.musicGenreId) {
            values.push("MusicGenre");
        }

        if (params.studioId) {
            values.push("Studio");
        }

        if (params.personId) {
            values.push("Person");
        }

        if (params.parentId) {
            values.push("Folder");
        }

        return values.join("-");
    };

    return ItemsView;
});
