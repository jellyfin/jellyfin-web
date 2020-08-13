import events from 'events';
import inputManager from 'inputManager';
import libraryMenu from 'libraryMenu';
import layoutManager from 'layoutManager';
import loading from 'loading';
import dom from 'dom';
import * as userSettings from 'userSettings';
import cardBuilder from 'cardBuilder';
import playbackManager from 'playbackManager';
import * as mainTabsManager from 'mainTabsManager';
import globalize from 'globalize';
import 'scrollStyles';
import 'emby-itemscontainer';
import 'emby-button';

/* eslint-disable indent */

    function getTabs() {
        return [{
            name: globalize.translate('Shows')
        }, {
            name: globalize.translate('Suggestions')
        }, {
            name: globalize.translate('TabLatest')
        }, {
            name: globalize.translate('TabUpcoming')
        }, {
            name: globalize.translate('TabGenres')
        }, {
            name: globalize.translate('TabNetworks')
        }, {
            name: globalize.translate('TabEpisodes')
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get('landing-' + folderId)) {
            case 'suggestions':
                return 1;

            case 'latest':
                return 2;

            case 'favorites':
                return 1;

            case 'genres':
                return 4;

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

    export default function (view, params) {
        function reload() {
            loading.show();
            loadResume();
            loadNextUp();
        }

        function loadNextUp() {
            const query = {
                Limit: 24,
                Fields: 'PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo',
                UserId: ApiClient.getCurrentUserId(),
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

                const container = view.querySelector('#nextUpItems');
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: container,
                    preferThumb: true,
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

                import('autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(view);
                });
            });
        }

        function enableScrollX() {
            return !layoutManager.desktop;
        }

        function getThumbShape() {
            return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
        }

        function loadResume() {
            const parentId = libraryMenu.getTopParentId();
            const screenWidth = dom.getWindowSize().innerWidth;
            const limit = screenWidth >= 1600 ? 5 : 6;
            const options = {
                SortBy: 'DatePlayed',
                SortOrder: 'Descending',
                IncludeItemTypes: 'Episode',
                Filters: 'IsResumable',
                Limit: limit,
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,SeriesInfo,UserData,BasicSyncInfo',
                ExcludeLocationTypes: 'Virtual',
                ParentId: parentId,
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop,Thumb',
                EnableTotalRecordCount: false
            };
            ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
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
                    shape: getThumbShape(),
                    scalable: true,
                    showTitle: true,
                    showParentTitle: true,
                    overlayText: false,
                    centerText: true,
                    overlayPlayButton: true,
                    allowBottomPadding: allowBottomPadding,
                    cardLayout: false
                });
            });
        }

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            const newIndex = parseInt(e.detail.selectedTabIndex);
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
                    depends = 'controllers/shows/tvshows';
                    break;

                case 1:
                    depends = 'controllers/shows/tvrecommended';
                    break;

                case 2:
                    depends = 'controllers/shows/tvlatest';
                    break;

                case 3:
                    depends = 'controllers/shows/tvupcoming';
                    break;

                case 4:
                    depends = 'controllers/shows/tvgenres';
                    break;

                case 5:
                    depends = 'controllers/shows/tvstudios';
                    break;

                case 6:
                    depends = 'controllers/shows/episodes';
                    break;
            }

            import(depends).then(({default: controllerFactory}) => {
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
                    } else if (index === 7) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: 'tvshows',
                            parentId: params.topParentId
                        });
                    } else {
                        controller = new controllerFactory(view, params, tabContent);
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
            switch (e.detail.command) {
                case 'search':
                    e.preventDefault();
                    Dashboard.navigate('search.html?collectionType=tv&parentId=' + params.topParentId);
            }
        }

        const self = this;
        let currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));

        self.initTab = function () {
            const tabContent = self.tabContent;
            setScrollClasses(tabContent.querySelector('#resumableItems'), enableScrollX());
        };

        self.renderTab = function () {
            reload();
        };

        const tabControllers = [];
        let renderedTabs = [];
        setScrollClasses(view.querySelector('#resumableItems'), enableScrollX());
        view.addEventListener('viewshow', function (e) {
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

            events.on(playbackManager, 'playbackstop', onPlaybackStop);
            events.on(ApiClient, 'message', onWebSocketMessage);
            inputManager.on(window, onInputCommand);
        });
        view.addEventListener('viewbeforehide', function (e) {
            inputManager.off(window, onInputCommand);
            events.off(playbackManager, 'playbackstop', onPlaybackStop);
            events.off(ApiClient, 'message', onWebSocketMessage);
        });
        view.addEventListener('viewdestroy', function (e) {
            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        });
    }

/* eslint-enable indent */
