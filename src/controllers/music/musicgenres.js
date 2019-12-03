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
                        Recursive: true,
                        Fields: "PrimaryImageAspectRatio,ItemCounts",
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
            return ApiClient.getGenres(ApiClient.getCurrentUserId(), query);
        }

        function reloadItems(context, promise) {
            var query = getQuery();
            promise.then(function (result) {
                var html = "";
                var viewStyle = self.getCurrentViewStyle();

                if (viewStyle == "Thumb") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "backdrop",
                        preferThumb: true,
                        context: 'music',
                        centerText: true,
                        overlayMoreButton: true,
                        showTitle: true
                    });
                } else if (viewStyle == "ThumbCard") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "backdrop",
                        preferThumb: true,
                        context: 'music',
                        cardLayout: true,
                        showTitle: true
                    });
                } else if (viewStyle == "PosterCard") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "auto",
                        context: 'music',
                        cardLayout: true,
                        showTitle: true
                    });
                } else if (viewStyle == "Poster") {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: "auto",
                        context: 'music',
                        centerText: true,
                        overlayMoreButton: true,
                        showTitle: true
                    });
                }

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

        function fullyReload() {
            self.preRender();
            self.renderTab();
        }

        var self = this;
        var data = {};

        self.getViewStyles = function () {
            return "Poster,PosterCard,Thumb,ThumbCard".split(",");
        };

        self.getCurrentViewStyle = function () {
            return getPageData(tabContent).view;
        };

        self.setCurrentViewStyle = function (viewStyle) {
            getPageData(tabContent).view = viewStyle;
            libraryBrowser.saveViewSetting(getSavedQueryKey(tabContent), viewStyle);
            fullyReload();
        };

        self.enableViewSelection = true;
        var promise;

        self.preRender = function () {
            promise = getPromise();
        };

        self.renderTab = function () {
            reloadItems(tabContent, promise);
        };
    };
});
