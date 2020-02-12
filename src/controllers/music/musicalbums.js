define(["layoutManager", "playbackManager", "loading", "events", "libraryBrowser", "imageLoader", "alphaPicker", "listView", "cardBuilder", "apphost", "emby-itemscontainer"], function (layoutManager, playbackManager, loading, events, libraryBrowser, imageLoader, alphaPicker, listView, cardBuilder, appHost) {
    "use strict";

    return function (view, params, tabContent) {
        function playAll() {
            ApiClient.getItem(ApiClient.getCurrentUserId(), params.topParentId).then(function (item) {
                playbackManager.play({
                    items: [item]
                });
            });
        }

        function shuffle() {
            ApiClient.getItem(ApiClient.getCurrentUserId(), params.topParentId).then(function (item) {
                getQuery();
                playbackManager.shuffle(item, null);
            });
        }

        function getPageData() {
            var key = getSavedQueryKey();

            if (!pageData) {
                pageData = {
                    query: {
                        SortBy: "SortName",
                        SortOrder: "Ascending",
                        IncludeItemTypes: "MusicAlbum",
                        Recursive: true,
                        Fields: "PrimaryImageAspectRatio,SortName,BasicSyncInfo",
                        ImageTypeLimit: 1,
                        EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                        StartIndex: 0,
                        Limit: pageSize
                    },
                    view: libraryBrowser.getSavedView(key) || "Poster"
                };
                pageData.query.ParentId = params.topParentId;
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery() {
            return getPageData().query;
        }

        function getSavedQueryKey() {
            if (!savedQueryKey) {
                savedQueryKey = libraryBrowser.getSavedQueryKey("musicalbums");
            }

            return savedQueryKey;
        }

        function onViewStyleChange() {
            var viewStyle = self.getCurrentViewStyle();
            var itemsContainer = tabContent.querySelector(".itemsContainer");

            if ("List" == viewStyle) {
                itemsContainer.classList.add("vertical-list");
                itemsContainer.classList.remove("vertical-wrap");
            } else {
                itemsContainer.classList.remove("vertical-list");
                itemsContainer.classList.add("vertical-wrap");
            }

            itemsContainer.innerHTML = "";
        }

        function reloadItems(page) {
            loading.show();
            isLoading = true;
            var query = getQuery();
            ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
                function onNextPageClick() {
                    if (isLoading) {
                        return;
                    }

                    query.StartIndex += query.Limit;
                    reloadItems(tabContent);
                }

                function onPreviousPageClick() {
                    if (isLoading) {
                        return;
                    }

                    query.StartIndex -= query.Limit;
                    reloadItems(tabContent);
                }

                window.scrollTo(0, 0);
                updateFilterControls(page);
                var html;
                var pagingHtml = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false,
                    updatePageSizeSetting: false,
                    addLayoutButton: false,
                    sortButton: false,
                    filterButton: false
                });
                var viewStyle = self.getCurrentViewStyle();
                if (viewStyle == "List") {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        context: "music",
                        sortBy: query.SortBy,
                        addToListButton: true
                    });
                } else if (viewStyle == "PosterCard") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "square",
                        context: "music",
                        showTitle: true,
                        coverImage: true,
                        showParentTitle: true,
                        lazy: true,
                        cardLayout: true
                    });
                } else {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "square",
                        context: "music",
                        showTitle: true,
                        showParentTitle: true,
                        lazy: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                }
                var i;
                var length;
                var elems = tabContent.querySelectorAll(".paging");

                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].innerHTML = pagingHtml;
                }

                elems = tabContent.querySelectorAll(".btnNextPage");
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener("click", onNextPageClick);
                }

                elems = tabContent.querySelectorAll(".btnPreviousPage");
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener("click", onPreviousPageClick);
                }

                var itemsContainer = tabContent.querySelector(".itemsContainer");
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();
                isLoading = false;

                require(["autoFocuser"], function (autoFocuser) {
                    autoFocuser.autoFocus(tabContent);
                });
            });
        }

        function updateFilterControls(tabContent) {
            var query = getQuery();
            self.alphaPicker.value(query.NameStartsWithOrGreater);
        }

        var savedQueryKey;
        var pageData;
        var self = this;
        var pageSize = 100;
        var isLoading = false;

        self.showFilterMenu = function () {
            require(["components/filterdialog/filterdialog"], function (filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery(),
                    mode: "albums",
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, "filterchange", function () {
                    getQuery().StartIndex = 0;
                    reloadItems(tabContent);
                });
                filterDialog.show();
            });
        };

        self.getCurrentViewStyle = function () {
            return getPageData().view;
        };

        function initPage(tabContent) {
            var alphaPickerElement = tabContent.querySelector(".alphaPicker");
            var itemsContainer = tabContent.querySelector(".itemsContainer");

            alphaPickerElement.addEventListener("alphavaluechanged", function (e) {
                var newValue = e.detail.value;
                var query = getQuery();
                query.NameStartsWithOrGreater = newValue;
                query.StartIndex = 0;
                reloadItems(tabContent);
            });
            self.alphaPicker = new alphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: "click"
            });

            tabContent.querySelector(".alphaPicker").classList.add("alphabetPicker-right");
            alphaPickerElement.classList.add("alphaPicker-fixed-right");
            itemsContainer.classList.add("padded-right-withalphapicker");

            tabContent.querySelector(".btnFilter").addEventListener("click", function () {
                self.showFilterMenu();
            });
            tabContent.querySelector(".btnSort").addEventListener("click", function (e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: Globalize.translate("OptionNameSort"),
                        id: "SortName"
                    }, {
                        name: Globalize.translate("OptionAlbumArtist"),
                        id: "AlbumArtist,SortName"
                    }, {
                        name: Globalize.translate("OptionCommunityRating"),
                        id: "CommunityRating,SortName"
                    }, {
                        name: Globalize.translate("OptionCriticRating"),
                        id: "CriticRating,SortName"
                    }, {
                        name: Globalize.translate("OptionDateAdded"),
                        id: "DateCreated,SortName"
                    }, {
                        name: Globalize.translate("OptionReleaseDate"),
                        id: "ProductionYear,PremiereDate,SortName"
                    }, {
                        name: Globalize.translate("OptionRandom"),
                        id: "Random,SortName"
                    }],
                    callback: function () {
                        getQuery().StartIndex = 0;
                        reloadItems(tabContent);
                    },
                    query: getQuery(),
                    button: e.target
                });
            });
            var btnSelectView = tabContent.querySelector(".btnSelectView");
            btnSelectView.addEventListener("click", function (e) {
                libraryBrowser.showLayoutMenu(e.target, self.getCurrentViewStyle(), "List,Poster,PosterCard".split(","));
            });
            btnSelectView.addEventListener("layoutchange", function (e) {
                var viewStyle = e.detail.viewStyle;
                getPageData().view = viewStyle;
                libraryBrowser.saveViewSetting(getSavedQueryKey(), viewStyle);
                getQuery().StartIndex = 0;
                onViewStyleChange();
                reloadItems(tabContent);
            });
            tabContent.querySelector(".btnPlayAll").addEventListener("click", playAll);
            tabContent.querySelector(".btnShuffle").addEventListener("click", shuffle);
        }

        initPage(tabContent);
        onViewStyleChange();

        self.renderTab = function () {
            reloadItems(tabContent);
            updateFilterControls(tabContent);
        };

        self.destroy = function () {};
    };
});
