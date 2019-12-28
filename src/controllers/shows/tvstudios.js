define(["loading", "libraryBrowser", "cardBuilder", "apphost"], function (loading, libraryBrowser, cardBuilder, appHost) {
    "use strict";

    function getQuery(params) {
        var key = getSavedQueryKey();
        var pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: "SortName",
                    SortOrder: "Ascending",
                    IncludeItemTypes: "Series",
                    Recursive: true,
                    Fields: "DateCreated,PrimaryImageAspectRatio",
                    StartIndex: 0
                }
            };
            pageData.query.ParentId = params.topParentId;
        }

        return pageData.query;
    }

    function getSavedQueryKey() {
        return libraryBrowser.getSavedQueryKey("studios");
    }

    function getPromise(context, params) {
        var query = getQuery(params);
        loading.show();
        return ApiClient.getStudios(ApiClient.getCurrentUserId(), query);
    }

    function reloadItems(context, params, promise) {
        promise.then(function (result) {
            var elem = context.querySelector("#items");
            cardBuilder.buildCards(result.Items, {
                itemsContainer: elem,
                shape: "backdrop",
                preferThumb: true,
                showTitle: true,
                scalable: true,
                centerText: true,
                overlayMoreButton: true,
                context: "tvshows"
            });
            loading.hide();

            require(["autoFocuser"], function (autoFocuser) {
                autoFocuser.autoFocus(context);
            });
        });
    }

    var data = {};
    return function (view, params, tabContent) {
        var promise;
        var self = this;

        self.preRender = function () {
            promise = getPromise(view, params);
        };

        self.renderTab = function () {
            reloadItems(tabContent, params, promise);
        };
    };
});
