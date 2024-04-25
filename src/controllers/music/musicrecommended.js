import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import layoutManager from 'components/layoutManager';
import loading from 'components/loading/loading';
import * as mainTabsManager from 'components/maintabsmanager';
import browser from 'scripts/browser';
import dom from 'scripts/dom';
import globalize from 'scripts/globalize';
import inputManager from 'scripts/inputManager';
import libraryMenu from 'scripts/libraryMenu';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryTab } from 'types/libraryTab';
import Dashboard from 'utils/dashboard';
import { getSquareShape } from 'utils/card';

import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-tabs/emby-tabs';
import 'elements/emby-button/emby-button';

import 'styles/flexstyles.scss';
import 'styles/scrollstyles.scss';

function itemsPerRow() {
    const screenWidth = dom.getWindowSize().innerWidth;

    if (screenWidth >= 1920) {
        return 9;
    }

    if (screenWidth >= 1200) {
        return 12;
    }

    if (screenWidth >= 1000) {
        return 10;
    }

    return 8;
}

function enableScrollX() {
    return !layoutManager.desktop;
}

function loadLatest(page, parentId) {
    loading.show();
    const userId = ApiClient.getCurrentUserId();
    const options = {
        IncludeItemTypes: 'Audio',
        Limit: enableScrollX() ? 3 * itemsPerRow() : 2 * itemsPerRow(),
        Fields: 'PrimaryImageAspectRatio',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {
        const elem = page.querySelector('#recentlyAddedSongs');
        elem.innerHTML = cardBuilder.getCardsHtml({
            items: items,
            showUnplayedIndicator: false,
            showLatestItemsPopup: false,
            shape: getSquareShape(enableScrollX()),
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            centerText: true,
            overlayPlayButton: true,
            allowBottomPadding: !enableScrollX(),
            cardLayout: false,
            coverImage: true
        });
        imageLoader.lazyChildren(elem);
        loading.hide();

        import('../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        });
    });
}

function loadRecentlyPlayed(page, parentId) {
    const options = {
        SortBy: 'DatePlayed',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Audio',
        Limit: itemsPerRow(),
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsPlayed',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
        const elem = page.querySelector('#recentlyPlayed');

        if (result.Items.length) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.innerHTML = cardBuilder.getCardsHtml({
            items: result.Items,
            showUnplayedIndicator: false,
            shape: getSquareShape(enableScrollX()),
            showTitle: true,
            showParentTitle: true,
            action: 'instantmix',
            lazy: true,
            centerText: true,
            overlayMoreButton: true,
            allowBottomPadding: !enableScrollX(),
            cardLayout: false,
            coverImage: true
        });
        imageLoader.lazyChildren(itemsContainer);
    });
}

function loadFrequentlyPlayed(page, parentId) {
    const options = {
        SortBy: 'PlayCount',
        SortOrder: 'Descending',
        IncludeItemTypes: 'Audio',
        Limit: itemsPerRow(),
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio',
        Filters: 'IsPlayed',
        ParentId: parentId,
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
        EnableTotalRecordCount: false
    };
    ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
        const elem = page.querySelector('#topPlayed');

        if (result.Items.length) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        const itemsContainer = elem.querySelector('.itemsContainer');
        itemsContainer.innerHTML = cardBuilder.getCardsHtml({
            items: result.Items,
            showUnplayedIndicator: false,
            shape: getSquareShape(enableScrollX()),
            showTitle: true,
            showParentTitle: true,
            action: 'instantmix',
            lazy: true,
            centerText: true,
            overlayMoreButton: true,
            allowBottomPadding: !enableScrollX(),
            cardLayout: false,
            coverImage: true
        });
        imageLoader.lazyChildren(itemsContainer);
    });
}

function loadSuggestionsTab(page, tabContent, parentId) {
    console.debug('loadSuggestionsTab');
    loadLatest(tabContent, parentId);
    loadRecentlyPlayed(tabContent, parentId);
    loadFrequentlyPlayed(tabContent, parentId);

    import('../../components/favoriteitems').then(({ default: favoriteItems }) => {
        favoriteItems.render(tabContent, ApiClient.getCurrentUserId(), parentId, ['favoriteArtists', 'favoriteAlbums', 'favoriteSongs']);
    });
}

function getTabs() {
    return [{
        name: globalize.translate('Albums')
    }, {
        name: globalize.translate('Suggestions')
    }, {
        name: globalize.translate('HeaderAlbumArtists')
    }, {
        name: globalize.translate('Artists')
    }, {
        name: globalize.translate('Playlists')
    }, {
        name: globalize.translate('Songs')
    }, {
        name: globalize.translate('Genres')
    }];
}

function getDefaultTabIndex(folderId) {
    switch (userSettings.get('landing-' + folderId)) {
        case LibraryTab.Suggestions:
            return 1;

        case LibraryTab.AlbumArtists:
            return 2;

        case LibraryTab.Artists:
            return 3;

        case LibraryTab.Playlists:
            return 4;

        case LibraryTab.Songs:
            return 5;

        case LibraryTab.Genres:
            return 6;

        default:
            return 0;
    }
}

export default function (view, params) {
    function reload() {
        loading.show();
        const tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
        loadSuggestionsTab(view, tabContent, params.topParentId);
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

    function onBeforeTabChange(e) {
        preLoadTab(view, parseInt(e.detail.selectedTabIndex, 10));
    }

    function onTabChange(e) {
        loadTab(view, parseInt(e.detail.selectedTabIndex, 10));
    }

    function getTabContainers() {
        return view.querySelectorAll('.pageTabContent');
    }

    function initTabs() {
        mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
    }

    function getMode(index) {
        if (index === 2) {
            return 'albumartists';
        } else if (index === 3) {
            return 'artists';
        }
    }

    const getTabController = (page, index, callback) => {
        let depends;

        switch (index) {
            case 0:
                depends = 'musicalbums';
                break;

            case 1:
                depends = 'musicrecommended';
                break;

            case 2:
            case 3:
                depends = 'musicartists';
                break;

            case 4:
                depends = 'musicplaylists';
                break;

            case 5:
                depends = 'songs';
                break;

            case 6:
                depends = 'musicgenres';
                break;
        }

        import(`../music/${depends}`).then(({ default: ControllerFactory }) => {
            let tabContent;

            if (index == 1) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                this.tabContent = tabContent;
            }

            let controller = tabControllers[index];

            if (!controller) {
                tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index === 1) {
                    controller = this;
                } else {
                    controller = new ControllerFactory(view, params, tabContent, {
                        mode: getMode(index)
                    });
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
        getTabController(page, index, function (controller) {
            if (renderedTabs.indexOf(index) == -1) {
                renderedTabs.push(index);
                controller.renderTab();
            }
        });
    }

    function onInputCommand(e) {
        if (e.detail.command === 'search') {
            e.preventDefault();
            Dashboard.navigate('search.html?collectionType=music&parentId=' + params.topParentId);
        }
    }

    let currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId), 10);
    const suggestionsTabIndex = 1;

    this.initTab = function () {
        const tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
        const containers = tabContent.querySelectorAll('.itemsContainer');

        for (let i = 0, length = containers.length; i < length; i++) {
            setScrollClasses(containers[i], browser.mobile);
        }
    };

    this.renderTab = function () {
        reload();
    };

    const tabControllers = [];
    const renderedTabs = [];
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
                view.setAttribute('data-title', globalize.translate('TabMusic'));
                libraryMenu.setTitle(globalize.translate('TabMusic'));
            }
        }

        inputManager.on(window, onInputCommand);
    });
    view.addEventListener('viewbeforehide', function () {
        inputManager.off(window, onInputCommand);
    });
    view.addEventListener('viewdestroy', function () {
        tabControllers.forEach(function (t) {
            if (t.destroy) {
                t.destroy();
            }
        });
    });
}
