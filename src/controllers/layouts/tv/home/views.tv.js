import {Spotlight} from './spotlight';
import {getbackdropImageUrl} from './imagehelper';
import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';
import appRouter from 'appRouter';

function loadResume(element, apiClient, parentId) {
    const options = {
        Limit: 6,
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getResumableItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const section = element.querySelector('.resumeSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'backdrop',
            overlayText: true,
            rows: 3,
            scalable: false,
            coverImage: true,
            showTitle: true,
            preferThumb: true
        });
        return;
    });
}

function loadNextUp(element, apiClient, parentId) {
    const options = {
        UserId: apiClient.getCurrentUserId(),
        Fields: 'PrimaryImageAspectRatio',
        ImageTypeLimit: 1,
        Limit: 18,
        ParentId: parentId,
        EnableTotalRecordCount: false
    };
    return apiClient.getNextUpEpisodes(options).then(({Items}) => {
        const section = element.querySelector('.nextUpSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'backdrop',
            overlayText: true,
            rows: 3,
            scalable: false,
            coverImage: true,
            showTitle: true,
            preferThumb: true
        });
        return;
    });
}

function loadLatest(element, apiClient, parentId) {
    const options = {
        UserId: apiClient.getCurrentUserId(),
        IncludeItemTypes: 'Episode',
        Limit: 12,
        Fields: 'PrimaryImageAspectRatio',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Backdrop,Thumb'
    };
    return apiClient.getLatestItems(options).then(result => {
        const section = element.querySelector('.latestSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'backdrop',
            overlayText: true,
            rows: 3,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadFavoriteSeries(element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'Series',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsFavorite',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const section = element.querySelector('.favoriteSeriesSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'portrait',
            showTitle: true,
            overlayText: true,
            rows: 2,
            scalable: false
        });
        return;
    });
}

function loadFavoriteEpisode(element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'Episode',
        Limit: 6,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsFavorite',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const section = element.querySelector('.favoriteEpisodeSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'backdrop',
            showTitle: true,
            overlayText: true,
            rows: 3,
            scalable: false
        });
        return;
    });
}

function loadSpotlight(instance, element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'Series',
        Limit: 20,
        Recursive: true,
        ParentId: parentId,
        EnableImageTypes: 'Backdrop',
        ImageTypes: 'Backdrop',
        Fields: 'Taglines'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const card = element.querySelector('.wideSpotlightCard');
        instance.spotlight = new Spotlight(card, Items, 767);
        return;
    });
}

function loadImages(element, apiClient, parentId) {
    return apiClient.getItems(apiClient.getCurrentUserId(), {
        SortBy: 'IsFavoriteOrLiked,Random',
        IncludeItemTypes: 'Series',
        Limit: 2,
        Recursive: true,
        ParentId: parentId,
        EnableImageTypes: 'Backdrop',
        ImageTypes: 'Backdrop'
    }).then(({Items}) => {
        const items = Items;
        if (items.length > 0) {
            element.querySelector('.tvEpisodesCard .cardImage').style.backgroundImage = `url('${getbackdropImageUrl(items[0])}')`;
        }
        if (items.length > 1) {
            element.querySelector('.allSeriesCard .cardImage').style.backgroundImage = `url('${getbackdropImageUrl(items[1])}')`;
        }
        return;
    });
}

function gotoTvView(tab, parentId) {
    appRouter.show(`/tv.html?tab=${tab}&parentid=${parentId}`);
}

export class TvView {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = () => Promise.all([
            loadResume(element, apiClient, parentId),
            loadNextUp(element, apiClient, parentId),
            loadLatest(element, apiClient, parentId),
            loadFavoriteSeries(element, apiClient, parentId),
            loadFavoriteEpisode(element, apiClient, parentId)
        ]);
        loadSpotlight(this, element, apiClient, parentId);
        loadImages(element, apiClient, parentId);
        element.querySelector('.allSeriesCard').addEventListener('click', () => {
            gotoTvView('0', parentId);
        });
        element.querySelector('.tvEpisodesCard').addEventListener('click', () => {
            gotoTvView('6', parentId);
        });
        element.querySelector('.tvGenresCard').addEventListener('click', () => {
            gotoTvView('4', parentId);
        });
        this.destroy = function () {
            if (this.spotlight) {
                this.spotlight.destroy();
                this.spotlight = null;
            }
        };
    }
}

export default TvView;
