define(["layoutManager", "loading", "libraryBrowser", "cardBuilder", "lazyLoader", "apphost", "globalize", "appRouter", "dom", "emby-button"], function (layoutManager, loading, libraryBrowser, cardBuilder, lazyLoader, appHost, globalize, appRouter, dom) {
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
                        IncludeItemTypes: "Movie",
                        Recursive: true,
                        EnableTotalRecordCount: false
                    },
                    view: "Poster"
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
            return libraryBrowser.getSavedQueryKey("moviegenres");
        }

        function getPromise() {
            loading.show();
            var query = getQuery();
            return ApiClient.getGenres(ApiClient.getCurrentUserId(), query);
        }

        function enableScrollX() {
            return !layoutManager.desktop;
        }

        function getThumbShape() {
            return enableScrollX() ? "overflowBackdrop" : "backdrop";
        }

        function getPortraitShape() {
            return enableScrollX() ? "overflowPortrait" : "portrait";
        }

        function fillItemsContainer(elem) {
            var id = elem.getAttribute("data-id");
            var viewStyle = self.getCurrentViewStyle();
            var limit = "Thumb" == viewStyle || "ThumbCard" == viewStyle ? 5 : 9;

            if (enableScrollX()) {
                limit = 10;
            }

            var enableImageTypes = "Thumb" == viewStyle || "ThumbCard" == viewStyle ? "Primary,Backdrop,Thumb" : "Primary";
            var query = {
                SortBy: "SortName",
                SortOrder: "Ascending",
                IncludeItemTypes: "Movie",
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
                ImageTypeLimit: 1,
                EnableImageTypes: enableImageTypes,
                Limit: limit,
                GenreIds: id,
                EnableTotalRecordCount: false,
                ParentId: params.topParentId
            };
            ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
                var supportsImageAnalysis = appHost.supports("imageanalysis");

                if (viewStyle == "Thumb") {
                    cardBuilder.buildCards(result.Items, {
                        itemsContainer: elem,
                        shape: getThumbShape(),
                        preferThumb: true,
                        showTitle: true,
                        scalable: true,
                        centerText: true,
                        overlayMoreButton: true,
                        allowBottomPadding: false
                    });
                } else if (viewStyle == "ThumbCard") {
                    cardBuilder.buildCards(result.Items, {
                        itemsContainer: elem,
                        shape: getThumbShape(),
                        preferThumb: true,
                        showTitle: true,
                        scalable: true,
                        centerText: false,
                        cardLayout: true,
                        showYear: true
                    });
                } else if (viewStyle == "PosterCard") {
                    cardBuilder.buildCards(result.Items, {
                        itemsContainer: elem,
                        shape: getPortraitShape(),
                        showTitle: true,
                        scalable: true,
                        centerText: false,
                        cardLayout: true,
                        showYear: true
                    });
                } else if (viewStyle == "Poster") {
                    cardBuilder.buildCards(result.Items, {
                        itemsContainer: elem,
                        shape: getPortraitShape(),
                        scalable: true,
                        overlayMoreButton: true,
                        allowBottomPadding: true,
                        showTitle: true,
                        centerText: true,
                        showYear: true
                    });
                }
                if (result.Items.length >= query.Limit) {
                    tabContent.querySelector(".btnMoreFromGenre" + id + " i").classList.remove("hide");
                }
            });
        }

        function reloadItems(context, promise) {
            var query = getQuery();
            promise.then(function (result) {
                var elem = context.querySelector("#items");
                var html = "";
                var items = result.Items;

                for (var i = 0, length = items.length; i < length; i++) {
                    var item = items[i];

                    html += '<div class="verticalSection">';
                    html += '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
                    html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item, {
                        context: "movies",
                        parentId: params.topParentId
                    }) + '" class="more button-flat button-flat-mini sectionTitleTextButton btnMoreFromGenre' + item.Id + '">';
                    html += '<h2 class="sectionTitle sectionTitle-cards">';
                    html += item.Name;
                    html += "</h2>";
                    html += '<i class="material-icons hide chevron_right"></i>';
                    html += "</a>";
                    html += "</div>";
                    if (enableScrollX()) {
                        var scrollXClass = "scrollX hiddenScrollX";

                        if (layoutManager.tv) {
                            scrollXClass += "smoothScrollX padded-top-focusscale padded-bottom-focusscale";
                        }

                        html += '<div is="emby-itemscontainer" class="itemsContainer ' + scrollXClass + ' lazy padded-left padded-right" data-id="' + item.Id + '">';
                    } else {
                        html += '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap lazy padded-left padded-right" data-id="' + item.Id + '">';
                    }

                    html += "</div>";
                    html += "</div>";
                }

                elem.innerHTML = html;
                lazyLoader.lazyChildren(elem, fillItemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();
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
