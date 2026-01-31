import { playbackManager } from '../../components/playback/playbackmanager';
import loading from '../../components/loading/loading';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from '../../lib/globalize';
import Events from '../../utils/events.ts';
import { setFilterStatus } from 'components/filterdialog/filterIndicator';

import '../../elements/emby-itemscontainer/emby-itemscontainer';

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
            playbackManager.shuffle(item);
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
                    Fields: 'PrimaryImageAspectRatio,SortName',
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
        return `${params.topParentId}-musicalbums`;
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

    const reloadItems = () => {
        loading.show();
        isLoading = true;
        const query = getQuery();
        setFilterStatus(tabContent, query);

        ApiClient.getItems(ApiClient.getCurrentUserId(), query).then((result) => {
            function onNextPageClick() {
                if (isLoading) {
                    return;
                }

                if (userSettings.libraryPageSize() > 0) {
                    query.StartIndex += query.Limit;
                }
                reloadItems();
            }

            function onPreviousPageClick() {
                if (isLoading) {
                    return;
                }

                if (userSettings.libraryPageSize() > 0) {
                    query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
                }
                reloadItems();
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
            if (viewStyle == 'List') {
                html = listView.getListViewHtml({
                    items: result.Items,
                    context: 'music',
                    sortBy: query.SortBy,
                    addToListButton: true,
                    isMultiselectable: true
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
                    cardLayout: true,
                    isMultiselectable: true
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
                    overlayPlayButton: true,
                    isMultiselectable: true
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
                autoFocuser.autoFocus(tabContent);
            });
        });
    };

    let pageData;
    let isLoading = false;

    this.showFilterMenu = function () {
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const filterDialog = new FilterDialog({
                query: getQuery(),
                mode: 'albums',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', function () {
                getQuery().StartIndex = 0;
                reloadItems();
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
            reloadItems();
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

        tabElement.querySelector('.btnSort').addEventListener('click', (e) => {
            libraryBrowser.showSortMenu({
                items: [{
                    name: globalize.translate('Name'),
                    id: 'SortName'
                }, {
                    name: globalize.translate('AlbumArtist'),
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
                    reloadItems();
                },
                query: getQuery(),
                button: e.target
            });
        });

        const btnSelectView = tabElement.querySelector('.btnSelectView');
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'List,Poster,PosterCard'.split(','));
        });

        btnSelectView.addEventListener('layoutchange', function (e) {
            const viewStyle = e.detail.viewStyle;
            getPageData().view = viewStyle;
            userSettings.saveViewSetting(getSavedQueryKey(), viewStyle);
            getQuery().StartIndex = 0;
            onViewStyleChange();
            reloadItems();
        });

        tabElement.querySelector('.btnPlayAll').addEventListener('click', playAll);
        tabElement.querySelector('.btnShuffle').addEventListener('click', shuffle);
    };

    initPage(tabContent);
    onViewStyleChange();

    this.renderTab = () => {
        reloadItems();
        this.alphaPicker?.updateControls(getQuery());
    };
}

