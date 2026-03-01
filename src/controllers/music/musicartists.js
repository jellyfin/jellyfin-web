import loading from '../../components/loading/loading';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import Events from '../../utils/events.ts';
import { setFilterStatus } from 'components/filterdialog/filterIndicator';

import '../../elements/emby-itemscontainer/emby-itemscontainer';

export default function (view, params, tabContent, options) {
    function getPageData() {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            const queryValues = {
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,SortName',
                StartIndex: 0,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
            };

            if (userSettings.libraryPageSize() > 0) {
                queryValues['Limit'] = userSettings.libraryPageSize();
            }

            pageData = data[key] = {
                query: queryValues,
                view: userSettings.getSavedView(key) || 'Poster'
            };
            pageData.query.ParentId = params.topParentId;
            userSettings.loadQuerySettings(key, pageData.query);
        }

        return pageData;
    }

    function getQuery() {
        return getPageData().query;
    }

    function getSavedQueryKey() {
        return `${params.topParentId}-${options.mode}`;
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
        if (isLoading) return;
        loading.show();
        isLoading = true;
        const query = getQuery();
        if (userSettings.enableInfiniteScroll() && userSettings.libraryPageSize() < 50) {
            query.Limit = 50;
        } else {
            query.Limit = userSettings.libraryPageSize();
        }
        setFilterStatus(tabContent, query);

        const promise = options.mode == 'albumartists' ?
            ApiClient.getAlbumArtists(ApiClient.getCurrentUserId(), query) :
            ApiClient.getArtists(ApiClient.getCurrentUserId(), query);
        promise.then((result) => {
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

            if (!userSettings.enableInfiniteScroll()) {
                window.scrollTo(0, 0);
            }
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
                    sortBy: query.SortBy
                });
            } else if (viewStyle == 'PosterCard') {
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: 'square',
                    context: 'music',
                    showTitle: true,
                    coverImage: true,
                    cardLayout: true
                });
            } else {
                html = cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: 'square',
                    context: 'music',
                    showTitle: true,
                    coverImage: true,
                    lazy: true,
                    centerText: true,
                    overlayPlayButton: true
                });
            }

            if (!userSettings.enableInfiniteScroll()) {
                let elems = tabContent.querySelectorAll('.paging');

                for (const elem of elems) {
                    elem.innerHTML = pagingHtml;
                }

                elems = tabContent.querySelectorAll('.btnNextPage');
                for (const elem of elems) {
                    elem.addEventListener('click', onNextPageClick);
                };

                elems = tabContent.querySelectorAll('.btnPreviousPage');
                for (const elem of elems) {
                    elem.addEventListener('click', onPreviousPageClick);
                }
            } else {
                hasMoreitems = true;
                // Check if we need to load more items
                if (result.Items.length >= query.Limit) {
                    query.StartIndex += query.Limit;
                } else if (query.NameStartsWith !== undefined) {
                    // no more items with the alphaPicker/NameStartsWith selection.
                    // increment ascii letter code and search with next letter
                    const nextletter = String.fromCharCode(query.NameStartsWith.charCodeAt(0) + 1);
                    // check if ascii code is smaller or equal to Z else disable loading more items
                    if (nextletter.charCodeAt(0) <= 90) {
                        query.NameStartsWith = nextletter;
                        //reset start index for new letter
                        query.StartIndex = 0;
                    } else {
                        hasMoreitems = false;
                    }
                } else {
                    //if not searching with NameStartsWith set hasMoreitems false if no more items are found
                    hasMoreitems = false;
                }
            }

            const itemsContainer = tabContent.querySelector('.itemsContainer');
            if (userSettings.enableInfiniteScroll()) {
                itemsContainer.innerHTML += html;
            } else {
                itemsContainer.innerHTML = html;
            }
            imageLoader.lazyChildren(itemsContainer);
            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            loading.hide();
            isLoading = false;

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(tabContent);
            });
        });
    };

    const data = {};
    let isLoading = false;
    let hasMoreitems = true;
    const scrollController = new AbortController();
    this.showFilterMenu = function () {
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const filterDialog = new FilterDialog({
                query: getQuery(),
                mode: options.mode,
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
            itemsContainer.innerHTML = ''; // Clear the existing items
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
        if (userSettings.enableInfiniteScroll()) {
            document.addEventListener('viewshow', () => {
                // Stop the scroll event listener on view change
                scrollController.abort();
            }, { signal: scrollController.signal });

            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY || window.pageYOffset;
                const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                const clientHeight = document.documentElement.clientHeight || window.innerHeight;
                const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

                const isNearBottom = scrollPercentage >= 95;

                // check if tabelement is active else dont run reloaditems
                console.log(scrollTop, scrollHeight, clientHeight, scrollPercentage);
                if (isNearBottom && !isLoading && hasMoreitems && tabElement.classList.contains('is-active')) {
                    reloadItems();
                }
            }, { signal: scrollController.signal });
        }
    };

    initPage(tabContent);
    onViewStyleChange();

    this.renderTab = () => {
        reloadItems();
        this.alphaPicker?.updateControls(getQuery());
    };
}

