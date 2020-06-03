import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';
import appRouter from 'appRouter';

function loadLatest(element, apiClient, parentId) {
    const options = {
        IncludeItemTypes: 'Audio',
        Limit: 9,
        Fields: 'PrimaryImageAspectRatio',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getLatestItems(options).then(result => {
        const section = element.querySelector('.latestSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 2
            },
            scalable: false
        });
        return;
    });
}

function loadRecentlyPlayed(element, apiClient, parentId) {
    const options = {
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Audio',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsPlayed',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector('.recentlyPlayedSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            action: 'instantmix',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

function loadFrequentlyPlayed(element, apiClient, parentId) {
    const options = {
        SortBy: 'PlayCount',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Audio',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsPlayed',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector('.frequentlyPlayedSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            action: 'instantmix',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

function loadFavoriteSongs(element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'Audio',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsFavorite',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector('.favoriteSongsSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            action: 'instantmix',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

function loadFavoriteAlbums(element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'MusicAlbum',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsFavorite',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector('.favoriteAlbumsSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

function loadFavoriteArtists(element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsFavorite',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getArtists(apiClient.getCurrentUserId(), options).then(result => {
        const section = element.querySelector('.favoriteArtistsSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

function gotoMusicView(tab, parentId) {
    appRouter.show('/music.html?tab=' + tab + '&parentid=' + parentId);
}

export class MusicView {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element, true);
        }
        this.loadData = isRefresh => {
            if (isRefresh) {
                return Promise.resolve();
            }
            return Promise.all([
                loadLatest(element, apiClient, parentId),
                loadRecentlyPlayed(element, apiClient, parentId),
                loadFrequentlyPlayed(element, apiClient, parentId),
                loadFavoriteSongs(element, apiClient, parentId),
                loadFavoriteAlbums(element, apiClient, parentId),
                loadFavoriteArtists(element, apiClient, parentId)]
            );
        };
        element.querySelector('.albumsCard').addEventListener('click', () => {
            gotoMusicView('1', parentId);
        });
        element.querySelector('.artistsCard').addEventListener('click', () => {
            gotoMusicView('2', parentId);
        });
        element.querySelector('.songCard').addEventListener('click', () => {
            gotoMusicView('5', parentId);
        });
        this.destroy = () => { };
    }
}

export default MusicView;
