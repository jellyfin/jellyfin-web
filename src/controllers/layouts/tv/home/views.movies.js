import globalize from 'globalize';
import {Spotlight} from './spotlight';
import imageLoader from 'imageLoader';
import {getbackdropImageUrl} from './imagehelper';
import focusManager from 'focusManager';
import cardBuilder from 'cardBuilder';
import appRouter from 'appRouter';
import 'emby-itemscontainer';

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
            rows: 2,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadLatest(element, apiClient, parentId) {
    const options = {
        IncludeItemTypes: 'Movie',
        Limit: 12,
        ParentId: parentId,
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
            shape: 'portrait',
            overlayText: true,
            rows: 2,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

function loadSpotlight(instance, element, apiClient, parentId) {
    const options = {
        SortBy: 'Random',
        IncludeItemTypes: 'Movie',
        Limit: 20,
        Recursive: true,
        ParentId: parentId,
        EnableImageTypes: 'Backdrop',
        ImageTypes: 'Backdrop',
        Fields: 'Taglines'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const card = element.querySelector('.wideSpotlightCard');
        instance.spotlight = new Spotlight(card, Items);
        return;
    });
}

function loadRecommendations(element, apiClient) {
    return apiClient.getMovieRecommendations({
        UserId: apiClient.getCurrentUserId(),
        categoryLimit: 4,
        ItemLimit: 8,
        ImageTypeLimit: 1,
        Fields: 'PrimaryImageAspectRatio'
    }).then(recommendations => {
        const values = recommendations.map(getRecommendationHtml);
        const recs = element.querySelector('.recommendations');
        if (recs) {
            recs.innerHTML = `<div class="horizontalSectionsContainer">${values.join('')}</div>`;
            imageLoader.lazyChildren(recs);
        }
        return;
    });
}

function getRecommendationHtml({Items, RecommendationType, BaselineItemName}) {
    const cardsHtml = cardBuilder.getCardsHtml(Items, {
        shape: 'portrait',
        showTitle: true,
        overlayText: true,
        rows: 2,
        scalable: false
    });
    let html = '';
    let title = '';
    switch (RecommendationType) {
        case 'SimilarToRecentlyPlayed':
            title = globalize.translate('RecommendationBecauseYouWatched', BaselineItemName);
            break;
        case 'SimilarToLikedItem':
            title = globalize.translate('RecommendationBecauseYouLike', BaselineItemName);
            break;
        case 'HasDirectorFromRecentlyPlayed':
        case 'HasLikedDirector':
            title = globalize.translate('RecommendationDirectedBy', BaselineItemName);
            break;
        case 'HasActorFromRecentlyPlayed':
        case 'HasLikedActor':
            title = globalize.translate('RecommendationStarring', BaselineItemName);
            break;
    }
    html += '<div class="horizontalSection">';
    html += `<div class="sectionTitle">${title}</div>`;
    html += '<div is="emby-itemscontainer" class="itemsContainer">';
    html += cardsHtml;
    html += '</div>';
    html += '</div>';
    return html;
}

function gotoMoviesView(tab, parentId) {
    appRouter.show(`/movies.html?tab=${tab}&parentid=${parentId}`);
}

export class MoviesView {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = isRefresh => {
            const promises = [
                loadResume(element, apiClient, parentId),
                loadLatest(element, apiClient, parentId)
            ];
            if (!isRefresh) {
                promises.push(
                    loadRecommendations(element, apiClient)
                );
            }
            return Promise.all(promises);
        };
        loadSpotlight(this, element, apiClient, parentId);
        element.querySelector('.allMoviesCard').addEventListener('click', () => {
            gotoMoviesView('0', parentId);
        });
        element.querySelector('.movieFavoritesCard').addEventListener('click', () => {
            gotoMoviesView('3', parentId);
        });
        element.querySelector('.movieGenresCard').addEventListener('click', () => {
            gotoMoviesView('5', parentId);
        });
    }

    destroy () {
        if (this.spotlight) {
            this.spotlight.destroy();
            this.spotlight = null;
        }
    }
}

export default MoviesView;
