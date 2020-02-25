define(["events", "layoutManager", "inputManager", "userSettings", "libraryMenu", "mainTabsManager", "cardBuilder", "dom", "imageLoader", "playbackManager", "emby-scroller", "emby-itemscontainer", "emby-tabs", "emby-button"], function (events, layoutManager, inputManager, userSettings, libraryMenu, mainTabsManager, cardBuilder, dom, imageLoader, playbackManager) {
    "use strict";

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getPortraitShape() {
        return enableScrollX() ? "overflowPortrait" : "portrait";
    }

    function getThumbShape() {
        return enableScrollX() ? "overflowBackdrop" : "backdrop";
    }

    function loadLatest(page, userId, parentId) {
        var options = {
            IncludeItemTypes: "Movie",
            Limit: 18,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };
        ApiClient.getJSON(ApiClient.getUrl("Users/" + userId + "/Items/Latest", options)).then(function (items) {
            var allowBottomPadding = !enableScrollX();
            var container = page.querySelector("#recentlyAddedItems");
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
        var screenWidth = dom.getWindowSize().innerWidth;
        var options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Movie",
            Filters: "IsResumable",
            Limit: screenWidth >= 1920 ? 5 : screenWidth >= 1600 ? 5 : 3,
            Recursive: true,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            CollapseBoxSetItems: false,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: false
        };
        ApiClient.getItems(userId, options).then(function (result) {
            if (result.Items.length) {
                page.querySelector("#resumableSection").classList.remove("hide");
            } else {
                page.querySelector("#resumableSection").classList.add("hide");
            }

            var allowBottomPadding = !enableScrollX();
            var container = page.querySelector("#resumableItems");
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
        var html = "";
        var title = "";

        switch (recommendation.RecommendationType) {
            case "SimilarToRecentlyPlayed":
                title = Globalize.translate("RecommendationBecauseYouWatched").replace("{0}", recommendation.BaselineItemName);
                break;

            case "SimilarToLikedItem":
                title = Globalize.translate("RecommendationBecauseYouLike").replace("{0}", recommendation.BaselineItemName);
                break;

            case "HasDirectorFromRecentlyPlayed":
            case "HasLikedDirector":
                title = Globalize.translate("RecommendationDirectedBy").replace("{0}", recommendation.BaselineItemName);
                break;

            case "HasActorFromRecentlyPlayed":
            case "HasLikedActor":
                title = Globalize.translate("RecommendationStarring").replace("{0}", recommendation.BaselineItemName);
                break;
        }

        html += '<div class="verticalSection">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + "</h2>";
        var allowBottomPadding = true;

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
        html += "</div>";
        html += "</div>";
        return html;
    }

    function loadSuggestions(page, userId, parentId) {
        var screenWidth = dom.getWindowSize().innerWidth;
        var url = ApiClient.getUrl("Movies/Recommendations", {
            userId: userId,
            categoryLimit: 6,
            ItemLimit: screenWidth >= 1920 ? 8 : screenWidth >= 1600 ? 8 : screenWidth >= 1200 ? 6 : 5,
            Fields: "PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
        });
        ApiClient.getJSON(url).then(function (recommendations) {
            if (!recommendations.length) {
                page.querySelector(".noItemsMessage").classList.remove("hide");
                page.querySelector(".recommendations").innerHTML = "";
                return;
            }

            var html = recommendations.map(getRecommendationHtml).join("");
            page.querySelector(".noItemsMessage").classList.add("hide");
            var recs = page.querySelector(".recommendations");
            recs.innerHTML = html;
            imageLoader.lazyChildren(recs);

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }

    function autoFocus(page) {
        require(["autoFocuser"], function (autoFocuser) {
            autoFocuser.autoFocus(page);
        });
    }

    function setScrollClasses(elem, scrollX) {
        if (scrollX) {
            elem.classList.add("hiddenScrollX");

            if (layoutManager.tv) {
                elem.classList.add("smoothScrollX");
                elem.classList.add("padded-top-focusscale");
                elem.classList.add("padded-bottom-focusscale");
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

    function initSuggestedTab(page, tabContent) {
        var containers = tabContent.querySelectorAll(".itemsContainer");

        for (var i = 0, length = containers.length; i < length; i++) {
            setScrollClasses(containers[i], enableScrollX());
        }
    }

    function loadSuggestionsTab(view, params, tabContent) {
        var parentId = params.topParentId;
        var userId = ApiClient.getCurrentUserId();
        console.debug("loadSuggestionsTab");
        loadResume(tabContent, userId, parentId);
        loadLatest(tabContent, userId, parentId);
        loadSuggestions(tabContent, userId, parentId);
    }

    function getTabs() {
        return [{
            name: Globalize.translate("Movies")
        }, {
            name: Globalize.translate("TabSuggestions")
        }, {
            name: Globalize.translate("TabTrailers")
        }, {
            name: Globalize.translate("TabFavorites")
        }, {
            name: Globalize.translate("TabCollections")
        }, {
            name: Globalize.translate("TabGenres")
        }, {
            name: Globalize.translate("ButtonSearch"),
            cssClass: "searchTabButton"
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get("landing-" + folderId)) {
            case "suggestions":
                return 1;

            case "favorites":
                return 3;

            case "collections":
                return 4;

            case "genres":
                return 5;

            default:
                return 0;
        }
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
            return view.querySelectorAll(".pageTabContent");
        }

        function initTabs() {
            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        }

        function getTabController(page, index, callback) {
            var depends = [];

            switch (index) {
                case 0:
                    depends.push("controllers/movies/movies");
                    break;

                case 1:
                    break;

                case 2:
                    depends.push("controllers/movies/movietrailers");
                    break;

                case 3:
                    depends.push("controllers/movies/movies");
                    break;

                case 4:
                    depends.push("controllers/movies/moviecollections");
                    break;

                case 5:
                    depends.push("controllers/movies/moviegenres");
                    break;

                case 6:
                    depends.push("scripts/searchtab");
            }

            require(depends, function (controllerFactory) {
                var tabContent;

                if (index === suggestionsTabIndex) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                    self.tabContent = tabContent;
                }

                var controller = tabControllers[index];

                if (!controller) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                    if (index === suggestionsTabIndex) {
                        controller = self;
                    } else if (index === 6) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: "movies",
                            parentId: params.topParentId
                        });
                    } else if (index == 0 || index == 3) {
                        controller = new controllerFactory(view, params, tabContent, {
                            mode: index ? "favorites" : "movies"
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

        function onInputCommand(e) {
            switch (e.detail.command) {
                case "search":
                    e.preventDefault();
                    Dashboard.navigate("search.html?collectionType=movies&parentId=" + params.topParentId);
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
        view.addEventListener("viewshow", function (e) {
            if (isViewRestored = e.detail.isRestored, initTabs(), !view.getAttribute("data-title")) {
                var parentId = params.topParentId;

                if (parentId) {
                    ApiClient.getItem(ApiClient.getCurrentUserId(), parentId).then(function (item) {
                        view.setAttribute("data-title", item.Name);
                        libraryMenu.setTitle(item.Name);
                    });
                } else {
                    view.setAttribute("data-title", Globalize.translate("TabMovies"));
                    libraryMenu.setTitle(Globalize.translate("TabMovies"));
                }
            }

            events.on(playbackManager, "playbackstop", onPlaybackStop);
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
