define(["libraryBrowser", "cardBuilder", "apphost", "imageLoader", "loading"], function (libraryBrowser, cardBuilder, appHost, imageLoader, loading) {
    "use strict";

    return function (view, params, tabContent) {
        function getPageData() {
            var key = getSavedQueryKey();
            var pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: "SortName",
                        SortOrder: "Ascending",
                        IncludeItemTypes: "Playlist",
                        Recursive: true,
                        Fields: "PrimaryImageAspectRatio,SortName,CanDelete",
                        StartIndex: 0
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
            return libraryBrowser.getSavedQueryKey("genres");
        }

        function getPromise() {
            loading.show();
            var query = getQuery();
            return ApiClient.getItems(ApiClient.getCurrentUserId(), query);
        }

        function reloadItems(context, promise) {
            var query = getQuery();
            promise.then(function (result) {
                var html = "";
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "square",
                    showTitle: true,
                    coverImage: true,
                    centerText: true,
                    overlayPlayButton: true,
                    allowBottomPadding: true,
                    cardLayout: false
                });
                var elem = context.querySelector("#items");
                elem.innerHTML = html;
                imageLoader.lazyChildren(elem);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();

                require(["autoFocuser"], function (autoFocuser) {
                    autoFocuser.autoFocus(context);
                });
            });
        }

        var self = this;
        var data = {};

        self.getCurrentViewStyle = function () {
            return getPageData(tabContent).view;
        };

        var promise;

        self.preRender = function () {
            promise = getPromise();
        };

        self.renderTab = function () {
            reloadItems(tabContent, promise);
        };
    };
});
