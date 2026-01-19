import loading from '../../components/loading/loading';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import Events from '../../utils/events';
import { setFilterStatus } from 'components/filterdialog/filterIndicator';

import '../../elements/emby-itemscontainer/emby-itemscontainer';
import { scrollPageToTop } from 'components/sitbackMode/sitback.logic';
import { ApiClient } from 'jellyfin-apiclient';

export interface MusicArtistsOptions {
    mode: 'artists' | 'albumartists';
}

export interface MusicArtistsParams {
    topParentId: string;
}

interface PageData {
    query: any;
    view: string;
}

export default function (this: any, _view: HTMLElement, params: MusicArtistsParams, tabContent: HTMLElement, options: MusicArtistsOptions) {
    const data: Record<string, PageData> = {};
    let isLoading = false;

    const getSavedQueryKey = () => {
        return `${params.topParentId}-${options.mode}`;
    };

    const getPageData = () => {
        const key = getSavedQueryKey();
        let pageData = data[key];

        if (!pageData) {
            const queryValues: any = {
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
    };

    const getQuery = () => {
        return getPageData().query;
    };

    const onViewStyleChange = () => {
        const viewStyle = this.getCurrentViewStyle();
        const itemsContainer = tabContent.querySelector('.itemsContainer');

        if (!itemsContainer) return;

        if (viewStyle === 'List') {
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
        scrollPageToTop();
        const query = getQuery();
        setFilterStatus(tabContent, query);

        const apiClient = (window as any).ApiClient as ApiClient;

        const promise = options.mode === 'albumartists' ?
            apiClient.getAlbumArtists(apiClient.getCurrentUserId(), query) :
            apiClient.getArtists(apiClient.getCurrentUserId(), query);

        promise.then((result) => {
            const onNextPageClick = () => {
                if (isLoading) return;
                if (userSettings.libraryPageSize() > 0) {
                    query.StartIndex += query.Limit;
                }
                reloadItems();
            };

            const onPreviousPageClick = () => {
                if (isLoading) return;
                if (userSettings.libraryPageSize() > 0) {
                    query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
                }
                reloadItems();
            };

            this.alphaPicker?.updateControls(query);
            let html = '';
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
            if (viewStyle === 'List') {
                html = listView.getListViewHtml({
                    items: result.Items,
                    sortBy: query.SortBy
                });
            } else if (viewStyle === 'PosterCard') {
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

            const pagingElems = tabContent.querySelectorAll('.paging');
            pagingElems.forEach(el => {
                el.innerHTML = pagingHtml;
            });

            const btnNextPage = tabContent.querySelectorAll('.btnNextPage');
            btnNextPage.forEach(el => {
                el.addEventListener('click', onNextPageClick);
            });

            const btnPreviousPage = tabContent.querySelectorAll('.btnPreviousPage');
            btnPreviousPage.forEach(el => {
                el.addEventListener('click', onPreviousPageClick);
            });

            const itemsContainer = tabContent.querySelector('.itemsContainer');
            if (itemsContainer) {
                itemsContainer.innerHTML = html;
                imageLoader.lazyChildren(itemsContainer);
            }

            userSettings.saveQuerySettings(getSavedQueryKey(), query);
            loading.hide();
            isLoading = false;

            import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(tabContent);
            });
        });
    };

    this.showFilterMenu = () => {
        import('../../components/filterdialog/filterdialog').then(({ default: FilterDialog }) => {
            const apiClient = (window as any).ApiClient as ApiClient;
            const filterDialog = new (FilterDialog as any)({
                query: getQuery(),
                mode: options.mode,
                serverId: apiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', () => {
                getQuery().StartIndex = 0;
                reloadItems();
            });
            filterDialog.show();
        });
    };

    this.getCurrentViewStyle = () => {
        return getPageData().view;
    };

    const initPage = (tabElement: HTMLElement) => {
        const alphaPickerElement = tabElement.querySelector('.alphaPicker') as HTMLElement;
        const itemsContainer = tabElement.querySelector('.itemsContainer') as HTMLElement;

        if (!alphaPickerElement || !itemsContainer) return;

        alphaPickerElement.addEventListener('alphavaluechanged', (e: any) => {
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

        this.alphaPicker = new (AlphaPicker as any)({
            element: alphaPickerElement,
            valueChangeEvent: 'click'
        });

        alphaPickerElement.classList.add('alphabetPicker-right');
        alphaPickerElement.classList.add('alphaPicker-fixed-right');
        itemsContainer.classList.add('padded-right-withalphapicker');

        tabElement.querySelector('.btnFilter')?.addEventListener('click', () => {
            this.showFilterMenu();
        });

        const btnSelectView = tabElement.querySelector('.btnSelectView');
        btnSelectView?.addEventListener('click', (e: any) => {
            libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'List,Poster,PosterCard'.split(','));
        });

        btnSelectView?.addEventListener('layoutchange', (e: any) => {
            const viewStyle = e.detail.viewStyle;
            getPageData().view = viewStyle;
            userSettings.saveViewSetting(getSavedQueryKey(), viewStyle);
            getQuery().StartIndex = 0;
            onViewStyleChange();
            reloadItems();
        });
    };

    initPage(tabContent);
    onViewStyleChange();

    this.renderTab = () => {
        reloadItems();
        this.alphaPicker?.updateControls(getQuery());
    };
}