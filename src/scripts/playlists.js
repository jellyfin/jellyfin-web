define(["loading", "listView", "cardBuilder", "libraryMenu", "libraryBrowser", "apphost", "imageLoader", "emby-itemscontainer"], function (loading, listView, cardBuilder, libraryMenu, libraryBrowser, appHost, imageLoader) {
    "use strict";

    return function (view, params) {
        function getPageData(context) {
            var key = getSavedQueryKey(context);
            var pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: "SortName",
                        SortOrder: "Ascending",
                        IncludeItemTypes: "Playlist",
                        Recursive: true,
                        Fields: "PrimaryImageAspectRatio,SortName,CumulativeRunTimeTicks,CanDelete",
                        StartIndex: 0,
                        Limit: 100
                    },
                    view: libraryBrowser.getSavedView(key) || "Poster"
                };
                pageData.query.ParentId = libraryMenu.getTopParentId();
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery(context) {
            return getPageData(context).query;
        }

        function getSavedQueryKey(context) {
            if (!context.savedQueryKey) {
                context.savedQueryKey = libraryBrowser.getSavedQueryKey();
            }

            return context.savedQueryKey;
        }

        function showLoadingMessage() {
            loading.show();
        }

        function hideLoadingMessage() {
            loading.hide();
        }

        function onViewStyleChange() {
            var viewStyle = getPageData(view).view;
            var itemsContainer = view.querySelector(".itemsContainer");

            if ("List" == viewStyle) {
                itemsContainer.classList.add("vertical-list");
                itemsContainer.classList.remove("vertical-wrap");
            } else {
                itemsContainer.classList.remove("vertical-list");
                itemsContainer.classList.add("vertical-wrap");
            }

            itemsContainer.innerHTML = "";
        }

        function reloadItems() {
            showLoadingMessage();
            var query = getQuery(view);
            var promise1 = ApiClient.getItems(Dashboard.getCurrentUserId(), query);
            var promise2 = Dashboard.getCurrentUser();
            Promise.all([promise1, promise2]).then(function (responses) {
                var result = responses[0];
                responses[1];
                window.scrollTo(0, 0);
                var html = "";
                var viewStyle = getPageData(view).view;
                view.querySelector(".listTopPaging").innerHTML = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    viewButton: false,
                    showLimit: false,
                    updatePageSizeSetting: false,
                    addLayoutButton: true,
                    layouts: "List,Poster,PosterCard,Thumb,ThumbCard",
                    currentLayout: viewStyle
                });

                if (result.TotalRecordCount) {
                    if (viewStyle == "List") {
                        html = listView.getListViewHtml({
                            items: result.Items,
                            sortBy: query.SortBy
                        });
                    } else if (viewStyle == "PosterCard") {
                        html = cardBuilder.getCardsHtml({
                            items: result.Items,
                            shape: "square",
                            coverImage: true,
                            showTitle: true,
                            cardLayout: true
                        });
                    } else if (viewStyle == "Thumb") {
                        html = cardBuilder.getCardsHtml({
                            items: result.Items,
                            shape: "backdrop",
                            showTitle: true,
                            centerText: true,
                            preferThumb: true,
                            overlayPlayButton: true
                        });
                    } else if (viewStyle == "ThumbCard") {
                        html = cardBuilder.getCardsHtml({
                            items: result.Items,
                            shape: "backdrop",
                            showTitle: true,
                            preferThumb: true,
                            cardLayout: true
                        });
                    } else {
                        html = cardBuilder.getCardsHtml({
                            items: result.Items,
                            shape: "square",
                            showTitle: true,
                            coverImage: true,
                            centerText: true,
                            overlayPlayButton: true
                        });
                    }
                    view.querySelector(".noItemsMessage").classList.add("hide");
                } else {
                    view.querySelector(".noItemsMessage").classList.remove("hide");
                }

                var elem = view.querySelector(".itemsContainer");
                elem.innerHTML = html;
                imageLoader.lazyChildren(elem);
                var btnNextPage = view.querySelector(".btnNextPage");

                if (btnNextPage) {
                    btnNextPage.addEventListener("click", function () {
                        query.StartIndex += query.Limit;
                        reloadItems();
                    });
                }

                var btnPreviousPage = view.querySelector(".btnPreviousPage");

                if (btnPreviousPage) {
                    btnPreviousPage.addEventListener("click", function () {
                        query.StartIndex -= query.Limit;
                        reloadItems();
                    });
                }

                var btnChangeLayout = view.querySelector(".btnChangeLayout");

                if (btnChangeLayout) {
                    btnChangeLayout.addEventListener("layoutchange", function (e) {
                        var layout = e.detail.viewStyle;
                        getPageData(view).view = layout;
                        libraryBrowser.saveViewSetting(getSavedQueryKey(view), layout);
                        onViewStyleChange();
                        reloadItems();
                    });
                }

                libraryBrowser.saveQueryValues(getSavedQueryKey(view), query);
                hideLoadingMessage();
            });
        }

        var data = {};
        view.addEventListener("viewbeforeshow", function () {
            reloadItems();
        });
        view.querySelector(".btnNewPlaylist").addEventListener("click", function () {
            require(["playlistEditor"], function (playlistEditor) {
                var serverId = ApiClient.serverInfo().Id;
                new playlistEditor().show({
                    items: [],
                    serverId: serverId
                });
            });
        });
        onViewStyleChange();
    };
});
