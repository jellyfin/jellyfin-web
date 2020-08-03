import playbackManager from 'playbackManager';
import loading from 'loading';
import events from 'events';
import libraryBrowser from 'libraryBrowser';
import imageLoader from 'imageLoader';
import AlphaPicker from 'alphaPicker';
import listView from 'listView';
import cardBuilder from 'cardBuilder';
import * as userSettings from 'userSettings';
import globalize from 'globalize';
import 'emby-itemscontainer';

/* eslint-disable indent */

    export default function (view, params, tabContent) {
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
            const key = getSavedQueryKey();

            if (!pageData) {
                pageData = {
                    query: {
                        SortBy: 'SortName',
                        SortOrder: 'Ascending',
                        IncludeItemTypes: 'MusicAlbum',
                        Recursive: true,
                        Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo',
                        ImageTypeLimit: 1,
                        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                        StartIndex: 0
                    },
                    view: libraryBrowser.getSavedView(key) || 'Poster'
                };

                if (userSettings.libraryPageSize() > 0) {
                    pageData.query['Limit'] = userSettings.libraryPageSize();
                }

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
                savedQueryKey = libraryBrowser.getSavedQueryKey('musicalbums');
            }

            return savedQueryKey;
        }

        function onViewStyleChange() {
            const viewStyle = self.getCurrentViewStyle();
            const itemsContainer = tabContent.querySelector('.itemsContainer');

            if (viewStyle == 'List') {
                itemsContainer.classList.add('vertical-list');
                itemsContainer.classList.remove('vertical-wrap');
            } else {
                itemsContainer.classList.remove('vertical-list');
                itemsContainer.classList.add('vertical-wrap');
            }

            itemsContainer.innerHTML = '';
        }

        function reloadItems(page) {
            loading.show();
            isLoading = true;
            const query = getQuery();
            ApiClient.getItems(ApiClient.getCurrentUserId(), query).then(function (result) {
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
                updateFilterControls(page);
                let html;
                const pagingHtml = libraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: false,
                    updatePageSizeSetting: false,
                    addLayoutButton: false,
                    sortButton: false,
                    filterButton: false
                });
                const viewStyle = self.getCurrentViewStyle();
                if (viewStyle == 'List') {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        context: 'music',
                        sortBy: query.SortBy,
                        addToListButton: true
                    });
                } else if (viewStyle == 'PosterCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'square',
                        context: 'music',
                        showTitle: true,
                        coverImage: true,
                        showParentTitle: true,
                        lazy: true,
                        cardLayout: true
                    });
                } else {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'square',
                        context: 'music',
                        showTitle: true,
                        showParentTitle: true,
                        lazy: true,
                        centerText: true,
                        overlayPlayButton: true
                    });
                }
                let elems = tabContent.querySelectorAll('.paging');

                for (let i = 0, length = elems.length; i < length; i++) {
                    elems[i].innerHTML = pagingHtml;
                }

                elems = tabContent.querySelectorAll('.btnNextPage');
                for (let i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onNextPageClick);
                }

                elems = tabContent.querySelectorAll('.btnPreviousPage');
                for (let i = 0, length = elems.length; i < length; i++) {
                    elems[i].addEventListener('click', onPreviousPageClick);
                }

                const itemsContainer = tabContent.querySelector('.itemsContainer');
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(), query);
                loading.hide();
                isLoading = false;

                import('autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(tabContent);
                });
            });
        }

        function updateFilterControls(tabContent) {
            const query = getQuery();
            self.alphaPicker.value(query.NameStartsWithOrGreater);
        }

        let savedQueryKey;
        let pageData;
        const self = this;
        let isLoading = false;

        self.showFilterMenu = function () {
            import('components/filterdialog/filterdialog').then(({default: filterDialogFactory}) => {
                const filterDialog = new filterDialogFactory({
                    query: getQuery(),
                    mode: 'albums',
                    serverId: ApiClient.serverId()
                });
                events.on(filterDialog, 'filterchange', function () {
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
            const alphaPickerElement = tabContent.querySelector('.alphaPicker');
            const itemsContainer = tabContent.querySelector('.itemsContainer');

            alphaPickerElement.addEventListener('alphavaluechanged', function (e) {
                const newValue = e.detail.value;
                const query = getQuery();
                query.NameStartsWithOrGreater = newValue;
                query.StartIndex = 0;
                reloadItems(tabContent);
            });
            self.alphaPicker = new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            });

            tabContent.querySelector('.alphaPicker').classList.add('alphabetPicker-right');
            alphaPickerElement.classList.add('alphaPicker-fixed-right');
            itemsContainer.classList.add('padded-right-withalphapicker');

            tabContent.querySelector('.btnFilter').addEventListener('click', function () {
                self.showFilterMenu();
            });
            tabContent.querySelector('.btnSort').addEventListener('click', function (e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: globalize.translate('OptionNameSort'),
                        id: 'SortName'
                    }, {
                        name: globalize.translate('OptionAlbumArtist'),
                        id: 'AlbumArtist,SortName'
                    }, {
                        name: globalize.translate('OptionCommunityRating'),
                        id: 'CommunityRating,SortName'
                    }, {
                        name: globalize.translate('OptionCriticRating'),
                        id: 'CriticRating,SortName'
                    }, {
                        name: globalize.translate('OptionDateAdded'),
                        id: 'DateCreated,SortName'
                    }, {
                        name: globalize.translate('OptionReleaseDate'),
                        id: 'ProductionYear,PremiereDate,SortName'
                    }, {
                        name: globalize.translate('OptionRandom'),
                        id: 'Random,SortName'
                    }],
                    callback: function () {
                        getQuery().StartIndex = 0;
                        reloadItems(tabContent);
                    },
                    query: getQuery(),
                    button: e.target
                });
            });
            const btnSelectView = tabContent.querySelector('.btnSelectView');
            btnSelectView.addEventListener('click', function (e) {
                libraryBrowser.showLayoutMenu(e.target, self.getCurrentViewStyle(), 'List,Poster,PosterCard'.split(','));
            });
            btnSelectView.addEventListener('layoutchange', function (e) {
                const viewStyle = e.detail.viewStyle;
                getPageData().view = viewStyle;
                libraryBrowser.saveViewSetting(getSavedQueryKey(), viewStyle);
                getQuery().StartIndex = 0;
                onViewStyleChange();
                reloadItems(tabContent);
            });
            tabContent.querySelector('.btnPlayAll').addEventListener('click', playAll);
            tabContent.querySelector('.btnShuffle').addEventListener('click', shuffle);
        }

        initPage(tabContent);
        onViewStyleChange();

        self.renderTab = function () {
            reloadItems(tabContent);
            updateFilterControls(tabContent);
        };

        self.destroy = function () {};
    }

/* eslint-enable indent */
