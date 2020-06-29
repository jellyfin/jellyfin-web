define(['events', 'inputManager', 'libraryMenu', 'layoutManager', 'loading', 'dom', 'userSettings', 'cardBuilder', 'playbackManager', 'mainTabsManager', 'globalize', 'scrollStyles', 'emby-itemscontainer', 'emby-button'], function (events, inputManager, libraryMenu, layoutManager, loading, dom, userSettings, cardBuilder, playbackManager, mainTabsManager, globalize) {
    'use strict';

    function getTabs() {
        return [{
            name: globalize.translate('TabShows')
        }, {
            name: globalize.translate('TabSuggestions')
        }, {
            name: globalize.translate('TabUpcoming')
        }, {
            name: globalize.translate('TabGenres')
        }, {
            name: globalize.translate('TabNetworks')
        }, {
            name: globalize.translate('TabEpisodes')
        }, {
            name: globalize.translate('ButtonSearch'),
            cssClass: 'searchTabButton'
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get('landing-' + folderId)) {
            case 'suggestions':
                return 1;

            case 'favorites':
                return 1;

            case 'genres':
                return 3;

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
        var containers = tabContent.querySelectorAll('.itemsContainer');

        for (var i = 0, length = containers.length; i < length; i++) {
            setScrollClasses(containers[i], enableScrollX());
        }
    }

    function loadSuggestionsTab(view, params, tabContent) {
        var parentId = params.topParentId;
        var userId = ApiClient.getCurrentUserId();
        console.debug('loadSuggestionsTab');
        loadResume(tabContent, userId, parentId);
        loadLatest(tabContent, userId, parentId);
        loadNextUp(tabContent, userId, parentId);
    }

    function loadResume(view, userId, parentId) {
        var screenWidth = dom.getWindowSize().innerWidth;
        var options = {
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            IncludeItemTypes: 'Episode',
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
                view.querySelector('#resumableSection').classList.remove('hide');
            } else {
                view.querySelector('#resumableSection').classList.add('hide');
            }

            var allowBottomPadding = !enableScrollX();
            var container = view.querySelector('#resumableItems');
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
            loading.hide();

            require(['autoFocuser'], function (autoFocuser) {
                autoFocuser.autoFocus(view);
            });
        });
    }

    function loadLatest(view, userId, parentId) {
        var options = {
            userId: userId,
            IncludeItemTypes: 'Episode',
            Limit: 30,
            Fields: 'PrimaryImageAspectRatio,BasicSyncInfo',
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Thumb'
        };
        ApiClient.getLatestItems(options).then(function (items) {
            var section = view.querySelector('#latestItemsSection');
            var allowBottomPadding = !enableScrollX();
            var container = section.querySelector('#latestEpisodesItems');
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

            require(['autoFocuser'], function (autoFocuser) {
                autoFocuser.autoFocus(view);
            });
        });
    }

    function loadNextUp(view, userId, parentId) {
        var query = {
            userId: userId,
            Limit: 24,
            Fields: 'PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo',
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

            var section = view.querySelector('#nextUpItemsSection');
            var container = section.querySelector('#nextUpItems');
            cardBuilder.buildCards(result.Items, {
                parentContainer: section,
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

            require(['autoFocuser'], function (autoFocuser) {
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

    return function (view, params) {

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            var newIndex = parseInt(e.detail.selectedTabIndex);
            loadTab(view, newIndex);
        }

        function getTabContainers() {
            return view.querySelectorAll('.pageTabContent');
        }

        function initTabs() {
            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        }

        function getTabController(page, index, callback) {
            var depends = [];

            switch (index) {
                case 0:
                    depends.push('controllers/shows/tvshows');
                    break;

                case 1:
                    break;

                case 2:
                    depends.push('controllers/shows/tvupcoming');
                    break;

                case 3:
                    depends.push('controllers/shows/tvgenres');
                    break;

                case 4:
                    depends.push('controllers/shows/tvstudios');
                    break;

                case 5:
                    depends.push('controllers/shows/episodes');
                    break;

                case 6:
                    depends.push('scripts/searchtab');
            }

            require(depends, function (controllerFactory) {
                var tabContent;

                if (index === 1) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                    self.tabContent = tabContent;
                }

                var controller = tabControllers[index];

                if (!controller) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                    if (index === 1) {
                        controller = self;
                    } else if (index === 6) {
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
                initialTabIndex = null;

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
            var msg = data;

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

        var isViewRestored;
        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));
        var initialTabIndex = currentTabIndex;
        var suggestionsTabIndex = 1;

        self.initTab = function () {
            var tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
            initSuggestedTab(view, tabContent);
        };

        self.renderTab = function () {
            var tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
            loadSuggestionsTab(view, params, tabContent);
        };

        var tabControllers = [];
        var renderedTabs = [];
        view.addEventListener('viewshow', function (e) {
            isViewRestored = e.detail.isRestored;
            initTabs();
            if (!view.getAttribute('data-title')) {
                var parentId = params.topParentId;

                if (parentId) {
                    ApiClient.getItem(ApiClient.getCurrentUserId(), parentId).then(function (item) {
                        view.setAttribute('data-title', item.Name);
                        libraryMenu.setTitle(item.Name);
                    });
                } else {
                    view.setAttribute('data-title', globalize.translate('TabShows'));
                    libraryMenu.setTitle(globalize.translate('TabShows'));
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
    };
});
