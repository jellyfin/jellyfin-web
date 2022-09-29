import loading from '../../components/loading/loading';
import { Events } from 'jellyfin-apiclient';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from '../../scripts/globalize';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

/* eslint-disable indent */

    export default function (view, params, tabContent) {
        function getPageData(context) {
            const key = getSavedQueryKey(context);
            let pageData = data[key];

            if (!pageData) {
                pageData = data[key] = {
                    query: {
                        SortBy: 'SortName',
                        SortOrder: 'Ascending',
                        IncludeItemTypes: 'Series',
                        Recursive: true,
                        Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
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

        function getQuery(context) {
            return getPageData(context).query;
        }

        function getSavedQueryKey(context) {
            if (!context.savedQueryKey) {
                context.savedQueryKey = libraryBrowser.getSavedQueryKey('series');
            }

            return context.savedQueryKey;
        }

        const onViewStyleChange = () => {
            const viewStyle = this.getCurrentViewStyle();
            const itemsContainer = tabContent.querySelector('.itemsContainer');

            if (viewStyle == 'List') {
                itemsContainer.classList.add('vertical-list');
                itemsContainer.classList.remove('vertical-wrap');
            } else {
                itemsContainer.classList.remove('vertical-list');
                itemsContainer.classList.add('vertical-wrap');
            }

            itemsContainer.innerHTML = '';
        };

        const reloadItems = (page) => {
            loading.show();
            isLoading = true;
            const query = getQuery(page);
            ApiClient.getItems(ApiClient.getCurrentUserId(), query).then((result) => {
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
                this.alphaPicker?.updateControls(query);
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
                const viewStyle = this.getCurrentViewStyle();
                if (viewStyle == 'Thumb') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        preferThumb: true,
                        context: 'tvshows',
                        overlayMoreButton: true,
                        showTitle: true,
                        centerText: true
                    });
                } else if (viewStyle == 'ThumbCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'backdrop',
                        preferThumb: true,
                        context: 'tvshows',
                        cardLayout: true,
                        showTitle: true,
                        showYear: true,
                        centerText: true
                    });
                } else if (viewStyle == 'Banner') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'banner',
                        preferBanner: true,
                        context: 'tvshows'
                    });
                } else if (viewStyle == 'List') {
                    html = listView.getListViewHtml({
                        items: result.Items,
                        context: 'tvshows',
                        sortBy: query.SortBy
                    });
                } else if (viewStyle == 'PosterCard') {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'portrait',
                        context: 'tvshows',
                        showTitle: true,
                        showYear: true,
                        centerText: true,
                        cardLayout: true
                    });
                } else {
                    html = cardBuilder.getCardsHtml({
                        items: result.Items,
                        shape: 'portrait',
                        context: 'tvshows',
                        centerText: true,
                        lazy: true,
                        overlayMoreButton: true,
                        showTitle: true,
                        showYear: true
                    });
                }

                let elems = tabContent.querySelectorAll('.paging');

                for (const elem of elems) {
                    elem.innerHTML = pagingHtml;
                }

                elems = tabContent.querySelectorAll('.btnNextPage');
                for (const elem of elems) {
                    elem.addEventListener('click', onNextPageClick);
                }

                elems = tabContent.querySelectorAll('.btnPreviousPage');
                for (const elem of elems) {
                    elem.addEventListener('click', onPreviousPageClick);
                }

                const itemsContainer = tabContent.querySelector('.itemsContainer');
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
                libraryBrowser.saveQueryValues(getSavedQueryKey(page), query);
                loading.hide();
                isLoading = false;

                import('../../components/autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(page);
                });
            });
        };

        const data = {};
        let isLoading = false;

        this.showFilterMenu = function () {
            import('../../components/filterdialog/filterdialog').then(({default: filterDialogFactory}) => {
                const filterDialog = new filterDialogFactory({
                    query: getQuery(tabContent),
                    mode: 'series',
                    serverId: ApiClient.serverId()
                });
                Events.on(filterDialog, 'filterchange', function () {
                    getQuery(tabContent).StartIndex = 0;
                    reloadItems(tabContent);
                });
                filterDialog.show();
            });
        };

        this.getCurrentViewStyle = function () {
            return getPageData(tabContent).view;
        };

        const initPage = (tabContent) => {
            const alphaPickerElement = tabContent.querySelector('.alphaPicker');
            const itemsContainer = tabContent.querySelector('.itemsContainer');

            alphaPickerElement.addEventListener('alphavaluechanged', function (e) {
                const newValue = e.detail.value;
                const query = getQuery(tabContent);
                if (newValue === '#') {
                    query.NameLessThan = 'A';
                    delete query.NameStartsWith;
                } else {
                    query.NameStartsWith = newValue;
                    delete query.NameLessThan;
                }
                query.StartIndex = 0;
                reloadItems(tabContent);
            });
            this.alphaPicker = new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            });

            tabContent.querySelector('.alphaPicker').classList.add('alphabetPicker-right');
            alphaPickerElement.classList.add('alphaPicker-fixed-right');
            itemsContainer.classList.add('padded-right-withalphapicker');

            tabContent.querySelector('.btnFilter').addEventListener('click', () => {
                this.showFilterMenu();
            });
            tabContent.querySelector('.btnSort').addEventListener('click', function (e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: globalize.translate('Name'),
                        id: 'SortName'
                    }, {
                        name: globalize.translate('OptionRandom'),
                        id: 'Random'
                    }, {
                        name: globalize.translate('OptionImdbRating'),
                        id: 'CommunityRating,SortName'
                    }, {
                        name: globalize.translate('OptionDateShowAdded'),
                        id: 'DateCreated,SortName'
                    }, {
                        name: globalize.translate('OptionDateEpisodeAdded'),
                        id: 'DateLastContentAdded,SortName'
                    }, {
                        name: globalize.translate('OptionDatePlayed'),
                        id: 'SeriesDatePlayed,SortName'
                    }, {
                        name: globalize.translate('OptionParentalRating'),
                        id: 'OfficialRating,SortName'
                    }, {
                        name: globalize.translate('OptionReleaseDate'),
                        id: 'PremiereDate,SortName'
                    }],
                    callback: function () {
                        getQuery(tabContent).StartIndex = 0;
                        reloadItems(tabContent);
                    },
                    query: getQuery(tabContent),
                    button: e.target
                });
            });
            const btnSelectView = tabContent.querySelector('.btnSelectView');
            btnSelectView.addEventListener('click', (e) => {
                libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
            });
            btnSelectView.addEventListener('layoutchange', function (e) {
                const viewStyle = e.detail.viewStyle;
                getPageData(tabContent).view = viewStyle;
                libraryBrowser.saveViewSetting(getSavedQueryKey(tabContent), viewStyle);
                getQuery(tabContent).StartIndex = 0;
                onViewStyleChange();
                reloadItems(tabContent);
            });
        };

        initPage(tabContent);
        onViewStyleChange();

        this.renderTab = () => {
            reloadItems(tabContent);
            this.alphaPicker?.updateControls(getQuery(tabContent));
        };
    }

/* eslint-enable indent */
