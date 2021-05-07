import loading from '../../components/loading/loading';
import { Events } from 'jellyfin-apiclient';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

/* eslint-disable indent */

    export default function (view, params, tabContent) {
        function getPageData(context) {
            const key = getSavedQueryKey(context);
            let pageData = data[key];

            if (!pageData) {
                const queryValues = {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio,SortName,BasicSyncInfo',
                    StartIndex: 0,
                    ImageTypeLimit: 1,
                    EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
                };

                if (userSettings.libraryPageSize() > 0) {
                    queryValues['Limit'] = userSettings.libraryPageSize();
                }

                pageData = data[key] = {
                    query: queryValues,
                    view: libraryBrowser.getSavedView(key) || 'Poster'
                };
                pageData.query.ParentId = params.topParentId;
                libraryBrowser.loadSavedQueryValues(key, pageData.query);
            }

            return pageData;
        }

        function getQuery(context) {
            return getPageData(context).query;
        }

        const getSavedQueryKey = (context) => {
            if (!context.savedQueryKey) {
                context.savedQueryKey = libraryBrowser.getSavedQueryKey(this.mode);
            }

            return context.savedQueryKey;
        };

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
            const promise = this.mode == 'albumartists' ?
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
                libraryBrowser.saveQueryValues(getSavedQueryKey(page), query);
                loading.hide();
                isLoading = false;

                import('../../components/autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(tabContent);
                });
            });
        };

        const updateFilterControls = (tabContent) => {
            const query = getQuery(tabContent);
            this.alphaPicker.value(query.NameStartsWith);
        };

        const data = {};
        let isLoading = false;

        this.showFilterMenu = function () {
            import('../../components/filterdialog/filterdialog').then(({default: filterDialogFactory}) => {
                const filterDialog = new filterDialogFactory({
                    query: getQuery(tabContent),
                    mode: this.mode,
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
                query.NameStartsWith = newValue;
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
            const btnSelectView = tabContent.querySelector('.btnSelectView');
            btnSelectView.addEventListener('click', (e) => {
                libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'List,Poster,PosterCard'.split(','));
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

        this.renderTab = function () {
            reloadItems(tabContent);
            updateFilterControls(tabContent);
        };

        this.destroy = function () {};
    }

/* eslint-enable indent */
