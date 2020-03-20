define(["browser", "layoutManager", "userSettings", "inputManager", "loading", "cardBuilder", "dom", "apphost", "imageLoader", "libraryMenu", "playbackManager", "mainTabsManager", "scrollStyles", "emby-itemscontainer", "emby-tabs", "emby-button", "flexStyles"], function (browser, layoutManager, userSettings, inputManager, loading, cardBuilder, dom, appHost, imageLoader, libraryMenu, playbackManager, mainTabsManager) {
    "use strict";

    function itemsPerRow() {
        var screenWidth = dom.getWindowSize().innerWidth;

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

    function getSquareShape() {
        return enableScrollX() ? "overflowSquare" : "square";
    }

    function loadLatest(page, parentId) {
        loading.show();
        var userId = ApiClient.getCurrentUserId();
        var options = {
            IncludeItemTypes: "Audio",
            Limit: enableScrollX() ? 3 * itemsPerRow() : 2 * itemsPerRow(),
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };
        ApiClient.getJSON(ApiClient.getUrl("Users/" + userId + "/Items/Latest", options)).then(function (items) {
            var elem = page.querySelector("#recentlyAddedSongs");
            var supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = false;
            elem.innerHTML = cardBuilder.getCardsHtml({
                items: items,
                showUnplayedIndicator: false,
                showLatestItemsPopup: false,
                shape: getSquareShape(),
                showTitle: true,
                showParentTitle: true,
                lazy: true,
                centerText: !supportsImageAnalysis,
                overlayPlayButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                coverImage: true
            });
            imageLoader.lazyChildren(elem);
            loading.hide();

            require(["autoFocuser"], function (autoFocuser) {
                autoFocuser.autoFocus(page);
            });
        });
    }

    function loadRecentlyPlayed(page, parentId) {
        var options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: itemsPerRow(),
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,AudioInfo",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };
        ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
            var elem = page.querySelector("#recentlyPlayed");

            if (result.Items.length) {
                elem.classList.remove("hide");
            } else {
                elem.classList.add("hide");
            }

            var itemsContainer = elem.querySelector(".itemsContainer");
            var supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = false;
            itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                showUnplayedIndicator: false,
                shape: getSquareShape(),
                showTitle: true,
                showParentTitle: true,
                action: "instantmix",
                lazy: true,
                centerText: !supportsImageAnalysis,
                overlayMoreButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                coverImage: true
            });
            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function loadFrequentlyPlayed(page, parentId) {
        var options = {
            SortBy: "PlayCount",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: itemsPerRow(),
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,AudioInfo",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };
        ApiClient.getItems(ApiClient.getCurrentUserId(), options).then(function (result) {
            var elem = page.querySelector("#topPlayed");

            if (result.Items.length) {
                elem.classList.remove("hide");
            } else {
                elem.classList.add("hide");
            }

            var itemsContainer = elem.querySelector(".itemsContainer");
            var supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = false;
            itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                showUnplayedIndicator: false,
                shape: getSquareShape(),
                showTitle: true,
                showParentTitle: true,
                action: "instantmix",
                lazy: true,
                centerText: !supportsImageAnalysis,
                overlayMoreButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                coverImage: true
            });
            imageLoader.lazyChildren(itemsContainer);
        });
    }

    function loadSuggestionsTab(page, tabContent, parentId) {
        console.debug("loadSuggestionsTab");
        loadLatest(tabContent, parentId);
        loadRecentlyPlayed(tabContent, parentId);
        loadFrequentlyPlayed(tabContent, parentId);

        require(["components/favoriteitems"], function (favoriteItems) {
            favoriteItems.render(tabContent, ApiClient.getCurrentUserId(), parentId, ["favoriteArtists", "favoriteAlbums", "favoriteSongs"]);
        });
    }

    function getTabs() {
        return [{
            name: Globalize.translate("TabSuggestions")
        }, {
            name: Globalize.translate("TabAlbums")
        }, {
            name: Globalize.translate("TabAlbumArtists")
        }, {
            name: Globalize.translate("TabArtists")
        }, {
            name: Globalize.translate("TabPlaylists")
        }, {
            name: Globalize.translate("TabSongs")
        }, {
            name: Globalize.translate("TabGenres")
        }, {
            name: Globalize.translate("ButtonSearch"),
            cssClass: "searchTabButton"
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get("landing-" + folderId)) {
            case "albums":
                return 1;

            case "albumartists":
                return 2;

            case "artists":
                return 3;

            case "playlists":
                return 4;

            case "songs":
                return 5;

            case "genres":
                return 6;

            default:
                return 0;
        }
    }

    return function (view, params) {
        function reload() {
            loading.show();
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            loadSuggestionsTab(view, tabContent, params.topParentId);
        }

        function enableScrollX() {
            return browser.mobile;
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

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            loadTab(view, parseInt(e.detail.selectedTabIndex));
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
                    break;

                case 1:
                    depends.push("controllers/music/musicalbums");
                    break;

                case 2:
                case 3:
                    depends.push("controllers/music/musicartists");
                    break;

                case 4:
                    depends.push("controllers/music/musicplaylists");
                    break;

                case 5:
                    depends.push("controllers/music/songs");
                    break;

                case 6:
                    depends.push("controllers/music/musicgenres");
                    break;

                case 7:
                    depends.push("scripts/searchtab");
            }

            require(depends, function (controllerFactory) {
                var tabContent;

                if (0 == index) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                    self.tabContent = tabContent;
                }

                var controller = tabControllers[index];

                if (!controller) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                    if (index === 0) {
                        controller = self;
                    } else if (index === 7) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: "music",
                            parentId: params.topParentId
                        });
                    } else {
                        controller = new controllerFactory(view, params, tabContent);
                    }

                    if (index == 2) {
                        controller.mode = "albumartists";
                    } else if (index == 3) {
                        controller.mode = "artists";
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

        function onInputCommand(e) {
            switch (e.detail.command) {
                case "search":
                    e.preventDefault();
                    Dashboard.navigate("search.html?collectionType=music&parentId=" + params.topParentId);
            }
        }

        var isViewRestored;
        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));
        var initialTabIndex = currentTabIndex;

        self.initTab = function () {
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            var containers = tabContent.querySelectorAll(".itemsContainer");

            for (var i = 0, length = containers.length; i < length; i++) {
                setScrollClasses(containers[i], enableScrollX());
            }
        };

        self.renderTab = function () {
            reload();
        };

        var tabControllers = [];
        var renderedTabs = [];
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
                    view.setAttribute("data-title", Globalize.translate("TabMusic"));
                    libraryMenu.setTitle(Globalize.translate("TabMusic"));
                }
            }

            inputManager.on(window, onInputCommand);
        });
        view.addEventListener("viewbeforehide", function (e) {
            inputManager.off(window, onInputCommand);
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
