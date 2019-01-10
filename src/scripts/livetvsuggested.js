define(["layoutManager", "userSettings", "inputManager", "loading", "globalize", "libraryBrowser", "mainTabsManager", "cardBuilder", "apphost", "imageLoader", "scrollStyles", "emby-itemscontainer", "emby-tabs", "emby-button"], function (layoutManager, userSettings, inputManager, loading, globalize, libraryBrowser, mainTabsManager, cardBuilder, appHost, imageLoader) {
    "use strict";

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getBackdropShape() {
        if (enableScrollX()) {
            return "overflowBackdrop";
        }
        return "backdrop";
    }

    function getPortraitShape() {
        if (enableScrollX()) {
            return "overflowPortrait";
        }
        return "portrait";
    }

    function getLimit() {
        if (enableScrollX()) {
            return 12;
        }
        return 9;
    }

    function loadRecommendedPrograms(page) {
        loading.show();
        var limit = getLimit();

        if (enableScrollX()) {
            limit *= 2;
        }

        ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: true,
            limit: limit,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: false,
            Fields: "ChannelInfo,PrimaryImageAspectRatio"
        }).then(function (result) {
            renderItems(page, result.Items, "activeProgramItems", "play", {
                showAirDateTime: false,
                showAirEndTime: true
            });
            loading.hide();
        });
    }

    function reload(page, enableFullRender) {
        if (enableFullRender) {
            loadRecommendedPrograms(page);
            ApiClient.getLiveTvPrograms({
                userId: Dashboard.getCurrentUserId(),
                HasAired: false,
                limit: getLimit(),
                IsMovie: false,
                IsSports: false,
                IsKids: false,
                IsNews: false,
                IsSeries: true,
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo,PrimaryImageAspectRatio",
                EnableImageTypes: "Primary,Thumb"
            }).then(function (result) {
                renderItems(page, result.Items, "upcomingEpisodeItems");
            });
            ApiClient.getLiveTvPrograms({
                userId: Dashboard.getCurrentUserId(),
                HasAired: false,
                limit: getLimit(),
                IsMovie: true,
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo",
                EnableImageTypes: "Primary,Thumb"
            }).then(function (result) {
                renderItems(page, result.Items, "upcomingTvMovieItems", null, {
                    shape: getPortraitShape(),
                    preferThumb: null,
                    showParentTitle: false
                });
            });
            ApiClient.getLiveTvPrograms({
                userId: Dashboard.getCurrentUserId(),
                HasAired: false,
                limit: getLimit(),
                IsSports: true,
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo,PrimaryImageAspectRatio",
                EnableImageTypes: "Primary,Thumb"
            }).then(function (result) {
                renderItems(page, result.Items, "upcomingSportsItems");
            });
            ApiClient.getLiveTvPrograms({
                userId: Dashboard.getCurrentUserId(),
                HasAired: false,
                limit: getLimit(),
                IsKids: true,
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo,PrimaryImageAspectRatio",
                EnableImageTypes: "Primary,Thumb"
            }).then(function (result) {
                renderItems(page, result.Items, "upcomingKidsItems");
            });
            ApiClient.getLiveTvPrograms({
                userId: Dashboard.getCurrentUserId(),
                HasAired: false,
                limit: getLimit(),
                IsNews: true,
                EnableTotalRecordCount: false,
                Fields: "ChannelInfo,PrimaryImageAspectRatio",
                EnableImageTypes: "Primary,Thumb"
            }).then(function (result) {
                renderItems(page, result.Items, "upcomingNewsItems", null, {
                    showParentTitleOrTitle: true,
                    showTitle: false,
                    showParentTitle: false
                });
            });
        }
    }

    function renderItems(page, items, sectionClass, overlayButton, cardOptions) {
        var html = cardBuilder.getCardsHtml(Object.assign({
            items: items,
            preferThumb: "auto",
            inheritThumb: false,
            shape: enableScrollX() ? "autooverflow" : "auto",
            defaultShape: getBackdropShape(),
            showParentTitle: true,
            showTitle: true,
            centerText: true,
            coverImage: true,
            overlayText: false,
            lazy: true,
            overlayPlayButton: "play" === overlayButton,
            overlayMoreButton: "more" === overlayButton,
            overlayInfoButton: "info" === overlayButton,
            allowBottomPadding: !enableScrollX(),
            showAirTime: true,
            showAirDateTime: true
        }, cardOptions || {}));
        var elem = page.querySelector("." + sectionClass);
        elem.innerHTML = html;
        imageLoader.lazyChildren(elem);
    }

    function getTabs() {
        return [
            { name: globalize.translate("Programs") },
            { name: globalize.translate("TabGuide") },
            { name: globalize.translate("TabChannels") },
            { name: globalize.translate("TabRecordings") },
            { name: globalize.translate("HeaderSchedule") },
            { name: globalize.translate("TabSeries") },
            { name: globalize.translate("ButtonSearch"), cssClass: "searchTabButton" }
        ];
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

    function getDefaultTabIndex(folderId) {
        if (userSettings.get("landing-" + folderId) === "guide") {
            return 1;
        }
        return 0;
    }

    return function (view, params) {
        function enableFullRender() {
            return new Date().getTime() - lastFullRender > 3e5;
        }

        function onBeforeTabChange(evt) {
            preLoadTab(view, parseInt(evt.detail.selectedTabIndex));
        }

        function onTabChange(evt) {
            var previousTabController = tabControllers[parseInt(evt.detail.previousIndex)];

            if (previousTabController && previousTabController.onHide) {
                previousTabController.onHide();
            }

            loadTab(view, parseInt(evt.detail.selectedTabIndex));
        }

        function getTabContainers() {
            return view.querySelectorAll(".pageTabContent");
        }

        function initTabs() {
            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        }

        function getTabController(page, index, callback) {
            var depends = [];

            // TODO int is a little hard to read
            switch (index) {
                case 0:
                    break;
                case 1:
                    depends.push("scripts/livetvguide");
                    break;
                case 2:
                    depends.push("scripts/livetvchannels");
                    break;
                case 3:
                    depends.push("scripts/livetvrecordings");
                    break;
                case 4:
                    depends.push("scripts/livetvschedule");
                    break;
                case 5:
                    depends.push("scripts/livetvseriestimers");
                    break;
                case 6:
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
                    if (0 === index) {
                        controller = self;
                    } else if (6 === index) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: "livetv"
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
                if (renderedTabs.indexOf(index) === -1 && controller.preRender) {
                    controller.preRender();
                }
            });
        }

        function loadTab(page, index) {
            currentTabIndex = index;
            getTabController(page, index, function (controller) {
                initialTabIndex = null;

                if (1 === index) {
                    document.body.classList.add("autoScrollY");
                } else {
                    document.body.classList.remove("autoScrollY");
                }

                if (-1 == renderedTabs.indexOf(index)) {
                    if (1 === index) {
                        renderedTabs.push(index);
                    }

                    controller.renderTab();
                } else if (controller.onShow) {
                    controller.onShow();
                }

                currentTabController = controller;
            });
        }

        function onInputCommand(evt) {
            if (evt.detail.command === "search") {
                evt.preventDefault();
                Dashboard.navigate("search.html?collectionType=livetv");
            }
        }

        var isViewRestored;
        var self = this;
        var currentTabIndex = parseInt(params.tab || getDefaultTabIndex("livetv"));
        var initialTabIndex = currentTabIndex;
        var lastFullRender = 0;
        [].forEach.call(view.querySelectorAll(".sectionTitleTextButton-programs"), function (link) {
            var href = link.href;

            if (href) {
                link.href = href + "&serverId=" + ApiClient.serverId();
            }
        });

        self.initTab = function () {
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            var containers = tabContent.querySelectorAll(".itemsContainer");

            for (var i = 0, length = containers.length; i < length; i++) {
                setScrollClasses(containers[i], enableScrollX());
            }
        };

        self.renderTab = function () {
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");

            if (enableFullRender()) {
                reload(tabContent, true);
                lastFullRender = new Date().getTime();
            } else {
                reload(tabContent);
            }
        };

        var currentTabController;
        var tabControllers = [];
        var renderedTabs = [];
        view.addEventListener("viewbeforeshow", function (evt) {
            isViewRestored = evt.detail.isRestored;
            initTabs();
        });
        view.addEventListener("viewshow", function (evt) {
            isViewRestored = evt.detail.isRestored;
            if (!isViewRestored) {
                mainTabsManager.selectedTabIndex(initialTabIndex);
            }
            inputManager.on(window, onInputCommand);
        });
        view.addEventListener("viewbeforehide", function (e__u) {
            if (currentTabController && currentTabController.onHide) {
                currentTabController.onHide();
            }
            document.body.classList.remove("autoScrollY");
            inputManager.off(window, onInputCommand);
        });
        view.addEventListener("viewdestroy", function (evt) {
            tabControllers.forEach(function (tabController) {
                if (tabController.destroy) {
                    tabController.destroy();
                }
            });
        });
    };
});
