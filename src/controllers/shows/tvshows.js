import loading from '../../components/loading/loading';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from '../../lib/globalize';
import Events from '../../utils/events.ts';
import { setFilterStatus } from 'components/filterdialog/filterIndicator';

import '../../elements/emby-itemscontainer/emby-itemscontainer';

export default function (view, params, tabContent) {
    function getPageData() {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Series',
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio',
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
                    StartIndex: 0
                },
                view: userSettings.getSavedView(key) || 'Poster'
            };

            if (userSettings.libraryPageSize() > 0) {
                pageData.query['Limit'] = userSettings.libraryPageSize();
            }

            pageData.query.ParentId = params.topParentId;
            userSettings.loadQuerySettings(key, pageData.query);
        }

        return pageData;
    }

    function getQuery() {
        return getPageData().query;
    }

    function getSavedQueryKey() {
        return `${params.topParentId}-series`;
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
        const query = getQuery();
        setFilterStatus(page, query);

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
            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            loading.hide();
            isLoading = false;

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(page);
            });
        });
    };

    const data = {};
    let isLoading = false;

    this.showFilterMenu = function () {
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const filterDialog = new FilterDialog({
                query: getQuery(),
                mode: 'series',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', function () {
                getQuery().StartIndex = 0;
                reloadItems(tabContent);
            });
            filterDialog.show();
        });
    };

    this.getCurrentViewStyle = function () {
        return getPageData().view;
    };

    const initPage = (tabElement) => {
        const alphaPickerElement = tabElement.querySelector('.alphaPicker');
        const itemsContainer = tabElement.querySelector('.itemsContainer');

        alphaPickerElement.addEventListener('alphavaluechanged', function (e) {
            const newValue = e.detail.value;
            const query = getQuery();
            if (newValue === '#') {
                query.NameLessThan = 'A';
                delete query.NameStartsWith;
            } else {
                query.NameStartsWith = newValue;
                delete query.NameLessThan;
            }
            query.StartIndex = 0;
            reloadItems(tabElement);
        });
        this.alphaPicker = new AlphaPicker({
            element: alphaPickerElement,
            valueChangeEvent: 'click'
        });

        tabElement.querySelector('.alphaPicker').classList.add('alphabetPicker-right');
        alphaPickerElement.classList.add('alphaPicker-fixed-right');
        itemsContainer.classList.add('padded-right-withalphapicker');

        tabElement.querySelector('.btnFilter').addEventListener('click', () => {
            this.showFilterMenu();
        });
        tabElement.querySelector('.btnSort').addEventListener('click', function (e) {
            libraryBrowser.showSortMenu({
                items: [{
                    name: globalize.translate('Name'),
                    id: 'SortName'
                }, {
                    name: globalize.translate('OptionRandom'),
                    id: 'Random'
                }, {
                    name: globalize.translate('OptionCommunityRating'),
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
                    getQuery().StartIndex = 0;
                    reloadItems(tabElement);
                },
                query: getQuery(),
                button: e.target
            });
        });
        const btnSelectView = tabElement.querySelector('.btnSelectView');
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
        });
        btnSelectView.addEventListener('layoutchange', function (e) {
            const viewStyle = e.detail.viewStyle;
            getPageData().view = viewStyle;
            userSettings.saveViewSetting(getSavedQueryKey(), viewStyle);
            getQuery().StartIndex = 0;
            onViewStyleChange();
            reloadItems(tabElement);
        });
    };

    initPage(tabContent);
    onViewStyleChange();

    this.renderTab = () => {
        reloadItems(tabContent);
        this.alphaPicker?.updateControls(getQuery());
    };
}

