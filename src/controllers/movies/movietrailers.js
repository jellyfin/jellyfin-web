define(["layoutManager", "loading", "events", "libraryBrowser", "imageLoader", "alphaPicker", "listView", "cardBuilder", "apphost", "emby-itemscontainer"], function (layoutManager, loading, events, libraryBrowser, imageLoader, alphaPicker, listView, cardBuilder, appHost) {
    "use strict";

    return function (view, params, tabContent) {
        function getPageData(context) {
            var key = getSavedQueryKey(context);
            var pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: "SortName",
                        SortOrder: "Ascending",
                        IncludeItemTypes: "Trailer",
                        Recursive: true,
                        Fields: "PrimaryImageAspectRatio,SortName,BasicSyncInfo",
                        ImageTypeLimit: 1,
                        EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                        StartIndex: 0,
                        Limit: pageSize
                    },
                    view: libraryBrowser.getSavedView(key) || "Poster"
                };
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery(context) {
            return getPageData(context).query;
        }

        function getSavedQueryKey(context) {
            if (!context.savedQueryKey) {
                context.savedQueryKey = libraryBrowser.getSavedQueryKey("trailers");
            }

            return context.savedQueryKey;
        }

        function reloadItems() {
            loading.show();
            isLoading = true;
            var query = getQuery(tabContent);
            ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
                function onNextPageClick() {
                    if (isLoading) {
                        return;
                    }

                    query.StartIndex += query.Limit;
                    reloadItems();
                }

                function onPreviousPageClick() {
                    if (isLoading) {
                        return;
                    }

                    query.StartIndex -= query.Limit;
                    reloadItems();
                }

                window.scrollTo(0, 0);
                updateFilterControls(tabContent);
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
                var html;
                var viewStyle = self.getCurrentViewStyle();

                if (viewStyle == "Thumb") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "backdrop",
                        preferThumb: true,
                        context: "movies",
                        overlayPlayButton: true
                    });
                } else if (viewStyle == "ThumbCard") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "backdrop",
                        preferThumb: true,
                        context: "movies",
                        cardLayout: true,
                        showTitle: true,
                        showYear: true,
                        centerText: true
                    });
                } else if (viewStyle == "Banner") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "banner",
                        preferBanner: true,
                        context: "movies"
                    });
                } else if (viewStyle == "List") {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        context: "movies",
                        sortBy: query.SortBy
                    });
                } else if (viewStyle == "PosterCard") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "portrait",
                        context: "movies",
                        showTitle: true,
                        showYear: true,
                        cardLayout: true,
                        centerText: true
                    });
                } else {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "portrait",
                        context: "movies",
                        centerText: true,
                        overlayPlayButton: true,
                        showTitle: true,
                        showYear: true
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

                if (!result.Items.length) {
                    html = '<p style="text-align:center;">' + Globalize.translate("MessageNoTrailersFound") + "</p>";
                }

                var itemsContainer = tabContent.querySelector(".itemsContainer");
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(tabContent), query);
                loading.hide();
                isLoading = false;
            });
        }

        function updateFilterControls(tabContent) {
            var query = getQuery(tabContent);
            self.alphaPicker.value(query.NameStartsWithOrGreater);
        }

        var self = this;
        var pageSize = 100;
        var data = {};
        var isLoading = false;

        self.showFilterMenu = function () {
            require(["components/filterdialog/filterdialog"], function (filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery(tabContent),
                    mode: "movies",
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, "filterchange", function () {
                    getQuery(tabContent).StartIndex = 0;
                    reloadItems();
                });
                filterDialog.show();
            });
        };

        self.getCurrentViewStyle = function () {
            return getPageData(tabContent).view;
        };

        function initPage(tabContent) {
            var alphaPickerElement = tabContent.querySelector(".alphaPicker");
            var itemsContainer = tabContent.querySelector(".itemsContainer");
            alphaPickerElement.addEventListener("alphavaluechanged", function (e) {
                var newValue = e.detail.value;
                var query = getQuery(tabContent);
                query.NameStartsWithOrGreater = newValue;
                query.StartIndex = 0;
                reloadItems();
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
                        name: Globalize.translate("OptionImdbRating"),
                        id: "CommunityRating,SortName"
                    }, {
                        name: Globalize.translate("OptionDateAdded"),
                        id: "DateCreated,SortName"
                    }, {
                        name: Globalize.translate("OptionDatePlayed"),
                        id: "DatePlayed,SortName"
                    }, {
                        name: Globalize.translate("OptionParentalRating"),
                        id: "OfficialRating,SortName"
                    }, {
                        name: Globalize.translate("OptionPlayCount"),
                        id: "PlayCount,SortName"
                    }, {
                        name: Globalize.translate("OptionReleaseDate"),
                        id: "PremiereDate,SortName"
                    }],
                    callback: function () {
                        getQuery(tabContent).StartIndex = 0;
                        reloadItems();
                    },
                    query: getQuery(tabContent),
                    button: e.target
                });
            });
        }

        initPage(tabContent);

        self.renderTab = function () {
            reloadItems();
            updateFilterControls(tabContent);
        };

        self.destroy = function () {};
    };
});
