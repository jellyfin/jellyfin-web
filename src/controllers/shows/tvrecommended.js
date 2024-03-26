import autoFocuser from 'components/autoFocuser';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import layoutManager from 'components/layoutManager';
import loading from 'components/loading/loading';
import * as mainTabsManager from 'components/maintabsmanager';
import { playbackManager } from 'components/playback/playbackmanager';
import dom from 'scripts/dom';
import globalize from 'scripts/globalize';
import inputManager from 'scripts/inputManager';
import libraryMenu from 'scripts/libraryMenu';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryTab } from 'types/libraryTab';
import { getBackdropShape } from 'utils/card';
import Dashboard from 'utils/dashboard';
import Events from 'utils/events';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-button/emby-button';

import 'styles/scrollstyles.scss';

function getTabs() {
    return [{
        name: globalize.translate('Shows')
    }, {
        name: globalize.translate('Suggestions')
    }, {
        name: globalize.translate('TabUpcoming')
    }, {
        name: globalize.translate('Genres')
    }, {
        name: globalize.translate('TabNetworks')
    }, {
        name: globalize.translate('Episodes')
    }];
}

function getDefaultTabIndex(folderId) {
    switch (userSettings.get('landing-' + folderId)) {
        case LibraryTab.Suggestions:
            return 1;

        case LibraryTab.Upcoming:
            return 2;

        case LibraryTab.Genres:
            return 3;

        case LibraryTab.Networks:
            return 4;

        case LibraryTab.Episodes:
            return 5;

        default:
            return 0;
    }
}

function setScrollClasses(elem, scrollX) {
    if (scrollX) {
        elem.classList.add('hiddenScrollX');

        if (layoutManager.tv) {
            elem.classList.add('smoothScrollX');
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

    for (let i = 0, length = containers.length; i < length; i++) {
        setScrollClasses(containers[i], enableScrollX());
    }
}

function loadSuggestionsTab(view, params, tabContent) {
    const parentId = params.topParentId;
    const userId = ApiClient.getCurrentUserId();
    console.debug('loadSuggestionsTab');
    loadResume(tabContent, userId, parentId);
    loadLatest(tabContent, userId, parentId);
    loadNextUp(tabContent, userId, parentId);
}

function loadResume(view, userId, parentId) {
    const screenWidth = dom.getWindowSize().innerWidth;
    const options = {
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Episode',
        Filters: 'IsResumable',
        Limit: screenWidth >= 1600 ? 5 : 3,
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
        CollapseBoxSetItems: false,
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getItems(userId, options).then(function (result) {
        if (result.Items.length) {
            view.querySelector('#resumableSection').classList.remove('hide');
        } else {
            view.querySelector('#resumableSection').classList.add('hide');
        }

        const allowBottomPadding = !enableScrollX();
        const container = view.querySelector('#resumableItems');
        cardBuilder.buildCards(result.Items, {
            itemsContainer: container,
            preferThumb: true,
            inheritThumb: !userSettings.useEpisodeImagesInNextUpAndResume(),
            shape: getBackdropShape(enableScrollX()),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            cardLayout: false,
            showTitle: true,
            showYear: true,
            centerText: true
        });
        loading.hide();

        autoFocuser.autoFocus(view);
    });
}

function loadLatest(view, userId, parentId) {
    const options = {
        userId: userId,
        IncludeItemTypes: 'Episode',
        Limit: 30,
        Fields: 'PrimaryImageAspectRatio',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb'
    };
    ApiClient.getLatestItems(options).then(function (items) {
        const section = view.querySelector('#latestItemsSection');
        const allowBottomPadding = !enableScrollX();
        const container = section.querySelector('#latestEpisodesItems');
        cardBuilder.buildCards(items, {
            parentContainer: section,
            itemsContainer: container,
            items: items,
            shape: 'backdrop',
            preferThumb: true,
            showTitle: true,
            showSeriesYear: true,
            showParentTitle: true,
            overlayText: false,
            cardLayout: false,
            allowBottomPadding: allowBottomPadding,
            showUnplayedIndicator: false,
            showChildCountIndicator: true,
            centerText: true,
            lazy: true,
            overlayPlayButton: true,
            lines: 2
        });
        loading.hide();

        autoFocuser.autoFocus(view);
    });
}

function loadNextUp(view, userId, parentId) {
    const query = {
        userId: userId,
        Limit: 24,
        Fields: 'PrimaryImageAspectRatio,DateCreated,MediaSourceCount',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        EnableTotalRecordCount: false
    };
    query.ParentId = libraryMenu.getTopParentId();
    ApiClient.getNextUpEpisodes(query).then(function (result) {
        if (result.Items.length) {
            view.querySelector('.noNextUpItems').classList.add('hide');
        } else {
            view.querySelector('.noNextUpItems').classList.remove('hide');
        }

        const section = view.querySelector('#nextUpItemsSection');
        const container = section.querySelector('#nextUpItems');
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: container,
            preferThumb: true,
            inheritThumb: !userSettings.useEpisodeImagesInNextUpAndResume(),
            shape: 'backdrop',
            scalable: true,
            showTitle: true,
            showParentTitle: true,
            overlayText: false,
            centerText: true,
            overlayPlayButton: true,
            cardLayout: false
        });
        loading.hide();

        autoFocuser.autoFocus(view);
    });
}

function enableScrollX() {
    return !layoutManager.desktop;
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

    function getTabController(page, index, callback) {
        let depends;

        switch (index) {
            case 0:
                depends = 'tvshows';
                break;

            case 1:
                depends = 'tvrecommended';
                break;

            case 2:
                depends = 'tvupcoming';
                break;

            case 3:
                depends = 'tvgenres';
                break;

            case 4:
                depends = 'tvstudios';
                break;

            case 5:
                depends = 'episodes';
                break;
        }

        import(`../shows/${depends}`).then(({ default: ControllerFactory }) => {
            let tabContent;

            if (index === 1) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                self.tabContent = tabContent;
            }

            let controller = tabControllers[index];

            if (!controller) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index === 1) {
                    controller = self;
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
    }

    function preLoadTab(page, index) {
        getTabController(page, index, function (controller) {
            if (renderedTabs.indexOf(index) == -1 && controller.preRender) {
                controller.preRender();
            }
        });
    }

    function loadTab(page, index) {
        currentTabIndex = index;
        getTabController(page, index, function (controller) {
            if (renderedTabs.indexOf(index) == -1) {
                renderedTabs.push(index);
                controller.renderTab();
            }
        });
    }

    function onPlaybackStop(e, state) {
        if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
            renderedTabs = [];
            mainTabsManager.getTabsElement().triggerTabChange();
        }
    }

    function onWebSocketMessage(e, data) {
        const msg = data;

        if (msg.MessageType === 'UserDataChanged' && msg.Data.UserId == ApiClient.getCurrentUserId()) {
            renderedTabs = [];
        }
    }

    function onInputCommand(e) {
        if (e.detail.command === 'search') {
            e.preventDefault();
            Dashboard.navigate(`search.html?collectionType=${CollectionType.Tvshows}&parentId=${params.topParentId}`);
        }
    }

    const self = this;
    let currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId), 10);
    const suggestionsTabIndex = 1;

    self.initTab = function () {
        const tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
        initSuggestedTab(view, tabContent);
    };

    self.renderTab = function () {
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
                ApiClient.getItem(ApiClient.getCurrentUserId(), parentId).then(function (item) {
                    view.setAttribute('data-title', item.Name);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                view.setAttribute('data-title', globalize.translate('Shows'));
                libraryMenu.setTitle(globalize.translate('Shows'));
            }
        }

        Events.on(playbackManager, 'playbackstop', onPlaybackStop);
        Events.on(ApiClient, 'message', onWebSocketMessage);
        inputManager.on(window, onInputCommand);
    });
    view.addEventListener('viewbeforehide', function () {
        inputManager.off(window, onInputCommand);
        Events.off(playbackManager, 'playbackstop', onPlaybackStop);
        Events.off(ApiClient, 'message', onWebSocketMessage);
    });
    view.addEventListener('viewdestroy', function () {
        tabControllers.forEach(function (t) {
            if (t.destroy) {
                t.destroy();
            }
        });
    });
}

