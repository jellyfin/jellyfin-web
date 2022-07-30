import loading from '../../components/loading/loading';
import * as userSettings from '../../scripts/settings/userSettings';
import { Events } from 'jellyfin-apiclient';
import libraryBrowser from '../../scripts/libraryBrowser';
import { AlphaPicker } from '../../components/alphaPicker/alphaPicker';
import listView from '../../components/listview/listview';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import globalize from '../../scripts/globalize';
import { playbackManager } from '../../components/playback/playbackmanager';
import '../../elements/emby-itemscontainer/emby-itemscontainer';

class Movies {
    isLoading = false;
    constructor(params, tabContent, options) {
        this.params = params;
        this.tabContent = tabContent;
        this.options = options;
        this.itemsContainer = tabContent.querySelector('.itemsContainer');
        this.savedQueryKey = params.topParentId + '-' + options.mode;
        this.savedViewKey = this.savedQueryKey + '-view';
        this.query = {
            SortBy: 'SortName,ProductionYear',
            SortOrder: 'Ascending',
            IncludeItemTypes: 'Movie',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            StartIndex: 0,
            ParentId: params.topParentId
        };

        if (userSettings.libraryPageSize() > 0) {
            this.query['Limit'] = userSettings.libraryPageSize();
        }

        if (options.mode === 'favorites') {
            this.query.IsFavorite = true;
        }

        this.query = userSettings.loadQuerySettings(this.savedQueryKey, this.query);
    }

    initTab() {
        this.initPage(this.tabContent);
        this.onViewStyleChange();
    }

    renderTab() {
        const itemsContainer = this.tabContent.querySelector('.itemsContainer');
        itemsContainer.refreshItems();
        this.alphaPicker?.updateControls(this.query);
    }

    initPage(tabContent) {
        const itemsContainer = tabContent.querySelector('.itemsContainer');
        itemsContainer.fetchData = this.fetchData.bind(this);
        itemsContainer.getItemsHtml = this.getItemsHtml.bind(this);
        itemsContainer.afterRefresh = this.afterRefresh.bind(this);
        const alphaPickerElement = tabContent.querySelector('.alphaPicker');

        if (alphaPickerElement) {
            alphaPickerElement.addEventListener('alphavaluechanged', (e) => {
                const newValue = e.detail.value;
                if (newValue === '#') {
                    this.query.NameLessThan = 'A';
                    delete this.query.NameStartsWith;
                } else {
                    this.query.NameStartsWith = newValue;
                    delete this.query.NameLessThan;
                }
                this.query.StartIndex = 0;
                itemsContainer.refreshItems();
            });
            this.alphaPicker = new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            });

            tabContent.querySelector('.alphaPicker').classList.add('alphabetPicker-right');
            alphaPickerElement.classList.add('alphaPicker-fixed-right');
            itemsContainer.classList.add('padded-right-withalphapicker');
        }

        const btnFilter = tabContent.querySelector('.btnFilter');

        if (btnFilter) {
            btnFilter.addEventListener('click', () => {
                this.showFilterMenu();
            });
        }
        const btnSort = tabContent.querySelector('.btnSort');

        if (btnSort) {
            btnSort.addEventListener('click', (e) => {
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
                    callback: () => {
                        this.query.StartIndex = 0;
                        userSettings.saveQuerySettings(this.savedQueryKey, this.query);
                        itemsContainer.refreshItems();
                    },
                    query: this.query,
                    button: e.target
                });
            });
        }
        const btnSelectView = tabContent.querySelector('.btnSelectView');
        btnSelectView.addEventListener('click', (e) => {
            libraryBrowser.showLayoutMenu(e.target, this.getCurrentViewStyle(), 'Banner,List,Poster,PosterCard,Thumb,ThumbCard'.split(','));
        });
        btnSelectView.addEventListener('layoutchange', (e) => {
            const viewStyle = e.detail.viewStyle;
            userSettings.set(this.savedViewKey, viewStyle);
            this.query.StartIndex = 0;
            this.onViewStyleChange();
            itemsContainer.refreshItems();
        });

        const btnShuffle = tabContent.querySelector('.btnShuffle');

        if (btnShuffle) {
            btnShuffle.addEventListener('click', this.shuffle.bind(this));
        }
    }

    fetchData() {
        this.isLoading = true;
        loading.show();
        return ApiClient.getItems(ApiClient.getCurrentUserId(), this.query);
    }

    getItemsHtml(items) {
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
                sortBy: this.query.SortBy
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
    }

    getCurrentViewStyle() {
        return userSettings.get(this.savedViewKey) || 'Poster';
    }

    afterRefresh(result) {
        window.scrollTo(0, 0);
        this.alphaPicker?.updateControls(this.query);
        const pagingHtml = libraryBrowser.getQueryPagingHtml({
            startIndex: this.query.StartIndex,
            limit: this.query.Limit,
            totalRecordCount: result.TotalRecordCount,
            showLimit: false,
            updatePageSizeSetting: false,
            addLayoutButton: false,
            sortButton: false,
            filterButton: false
        });

        let elems = this.tabContent.querySelectorAll('.paging');

        for (const paging of elems) {
            paging.innerHTML = pagingHtml;
        }

        elems = this.tabContent.querySelectorAll('.btnNextPage');
        for (const btnNextPage of elems) {
            btnNextPage.addEventListener('click', this.onNextPageClick.bind(this));
        }

        elems = this.tabContent.querySelectorAll('.btnPreviousPage');
        for (const btnPreviousPage of elems) {
            btnPreviousPage.addEventListener('click', this.onPreviousPageClick.bind(this));
        }

        const btnShuffle = this.tabContent.querySelector('.btnShuffle');

        if (btnShuffle) {
            btnShuffle.classList.toggle('hide', result.TotalRecordCount < 1);
        }

        this.isLoading = false;
        loading.hide();

        import('../../components/autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(this.tabContent);
        });
    }

    onNextPageClick() {
        if (this.isLoading) {
            return;
        }

        if (userSettings.libraryPageSize() > 0) {
            this.query.StartIndex += this.query.Limit;
        }
        this.itemsContainer.refreshItems();
    }

    onPreviousPageClick() {
        if (this.isLoading) {
            return;
        }

        if (userSettings.libraryPageSize() > 0) {
            this.query.StartIndex = Math.max(0, this.query.StartIndex - this.query.Limit);
        }
        this.itemsContainer.refreshItems();
    }

    showFilterMenu() {
        const itemsContainer = this.tabContent.querySelector('.itemsContainer');
        import('../../components/filterdialog/filterdialog').then(({default: filterDialogFactory}) => {
            const filterDialog = new filterDialogFactory({
                query: this.query,
                mode: 'movies',
                serverId: ApiClient.serverId()
            });
            Events.on(filterDialog, 'filterchange', () => {
                this.query.StartIndex = 0;
                itemsContainer.refreshItems();
            });
            filterDialog.show();
        });
    }

    shuffle() {
        ApiClient.getItem(
            ApiClient.getCurrentUserId(),
            this.params.topParentId
        ).then((item) => {
            playbackManager.shuffle(item);
        });
    }

    onViewStyleChange() {
        const viewStyle = this.getCurrentViewStyle();
        const itemsContainer = this.tabContent.querySelector('.itemsContainer');

        if (viewStyle == 'List') {
            itemsContainer.classList.add('vertical-list');
            itemsContainer.classList.remove('vertical-wrap');
        } else {
            itemsContainer.classList.remove('vertical-list');
            itemsContainer.classList.add('vertical-wrap');
        }

        itemsContainer.innerHTML = '';
    }

    destroy() {
        this.itemsContainer = null;
    }
}

export default Movies;
