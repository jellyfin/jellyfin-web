import loading from '../../components/loading/loading';
import { Events } from 'jellyfin-apiclient';
import libraryBrowser from '../../scripts/libraryBrowser';
import imageLoader from '../../components/images/imageLoader';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import globalize from '../../scripts/globalize';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

function getSavedQueryKey(context) {
    if (!context.savedQueryKey) {
        context.savedQueryKey = libraryBrowser.getSavedQueryKey('trailers');
    }

    return context.savedQueryKey;
}
class MovieTrailers {
    isLoading = false;
    data = {};
    constructor(params, tabContent) {
        this.topParentId = params.topParentId;
        this.tabContent = tabContent;
    }

    getPageData(context) {
        const key = getSavedQueryKey(context);
        let pageData = this.data[key];

        if (!pageData) {
            pageData = this.data[key] = {
                query: {
                    SortBy: 'SortName',
                    SortOrder: 'Ascending',
                    IncludeItemTypes: 'Trailer',
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

            libraryBrowser.loadSavedQueryValues(key, pageData.query);
        }

        return pageData;
    }

    getQuery(context) {
        return this.getPageData(context).query;
    }

    reloadItems(page) {
        loading.show();
        this.isLoading = true;
        const query = this.getQuery(page);
        ApiClient.getItems(ApiClient.getCurrentUserId(), query).then((result) => {
            window.scrollTo(0, 0);
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
            let html;
            const viewStyle = this.getCurrentViewStyle();

            if (viewStyle == 'Thumb') {
                html = cardBuilder.getCardsHtml(result.Items, {
                    items: result.Items,
                    shape: 'backdrop',
                    preferThumb: true,
                    context: 'movies',
                    overlayPlayButton: true
                });
            } else if (viewStyle == 'ThumbCard') {
                html = cardBuilder.getCardsHtml(result.Items, {
                    items: result.Items,
                    shape: 'backdrop',
                    preferThumb: true,
                    context: 'movies',
                    cardLayout: true,
                    showTitle: true,
                    showYear: true,
                    centerText: true
                });
            } else if (viewStyle == 'Banner') {
                html = cardBuilder.getCardsHtml(result.Items, {
                    items: result.Items,
                    shape: 'banner',
                    preferBanner: true,
                    context: 'movies'
                });
            } else if (viewStyle == 'List') {
                html = listView.getListViewHtml({
                    items: result.Items,
                    context: 'movies',
                    sortBy: query.SortBy
                });
            } else if (viewStyle == 'PosterCard') {
                html = cardBuilder.getCardsHtml(result.Items, {
                    items: result.Items,
                    shape: 'portrait',
                    context: 'movies',
                    showTitle: true,
                    showYear: true,
                    cardLayout: true,
                    centerText: true
                });
            } else {
                html = cardBuilder.getCardsHtml(result.Items, {
                    items: result.Items,
                    shape: 'portrait',
                    context: 'movies',
                    centerText: true,
                    overlayPlayButton: true,
                    showTitle: true,
                    showYear: true
                });
            }

            let elems = page.querySelectorAll('.paging');

            for (const paging of elems) {
                paging.innerHTML = pagingHtml;
            }

            elems = page.querySelectorAll('.btnNextPage');
            for (const btnNextPage of elems) {
                btnNextPage.addEventListener('click', this.onNextPageClick.bind(this));
            }

            elems = page.querySelectorAll('.btnPreviousPage');
            for (const btnPreviousPage of elems) {
                btnPreviousPage.addEventListener('click', this.onPreviousPageClick.bind(this));
            }

            if (!result.Items.length) {
                html = '';

                html += '<div class="noItemsMessage centerMessage">';
                html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
                html += '<p>' + globalize.translate('MessageNoTrailersFound') + '</p>';
                html += '</div>';
            }

            const itemsContainer = page.querySelector('.itemsContainer');
            itemsContainer.innerHTML = html;
            imageLoader.lazyChildren(itemsContainer);
            libraryBrowser.saveQueryValues(getSavedQueryKey(page), query);
            loading.hide();
            this.isLoading = false;
        });
    }

    onNextPageClick() {
        if (this.isLoading) {
            return;
        }

        if (userSettings.libraryPageSize() > 0) {
            this.query.StartIndex += this.query.Limit;
        }
        this.reloadItems(this.tabContent);
    }

    onPreviousPageClick() {
        if (this.isLoading) {
            return;
        }

        if (userSettings.libraryPageSize() > 0) {
            this.query.StartIndex = Math.max(0, this.query.StartIndex - this.query.Limit);
        }
        this.reloadItems(this.tabContent);
    }

    showFilterMenu() {
        import('../../components/filterdialog/filterdialog').then(({ default: filterDialogFactory }) => {
            const filterDialog = new filterDialogFactory({
                query: this.getQuery(this.tabContent),
                mode: 'movies',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', () => {
                this.getQuery(this.tabContent).StartIndex = 0;
                this.reloadItems(this.tabContent);
            });
            filterDialog.show();
        });
    }

    getCurrentViewStyle = () => {
        return this.getPageData(this.tabContent).view;
    };

    initPage(tabContent) {
        const alphaPickerElement = tabContent.querySelector('.alphaPicker');
        const itemsContainer = tabContent.querySelector('.itemsContainer');
        alphaPickerElement.addEventListener('alphavaluechanged', (e) => {
            const newValue = e.detail.value;
            const query = this.getQuery(tabContent);
            if (newValue === '#') {
                query.NameLessThan = 'A';
                delete query.NameStartsWith;
            } else {
                query.NameStartsWith = newValue;
                delete query.NameLessThan;
            }
            query.StartIndex = 0;
            this.reloadItems(tabContent);
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
        tabContent.querySelector('.btnSort').addEventListener('click', (e) => {
            libraryBrowser.showSortMenu({
                items: [{
                    name: globalize.translate('Name'),
                    id: 'SortName'
                }, {
                    name: globalize.translate('OptionImdbRating'),
                    id: 'CommunityRating,SortName'
                }, {
                    name: globalize.translate('OptionDateAdded'),
                    id: 'DateCreated,SortName'
                }, {
                    name: globalize.translate('OptionDatePlayed'),
                    id: 'DatePlayed,SortName'
                }, {
                    name: globalize.translate('OptionParentalRating'),
                    id: 'OfficialRating,SortName'
                }, {
                    name: globalize.translate('OptionPlayCount'),
                    id: 'PlayCount,SortName'
                }, {
                    name: globalize.translate('OptionReleaseDate'),
                    id: 'PremiereDate,SortName'
                }],
                callback: () => {
                    this.getQuery(tabContent).StartIndex = 0;
                    this.reloadItems(tabContent);
                },
                query: this.getQuery(tabContent),
                button: e.target
            });
        });
    }

    initTab() {
        this.initPage(this.tabContent);
    }

    renderTab() {
        this.reloadItems(this.tabContent);
        this.alphaPicker?.updateControls(this.getQuery(this.tabContent));
    }
}

export default MovieTrailers;
