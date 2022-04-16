import escapeHtml from 'escape-html';
import layoutManager from '../../components/layoutManager';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import dom from '../../scripts/dom';
import imageLoader from '../../components/images/imageLoader';
import globalize from '../../scripts/globalize';

function enableScrollX() {
    return !layoutManager.desktop;
}

function getPortraitShape() {
    return enableScrollX() ? 'overflowPortrait' : 'portrait';
}

function getThumbShape() {
    return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
}

function loadLatest(page, userId, parentId) {
    const options = {
        IncludeItemTypes: 'Movie',
        Limit: 18,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {
        const allowBottomPadding = !enableScrollX();
        const container = page.querySelector('#recentlyAddedItems');
        cardBuilder.buildCards(items, {
            itemsContainer: container,
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            showTitle: true,
            showYear: true,
            centerText: true
        });

        // FIXME: Wait for all sections to load
        autoFocus(page);
    });
}

function loadResume(page, userId, parentId) {
    const screenWidth = dom.getWindowSize().innerWidth;
    const options = {
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Movie',
        Filters: 'IsResumable',
        Limit: screenWidth >= 1920 ? 5 : screenWidth >= 1600 ? 5 : 3,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
        CollapseBoxSetItems: false,
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getItems(userId, options).then(function (result) {
        if (result.Items.length) {
            page.querySelector('#resumableSection').classList.remove('hide');
        } else {
            page.querySelector('#resumableSection').classList.add('hide');
        }

        const allowBottomPadding = !enableScrollX();
        const container = page.querySelector('#resumableItems');
        cardBuilder.buildCards(result.Items, {
            itemsContainer: container,
            preferThumb: true,
            shape: getThumbShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            cardLayout: false,
            showTitle: true,
            showYear: true,
            centerText: true
        });

        // FIXME: Wait for all sections to load
        autoFocus(page);
    });
}

function getRecommendationHtml(recommendation) {
    let html = '';
    let title = '';

    switch (recommendation.RecommendationType) {
        case 'SimilarToRecentlyPlayed':
            title = globalize.translate('RecommendationBecauseYouWatched', recommendation.BaselineItemName);
            break;

        case 'SimilarToLikedItem':
            title = globalize.translate('RecommendationBecauseYouLike', recommendation.BaselineItemName);
            break;

        case 'HasDirectorFromRecentlyPlayed':
        case 'HasLikedDirector':
            title = globalize.translate('RecommendationDirectedBy', recommendation.BaselineItemName);
            break;

        case 'HasActorFromRecentlyPlayed':
        case 'HasLikedActor':
            title = globalize.translate('RecommendationStarring', recommendation.BaselineItemName);
            break;
    }

    html += '<div class="verticalSection">';
    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + escapeHtml(title) + '</h2>';
    const allowBottomPadding = true;

    if (enableScrollX()) {
        html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
        html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
    } else {
        html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
    }

    html += cardBuilder.getCardsHtml(recommendation.Items, {
        shape: getPortraitShape(),
        scalable: true,
        overlayPlayButton: true,
        allowBottomPadding: allowBottomPadding,
        showTitle: true,
        showYear: true,
        centerText: true
    });

    if (enableScrollX()) {
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}

function loadSuggestions(page, userId) {
    const screenWidth = dom.getWindowSize().innerWidth;
    const url = ApiClient.getUrl('Movies/Recommendations', {
        userId: userId,
        categoryLimit: 6,
        ItemLimit: screenWidth >= 1920 ? 8 : screenWidth >= 1600 ? 8 : screenWidth >= 1200 ? 6 : 5,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
    });
    ApiClient.getJSON(url).then(function (recommendations) {
        if (!recommendations.length) {
            page.querySelector('.noItemsMessage').classList.remove('hide');
            page.querySelector('.recommendations').innerHTML = '';
            return;
        }

        const html = recommendations.map(getRecommendationHtml).join('');
        page.querySelector('.noItemsMessage').classList.add('hide');
        const recs = page.querySelector('.recommendations');
        recs.innerHTML = html;
        imageLoader.lazyChildren(recs);

        // FIXME: Wait for all sections to load
        autoFocus(page);
    });
}

function autoFocus(page) {
    import('../../components/autoFocuser').then(({default: autoFocuser}) => {
        autoFocuser.autoFocus(page);
    });
}

function setScrollClasses(elem, scrollX) {
    if (scrollX) {
        elem.classList.add('hiddenScrollX');

        if (layoutManager.tv) {
            elem.classList.add('smoothScrollX');
            elem.classList.add('padded-top-focusscale');
            elem.classList.add('padded-bottom-focusscale');
        }

        elem.classList.add('scrollX');
        elem.classList.remove('vertical-wrap');
    } else {
        elem.classList.remove('hiddenScrollX');
        elem.classList.remove('smoothScrollX');
        elem.classList.remove('scrollX');
        elem.classList.add('vertical-wrap');
    }
}

function initSuggestedTab(page, tabContent) {
    const containers = tabContent.querySelectorAll('.itemsContainer');

    for (const container of containers) {
        setScrollClasses(container, enableScrollX());
    }
}

function loadSuggestionsTab(view, topParentId, tabContent) {
    const parentId = topParentId;
    const userId = ApiClient.getCurrentUserId();
    loadResume(tabContent, userId, parentId);
    loadLatest(tabContent, userId, parentId);
    loadSuggestions(tabContent, userId);
}

class MoviesRecommended {
    constructor(view, topParentId, tabContent) {
        this.initTab = function () {
            initSuggestedTab(view, tabContent);
        };

        this.renderTab = function () {
            loadSuggestionsTab(view, topParentId, tabContent);
        };
    }
}

export default MoviesRecommended;

