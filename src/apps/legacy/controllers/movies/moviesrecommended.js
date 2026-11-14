import escapeHtml from 'escape-html';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import { getLatestMediaQuery } from '@/apps/legacy/features/libraries/api/useLatestMedia';
import { getItemsQuery } from '@/apps/modern/features/libraries/hooks/api/useItems';
import { getMovieRecommendationsQuery } from '@/apps/modern/features/libraries/hooks/api/useMovieRecommendations';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { getBackdropShape, getPortraitShape } from 'components/cardbuilder/utils/shape';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import * as mainTabsManager from 'components/maintabsmanager';
import { playbackManager } from 'components/playback/playbackmanager';
import { getItemQuery } from '@/hooks/useItem';
import dom from 'utils/dom';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import inputManager from 'scripts/inputManager';
import libraryMenu from 'scripts/libraryMenu';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryTab } from 'types/libraryTab';
import Dashboard from 'utils/dashboard';
import Events from 'utils/events';
import { importLegacyController } from 'utils/moduleLoaders';
import { queryClient } from '@/utils/query/queryClient';

import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-tabs/emby-tabs';
import 'elements/emby-button/emby-button';

function enableScrollX() {
    return !layoutManager.desktop;
}

async function loadLatest(page, userId, parentId) {
    const api = ServerConnections.getApi();
    const items = await queryClient.query(getLatestMediaQuery(api, {
        userId,
        includeItemTypes: [BaseItemKind.Movie],
        limit: 18,
        fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount],
        parentId,
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Banner, ImageType.Thumb]
    }));

    const allowBottomPadding = !enableScrollX();
    cardBuilder.buildCards(items, {
        itemsContainer: page.querySelector('#recentlyAddedItems'),
        shape: getPortraitShape(enableScrollX()),
        scalable: true,
        overlayPlayButton: true,
        allowBottomPadding,
        showTitle: true,
        showYear: true,
        centerText: true
    });
}

async function loadResume(page, userId, parentId) {
    const api = ServerConnections.getApi();
    const screenWidth = dom.getWindowSize().innerWidth;
    const items = (await queryClient.query(getItemsQuery(api, {
        userId,
        sortBy: ItemSortBy.DatePlayed,
        sortOrder: SortOrder.Descending,
        includeItemTypes: [BaseItemKind.Movie],
        filters: [ItemFilter.IsResumable],
        limit: screenWidth >= 1600 ? 5 : 3,
        recursive: true,
        fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount],
        collapseBoxSetItems: false,
        parentId,
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Banner, ImageType.Thumb],
        enableTotalRecordCount: false
    }))).Items;

    page.querySelector('#resumableSection').classList.toggle('hide', !items.length);

    const allowBottomPadding = !enableScrollX();
    const container = page.querySelector('#resumableItems');
    cardBuilder.buildCards(items, {
        itemsContainer: container,
        preferThumb: true,
        shape: getBackdropShape(enableScrollX()),
        scalable: true,
        overlayPlayButton: true,
        allowBottomPadding: allowBottomPadding,
        cardLayout: false,
        showTitle: true,
        showYear: true,
        centerText: true
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
        shape: getPortraitShape(enableScrollX()),
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

async function loadSuggestions(page, userId, parentId) {
    const api = ServerConnections.getApi();
    const screenWidth = dom.getWindowSize().innerWidth;
    let itemLimit = 5;
    if (screenWidth >= 1600) {
        itemLimit = 8;
    } else if (screenWidth >= 1200) {
        itemLimit = 6;
    }

    const recommendations = await queryClient.query(getMovieRecommendationsQuery(api, {
        userId,
        parentId,
        categoryLimit: 6,
        itemLimit,
        fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.MediaSourceCount]
    }));

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
}

function autoFocus(page) {
    import('components/autoFocuser').then(({ default: autoFocuser }) => {
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

async function loadSuggestionsTab(view, params, tabContent) {
    const parentId = params.topParentId;
    const userId = ServerConnections.currentApiClient().getCurrentUserId();

    await Promise.all([
        loadResume(tabContent, userId, parentId),
        loadLatest(tabContent, userId, parentId),
        loadSuggestions(tabContent, userId, parentId)
    ]);

    autoFocus(tabContent);
}

function getTabs() {
    return [{
        name: globalize.translate('Movies')
    }, {
        name: globalize.translate('Suggestions')
    }, {
        name: globalize.translate('Favorites')
    }, {
        name: globalize.translate('Collections')
    }, {
        name: globalize.translate('Genres')
    }];
}

function getDefaultTabIndex(folderId) {
    switch (userSettings.get('landing-' + folderId)) {
        case LibraryTab.Suggestions:
            return 1;

        case LibraryTab.Favorites:
            return 2;

        case LibraryTab.Collections:
            return 3;

        case LibraryTab.Genres:
            return 4;

        default:
            return 0;
    }
}

export default function (view, params) {
    function onBeforeTabChange(e) {
        preLoadTab(view, parseInt(e.detail.selectedTabIndex, 10));
    }

    function onTabChange(e) {
        const newIndex = parseInt(e.detail.selectedTabIndex, 10);
        loadTab(view, newIndex);
    }

    function getTabContainers() {
        return view.querySelectorAll('.pageTabContent');
    }

    function initTabs() {
        mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
    }

    const getTabController = (page, index, callback) => {
        let depends = 'movies';

        switch (index) {
            case 1:
                depends = 'moviesrecommended.js';
                break;

            case 3:
                depends = 'moviecollections';
                break;

            case 4:
                depends = 'moviegenres';
                break;
        }

        importLegacyController(`movies/${depends}`).then(({ default: ControllerFactory }) => {
            let tabContent;

            if (index === suggestionsTabIndex) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                this.tabContent = tabContent;
            }

            let controller = tabControllers[index];

            if (!controller) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index === suggestionsTabIndex) {
                    controller = this;
                } else if (index == 0 || index == 2) {
                    controller = new ControllerFactory(view, params, tabContent, {
                        mode: index ? 'favorites' : 'movies'
                    });
                } else {
                    controller = new ControllerFactory(view, params, tabContent);
                }

                tabControllers[index] = controller;

                if (controller.initTab) {
                    controller.initTab();
                }
            }

            callback(controller);
        });
    };

    function preLoadTab(page, index) {
        getTabController(page, index, function (controller) {
            if (renderedTabs.indexOf(index) == -1 && controller.preRender) {
                controller.preRender();
            }
        });
    }

    function loadTab(page, index) {
        currentTabIndex = index;
        getTabController(page, index, ((controller) => {
            if (renderedTabs.indexOf(index) == -1) {
                renderedTabs.push(index);
                controller.renderTab();
            }
        }));
    }

    function onPlaybackStop(e, stopInfo) {
        const state = stopInfo.state;

        if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
            renderedTabs = [];
            mainTabsManager.getTabsElement().triggerTabChange();
        }
    }

    function onInputCommand(e) {
        if (e.detail.command === 'search') {
            e.preventDefault();
            Dashboard.navigate('search?collectionType=movies&parentId=' + params.topParentId);
        }
    }

    let currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId), 10);
    const suggestionsTabIndex = 1;

    this.initTab = function () {
        const tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
        initSuggestedTab(view, tabContent);
    };

    this.renderTab = function () {
        const tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
        loadSuggestionsTab(view, params, tabContent);
    };

    const tabControllers = [];
    let renderedTabs = [];
    view.addEventListener('viewshow', function () {
        initTabs();
        if (!view.getAttribute('data-title')) {
            const parentId = params.topParentId;

            if (parentId) {
                const api = ServerConnections.getApi();
                const userId = ServerConnections.currentApiClient().getCurrentUserId();
                queryClient.query(getItemQuery(api, parentId, userId)).then(item => {
                    view.setAttribute('data-title', item.Name);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                view.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }

        Events.on(playbackManager, 'playbackstop', onPlaybackStop);
        inputManager.on(window, onInputCommand);
    });
    view.addEventListener('viewbeforehide', function () {
        inputManager.off(window, onInputCommand);
        Events.off(playbackManager, 'playbackstop', onPlaybackStop);
    });
    for (const tabController of tabControllers) {
        if (tabController.destroy) {
            tabController.destroy();
        }
    }
}
