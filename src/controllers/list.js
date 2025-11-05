import globalize from '../lib/globalize';
import listView from '../components/listview/listview';
import * as userSettings from '../scripts/settings/userSettings';
import focusManager from '../components/focusManager';
import cardBuilder from '../components/cardbuilder/cardBuilder';
import loading from '../components/loading/loading';
import AlphaNumericShortcuts from '../scripts/alphanumericshortcuts';
import libraryBrowser from '../scripts/libraryBrowser';
import { playbackManager } from '../components/playback/playbackmanager';
import AlphaPicker from '../components/alphaPicker/alphaPicker';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import '../elements/emby-scroller/emby-scroller';
import LibraryMenu from '../scripts/libraryMenu';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { stopMultiSelect } from 'components/multiSelect/multiSelect';

function getInitialLiveTvQuery(instance, params, startIndex = 0, limit = 300) {
    const query = {
        UserId: ServerConnections.getApiClient(params.serverId).getCurrentUserId(),
        StartIndex: startIndex,
        Fields: 'ChannelInfo,PrimaryImageAspectRatio',
        Limit: limit
    };

    if (params.type === 'Recordings') {
        query.IsInProgress = false;
    } else {
        query.HasAired = false;
    }

    if (params.genreId) {
        query.GenreIds = params.genreId;
    }

    if (params.IsMovie === 'true') {
        query.IsMovie = true;
    } else if (params.IsMovie === 'false') {
        query.IsMovie = false;
    }

    if (params.IsSeries === 'true') {
        query.IsSeries = true;
    } else if (params.IsSeries === 'false') {
        query.IsSeries = false;
    }

    if (params.IsNews === 'true') {
        query.IsNews = true;
    } else if (params.IsNews === 'false') {
        query.IsNews = false;
    }

    if (params.IsSports === 'true') {
        query.IsSports = true;
    } else if (params.IsSports === 'false') {
        query.IsSports = false;
    }

    if (params.IsKids === 'true') {
        query.IsKids = true;
    } else if (params.IsKids === 'false') {
        query.IsKids = false;
    }

    if (params.IsAiring === 'true') {
        query.IsAiring = true;
    } else if (params.IsAiring === 'false') {
        query.IsAiring = false;
    }

    return modifyQueryWithFilters(instance, query);
}

function modifyQueryWithFilters(instance, query) {
    const sortValues = instance.getSortValues();

    if (!query.SortBy) {
        query.SortBy = sortValues.sortBy;
        query.SortOrder = sortValues.sortOrder;
    }

    query.Fields = query.Fields ? query.Fields + ',PrimaryImageAspectRatio' : 'PrimaryImageAspectRatio';
    query.ImageTypeLimit = 1;
    let hasFilters;
    const queryFilters = [];
    const filters = instance.getFilters();

    if (filters.IsPlayed) {
        queryFilters.push('IsPlayed');
        hasFilters = true;
    }

    if (filters.IsUnplayed) {
        queryFilters.push('IsUnplayed');
        hasFilters = true;
    }

    if (filters.IsFavorite) {
        queryFilters.push('IsFavorite');
        hasFilters = true;
    }

    if (filters.IsResumable) {
        queryFilters.push('IsResumable');
        hasFilters = true;
    }

    if (filters.VideoTypes) {
        hasFilters = true;
        query.VideoTypes = filters.VideoTypes;
    }

    if (filters.GenreIds) {
        hasFilters = true;
        query.GenreIds = filters.GenreIds;
    }

    if (filters.Is4K) {
        query.Is4K = true;
        hasFilters = true;
    }

    if (filters.IsHD) {
        query.IsHD = true;
        hasFilters = true;
    }

    if (filters.IsSD) {
        query.IsHD = false;
        hasFilters = true;
    }

    if (filters.Is3D) {
        query.Is3D = true;
        hasFilters = true;
    }

    if (filters.HasSubtitles) {
        query.HasSubtitles = true;
        hasFilters = true;
    }

    if (filters.HasTrailer) {
        query.HasTrailer = true;
        hasFilters = true;
    }

    if (filters.HasSpecialFeature) {
        query.HasSpecialFeature = true;
        hasFilters = true;
    }

    if (filters.HasThemeSong) {
        query.HasThemeSong = true;
        hasFilters = true;
    }

    if (filters.HasThemeVideo) {
        query.HasThemeVideo = true;
        hasFilters = true;
    }

    query.Filters = queryFilters.length ? queryFilters.join(',') : null;
    instance.setFilterStatus(hasFilters);

    if (instance.alphaPicker) {
        const newValue = instance.alphaPicker.value();
        if (newValue === '#') {
            query.NameLessThan = 'A';
            delete query.NameStartsWith;
        } else {
            query.NameStartsWith = newValue;
            delete query.NameLessThan;
        }
    }

    return query;
}

function setSortButtonIcon(btnSortIcon, icon) {
    btnSortIcon.classList.remove('arrow_downward');
    btnSortIcon.classList.remove('arrow_upward');
    btnSortIcon.classList.add(icon);
}

function updateSortText(instance) {
    const btnSortText = instance.btnSortText;

    if (btnSortText) {
        const options = instance.getSortMenuOptions();
        const values = instance.getSortValues();
        const sortBy = values.sortBy;

        for (const option of options) {
            if (sortBy === option.value) {
                btnSortText.innerHTML = globalize.translate('SortByValue', option.name);
                break;
            }
        }

        const btnSortIcon = instance.btnSortIcon;

        if (btnSortIcon) {
            setSortButtonIcon(btnSortIcon, values.sortOrder === 'Descending' ? 'arrow_downward' : 'arrow_upward');
        }
    }
}

function updateItemsContainerForViewType(instance) {
    if (instance.getViewSettings().imageType === 'list') {
        instance.itemsContainer.classList.remove('vertical-wrap');
        instance.itemsContainer.classList.add('vertical-list');
    } else {
        instance.itemsContainer.classList.add('vertical-wrap');
        instance.itemsContainer.classList.remove('vertical-list');
    }
}

function updateAlphaPickerState(instance) {
    if (instance.alphaPicker) {
        const alphaPicker = instance.alphaPickerElement;

        if (alphaPicker) {
            const values = instance.getSortValues();

            if (values.sortBy.indexOf(ItemSortBy.SortName) !== -1) {
                alphaPicker.classList.remove('hide');
                instance.itemsContainer.parentNode.classList.add('padded-right-withalphapicker');
            } else {
                alphaPicker.classList.add('hide');
                instance.itemsContainer.parentNode.classList.remove('padded-right-withalphapicker');
            }
        }
    }
}

function getItems(instance, params, item, sortBy, startIndex, limit) {
    const apiClient = ServerConnections.getApiClient(params.serverId);

    instance.queryRecursive = false;
    if (params.type === 'Recordings') {
        return apiClient.getLiveTvRecordings(getInitialLiveTvQuery(instance, params, startIndex, limit));
    }

    if (params.type === 'Programs') {
        if (params.IsAiring === 'true') {
            return apiClient.getLiveTvRecommendedPrograms(getInitialLiveTvQuery(instance, params, startIndex, limit));
        }

        return apiClient.getLiveTvPrograms(getInitialLiveTvQuery(instance, params, startIndex, limit));
    }

    if (params.type === 'Books') {
        instance.queryRecursive = true;

        return apiClient.getItems(apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, {
            StartIndex: startIndex,
            Limit: limit,
            Recursive: true,
            IncludeItemTypes: 'Book,AudioBook',
            ImageTypeLimit: 1,
            ParentId: item.Id,
            SortBy: sortBy
        }));
    }

    if (params.type === 'nextup') {
        return apiClient.getNextUpEpisodes(modifyQueryWithFilters(instance, {
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,DateCreated,MediaSourceCount,Chapters,Trickplay',
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb',
            EnableTotalRecordCount: false,
            SortBy: sortBy,
            EnableRewatching: userSettings.enableRewatchingInNextUp()
        }));
    }

    if (!item) {
        instance.queryRecursive = true;
        let method = 'getItems';

        if (params.type === 'MusicArtist') {
            method = 'getArtists';
        } else if (params.type === 'Person') {
            method = 'getPeople';
        }

        return apiClient[method](apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, {
            StartIndex: startIndex,
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,SortName,Chapters,Trickplay',
            ImageTypeLimit: 1,
            IncludeItemTypes: params.type === 'MusicArtist' || params.type === 'Person' ? null : params.type,
            Recursive: true,
            IsFavorite: params.IsFavorite === 'true' || null,
            ArtistIds: params.artistId || null,
            SortBy: sortBy,
            Tags: params.tag || null
        }));
    }

    if (item.Type === 'Genre' || item.Type === 'MusicGenre' || item.Type === 'Studio' || item.Type === 'Person') {
        instance.queryRecursive = true;
        const query = {
            StartIndex: startIndex,
            Limit: limit,
            Fields: 'PrimaryImageAspectRatio,SortName',
            Recursive: true,
            parentId: params.parentId,
            SortBy: sortBy
        };

        if (item.Type === 'Studio') {
            query.StudioIds = item.Id;
        } else if (item.Type === 'Genre' || item.Type === 'MusicGenre') {
            query.GenreIds = item.Id;
        } else if (item.Type === 'Person') {
            query.PersonIds = item.Id;
        }

        if (item.Type === 'MusicGenre') {
            query.IncludeItemTypes = 'MusicAlbum';
        } else if (item.CollectionType === CollectionType.Movies) {
            query.IncludeItemTypes = 'Movie';
        } else if (item.CollectionType === CollectionType.Tvshows) {
            query.IncludeItemTypes = 'Series';
        } else if (item.Type === 'Genre') {
            query.IncludeItemTypes = 'Movie,Series,Video';
        } else if (item.Type === 'Person') {
            query.IncludeItemTypes = params.type;
        }

        return apiClient.getItems(apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, query));
    }

    const query = {
        StartIndex: startIndex,
        Limit: limit,
        Fields: 'PrimaryImageAspectRatio,SortName,Path,ChildCount,MediaSourceCount',
        ImageTypeLimit: 1,
        ParentId: item.Id,
        SortBy: sortBy
    };

    if (sortBy === 'Random') {
        instance.queryRecursive = true;
        query.IncludeItemTypes = 'Video,Movie,Series,Music';
        query.Recursive = true;
    }

    return apiClient.getItems(apiClient.getCurrentUserId(), modifyQueryWithFilters(instance, query));
}

function getItem(params) {
    if ([ 'Recordings', 'Programs', 'nextup', 'tag' ].includes(params.type)) {
        return Promise.resolve(null);
    }

    const apiClient = ServerConnections.getApiClient(params.serverId);
    const itemId = params.genreId || params.musicGenreId || params.studioId || params.personId || params.parentId;

    if (itemId) {
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId);
    }

    return Promise.resolve(null);
}

function showViewSettingsMenu() {
    const instance = this;

    import('../components/viewSettings/viewSettings').then(({ default: ViewSettings }) => {
        new ViewSettings().show({
            settingsKey: instance.getSettingsKey(),
            settings: instance.getViewSettings(),
            visibleSettings: instance.getVisibleViewSettings()
        }).then(function () {
            updateItemsContainerForViewType(instance);
            instance.itemsContainer.refreshItems();
        });
    });
}

function showFilterMenu() {
    const instance = this;

    import('../components/filtermenu/filtermenu').then(({ default: FilterMenu }) => {
        new FilterMenu().show({
            settingsKey: instance.getSettingsKey(),
            settings: instance.getFilters(),
            visibleSettings: instance.getVisibleFilters(),
            onChange: instance.itemsContainer.refreshItems.bind(instance.itemsContainer),
            parentId: instance.params.parentId,
            itemTypes: instance.getItemTypes(),
            serverId: instance.params.serverId,
            filterMenuOptions: instance.getFilterMenuOptions()
        }).then(function () {
            instance.itemsContainer.refreshItems();
        });
    });
}

function showSortMenu() {
    const instance = this;

    import('../components/sortmenu/sortmenu').then(({ default: SortMenu }) => {
        new SortMenu().show({
            settingsKey: instance.getSettingsKey(),
            settings: instance.getSortValues(),
            onChange: instance.itemsContainer.refreshItems.bind(instance.itemsContainer),
            serverId: instance.params.serverId,
            sortOptions: instance.getSortMenuOptions()
        }).then(function () {
            updateSortText(instance);
            updateAlphaPickerState(instance);
            instance.itemsContainer.refreshItems();
        });
    });
}

function onNewItemClick() {
    const instance = this;

    import('../components/playlisteditor/playlisteditor').then(({ default: PlaylistEditor }) => {
        const playlistEditor = new PlaylistEditor();
        playlistEditor.show({
            items: [],
            serverId: instance.params.serverId
        }).catch(() => {
            // Dialog closed
        });
    }).catch(err => {
        console.error('[onNewItemClick] failed to load playlist editor', err);
    });
}

function hideOrShowAll(elems, hide) {
    for (const elem of elems) {
        if (hide) {
            elem.classList.add('hide');
        } else {
            elem.classList.remove('hide');
        }
    }
}

function bindAll(elems, eventName, fn) {
    for (const elem of elems) {
        elem.addEventListener(eventName, fn);
    }
}

class ItemsView {
    constructor(view, params) {
        const query = {
            StartIndex: 0,
            Limit: undefined
        };

        if (userSettings.libraryPageSize() > 0) {
            query['Limit'] = userSettings.libraryPageSize();
        }

        let isLoading = false;

        function onNextPageClick() {
            if (!isLoading && query.Limit > 0) {
                query.StartIndex += query.Limit;
                self.itemsContainer.refreshItems().then(() => {
                    window.scrollTo(0, 0);
                    autoFocus();
                });
            }
        }

        function onPreviousPageClick() {
            if (!isLoading && query.Limit > 0) {
                query.StartIndex = Math.max(0, query.StartIndex - query.Limit);
                self.itemsContainer.refreshItems().then(() => {
                    window.scrollTo(0, 0);
                    autoFocus();
                });
            }
        }

        function updatePaging(startIndex, totalRecordCount, limit) {
            const pagingHtml = libraryBrowser.getQueryPagingHtml({
                startIndex,
                limit,
                totalRecordCount,
                showLimit: false,
                updatePageSizeSetting: false,
                addLayoutButton: false,
                sortButton: false,
                filterButton: false
            });

            for (const elem of view.querySelectorAll('.paging')) {
                elem.innerHTML = pagingHtml;
            }

            for (const elem of view.querySelectorAll('.btnNextPage')) {
                elem.addEventListener('click', onNextPageClick);
            }

            for (const elem of view.querySelectorAll('.btnPreviousPage')) {
                elem.addEventListener('click', onPreviousPageClick);
            }
        }

        function fetchData() {
            isLoading = true;

            return getItems(self, params, self.currentItem, null, query.StartIndex, query.Limit).then(function (result) {
                if (self.totalItemCount == null) {
                    self.totalItemCount = result.Items ? result.Items.length : result.length;
                }

                updateAlphaPickerState(self);
                updatePaging(result.StartIndex, result.TotalRecordCount, query.Limit);
                return result;
            }).finally(() => {
                isLoading = false;
            });
        }

        function getItemsHtml(items) {
            const settings = self.getViewSettings();

            if (settings.imageType === 'list') {
                return listView.getListViewHtml({
                    items: items
                });
            }

            let shape;
            let preferThumb;
            let preferDisc;
            let preferLogo;
            let defaultShape;
            const item = self.currentItem;
            let lines = settings.showTitle ? 2 : 0;

            if (settings.imageType === 'banner') {
                shape = 'banner';
            } else if (settings.imageType === 'disc') {
                shape = 'square';
                preferDisc = true;
            } else if (settings.imageType === 'logo') {
                shape = 'backdrop';
                preferLogo = true;
            } else if (settings.imageType === 'thumb') {
                shape = 'backdrop';
                preferThumb = true;
            } else if (params.type === 'nextup') {
                shape = 'backdrop';
                preferThumb = settings.imageType === 'thumb';
            } else if (params.type === 'Programs' || params.type === 'Recordings') {
                shape = params.IsMovie === 'true' ? 'portrait' : 'autoVertical';
                preferThumb = params.IsMovie !== 'true' ? 'auto' : false;
                defaultShape = params.IsMovie === 'true' ? 'portrait' : 'backdrop';
            } else {
                shape = 'autoVertical';
            }

            let posterOptions = {
                shape: shape,
                showTitle: settings.showTitle,
                showYear: settings.showTitle,
                centerText: true,
                coverImage: true,
                preferThumb: preferThumb,
                preferDisc: preferDisc,
                preferLogo: preferLogo,
                overlayPlayButton: false,
                overlayMoreButton: true,
                overlayText: !settings.showTitle,
                defaultShape: defaultShape,
                action: params.type === 'Audio' ? 'playallfromhere' : null
            };

            if (params.type === 'nextup') {
                posterOptions.showParentTitle = settings.showTitle;
            } else if (params.type === 'Person') {
                posterOptions.showYear = false;
                posterOptions.showParentTitle = false;
                lines = 1;
            } else if (params.type === 'Audio') {
                posterOptions.showParentTitle = settings.showTitle;
            } else if (params.type === 'MusicAlbum') {
                posterOptions.showParentTitle = settings.showTitle;
            } else if (params.type === 'Episode') {
                posterOptions.showParentTitle = settings.showTitle;
            } else if (params.type === 'MusicArtist') {
                posterOptions.showYear = false;
                lines = 1;
            } else if (params.type === 'Programs') {
                lines = settings.showTitle ? 1 : 0;
                const showParentTitle = settings.showTitle && params.IsMovie !== 'true';

                if (showParentTitle) {
                    lines++;
                }

                const showAirTime = settings.showTitle && params.type !== 'Recordings';

                if (showAirTime) {
                    lines++;
                }

                const showYear = settings.showTitle && params.IsMovie === 'true' && params.type === 'Recordings';

                if (showYear) {
                    lines++;
                }

                posterOptions = Object.assign(posterOptions, {
                    inheritThumb: params.type === 'Recordings',
                    context: 'livetv',
                    showParentTitle: showParentTitle,
                    showAirTime: showAirTime,
                    showAirDateTime: showAirTime,
                    overlayPlayButton: false,
                    overlayMoreButton: true,
                    showYear: showYear,
                    coverImage: true
                });
            } else {
                posterOptions.showParentTitle = settings.showTitle;
            }

            posterOptions.lines = lines;
            posterOptions.items = items;

            if (item && item.CollectionType === CollectionType.Folders) {
                posterOptions.context = 'folders';
            }

            return cardBuilder.getCardsHtml(posterOptions);
        }

        function initAlphaPicker() {
            self.scroller = view.querySelector('.scrollFrameY');
            const alphaPickerElement = self.alphaPickerElement;

            alphaPickerElement.classList.add('alphaPicker-fixed-right');
            alphaPickerElement.classList.add('focuscontainer-right');
            self.itemsContainer.parentNode.classList.add('padded-right-withalphapicker');

            self.alphaPicker = new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            });
            self.alphaPicker.on('alphavaluechanged', onAlphaPickerValueChanged);
        }

        function onAlphaPickerValueChanged() {
            query.StartIndex = 0;
            self.itemsContainer.refreshItems();
        }

        function setTitle(item) {
            LibraryMenu.setTitle(getTitle(item) || '');

            if (item && item.CollectionType === CollectionType.Playlists) {
                hideOrShowAll(view.querySelectorAll('.btnNewItem'), false);
            } else {
                hideOrShowAll(view.querySelectorAll('.btnNewItem'), true);
            }
        }

        function getTitle(item) {
            if (params.type === 'Recordings') {
                return globalize.translate('Recordings');
            }

            if (params.type === 'Programs') {
                if (params.IsMovie === 'true') {
                    return globalize.translate('Movies');
                }

                if (params.IsSports === 'true') {
                    return globalize.translate('Sports');
                }

                if (params.IsKids === 'true') {
                    return globalize.translate('HeaderForKids');
                }

                if (params.IsAiring === 'true') {
                    return globalize.translate('HeaderOnNow');
                }

                if (params.IsSeries === 'true') {
                    return globalize.translate('Shows');
                }

                if (params.IsNews === 'true') {
                    return globalize.translate('News');
                }

                return globalize.translate('Programs');
            }

            if (params.type === 'nextup') {
                return globalize.translate('NextUp');
            }

            if (params.type === 'favoritemovies') {
                return globalize.translate('FavoriteMovies');
            }

            if (item) {
                return item.Name;
            }

            if (params.type === 'Movie') {
                return globalize.translate('Movies');
            }

            if (params.type === 'Series') {
                return globalize.translate('Shows');
            }

            if (params.type === 'Season') {
                return globalize.translate('Seasons');
            }

            if (params.type === 'Episode') {
                return globalize.translate('Episodes');
            }

            if (params.type === 'MusicArtist') {
                return globalize.translate('Artists');
            }

            if (params.type === 'MusicAlbum') {
                return globalize.translate('Albums');
            }

            if (params.type === 'Audio') {
                return globalize.translate('Songs');
            }

            if (params.type === 'Video') {
                return globalize.translate('Videos');
            }

            if (params.tag) {
                return params.tag;
            }
        }

        function play() {
            const currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                const values = self.getSortValues();
                playbackManager.play({
                    items: [currentItem],
                    queryOptions: {
                        SortBy: values.sortBy,
                        SortOrder: values.sortOrder
                    },
                    autoplay: true
                });
            } else {
                getItems(self, self.params, currentItem, null, 0, 300).then(function (result) {
                    playbackManager.play({
                        items: result.Items,
                        autoplay: true
                    });
                });
            }
        }

        function queue() {
            const currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                playbackManager.queue({
                    items: [currentItem]
                });
            } else {
                getItems(self, self.params, currentItem, null, 0, 300).then(function (result) {
                    playbackManager.queue({
                        items: result.Items
                    });
                });
            }
        }

        function shuffle() {
            const currentItem = self.currentItem;

            if (currentItem && !self.hasFilters) {
                playbackManager.shuffle(currentItem);
            } else {
                getItems(self, self.params, currentItem, 'Random', 0, 300).then(function (result) {
                    playbackManager.play({
                        items: result.Items,
                        autoplay: true
                    });
                });
            }
        }

        function autoFocus() {
            import('../components/autoFocuser').then(({ default: autoFocuser }) => {
                autoFocuser.autoFocus(view);
            });
        }

        const self = this;
        self.params = params;
        this.itemsContainer = view.querySelector('.itemsContainer');

        if (params.parentId) {
            this.itemsContainer.setAttribute('data-parentid', params.parentId);
        } else if (params.type === 'nextup') {
            this.itemsContainer.setAttribute('data-monitor', 'videoplayback');
        } else if (params.type === 'favoritemovies') {
            this.itemsContainer.setAttribute('data-monitor', 'markfavorite');
        } else if (params.type === 'Programs') {
            this.itemsContainer.setAttribute('data-refreshinterval', '300000');
        }

        const btnViewSettings = view.querySelectorAll('.btnViewSettings');

        for (const btnViewSetting of btnViewSettings) {
            btnViewSetting.addEventListener('click', showViewSettingsMenu.bind(this));
        }

        const filterButtons = view.querySelectorAll('.btnFilter');
        this.filterButtons = filterButtons;
        const hasVisibleFilters = this.getVisibleFilters().length;

        for (const btnFilter of filterButtons) {
            btnFilter.addEventListener('click', showFilterMenu.bind(this));

            if (hasVisibleFilters) {
                btnFilter.classList.remove('hide');
            } else {
                btnFilter.classList.add('hide');
            }
        }

        const sortButtons = view.querySelectorAll('.btnSort');

        this.sortButtons = sortButtons;
        for (const sortButton of sortButtons) {
            sortButton.addEventListener('click', showSortMenu.bind(this));

            if (params.type !== 'nextup') {
                sortButton.classList.remove('hide');
            }
        }

        this.btnSortText = view.querySelector('.btnSortText');
        this.btnSortIcon = view.querySelector('.btnSortIcon');
        bindAll(view.querySelectorAll('.btnNewItem'), 'click', onNewItemClick.bind(this));
        this.alphaPickerElement = view.querySelector('.alphaPicker');
        self.itemsContainer.fetchData = fetchData;
        self.itemsContainer.getItemsHtml = getItemsHtml;
        view.addEventListener('viewshow', function (e) {
            const isRestored = e.detail.isRestored;

            if (!isRestored) {
                loading.show();
                updateSortText(self);
                updateItemsContainerForViewType(self);
            }

            setTitle(null);
            getItem(params).then(function (item) {
                setTitle(item);
                if (item && item.Type == 'Genre') {
                    item.ParentId = params.parentId;
                }

                self.currentItem = item;
                const refresh = !isRestored;
                self.itemsContainer.resume({
                    refresh: refresh
                }).then(function () {
                    loading.hide();

                    if (refresh) {
                        focusManager.autoFocus(self.itemsContainer);
                    }
                });

                if (!isRestored && item && item.Type !== 'PhotoAlbum') {
                    initAlphaPicker();
                }

                const itemType = item ? item.Type : null;

                if ((itemType === 'MusicGenre' || params.type !== 'Programs' && itemType !== 'Channel')
                    // Folder, Playlist views
                    && itemType !== 'UserView'
                    // Only Photo (homevideos) and Music Video CollectionFolders are supported
                    && !(itemType === 'CollectionFolder' && item?.CollectionType !== CollectionType.Homevideos && item?.CollectionType !== CollectionType.Musicvideos)
                ) {
                    // Show Play All buttons
                    hideOrShowAll(view.querySelectorAll('.btnPlay'), false);
                } else {
                    // Hide Play All buttons
                    hideOrShowAll(view.querySelectorAll('.btnPlay'), true);
                }

                if ((itemType === 'MusicGenre' || params.type !== 'Programs' && params.type !== 'nextup' && itemType !== 'Channel')
                    // Folder, Playlist views
                    && itemType !== 'UserView'
                    // Only Photo (homevideos) and Music Video CollectionFolders are supported
                    && !(itemType === 'CollectionFolder' && item?.CollectionType !== CollectionType.Homevideos && item?.CollectionType !== CollectionType.Musicvideos)
                ) {
                    // Show Shuffle buttons
                    hideOrShowAll(view.querySelectorAll('.btnShuffle'), false);
                } else {
                    // Hide Shuffle buttons
                    hideOrShowAll(view.querySelectorAll('.btnShuffle'), true);
                }

                if (item && playbackManager.canQueue(item)) {
                    // Show Queue button
                    hideOrShowAll(view.querySelectorAll('.btnQueue'), false);
                } else {
                    // Hide Queue button
                    hideOrShowAll(view.querySelectorAll('.btnQueue'), true);
                }
            });

            if (!isRestored) {
                bindAll(view.querySelectorAll('.btnPlay'), 'click', play);
                bindAll(view.querySelectorAll('.btnQueue'), 'click', queue);
                bindAll(view.querySelectorAll('.btnShuffle'), 'click', shuffle);
            }

            self.alphaNumericShortcuts = new AlphaNumericShortcuts({
                itemsContainer: self.itemsContainer
            });
        });
        view.addEventListener('viewhide', function () {
            const itemsContainer = self.itemsContainer;

            if (itemsContainer) {
                itemsContainer.pause();
            }

            const alphaNumericShortcuts = self.alphaNumericShortcuts;

            if (alphaNumericShortcuts) {
                alphaNumericShortcuts.destroy();
                self.alphaNumericShortcuts = null;
            }
        });
        view.addEventListener('viewdestroy', function () {
            if (self.listController) {
                self.listController.destroy();
            }

            if (self.alphaPicker) {
                self.alphaPicker.off('alphavaluechanged', onAlphaPickerValueChanged);
                self.alphaPicker.destroy();
            }

            self.currentItem = null;
            self.scroller = null;
            self.itemsContainer = null;
            self.filterButtons = null;
            self.sortButtons = null;
            self.btnSortText = null;
            self.btnSortIcon = null;
            self.alphaPickerElement = null;
        });
    }

    getFilters() {
        const basekey = this.getSettingsKey();
        return {
            IsPlayed: userSettings.getFilter(basekey + '-filter-IsPlayed') === 'true',
            IsUnplayed: userSettings.getFilter(basekey + '-filter-IsUnplayed') === 'true',
            IsFavorite: userSettings.getFilter(basekey + '-filter-IsFavorite') === 'true',
            IsResumable: userSettings.getFilter(basekey + '-filter-IsResumable') === 'true',
            Is4K: userSettings.getFilter(basekey + '-filter-Is4K') === 'true',
            IsHD: userSettings.getFilter(basekey + '-filter-IsHD') === 'true',
            IsSD: userSettings.getFilter(basekey + '-filter-IsSD') === 'true',
            Is3D: userSettings.getFilter(basekey + '-filter-Is3D') === 'true',
            VideoTypes: userSettings.getFilter(basekey + '-filter-VideoTypes'),
            SeriesStatus: userSettings.getFilter(basekey + '-filter-SeriesStatus'),
            HasSubtitles: userSettings.getFilter(basekey + '-filter-HasSubtitles'),
            HasTrailer: userSettings.getFilter(basekey + '-filter-HasTrailer'),
            HasSpecialFeature: userSettings.getFilter(basekey + '-filter-HasSpecialFeature'),
            HasThemeSong: userSettings.getFilter(basekey + '-filter-HasThemeSong'),
            HasThemeVideo: userSettings.getFilter(basekey + '-filter-HasThemeVideo'),
            GenreIds: userSettings.getFilter(basekey + '-filter-GenreIds')
        };
    }

    getSortValues() {
        const basekey = this.getSettingsKey();
        return userSettings.getSortValuesLegacy(basekey, this.getDefaultSortBy());
    }

    getDefaultSortBy() {
        const sortNameOption = this.getNameSortOption(this.params);

        if (this.params.type) {
            return sortNameOption.value;
        }

        return `${ItemSortBy.IsFolder},${sortNameOption.value}`;
    }

    getSortMenuOptions() {
        const sortBy = [];

        if (this.params.type === 'Programs') {
            sortBy.push({
                name: globalize.translate('AirDate'),
                value: [ItemSortBy.StartDate, ItemSortBy.SortName].join(',')
            });
        }

        let option = this.getNameSortOption(this.params);

        if (option) {
            sortBy.push(option);
        }

        option = this.getCommunityRatingSortOption();

        if (option) {
            sortBy.push(option);
        }

        option = this.getCriticRatingSortOption();

        if (option) {
            sortBy.push(option);
        }

        if (this.params.type !== 'Programs') {
            sortBy.push({
                name: globalize.translate('DateAdded'),
                value: [ItemSortBy.DateCreated, ItemSortBy.SortName].join(',')
            });
        }

        option = this.getDatePlayedSortOption();

        if (option) {
            sortBy.push(option);
        }

        if (!this.params.type) {
            option = this.getNameSortOption(this.params);
            sortBy.push({
                name: globalize.translate('Folders'),
                value: `${ItemSortBy.IsFolder},${option.value}`
            });
        }

        sortBy.push({
            name: globalize.translate('ParentalRating'),
            value: [ItemSortBy.OfficialRating, ItemSortBy.SortName].join(',')
        });
        option = this.getPlayCountSortOption();

        if (option) {
            sortBy.push(option);
        }

        sortBy.push({
            name: globalize.translate('ReleaseDate'),
            value: [ItemSortBy.ProductionYear, ItemSortBy.PremiereDate, ItemSortBy.SortName].join(',')
        });
        sortBy.push({
            name: globalize.translate('Runtime'),
            value: [ItemSortBy.Runtime, ItemSortBy.SortName].join(',')
        });
        return sortBy;
    }

    getNameSortOption(params) {
        if (params.type === 'Episode') {
            return {
                name: globalize.translate('Name'),
                value: [ItemSortBy.SeriesSortName, ItemSortBy.SortName].join(',')
            };
        }

        return {
            name: globalize.translate('Name'),
            value: ItemSortBy.SortName
        };
    }

    getPlayCountSortOption() {
        if (this.params.type === 'Programs') {
            return null;
        }

        return {
            name: globalize.translate('PlayCount'),
            value: [ItemSortBy.PlayCount, ItemSortBy.SortName].join(',')
        };
    }

    getDatePlayedSortOption() {
        if (this.params.type === 'Programs') {
            return null;
        }

        return {
            name: globalize.translate('DatePlayed'),
            value: [ItemSortBy.DatePlayed, ItemSortBy.SortName].join(',')
        };
    }

    getCriticRatingSortOption() {
        if (this.params.type === 'Programs') {
            return null;
        }

        return {
            name: globalize.translate('CriticRating'),
            value: [ItemSortBy.CriticRating, ItemSortBy.SortName].join(',')
        };
    }

    getCommunityRatingSortOption() {
        return {
            name: globalize.translate('CommunityRating'),
            value: [ItemSortBy.CommunityRating, ItemSortBy.SortName].join(',')
        };
    }

    getVisibleFilters() {
        const filters = [];
        const params = this.params;

        if (params.type !== 'nextup') {
            if (params.type === 'Programs') {
                filters.push('Genres');
            } else {
                filters.push('IsUnplayed');
                filters.push('IsPlayed');

                if (!params.IsFavorite) {
                    filters.push('IsFavorite');
                }

                filters.push('IsResumable');
                filters.push('VideoType');
                filters.push('HasSubtitles');
                filters.push('HasTrailer');
                filters.push('HasSpecialFeature');
                filters.push('HasThemeSong');
                filters.push('HasThemeVideo');
            }
        }

        return filters;
    }

    setFilterStatus(hasFilters) {
        this.hasFilters = hasFilters;
        if (this.hasFilters) {
            stopMultiSelect();
        }
        const filterButtons = this.filterButtons;

        if (filterButtons.length) {
            for (const btnFilter of filterButtons) {
                let bubble = btnFilter.querySelector('.filterButtonBubble');

                if (!bubble) {
                    if (!hasFilters) {
                        continue;
                    }

                    btnFilter.insertAdjacentHTML('afterbegin', '<div class="filterButtonBubble">!</div>');
                    btnFilter.classList.add('btnFilterWithBubble');
                    bubble = btnFilter.querySelector('.filterButtonBubble');
                }

                if (hasFilters) {
                    bubble.classList.remove('hide');
                } else {
                    bubble.classList.add('hide');
                }
            }
        }
    }

    getFilterMenuOptions() {
        const params = this.params;
        return {
            IsAiring: params.IsAiring,
            IsMovie: params.IsMovie,
            IsSports: params.IsSports,
            IsKids: params.IsKids,
            IsNews: params.IsNews,
            IsSeries: params.IsSeries,
            Recursive: this.queryRecursive
        };
    }

    getVisibleViewSettings() {
        const item = this.currentItem;
        const fields = ['showTitle'];

        if (!item || item.Type !== 'PhotoAlbum' && item.Type !== 'ChannelFolderItem') {
            fields.push('imageType');
        }

        fields.push('viewType');
        return fields;
    }

    getViewSettings() {
        const basekey = this.getSettingsKey();
        const params = this.params;
        const item = this.currentItem;
        let showTitle = userSettings.get(basekey + '-showTitle');

        if (showTitle === 'true') {
            showTitle = true;
        } else if (showTitle === 'false') {
            showTitle = false;
        } else if ([ 'Audio', 'MusicAlbum', 'MusicArtist', 'Person', 'Programs', 'Recordings', 'nextup', 'tag' ].includes(params.type)) {
            showTitle = true;
        } else if (item && item.Type !== 'PhotoAlbum') {
            showTitle = true;
        }

        let imageType = userSettings.get(basekey + '-imageType');

        if (!imageType && params.type === 'nextup') {
            if (userSettings.useEpisodeImagesInNextUpAndResume()) {
                imageType = 'primary';
            } else {
                imageType = 'thumb';
            }
        }

        return {
            showTitle,
            showYear: userSettings.get(basekey + '-showYear') !== 'false',
            imageType: imageType || 'primary',
            viewType: userSettings.get(basekey + '-viewType') || 'images'
        };
    }

    getItemTypes() {
        const params = this.params;

        if (params.type === 'nextup') {
            return ['Episode'];
        }

        if (params.type === 'Programs') {
            return ['Program'];
        }

        return [];
    }

    getSettingsKey() {
        const values = [];
        values.push('items');
        const params = this.params;

        if (params.type) {
            values.push(params.type);
        } else if (params.parentId) {
            values.push(params.parentId);
        }

        if (params.IsAiring) {
            values.push('IsAiring');
        }

        if (params.IsMovie) {
            values.push('IsMovie');
        }

        if (params.IsKids) {
            values.push('IsKids');
        }

        if (params.IsSports) {
            values.push('IsSports');
        }

        if (params.IsNews) {
            values.push('IsNews');
        }

        if (params.IsSeries) {
            values.push('IsSeries');
        }

        if (params.IsFavorite) {
            values.push('IsFavorite');
        }

        if (params.genreId) {
            values.push('Genre');
        }

        if (params.musicGenreId) {
            values.push('MusicGenre');
        }

        if (params.studioId) {
            values.push('Studio');
        }

        if (params.personId) {
            values.push('Person');
        }

        if (params.parentId) {
            values.push('Folder');
        }

        return values.join('-');
    }
}

export default ItemsView;
