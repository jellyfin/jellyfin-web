define(["dom", "layoutManager", "inputManager", "connectionManager", "events", "viewManager", "libraryBrowser", "appRouter", "apphost", "playbackManager", "browser", "globalize", "scripts/imagehelper", "paper-icon-button-light", "material-icons", "scrollStyles", "flexStyles"], function (dom, layoutManager, inputManager, connectionManager, events, viewManager, libraryBrowser, appRouter, appHost, playbackManager, browser, globalize, imageHelper) {
    "use strict";

    function getCurrentApiClient() {
        if (currentUser && currentUser.localUser) {
            return connectionManager.getApiClient(currentUser.localUser.ServerId);
        }

        return connectionManager.currentApiClient();
    }

    function lazyLoadViewMenuBarImages() {
        require(["imageLoader"], function (imageLoader) {
            imageLoader.lazyChildren(skinHeader);
        });
    }

    function onBackClick() {
        appRouter.back();
    }

    function updateUserInHeader(user) {
        var hasImage;

        if (user && user.name) {
            if (user.imageUrl) {
                var url = user.imageUrl;

                if (user.supportsImageParams) {
                    url += "&height=" + Math.round(26 * Math.max(window.devicePixelRatio || 1, 2));
                }

                updateHeaderUserButton(url);
                hasImage = true;
            }

            headerUserButton.classList.remove("hide");
        } else {
            headerUserButton.classList.add("hide");
        }

        if (!hasImage) {
            updateHeaderUserButton(null);
        }

        if (user && user.localUser) {
            if (headerHomeButton) {
                headerHomeButton.classList.remove("hide");
            }

            if (headerSearchButton) {
                headerSearchButton.classList.remove("hide");
            }

            if (headerSettingsButton) {
                if (user.localUser.Policy.IsAdministrator) {
                    headerSettingsButton.classList.remove("hide");
                } else {
                    headerSettingsButton.classList.add("hide");
                }
            }

            headerCastButton.classList.remove("hide");
        } else {
            headerHomeButton.classList.add("hide");
            headerCastButton.classList.add("hide");

            if (headerSearchButton) {
                headerSearchButton.classList.add("hide");
            }

            if (headerSettingsButton) {
                headerSettingsButton.classList.add("hide");
            }
        }

        requiresUserRefresh = false;
    }

    function updateHeaderUserButton(src) {
        if (src) {
            headerUserButton.classList.add("headerUserButtonRound");
            headerUserButton.innerHTML = '<img src="' + src + '" />';
        } else {
            headerUserButton.classList.remove("headerUserButtonRound");
            headerUserButton.innerHTML = '<i class="md-icon">&#xE7FD;</i>';
        }
    }

    function showSearch() {
        inputManager.trigger("search");
    }

    function onHeaderUserButtonClick(e) {
        Dashboard.navigate("mypreferencesmenu.html");
    }

    function onSettingsClick(e) {
        Dashboard.navigate("dashboard.html");
    }

    function onHeaderHomeButtonClick() {
        Dashboard.navigate("home.html");
    }

    function bindMenuEvents() {
        mainDrawerButton = document.querySelector(".mainDrawerButton");
        if (mainDrawerButton) {
            mainDrawerButton.addEventListener("click", toggleMainDrawer);
        }

        var headerBackButton = skinHeader.querySelector(".headerBackButton");

        if (headerBackButton) {
            headerBackButton.addEventListener("click", onBackClick);
        }

        if (headerSearchButton) {
            headerSearchButton.addEventListener("click", showSearch);
        }

        headerUserButton.addEventListener("click", onHeaderUserButtonClick);
        headerHomeButton.addEventListener("click", onHeaderHomeButtonClick);
        initHeadRoom(skinHeader);
        headerCastButton.addEventListener("click", onCastButtonClicked);

        if (headerSettingsButton) {
            headerSettingsButton.addEventListener("click", onSettingsClick);
        }
    }

    function onCastButtonClicked() {
        var btn = this;

        require(["playerSelectionMenu"], function (playerSelectionMenu) {
            playerSelectionMenu.show(btn);
        });
    }

    function getItemHref(item, context) {
        return appRouter.getRouteUrl(item, {
            context: context
        });
    }

    function toggleMainDrawer() {
        if (navDrawerInstance.isVisible) {
            closeMainDrawer();
        } else {
            openMainDrawer();
        }
    }

    function openMainDrawer() {
        navDrawerInstance.open();
        lastOpenTime = new Date().getTime();
    }

    function onMainDrawerOpened() {
        if (layoutManager.mobile) {
            document.body.classList.add("bodyWithPopupOpen");
        }
    }

    function closeMainDrawer() {
        navDrawerInstance.close();
    }

    function onMainDrawerSelect(e) {
        if (navDrawerInstance.isVisible) {
            onMainDrawerOpened();
        } else {
            document.body.classList.remove("bodyWithPopupOpen");
        }
    }

    function refreshLibraryInfoInDrawer(user, drawer) {
        var html = "";
        html += '<div style="height:.5em;"></div>';
        html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder" href="home.html"><i class="md-icon navMenuOptionIcon">home</i><span class="navMenuOptionText">' + globalize.translate("ButtonHome") + "</span></a>";

        // libraries are added here
        html += '<div class="libraryMenuOptions">';
        html += "</div>";

        if (user.localUser && user.localUser.Policy.IsAdministrator) {
            html += '<div class="adminMenuOptions">';
            html += '<h3 class="sidebarHeader">';
            html += globalize.translate("HeaderAdmin");
            html += "</h3>";
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder lnkManageServer" data-itemid="dashboard" href="dashboard.html"><i class="md-icon navMenuOptionIcon">dashboard</i><span class="navMenuOptionText">' + globalize.translate("TabDashboard") + "</span></a>";
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder editorViewMenu" data-itemid="editor" href="edititemmetadata.html"><i class="md-icon navMenuOptionIcon">mode_edit</i><span class="navMenuOptionText">' + globalize.translate("Metadata") + "</span></a>";
            html += "</div>";
        }

        if (user.localUser) {
            html += '<div class="userMenuOptions">';
            html += '<h3 class="sidebarHeader">';
            html += globalize.translate("HeaderUser");
            html += "</h3>";
            if (appHost.supports("multiserver")) {
                html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder" data-itemid="selectserver" href="selectserver.html?showuser=1"><i class="md-icon navMenuOptionIcon">wifi</i><span class="navMenuOptionText">' + globalize.translate("ButtonSelectServer") + "</span></a>";
            }
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnLogout" data-itemid="logout" href="#"><i class="md-icon navMenuOptionIcon">exit_to_app</i><span class="navMenuOptionText">' + globalize.translate("ButtonSignOut") + "</span></a>";
            html += "</div>";
        }

        // add buttons to navigation drawer
        navDrawerScrollContainer.innerHTML = html;

        // bind logout button click to method
        var btnLogout = navDrawerScrollContainer.querySelector(".btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", onLogoutClick);
        }
    }

    function refreshDashboardInfoInDrawer(apiClient) {
        currentDrawerType = "admin";
        loadNavDrawer();

        if (navDrawerScrollContainer.querySelector(".adminDrawerLogo")) {
            updateDashboardMenuSelectedItem();
        } else {
            createDashboardMenu(apiClient);
        }
    }

    function isUrlInCurrentView(url) {
        return -1 !== window.location.href.toString().toLowerCase().indexOf(url.toLowerCase());
    }

    function updateDashboardMenuSelectedItem() {
        var links = navDrawerScrollContainer.querySelectorAll(".navMenuOption");
        var currentViewId = viewManager.currentView().id;

        for (var i = 0, length = links.length; i < length; i++) {
            var link = links[i];
            var selected = false;
            var pageIds = link.getAttribute("data-pageids");

            if (pageIds) {
                pageIds = pageIds.split("|");
                selected = -1 != pageIds.indexOf(currentViewId);
            }

            var pageUrls = link.getAttribute("data-pageurls");

            if (pageUrls) {
                pageUrls = pageUrls.split("|");
                selected = pageUrls.filter(isUrlInCurrentView).length > 0;
            }
            if (selected) {
                link.classList.add("navMenuOption-selected");
                var title = "";
                link = link.querySelector("span") || link;
                title += (link.innerText || link.textContent).trim();
                LibraryMenu.setTitle(title);
            } else {
                link.classList.remove("navMenuOption-selected");
            }
        }
    }

    function createToolsMenuList(pluginItems) {
        var links = [{
            name: globalize.translate("TabServer")
        }, {
            name: globalize.translate("TabDashboard"),
            href: "dashboard.html",
            pageIds: ["dashboardPage"],
            icon: "dashboard"
        }, {
            name: globalize.translate("General"),
            href: "dashboardgeneral.html",
            pageIds: ["dashboardGeneralPage"],
            icon: "settings"
        }, {
            name: globalize.translate("TabUsers"),
            href: "userprofiles.html",
            pageIds: ["userProfilesPage", "newUserPage", "editUserPage", "userLibraryAccessPage", "userParentalControlPage", "userPasswordPage"],
            icon: "people"
        }, {
            name: globalize.translate("HeaderLibraries"),
            href: "library.html",
            pageIds: ["mediaLibraryPage", "librarySettingsPage", "libraryDisplayPage", "metadataImagesConfigurationPage", "metadataNfoPage"],
            icon: "folder"
        }, {
            name: globalize.translate("TabPlayback"),
            icon: "play_arrow",
            href: "encodingsettings.html",
            pageIds: ["encodingSettingsPage", "playbackConfigurationPage", "streamingSettingsPage"]
        }];
        addPluginPagesToMainMenu(links, pluginItems, "server");
        links.push({
            divider: true,
            name: globalize.translate("TabDevices")
        });
        links.push({
            name: globalize.translate("TabDevices"),
            href: "devices.html",
            pageIds: ["devicesPage", "devicePage"],
            icon: "devices"
        });
        links.push({
            name: globalize.translate("HeaderActivity"),
            href: "serveractivity.html",
            pageIds: ["serverActivityPage"],
            icon: "assessment"
        });
        links.push({
            name: globalize.translate("DLNA"),
            href: "dlnasettings.html",
            pageIds: ["dlnaSettingsPage", "dlnaProfilesPage", "dlnaProfilePage"],
            icon: "input"
        });
        links.push({
            divider: true,
            name: globalize.translate("TabLiveTV")
        });
        links.push({
            name: globalize.translate("TabLiveTV"),
            href: "livetvstatus.html",
            pageIds: ["liveTvStatusPage", "liveTvTunerPage"],
            icon: "live_tv"
        });
        links.push({
            name: globalize.translate("DVR"),
            href: "livetvsettings.html",
            pageIds: ["liveTvSettingsPage"],
            icon: "dvr"
        });
        links.push({
            divider: true,
            name: globalize.translate("TabAdvanced")
        });
        links.push({
            name: globalize.translate("TabNetworking"),
            icon: "cloud",
            href: "networking.html",
            pageIds: ["networkingPage"]
        });
        links.push({
            name: globalize.translate("HeaderApiKeys"),
            icon: "vpn_key",
            href: "apikeys.html",
            pageIds: ["apiKeysPage"]
        });
        links.push({
            name: globalize.translate("TabLogs"),
            href: "log.html",
            pageIds: ["logPage"],
            icon: "bug_report"
        });
        links.push({
            name: globalize.translate("TabNotifications"),
            icon: "notifications",
            href: "notificationsettings.html",
            pageIds: ["notificationSettingsPage", "notificationSettingPage"]
        });
        links.push({
            name: globalize.translate("TabPlugins"),
            icon: "shopping_cart",
            href: "installedplugins.html",
            pageIds: ["pluginsPage", "pluginCatalogPage"]
        });
        links.push({
            name: globalize.translate("TabScheduledTasks"),
            href: "scheduledtasks.html",
            pageIds: ["scheduledTasksPage", "scheduledTaskPage"],
            icon: "schedule"
        });
        addPluginPagesToMainMenu(links, pluginItems);
        return links;
    }

    function addPluginPagesToMainMenu(links, pluginItems, section) {
        for (var i = 0, length = pluginItems.length; i < length; i++) {
            var pluginItem = pluginItems[i];
            if (pluginItem.EnableInMainMenu && pluginItem.MenuSection === section) {
                links.push({
                    name: pluginItem.DisplayName,
                    icon: pluginItem.MenuIcon || "folder",
                    href: Dashboard.getConfigurationPageUrl(pluginItem.Name),
                    pageUrls: [Dashboard.getConfigurationPageUrl(pluginItem.Name)]
                });
            }
        }
    }

    function getToolsMenuLinks(apiClient) {
        return apiClient.getJSON(apiClient.getUrl("web/configurationpages") + "?pageType=PluginConfiguration&EnableInMainMenu=true").then(createToolsMenuList, function (err) {
            return createToolsMenuList([]);
        });
    }

    function getToolsLinkHtml(item) {
        var menuHtml = "";
        var pageIds = item.pageIds ? item.pageIds.join("|") : "";
        pageIds = pageIds ? ' data-pageids="' + pageIds + '"' : "";
        var pageUrls = item.pageUrls ? item.pageUrls.join("|") : "";
        pageUrls = pageUrls ? ' data-pageurls="' + pageUrls + '"' : "";
        menuHtml += '<a is="emby-linkbutton" class="navMenuOption" href="' + item.href + '"' + pageIds + pageUrls + ">";

        if (item.icon) {
            menuHtml += '<i class="md-icon navMenuOptionIcon">' + item.icon + "</i>";
        }

        menuHtml += '<span class="navMenuOptionText">';
        menuHtml += item.name;
        menuHtml += "</span>";
        return menuHtml + "</a>";
    }

    function getToolsMenuHtml(apiClient) {
        return getToolsMenuLinks(apiClient).then(function (items) {
            var item;
            var menuHtml = "";

            menuHtml += '<div class="drawerContent">';
            for (var i = 0; i < items.length; i++) {
                item = items[i];

                if (item.href) {
                    menuHtml += getToolsLinkHtml(item);
                }
                else if (item.name) {
                    menuHtml += '<h3 class="sidebarHeader">';
                    menuHtml += item.name;
                    menuHtml += "</h3>";
                }
            }

            return menuHtml + "</div>";
        });
    }

    function createDashboardMenu(apiClient) {
        return getToolsMenuHtml(apiClient).then(function (toolsMenuHtml) {
            var html = "";
            html += '<a class="adminDrawerLogo clearLink" is="emby-linkbutton" href="home.html">';
            html += '<img src="img/logo.png" />';
            html += "</a>";
            html += toolsMenuHtml;
            navDrawerScrollContainer.innerHTML = html;
            updateDashboardMenuSelectedItem();
        });
    }

    function onSidebarLinkClick() {
        var section = this.getElementsByClassName("sectionName")[0];
        var text = section ? section.innerHTML : this.innerHTML;
        LibraryMenu.setTitle(text);
    }

    function getUserViews(apiClient, userId) {
        return apiClient.getUserViews({}, userId).then(function (result) {
            var items = result.Items;
            var list = [];

            for (var i = 0, length = items.length; i < length; i++) {
                var view = items[i];

                list.push(view);
                if ("livetv" == view.CollectionType) {
                    view.ImageTags = {};
                    view.icon = "live_tv";
                    var guideView = Object.assign({}, view);
                    guideView.Name = globalize.translate("ButtonGuide");
                    guideView.ImageTags = {};
                    guideView.icon = "dvr";
                    guideView.url = "livetv.html?tab=1";
                    list.push(guideView);
                }
            }

            return list;
        });
    }

    function showBySelector(selector, show) {
        var elem = document.querySelector(selector);

        if (elem) {
            if (show) {
                elem.classList.remove("hide");
            }
            else {
                elem.classList.add("hide");
            }
        }
    }

    function updateLibraryMenu(user) {
        // FIXME: Potential equivalent might be
        // showBySelector(".lnkSyncToOtherDevices", !!user.Policy.EnableContentDownloading);
        if (!user) {
            showBySelector(".libraryMenuDownloads", false);
            showBySelector(".lnkSyncToOtherDevices", false);
            return void showBySelector(".userMenuOptions", false);
        }

        // FIXME: Potentially the same as above
        if (user.Policy.EnableContentDownloading) {
            showBySelector(".lnkSyncToOtherDevices", true);
        }
        else {
            showBySelector(".lnkSyncToOtherDevices", false);
        }

        if (user.Policy.EnableContentDownloading && appHost.supports("sync")) {
            showBySelector(".libraryMenuDownloads", true);
        }
        else {
            showBySelector(".libraryMenuDownloads", false);
        }

        var userId = Dashboard.getCurrentUserId();
        var apiClient = getCurrentApiClient();
        var libraryMenuOptions = document.querySelector(".libraryMenuOptions");

        if (libraryMenuOptions) {
            getUserViews(apiClient, userId).then(function (result) {
                var items = result;
                var html = "";
                html += '<h3 class="sidebarHeader">';
                html += globalize.translate("HeaderMedia");
                html += "</h3>";
                html += items.map(function (i) {
                    var icon = i.icon || imageHelper.getLibraryIcon(i.CollectionType);
                    var itemId = i.Id;
                    if (i.onclick) {
                        i.onclick;
                    }
                    return '<a is="emby-linkbutton" data-itemid="' + itemId + '" class="lnkMediaFolder navMenuOption" href="' + getItemHref(i, i.CollectionType) + '"><i class="md-icon navMenuOptionIcon">' + icon + '</i><span class="sectionName navMenuOptionText">' + i.Name + "</span></a>";
                }).join("");
                libraryMenuOptions.innerHTML = html;
                var elem = libraryMenuOptions;
                var sidebarLinks = elem.querySelectorAll(".navMenuOption");

                for (var i = 0, length = sidebarLinks.length; i < length; i++) {
                    sidebarLinks[i].removeEventListener("click", onSidebarLinkClick);
                    sidebarLinks[i].addEventListener("click", onSidebarLinkClick);
                }
            });
        }
    }

    function getTopParentId() {
        return getParameterByName("topParentId") || null;
    }

    function onMainDrawerClick(e) {
        if (dom.parentWithTag(e.target, "A")) {
            setTimeout(closeMainDrawer, 30);
        }
    }

    function onLogoutClick() {
        Dashboard.logout();
    }

    function updateCastIcon() {
        var context = document;
        var info = playbackManager.getPlayerInfo();
        var icon = headerCastButton.querySelector("i");

        if (info && !info.isLocalPlayer) {
            icon.innerHTML = "&#xE308;";
            headerCastButton.classList.add("castButton-active");
            context.querySelector(".headerSelectedPlayer").innerHTML = info.deviceName || info.name;
        } else {
            icon.innerHTML = "&#xE307;";
            headerCastButton.classList.remove("castButton-active");
            context.querySelector(".headerSelectedPlayer").innerHTML = "";
        }
    }

    function updateLibraryNavLinks(page) {
        var i;
        var length;
        var isLiveTvPage = page.classList.contains("liveTvPage");
        var isChannelsPage = page.classList.contains("channelsPage");
        var isEditorPage = page.classList.contains("metadataEditorPage");
        var isMySyncPage = page.classList.contains("mySyncPage");
        var id = isLiveTvPage || isChannelsPage || isEditorPage || isMySyncPage || page.classList.contains("allLibraryPage") ? "" : getTopParentId() || "";
        var elems = document.getElementsByClassName("lnkMediaFolder");

        for (var i = 0, length = elems.length; i < length; i++) {
            var lnkMediaFolder = elems[i];
            var itemId = lnkMediaFolder.getAttribute("data-itemid");

            if (isChannelsPage && "channels" === itemId) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else if (isLiveTvPage && "livetv" === itemId) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else if (isEditorPage && "editor" === itemId) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else if (isMySyncPage && "manageoffline" === itemId && -1 != window.location.href.toString().indexOf("mode=download")) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else if (isMySyncPage && "syncotherdevices" === itemId && -1 == window.location.href.toString().indexOf("mode=download")) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else if (id && itemId == id) {
                lnkMediaFolder.classList.add("navMenuOption-selected");
            }
            else {
                lnkMediaFolder.classList.remove("navMenuOption-selected");
            }
        }
    }

    function updateMenuForPageType(isDashboardPage, isLibraryPage) {
        var newPageType = isDashboardPage ? 2 : isLibraryPage ? 1 : 3;

        if (currentPageType !== newPageType) {
            currentPageType = newPageType;

            if (isDashboardPage && !layoutManager.mobile) {
                skinHeader.classList.add("headroomDisabled");
            } else {
                skinHeader.classList.remove("headroomDisabled");
            }

            var bodyClassList = document.body.classList;

            if (isLibraryPage) {
                bodyClassList.add("libraryDocument");
                bodyClassList.remove("dashboardDocument");
                bodyClassList.remove("hideMainDrawer");

                if (navDrawerInstance) {
                    navDrawerInstance.setEdgeSwipeEnabled(true);
                }
            } else {
                if (isDashboardPage) {
                    bodyClassList.remove("libraryDocument");
                    bodyClassList.add("dashboardDocument");
                    bodyClassList.remove("hideMainDrawer");

                    if (navDrawerInstance) {
                        navDrawerInstance.setEdgeSwipeEnabled(true);
                    }
                } else {
                    bodyClassList.remove("libraryDocument");
                    bodyClassList.remove("dashboardDocument");
                    bodyClassList.add("hideMainDrawer");

                    if (navDrawerInstance) {
                        navDrawerInstance.setEdgeSwipeEnabled(false);
                    }
                }
            }
        }

        if (requiresUserRefresh) {
            connectionManager.user(getCurrentApiClient()).then(updateUserInHeader);
        }
    }

    function updateTitle(page) {
        var title = page.getAttribute("data-title");

        if (title) {
            LibraryMenu.setTitle(title);
        }
        else if (page.classList.contains("standalonePage")) {
            LibraryMenu.setDefaultTitle();
        }
    }

    function updateBackButton(page) {
        if (!headerBackButton) {
            headerBackButton = document.querySelector(".headerBackButton");
        }

        if (headerBackButton) {
            if ("false" !== page.getAttribute("data-backbutton") && appRouter.canGoBack()) {
                headerBackButton.classList.remove("hide");
            } else {
                headerBackButton.classList.add("hide");
            }
        }
    }

    function initHeadRoom(elem) {
        require(["headroom"], function (Headroom) {
            var headroom = new Headroom([], {});
            headroom.add(elem);
        });
    }

    function refreshLibraryDrawer(user) {
        loadNavDrawer();
        currentDrawerType = "library";
        if (user) {
            Promise.resolve(user);
        } else {
            connectionManager.user(getCurrentApiClient()).then(function (user) {
                refreshLibraryInfoInDrawer(user);
                updateLibraryMenu(user.localUser);
            });
        }
    }

    function getNavDrawerOptions() {
        var drawerWidth = screen.availWidth - 50;
        drawerWidth = Math.max(drawerWidth, 240);
        drawerWidth = Math.min(drawerWidth, 320);
        return {
            target: navDrawerElement,
            onChange: onMainDrawerSelect,
            width: drawerWidth
        };
    }

    function loadNavDrawer() {
        if (navDrawerInstance) {
            return Promise.resolve(navDrawerInstance);
        }

        navDrawerElement = document.querySelector(".mainDrawer");
        navDrawerScrollContainer = navDrawerElement.querySelector(".scrollContainer");
        navDrawerScrollContainer.addEventListener("click", onMainDrawerClick);
        return new Promise(function (resolve, reject) {
            require(["navdrawer"], function (navdrawer) {
                navDrawerInstance = new navdrawer(getNavDrawerOptions());
                if (!layoutManager.tv) {
                    navDrawerElement.classList.remove("hide");
                }
                resolve(navDrawerInstance);
            });
        });
    }

    var navDrawerElement;
    var navDrawerScrollContainer;
    var navDrawerInstance;
    var mainDrawerButton;
    var headerHomeButton;
    var currentDrawerType;
    var pageTitleElement;
    var headerBackButton;
    var headerUserButton;
    var currentUser;
    var headerSettingsButton;
    var headerCastButton;
    var headerSearchButton;
    var enableLibraryNavDrawer = !layoutManager.tv;
    var skinHeader = document.querySelector(".skinHeader");
    var requiresUserRefresh = true;
    var lastOpenTime = new Date().getTime();
    window.LibraryMenu = {
        getTopParentId: getTopParentId,
        onHardwareMenuButtonClick: function () {
            toggleMainDrawer();
        },
        setTabs: function (type, selectedIndex, builder) {
            require(["mainTabsManager"], function (mainTabsManager) {
                if (type) {
                    mainTabsManager.setTabs(viewManager.currentView(), selectedIndex, builder, function () {
                        return [];
                    });
                } else {
                    mainTabsManager.setTabs(null);
                }
            });
        },
        setDefaultTitle: function () {
            if (!pageTitleElement) {
                pageTitleElement = document.querySelector(".pageTitle");
            }

            if (pageTitleElement) {
                pageTitleElement.classList.add("pageTitleWithLogo");
                pageTitleElement.classList.add("pageTitleWithDefaultLogo");
                pageTitleElement.style.backgroundImage = null;
                pageTitleElement.innerHTML = "";
            }

            document.title = "Jellyfin";
        },
        setTitle: function (title) {
            if (null == title) {
                return void LibraryMenu.setDefaultTitle();
            }

            if ("-" === title) {
                title = "";
            }

            var html = title;

            if (!pageTitleElement) {
                pageTitleElement = document.querySelector(".pageTitle");
            }

            if (pageTitleElement) {
                pageTitleElement.classList.remove("pageTitleWithLogo");
                pageTitleElement.classList.remove("pageTitleWithDefaultLogo");
                pageTitleElement.style.backgroundImage = null;
                pageTitleElement.innerHTML = html || "";
            }

            document.title = title || "Jellyfin";
        },
        setTransparentMenu: function (transparent) {
            if (transparent) {
                skinHeader.classList.add("semiTransparent");
            } else {
                skinHeader.classList.remove("semiTransparent");
            }
        }
    };
    var currentPageType;
    pageClassOn("pagebeforeshow", "page", function (e) {
        if (!this.classList.contains("withTabs")) {
            LibraryMenu.setTabs(null);
        }
    });
    pageClassOn("pageshow", "page", function (e) {
        var page = this;
        var isDashboardPage = page.classList.contains("type-interior");
        var isLibraryPage = !isDashboardPage && page.classList.contains("libraryPage");
        var apiClient = getCurrentApiClient();

        if (isDashboardPage) {
            if (mainDrawerButton) {
                mainDrawerButton.classList.remove("hide");
            }

            refreshDashboardInfoInDrawer(apiClient);
        } else {
            if (mainDrawerButton) {
                if (enableLibraryNavDrawer) {
                    mainDrawerButton.classList.remove("hide");
                } else {
                    mainDrawerButton.classList.add("hide");
                }
            }

            if ("library" !== currentDrawerType) {
                refreshLibraryDrawer();
            }
        }

        updateMenuForPageType(isDashboardPage, isLibraryPage);

        if (!e.detail.isRestored) {
            window.scrollTo(0, 0);
        }

        updateTitle(page);
        updateBackButton(page);
        updateLibraryNavLinks(page);
    });

    (function () {
        var html = "";
        html += '<div class="flex align-items-center flex-grow headerTop">';
        html += '<div class="headerLeft">';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><i class="md-icon">' + (browser.safari ? "chevron_left" : "&#xE5C4;") + "</i></button>";
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerHomeButton hide barsMenuButton headerButtonLeft"><i class="md-icon">&#xE88A;</i></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><i class="md-icon">&#xE5D2;</i></button>';
        html += '<h3 class="pageTitle"></h3>';
        html += "</div>";
        html += '<div class="headerRight">';
        html += '<span class="headerSelectedPlayer"></span>';
        html += '<button is="paper-icon-button-light" class="headerCastButton castButton headerButton headerButtonRight hide"><i class="md-icon">&#xE307;</i></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide"><i class="md-icon">&#xE8B6;</i></button>';
        html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerUserButton hide"><i class="md-icon">&#xE7FD;</i></button>';

        if (!layoutManager.mobile) {
            html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerSettingsButton hide"><i class="md-icon">dashboard</i></button>';
        }

        html += "</div>";
        html += "</div>";
        html += '<div class="headerTabs sectionTabs hide">';
        html += "</div>";
        skinHeader.classList.add("skinHeader-withBackground");
        skinHeader.innerHTML = html;
        headerHomeButton = skinHeader.querySelector(".headerHomeButton");
        headerUserButton = skinHeader.querySelector(".headerUserButton");
        headerSettingsButton = skinHeader.querySelector(".headerSettingsButton");
        headerCastButton = skinHeader.querySelector(".headerCastButton");
        headerSearchButton = skinHeader.querySelector(".headerSearchButton");
        skinHeader.classList.add("skinHeader-blurred");
        lazyLoadViewMenuBarImages();
        bindMenuEvents();
    })();

    events.on(connectionManager, "localusersignedin", function (e, user) {
        currentDrawerType = null;
        currentUser = {
            localUser: user
        };
        loadNavDrawer();
        connectionManager.user(connectionManager.getApiClient(user.ServerId)).then(function (user) {
            currentUser = user;
            updateUserInHeader(user);
        });
    });
    events.on(connectionManager, "localusersignedout", function () {
        currentUser = {};
        updateUserInHeader();
    });
    events.on(playbackManager, "playerchange", updateCastIcon);
    loadNavDrawer();
    return LibraryMenu;
});
