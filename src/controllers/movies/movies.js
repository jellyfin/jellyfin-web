define(["loading", "layoutManager", "userSettings", "events", "libraryBrowser", "alphaPicker", "listView", "cardBuilder", "emby-itemscontainer"],
       function(loading, layoutManager, userSettings, events, libraryBrowser, alphaPicker, listView, cardBuilder) {
    "use strict";
    return function(view, params, tabContent, options) {
        function onViewStyleChange() {
            if (self.getCurrentViewStyle() == "List") {
                itemsContainer.classList.add("vertical-list");
                itemsContainer.classList.remove("vertical-wrap");
            } else {
                itemsContainer.classList.remove("vertical-list");
                itemsContainer.classList.add("vertical-wrap");
            }
            itemsContainer.innerHTML = "";
        }

        function updateFilterControls() {
            self.alphaPicker && self.alphaPicker.value(query.NameStartsWithOrGreater)
        }

        function fetchData() {
            isLoading = true;
            loading.show();
            return ApiClient.getItems(ApiClient.getCurrentUserId(), query)
        }

        function afterRefresh(result) {
            function onNextPageClick() {
                if (isLoading) return;
                query.StartIndex += query.Limit;
                itemsContainer.refreshItems();
            }

            function onPreviousPageClick() {
                if (isLoading) return;
                query.StartIndex -= query.Limit;
                itemsContainer.refreshItems();
            }
            window.scrollTo(0, 0);
            updateFilterControls();
            var i, length, elems, pagingHtml = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: !1,
                    updatePageSizeSetting: !1,
                    addLayoutButton: !1,
                    sortButton: !1,
                    filterButton: !1
                });
            for (elems = tabContent.querySelectorAll(".paging"), i = 0, length = elems.length; i < length; i++)
                elems[i].innerHTML = pagingHtml;
            for (elems = tabContent.querySelectorAll(".btnNextPage"), i = 0, length = elems.length; i < length; i++)
                elems[i].addEventListener("click", onNextPageClick);
            for (elems = tabContent.querySelectorAll(".btnPreviousPage"), i = 0, length = elems.length; i < length; i++)
                elems[i].addEventListener("click", onPreviousPageClick)
            isLoading = false;
            loading.hide();
        }

        function getItemsHtml(items) {
            var viewStyle = self.getCurrentViewStyle();
            return "Thumb" == viewStyle ? cardBuilder.getCardsHtml({
                items: items,
                shape: "backdrop",
                preferThumb: !0,
                context: "movies",
                lazy: !0,
                overlayPlayButton: !0,
                showTitle: !0,
                showYear: !0,
                centerText: !0
            }) : "ThumbCard" == viewStyle ? cardBuilder.getCardsHtml({
                items: items,
                shape: "backdrop",
                preferThumb: !0,
                context: "movies",
                lazy: !0,
                cardLayout: !0,
                showTitle: !0,
                showYear: !0,
                centerText: !0
            }) : "Banner" == viewStyle ? cardBuilder.getCardsHtml({
                items: items,
                shape: "banner",
                preferBanner: !0,
                context: "movies",
                lazy: !0
            }) : "List" == viewStyle ? listView.getListViewHtml({
                items: items,
                context: "movies",
                sortBy: query.SortBy
            }) : "PosterCard" == viewStyle ? cardBuilder.getCardsHtml({
                items: items,
                shape: "portrait",
                context: "movies",
                showTitle: !0,
                showYear: !0,
                centerText: !0,
                lazy: !0,
                cardLayout: !0
            }) : cardBuilder.getCardsHtml({
                items: items,
                shape: "portrait",
                context: "movies",
                overlayPlayButton: !0,
                showTitle: !0,
                showYear: !0,
                centerText: !0
            })
        }

        function initPage(tabContent) {
            itemsContainer.fetchData = fetchData;
            itemsContainer.getItemsHtml = getItemsHtml;
            itemsContainer.afterRefresh = afterRefresh;
            var alphaPickerElement = tabContent.querySelector(".alphaPicker");
            if (alphaPickerElement) {
                alphaPickerElement.addEventListener("alphavaluechanged", function(e) {
                    var newValue = e.detail.value;
                    query.NameStartsWithOrGreater = newValue;
                    query.StartIndex = 0;
                    itemsContainer.refreshItems();
                });
                self.alphaPicker = new alphaPicker({
                    element: alphaPickerElement,
                    valueChangeEvent: "click"
                });
                if (layoutManager.desktop || layoutManager.mobile) {
                    alphaPickerElement.classList.add("alphabetPicker-right");
                    itemsContainer.classList.remove("padded-left-withalphapicker");
                    itemsContainer.classList.add("padded-right-withalphapicker");
                }
            }
            var btnFilter = tabContent.querySelector(".btnFilter");
            btnFilter && btnFilter.addEventListener("click", function() {
                self.showFilterMenu()
            });
            var btnSort = tabContent.querySelector(".btnSort");
            btnSort && btnSort.addEventListener("click", function(e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: Globalize.translate("OptionNameSort"),
                        id: "SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionImdbRating"),
                        id: "CommunityRating,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionCriticRating"),
                        id: "CriticRating,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionDateAdded"),
                        id: "DateCreated,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionDatePlayed"),
                        id: "DatePlayed,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionParentalRating"),
                        id: "OfficialRating,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionPlayCount"),
                        id: "PlayCount,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionReleaseDate"),
                        id: "PremiereDate,SortName,ProductionYear"
                    }, {
                        name: Globalize.translate("OptionRuntime"),
                        id: "Runtime,SortName,ProductionYear"
                    }],
                    callback: function() {
                        query.StartIndex = 0, userSettings.saveQuerySettings(savedQueryKey, query), itemsContainer.refreshItems()
                    },
                    query: query,
                    button: e.target
                })
            });
            var btnSelectView = tabContent.querySelector(".btnSelectView");
            btnSelectView.addEventListener("click", function(e) {
                libraryBrowser.showLayoutMenu(e.target, self.getCurrentViewStyle(), "Banner,List,Poster,PosterCard,Thumb,ThumbCard".split(","))
            }), btnSelectView.addEventListener("layoutchange", function(e) {
                var viewStyle = e.detail.viewStyle;
                userSettings.set(savedViewKey, viewStyle);
                query.StartIndex = 0;
                onViewStyleChange();
                itemsContainer.refreshItems();
            })
        }
        var self = this,
            itemsContainer = tabContent.querySelector(".itemsContainer"),
            savedQueryKey = params.topParentId + "-" + options.mode,
            savedViewKey = savedQueryKey + "-view",
            query = {
                SortBy: "SortName,ProductionYear",
                SortOrder: "Ascending",
                IncludeItemTypes: "Movie",
                Recursive: !0,
                Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                StartIndex: 0,
                Limit: 100,
                ParentId: params.topParentId
            },
            isLoading = false;
        if (options.mode === "favorites") query.IsFavorite = true;
        query = userSettings.loadQuerySettings(savedQueryKey, query);
        self.showFilterMenu = function() {
            require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: query,
                    mode: "movies",
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, "filterchange", function() {
                    query.StartIndex = 0, itemsContainer.refreshItems()
                }), filterDialog.show()
            })
        };
        self.getCurrentViewStyle = function() {
            return userSettings.get(savedViewKey) || "Poster"
        };
        self.initTab = function() {
            initPage(tabContent);
            onViewStyleChange();
        };
        self.renderTab = function() {
            itemsContainer.refreshItems();
            updateFilterControls();
        };
        self.destroy = function() {
            itemsContainer = null
        }
    }
});
