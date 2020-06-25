define(['events', 'libraryBrowser', 'imageLoader', 'listView', 'loading', 'userSettings', 'globalize', 'emby-itemscontainer'], function (events, libraryBrowser, imageLoader, listView, loading, userSettings, globalize) {
    'use strict';

    return function (view, params, tabContent) {
        function getPageData(context) {
            var key = getSavedQueryKey(context);
            var pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: 'Album,SortName',
                        SortOrder: 'Ascending',
                        IncludeItemTypes: 'Audio',
                        Recursive: true,
                        Fields: 'AudioInfo,ParentId',
                        StartIndex: 0,
                        ImageTypeLimit: 1,
                        EnableImageTypes: 'Primary'
                    }
                };

                if (userSettings.libraryPageSize() > 0) {
                    pageData.query['Limit'] = userSettings.libraryPageSize();
                }

                pageData.query.ParentId = params.topParentId;
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery(context) {
            return getPageData(context).query;
        }

        function getSavedQueryKey(context) {
            if (!context.savedQueryKey) {
                context.savedQueryKey = libraryBrowser.getSavedQueryKey('songs');
            }

            return context.savedQueryKey;
        }

        function reloadItems(page) {
            loading.show();
            isLoading = true;
            var query = getQuery(page);
            ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function (result) {
                function onNextPageClick() {
                    if (isLoading) {
                        return;
                    }

                    if (userSettings.libraryPageSize() > 0) {
                        query.StartIndex += query.Limit;
                    }
                    reloadItems(tabContent);
                }

                function onPreviousPageClick() {
                    if (isLoading) {
                        return;
                    }

                    if (userSettings.libraryPageSize() > 0) {
                        query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
                    }
                    reloadItems(tabContent);
                }

                window.scrollTo(0, 0);
                var i;
                var length;
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
                var html = listView.getListViewHtml({
                    items: result.Items,
                    action: 'playallfromhere',
                    smallIcon: true,
                    artist: true,
                    addToListButton: true
                });
                var elems = tabContent.querySelectorAll('.paging');

                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].innerHTML = pagingHtml;
                }

                elems = tabContent.querySelectorAll('.btnNextPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onNextPageClick);
                }

                elems = tabContent.querySelectorAll('.btnPreviousPage');
                for (i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onPreviousPageClick);
                }

                var itemsContainer = tabContent.querySelector('.itemsContainer');
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(page), query);
                loading.hide();
                isLoading = false;

                require(['autoFocuser'], function (autoFocuser) {
                    autoFocuser.autoFocus(page);
                });
            });
        }

        var self = this;
        var data = {};
        var isLoading = false;

        self.showFilterMenu = function () {
            require(['components/filterdialog/filterdialog'], function ({default: filterDialogFactory}) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery(tabContent),
                    mode: 'songs',
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, 'filterchange', function () {
                    getQuery(tabContent).StartIndex = 0;
                    reloadItems(tabContent);
                });
                filterDialog.show();
            });
        };

        self.getCurrentViewStyle = function () {
            return getPageData(tabContent).view;
        };

        function initPage(tabContent) {
            tabContent.querySelector('.btnFilter').addEventListener('click', function () {
                self.showFilterMenu();
            });
            tabContent.querySelector('.btnSort').addEventListener('click', function (e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: globalize.translate('OptionTrackName'),
                        id: 'Name'
                    }, {
                        name: globalize.translate('OptionAlbum'),
                        id: 'Album,SortName'
                    }, {
                        name: globalize.translate('OptionAlbumArtist'),
                        id: 'AlbumArtist,Album,SortName'
                    }, {
                        name: globalize.translate('OptionArtist'),
                        id: 'Artist,Album,SortName'
                    }, {
                        name: globalize.translate('OptionDateAdded'),
                        id: 'DateCreated,SortName'
                    }, {
                        name: globalize.translate('OptionDatePlayed'),
                        id: 'DatePlayed,SortName'
                    }, {
                        name: globalize.translate('OptionPlayCount'),
                        id: 'PlayCount,SortName'
                    }, {
                        name: globalize.translate('OptionReleaseDate'),
                        id: 'PremiereDate,AlbumArtist,Album,SortName'
                    }, {
                        name: globalize.translate('OptionRuntime'),
                        id: 'Runtime,AlbumArtist,Album,SortName'
                    }],
                    callback: function () {
                        getQuery(tabContent).StartIndex = 0;
                        reloadItems(tabContent);
                    },
                    query: getQuery(tabContent),
                    button: e.target
                });
            });
        }

        initPage(tabContent);

        self.renderTab = function () {
            reloadItems(tabContent);
        };

        self.destroy = function () {};
    };
});
