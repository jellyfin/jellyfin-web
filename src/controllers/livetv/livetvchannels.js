define(["cardBuilder", "imageLoader", "libraryBrowser", "loading", "events", "emby-itemscontainer"], function (cardBuilder, imageLoader, libraryBrowser, loading, events) {
    "use strict";

    return function (view, params, tabContent) {
        function getPageData() {
            if (!pageData) {
                pageData = {
                    query: {
                        StartIndex: 0,
                        Limit: 100,
                        Fields: "PrimaryImageAspectRatio"
                    }
                };
            }

            return pageData;
        }

        function getQuery() {
            return getPageData().query;
        }

        function getChannelsHtml(channels) {
            return cardBuilder.getCardsHtml({
                items: channels,
                shape: "square",
                showTitle: true,
                lazy: true,
                cardLayout: true,
                showDetailsMenu: true,
                showCurrentProgram: true,
                showCurrentProgramTime: true
            });
        }

        function renderChannels(context, result) {
            function onNextPageClick() {
                if (isLoading) {
                    return;
                }

                query.StartIndex += query.Limit;
                reloadItems(context);
            }

            function onPreviousPageClick() {
                if (isLoading) {
                    return;
                }

                query.StartIndex -= query.Limit;
                reloadItems(context);
            }

            var query = getQuery();
            context.querySelector(".paging").innerHTML = libraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                showLimit: false,
                updatePageSizeSetting: false,
                filterButton: false
            });
            var html = getChannelsHtml(result.Items);
            var elem = context.querySelector("#items");
            elem.innerHTML = html;
            imageLoader.lazyChildren(elem);
            var i;
            var length;
            var elems;

            for (elems = context.querySelectorAll(".btnNextPage"), i = 0, length = elems.length; i < length; i++) {
                elems[i].addEventListener("click", onNextPageClick);
            }

            for (elems = context.querySelectorAll(".btnPreviousPage"), i = 0, length = elems.length; i < length; i++) {
                elems[i].addEventListener("click", onPreviousPageClick);
            }
        }

        function showFilterMenu(context) {
            require(["components/filterdialog/filterdialog"], function (filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery(),
                    mode: "livetvchannels",
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, "filterchange", function () {
                    reloadItems(context);
                });
                filterDialog.show();
            });
        }

        function reloadItems(context, save) {
            loading.show();
            isLoading = true;
            var query = getQuery();
            var apiClient = ApiClient;
            query.UserId = apiClient.getCurrentUserId();
            apiClient.getLiveTvChannels(query).then(function (result) {
                renderChannels(context, result);
                loading.hide();
                isLoading = false;

                require(["autoFocuser"], function (autoFocuser) {
                    autoFocuser.autoFocus(view);
                });
            });
        }

        var pageData;
        var self = this;
        var isLoading = false;
        tabContent.querySelector(".btnFilter").addEventListener("click", function () {
            showFilterMenu(tabContent);
        });

        self.renderTab = function () {
            reloadItems(tabContent);
        };
    };
});
