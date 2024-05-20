import loading from '../../components/loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import libraryBrowser from '../../scripts/libraryBrowser';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import Events from '../../utils/events.ts';
import { playbackManager } from '../../components/playback/playbackmanager';

import '../../elements/emby-itemscontainer/emby-itemscontainer';

export default function (view, params, tabContent, options) {
    const onViewStyleChange = () => {
        if (this.getCurrentViewStyle() == 'List') {
            itemsContainer.classList.add('vertical-list');
            itemsContainer.classList.remove('vertical-wrap');
        } else {
            itemsContainer.classList.remove('vertical-list');
            itemsContainer.classList.add('vertical-wrap');
        }

        itemsContainer.innerHTML = '';
    };

    function fetchData() {
        isLoading = true;
        loading.show();
        return ApiClient.getItems(ApiClient.getCurrentUserId(), query);
    }

    function shuffle() {
        ApiClient.getItem(
            ApiClient.getCurrentUserId(),
            params.topParentId
        ).then((item) => {
            playbackManager.shuffle(item);
        });
    }

    const afterRefresh = (result) => {
        function onNextPageClick() {
            if (isLoading) {
                return;
            }

            if (userSettings.libraryPageSize() > 0) {
                query.StartIndex += query.Limit;
            }
            itemsContainer.refreshItems();
        }

        function onPreviousPageClick() {
            if (isLoading) {
                return;
            }

            if (userSettings.libraryPageSize() > 0) {
                query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
            }
            itemsContainer.refreshItems();
        }

        this.alphaPicker?.updateControls(query);
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

        for (const elem of tabContent.querySelectorAll('.paging')) {
            elem.innerHTML = pagingHtml;
        }

        for (const elem of tabContent.querySelectorAll('.btnNextPage')) {
            elem.addEventListener('click', onNextPageClick);
        }

        for (const elem of tabContent.querySelectorAll('.btnPreviousPage')) {
            elem.addEventListener('click', onPreviousPageClick);
        }

        tabContent.querySelector('.btnShuffle')?.classList.toggle('hide', result.TotalRecordCount < 1);

        isLoading = false;
        loading.hide();

        import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(tabContent);
        });
    };

    const getItemsHtml = (items) => {
        let html;
        const viewStyle = this.getCurrentViewStyle();

        if (viewStyle == 'Thumb') {
            html = cardBuilder.getCardsHtml({
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                context: 'movies',
                lazy: true,
                overlayPlayButton: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        } else if (viewStyle == 'ThumbCard') {
            html = cardBuilder.getCardsHtml({
                items: items,
                shape: 'backdrop',
                preferThumb: true,
                context: 'movies',
                lazy: true,
                cardLayout: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        } else if (viewStyle == 'Banner') {
            html = cardBuilder.getCardsHtml({
                items: items,
                shape: 'banner',
                preferBanner: true,
                context: 'movies',
                lazy: true
            });
        } else if (viewStyle == 'List') {
            html = listView.getListViewHtml({
                items: items,
                context: 'movies',
                sortBy: query.SortBy
            });
        } else if (viewStyle == 'PosterCard') {
            html = cardBuilder.getCardsHtml({
                items: items,
                shape: 'portrait',
                context: 'movies',
                showTitle: true,
                showYear: true,
                centerText: true,
                lazy: true,
                cardLayout: true
            });
        } else {
            html = cardBuilder.getCardsHtml({
                items: items,
                shape: 'portrait',
                context: 'movies',
                overlayPlayButton: true,
                showTitle: true,
                showYear: true,
                centerText: true
            });
        }

        return html;
    };

    const initPage = (tabElement) => {
        itemsContainer.fetchData = fetchData;
        itemsContainer.getItemsHtml = getItemsHtml;
        itemsContainer.afterRefresh = afterRefresh;
        const alphaPickerElement = tabElement.querySelector('.alphaPicker');

        if (alphaPickerElement) {
            alphaPickerElement.addEventListener('alphavaluechanged', function (e) {
                const newValue = e.detail.value;
                if (newValue === '#') {
                    query.NameLessThan = 'A';
                    delete query.NameStartsWith;
                } else {
                    query.NameStartsWith = newValue;
                    delete query.NameLessThan;
                }
                query.StartIndex = 0;
                itemsContainer.refreshItems();
            });
            this.alphaPicker = new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            });

            tabElement.querySelector('.alphaPicker').classList.add('alphabetPicker-right');
            alphaPickerElement.classList.add('alphaPicker-fixed-right');
            itemsContainer.classList.add('padded-right-withalphapicker');
        }

        const btnFilter = tabElement.querySelector('.btnFilter');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.showFilterMenu();
            });
        }
        const btnSort = tabElement.querySelector('.btnSort');

        if (btnSort) {
            btnSort.addEventListener('click', function (e) {
                libraryBrowser.showSortMenu({
                    items: [{
                        name: globalize.translate('Name'),
                        id: 'SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionRandom'),
                        id: 'Random'
                    }, {
                        name: globalize.translate('OptionImdbRating'),
                        id: 'CommunityRating,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionCriticRating'),
                        id: 'CriticRating,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionDateAdded'),
                        id: 'DateCreated,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionDatePlayed'),
                        id: 'DatePlayed,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionParentalRating'),
                        id: 'OfficialRating,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionPlayCount'),
                        id: 'PlayCount,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('OptionReleaseDate'),
                        id: 'PremiereDate,SortName,ProductionYear'
                    }, {
                        name: globalize.translate('Runtime'),
                        id: 'Runtime,SortName,ProductionYear'
                    }],
                    callback: function () {
                        query.StartIndex = 0;
                        userSettings.saveQuerySettings(savedQueryKey, query);
                        itemsContainer.refreshItems();
                    },
                    query: query,
                    button: e.target
                });
            });
        }
        const btnSelectView = tabElement.querySelector('.btnSelectView');
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
        });
        btnSelectView.addEventListener('layoutchange', function (e) {
            const viewStyle = e.detail.viewStyle;
            userSettings.set(savedViewKey, viewStyle);
            query.StartIndex = 0;
            onViewStyleChange();
            itemsContainer.refreshItems();
        });

        tabElement.querySelector('.btnShuffle')?.addEventListener('click', shuffle);
    };

    let itemsContainer = tabContent.querySelector('.itemsContainer');
    const savedQueryKey = params.topParentId + '-' + options.mode;
    const savedViewKey = savedQueryKey + '-view';
    let query = {
        SortBy: 'SortName,ProductionYear',
        SortOrder: 'Ascending',
        IncludeItemTypes: 'Movie',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        StartIndex: 0,
        ParentId: params.topParentId
    };

    if (userSettings.libraryPageSize() > 0) {
        query['Limit'] = userSettings.libraryPageSize();
    }

    let isLoading = false;

    if (options.mode === 'favorites') {
        query.IsFavorite = true;
    }

    query = userSettings.loadQuerySettings(savedQueryKey, query);

    this.showFilterMenu = function () {
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const filterDialog = new FilterDialog({
                query: query,
                mode: 'movies',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', () => {
                query.StartIndex = 0;
                itemsContainer.refreshItems();
            });
            filterDialog.show();
        });
    };

    this.getCurrentViewStyle = function () {
        return userSettings.get(savedViewKey) || 'Poster';
    };

    this.initTab = function () {
        initPage(tabContent);
        onViewStyleChange();
    };

    this.renderTab = () => {
        itemsContainer.refreshItems();
        this.alphaPicker?.updateControls(query);
    };

    this.destroy = function () {
        itemsContainer = null;
    };
}

