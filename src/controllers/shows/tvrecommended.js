define(["events", "inputManager", "libraryMenu", "layoutManager", "loading", "dom", "userSettings", "cardBuilder", "playbackManager", "mainTabsManager", "scrollStyles", "emby-itemscontainer", "emby-button"], function (events, inputManager, libraryMenu, layoutManager, loading, dom, userSettings, cardBuilder, playbackManager, mainTabsManager) {
    "use strict";

    function getTabs() {
        return [{
            name: Globalize.translate("TabShows")
        }, {
            name: Globalize.translate("TabSuggestions")
        }, {
            name: Globalize.translate("TabLatest")
        }, {
            name: Globalize.translate("TabUpcoming")
        }, {
            name: Globalize.translate("TabGenres")
        }, {
            name: Globalize.translate("TabNetworks")
        }, {
            name: Globalize.translate("TabEpisodes")
        }, {
            name: Globalize.translate("ButtonSearch"),
            cssClass: "searchTabButton"
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get("landing-" + folderId)) {
            case "suggestions":
                return 1;

            case "latest":
                return 2;

            case "favorites":
                return 1;

            case "genres":
                return 4;

            default:
                return 0;
        }
    }

    function setScrollClasses(elem, scrollX) {
        if (scrollX) {
            elem.classList.add("hiddenScrollX");

            if (layoutManager.tv) {
                elem.classList.add("smoothScrollX");
            }

            elem.classList.add("scrollX");
            elem.classList.remove("vertical-wrap");
        } else {
            elem.classList.remove("hiddenScrollX");
            elem.classList.remove("smoothScrollX");
            elem.classList.remove("scrollX");
            elem.classList.add("vertical-wrap");
        }
    }

    return function (view, params) {
        function reload() {
            loading.show();
            loadResume();
            loadNextUp();
        }

        function loadNextUp() {
            var query = {
                Limit: 24,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
                UserId: ApiClient.getCurrentUserId(),
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false
            };
            query.ParentId = libraryMenu.getTopParentId();
            ApiClient.getNextUpEpisodes(query).then(function (result) {
                if (result.Items.length) {
                    view.querySelector(".noNextUpItems").classList.add("hide");
                } else {
                    view.querySelector(".noNextUpItems").classList.remove("hide");
                }

                var container = view.querySelector("#nextUpItems");
                cardBuilder.buildCards(result.Items, {
                    itemsContainer: container,
                    preferThumb: true,
                    shape: "backdrop",
                    scalable: true,
                    showTitle: true,
                    showParentTitle: true,
                    overlayText: false,
                    centerText: true,
                    overlayPlayButton: true,
                    cardLayout: false
                });
                loading.hide();

                require(["autoFocuser"], function (autoFocuser) {
                    autoFocuser.autoFocus(view);
                });
            });
        }

        function enableScrollX() {
            return !layoutManager.desktop;
        }

        function getThumbShape() {
            return enableScrollX() ? "overflowBackdrop" : "backdrop";
        }

        function loadResume() {
            var parentId = libraryMenu.getTopParentId();
            var screenWidth = dom.getWindowSize().innerWidth;
            var limit = screenWidth >= 1600 ? 5 : 6;
            var options = {
                SortBy: "DatePlayed",
                SortOrder: "Descending",
                IncludeItemTypes: "Episode",
                Filters: "IsResumable",
                Limit: limit,
                Recursive: true,
                Fields: "PrimaryImageAspectRatio,SeriesInfo,UserData,BasicSyncInfo",
                ExcludeLocationTypes: "Virtual",
                ParentId: parentId,
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Thumb",
                EnableTotalRecordCount: false
            };
            ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
                if (result.Items.length) {
                    view.querySelector("#resumableSection").classList.remove("hide");
                } else {
                    view.querySelector("#resumableSection").classList.add("hide");
                }

                var allowBottomPadding = !enableScrollX();
                var container = view.querySelector("#resumableItems");
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
            var newIndex = parseInt(e.detail.selectedTabIndex);
            loadTab(view, newIndex);
        }

        function getTabContainers() {
            return view.querySelectorAll(".pageTabContent");
        }

        function initTabs() {
            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        }

        function getTabController(page, index, callback) {
            var depends = [];

            switch (index) {
                case 0:
                    depends.push("controllers/shows/tvshows");
                    break;

                case 1:
                    break;

                case 2:
                    depends.push("controllers/shows/tvlatest");
                    break;

                case 3:
                    depends.push("controllers/shows/tvupcoming");
                    break;

                case 4:
                    depends.push("controllers/shows/tvgenres");
                    break;

                case 5:
                    depends.push("controllers/shows/tvstudios");
                    break;

                case 6:
                    depends.push("controllers/shows/episodes");
                    break;

                case 7:
                    depends.push("scripts/searchtab");
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
                    } else if (index === 7) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: "tvshows",
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
            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == "Video") {
                renderedTabs = [];
                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        function onWebSocketMessage(e, data) {
            var msg = data;

            if (msg.MessageType === "UserDataChanged" && msg.Data.UserId == ApiClient.getCurrentUserId()) {
                renderedTabs = [];
            }
        }

        function onInputCommand(e) {
            switch (e.detail.command) {
                case "search":
                    e.preventDefault();
                    Dashboard.navigate("search.html?collectionType=tv&parentId=" + params.topParentId);
            }
        }

        var isViewRestored;
        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));
        var initialTabIndex = currentTabIndex;

        self.initTab = function () {
            var tabContent = self.tabContent;
            setScrollClasses(tabContent.querySelector("#resumableItems"), enableScrollX());
        };

        self.renderTab = function () {
            reload();
        };

        var tabControllers = [];
        var renderedTabs = [];
        setScrollClasses(view.querySelector("#resumableItems"), enableScrollX());
        view.addEventListener("viewshow", function (e) {
            isViewRestored = e.detail.isRestored;
            initTabs();
            if (!view.getAttribute("data-title")) {
                var parentId = params.topParentId;

                if (parentId) {
                    ApiClient.getItem(ApiClient.getCurrentUserId(), parentId).then(function (item) {
                        view.setAttribute("data-title", item.Name);
                        libraryMenu.setTitle(item.Name);
                    });
                } else {
                    view.setAttribute("data-title", Globalize.translate("TabShows"));
                    libraryMenu.setTitle(Globalize.translate("TabShows"));
                }
            }

            events.on(playbackManager, "playbackstop", onPlaybackStop);
            events.on(ApiClient, "message", onWebSocketMessage);
            inputManager.on(window, onInputCommand);
        });
        view.addEventListener("viewbeforehide", function (e) {
            inputManager.off(window, onInputCommand);
            events.off(playbackManager, "playbackstop", onPlaybackStop);
            events.off(ApiClient, "message", onWebSocketMessage);
        });
        view.addEventListener("viewdestroy", function (e) {
            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        });
    };
});
