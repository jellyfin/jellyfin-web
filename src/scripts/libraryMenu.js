import dom from './dom';
import layoutManager from '../components/layoutManager';
import inputManager from './inputManager';
import { Events } from 'jellyfin-apiclient';
import viewManager from '../components/viewManager/viewManager';
import { appRouter } from '../components/appRouter';
import { appHost } from '../components/apphost';
import { playbackManager } from '../components/playback/playbackmanager';
import SyncPlay from '../components/syncPlay/core';
import groupSelectionMenu from '../components/syncPlay/ui/groupSelectionMenu';
import browser from './browser';
import globalize from './globalize';
import imageHelper from './imagehelper';
import '../elements/emby-button/paper-icon-button-light';
import 'material-design-icons-iconfont';
import '../assets/css/scrollstyles.scss';
import '../assets/css/flexstyles.scss';
import Dashboard, { pageClassOn } from './clientUtils';
import ServerConnections from '../components/ServerConnections';
import Headroom from 'headroom.js';

/* eslint-disable indent */

    function renderHeader() {
        let html = '';
        html += '<div class="flex align-items-center flex-grow headerTop">';
        html += '<div class="headerLeft">';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><span class="material-icons ' + (browser.safari ? 'chevron_left' : 'arrow_back') + '"></span></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerHomeButton hide barsMenuButton headerButtonLeft"><span class="material-icons home"></span></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><span class="material-icons menu"></span></button>';
        html += '<h3 class="pageTitle"></h3>';
        html += '</div>';
        html += '<div class="headerRight">';
        html += '<span class="headerSelectedPlayer"></span>';
        html += '<button is="paper-icon-button-light" class="headerSyncButton syncButton headerButton headerButtonRight hide"><span class="material-icons sync_disabled"></span></button>';
        html += '<button is="paper-icon-button-light" class="headerAudioPlayerButton audioPlayerButton headerButton headerButtonRight hide"><span class="material-icons music_note"></span></button>';
        html += '<button is="paper-icon-button-light" class="headerCastButton castButton headerButton headerButtonRight hide"><span class="material-icons cast"></span></button>';
        html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide"><span class="material-icons search"></span></button>';
        html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerUserButton hide"><span class="material-icons person"></span></button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="headerTabs sectionTabs hide">';
        html += '</div>';

        skinHeader.classList.add('skinHeader-withBackground');
        skinHeader.classList.add('skinHeader-blurred');
        skinHeader.innerHTML = html;

        headerBackButton = skinHeader.querySelector('.headerBackButton');
        headerHomeButton = skinHeader.querySelector('.headerHomeButton');
        mainDrawerButton = skinHeader.querySelector('.mainDrawerButton');
        headerUserButton = skinHeader.querySelector('.headerUserButton');
        headerCastButton = skinHeader.querySelector('.headerCastButton');
        headerAudioPlayerButton = skinHeader.querySelector('.headerAudioPlayerButton');
        headerSearchButton = skinHeader.querySelector('.headerSearchButton');
        headerSyncButton = skinHeader.querySelector('.headerSyncButton');

        retranslateUi();
        lazyLoadViewMenuBarImages();
        bindMenuEvents();
        updateCastIcon();
    }

    function getCurrentApiClient() {
        if (currentUser && currentUser.localUser) {
            return ServerConnections.getApiClient(currentUser.localUser.ServerId);
        }

        return ServerConnections.currentApiClient();
    }

    function lazyLoadViewMenuBarImages() {
        import('../components/images/imageLoader').then((imageLoader) => {
            imageLoader.lazyChildren(skinHeader);
        });
    }

    function onBackClick() {
        appRouter.back();
    }

    function retranslateUi() {
        if (headerSyncButton) {
            headerSyncButton.title = globalize.translate('ButtonSyncPlay');
        }

        if (headerAudioPlayerButton) {
            headerAudioPlayerButton.title = globalize.translate('ButtonPlayer');
        }

        if (headerCastButton) {
            headerCastButton.title = globalize.translate('ButtonCast');
        }

        if (headerSearchButton) {
            headerSearchButton.title = globalize.translate('Search');
        }
    }

    function updateUserInHeader(user) {
        retranslateUi();

        let hasImage;

        if (user && user.name) {
            if (user.imageUrl) {
                const url = user.imageUrl;
                updateHeaderUserButton(url);
                hasImage = true;
            }
            headerUserButton.title = user.name;
            headerUserButton.classList.remove('hide');
        } else {
            headerUserButton.classList.add('hide');
        }

        if (!hasImage) {
            updateHeaderUserButton(null);
        }

        if (user && user.localUser) {
            if (headerHomeButton) {
                headerHomeButton.classList.remove('hide');
            }

            if (headerSearchButton) {
                headerSearchButton.classList.remove('hide');
            }

            if (!layoutManager.tv) {
                headerCastButton.classList.remove('hide');
            }

            const policy = user.Policy ? user.Policy : user.localUser.Policy;

            const apiClient = getCurrentApiClient();
            if (headerSyncButton && policy && policy.SyncPlayAccess !== 'None' && apiClient.isMinServerVersion('10.6.0')) {
                headerSyncButton.classList.remove('hide');
            }
        } else {
            headerHomeButton.classList.add('hide');
            headerCastButton.classList.add('hide');
            headerSyncButton.classList.add('hide');

            if (headerSearchButton) {
                headerSearchButton.classList.add('hide');
            }
        }

        requiresUserRefresh = false;
    }

    function updateHeaderUserButton(src) {
        if (src) {
            headerUserButton.classList.add('headerUserButtonRound');
            headerUserButton.innerHTML = '<div class="headerButton headerButtonRight paper-icon-button-light headerUserButtonRound" style="background-image:url(\'' + src + "');\"></div>";
        } else {
            headerUserButton.classList.remove('headerUserButtonRound');
            headerUserButton.innerHTML = '<span class="material-icons person"></span>';
        }
    }

    function showSearch() {
        inputManager.handleCommand('search');
    }

    function onHeaderUserButtonClick() {
        Dashboard.navigate('mypreferencesmenu.html');
    }

    function onHeaderHomeButtonClick() {
        Dashboard.navigate('home.html');
    }

    function showAudioPlayer() {
        return appRouter.showNowPlaying();
    }

    function bindMenuEvents() {
        if (mainDrawerButton) {
            mainDrawerButton.addEventListener('click', toggleMainDrawer);
        }

        if (headerBackButton) {
            headerBackButton.addEventListener('click', onBackClick);
        }

        if (headerSearchButton) {
            headerSearchButton.addEventListener('click', showSearch);
        }

        headerUserButton.addEventListener('click', onHeaderUserButtonClick);
        headerHomeButton.addEventListener('click', onHeaderHomeButtonClick);

        if (!layoutManager.tv) {
            headerCastButton.addEventListener('click', onCastButtonClicked);
        }

        headerAudioPlayerButton.addEventListener('click', showAudioPlayer);
        headerSyncButton.addEventListener('click', onSyncButtonClicked);

        if (layoutManager.mobile) {
            initHeadRoom(skinHeader);
        }
        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
        Events.on(playbackManager, 'playbackstop', onPlaybackStop);
    }

    function onPlaybackStart() {
        if (playbackManager.isPlayingAudio() && layoutManager.tv) {
            headerAudioPlayerButton.classList.remove('hide');
        } else {
            headerAudioPlayerButton.classList.add('hide');
        }
    }

    function onPlaybackStop(e, stopInfo) {
        if (stopInfo.nextMediaType != 'Audio') {
            headerAudioPlayerButton.classList.add('hide');
        }
    }

    function onCastButtonClicked() {
        const btn = this;

        import('../components/playback/playerSelectionMenu').then((playerSelectionMenu) => {
            playerSelectionMenu.show(btn);
        });
    }

    function onSyncButtonClicked() {
        const btn = this;
        groupSelectionMenu.show(btn);
    }

    function onSyncPlayEnabled(event, enabled) {
        const icon = headerSyncButton.querySelector('span');
        icon.classList.remove('sync', 'sync_disabled', 'sync_problem');
        if (enabled) {
            icon.classList.add('sync');
        } else {
            icon.classList.add('sync_disabled');
        }
    }

    function onSyncPlaySyncing(event, is_syncing) {
        const icon = headerSyncButton.querySelector('span');
        icon.classList.remove('sync', 'sync_disabled', 'sync_problem');
        if (is_syncing) {
            icon.classList.add('sync_problem');
        } else {
            icon.classList.add('sync');
        }
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
    }

    function onMainDrawerOpened() {
        if (layoutManager.mobile) {
            document.body.classList.add('bodyWithPopupOpen');
        }
    }

    function closeMainDrawer() {
        navDrawerInstance.close();
    }

    function onMainDrawerSelect() {
        if (navDrawerInstance.isVisible) {
            onMainDrawerOpened();
        } else {
            document.body.classList.remove('bodyWithPopupOpen');
        }
    }

    function refreshLibraryInfoInDrawer(user) {
        let html = '';
        html += '<div style="height:.5em;"></div>';
        html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder" href="#!/home.html"><span class="material-icons navMenuOptionIcon home"></span><span class="navMenuOptionText">' + globalize.translate('Home') + '</span></a>';

        // libraries are added here
        html += '<div class="libraryMenuOptions">';
        html += '</div>';

        if (user.localUser && user.localUser.Policy.IsAdministrator) {
            html += '<div class="adminMenuOptions">';
            html += '<h3 class="sidebarHeader">';
            html += globalize.translate('HeaderAdmin');
            html += '</h3>';
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder lnkManageServer" data-itemid="dashboard" href="#!/dashboard.html"><span class="material-icons navMenuOptionIcon dashboard"></span><span class="navMenuOptionText">' + globalize.translate('TabDashboard') + '</span></a>';
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder editorViewMenu" data-itemid="editor" href="#!/edititemmetadata.html"><span class="material-icons navMenuOptionIcon mode_edit"></span><span class="navMenuOptionText">' + globalize.translate('Metadata') + '</span></a>';
            html += '</div>';
        }

        if (user.localUser) {
            html += '<div class="userMenuOptions">';
            html += '<h3 class="sidebarHeader">';
            html += globalize.translate('HeaderUser');
            html += '</h3>';

            if (appHost.supports('multiserver')) {
                html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSelectServer" data-itemid="selectserver" href="#"><span class="material-icons navMenuOptionIcon wifi"></span><span class="navMenuOptionText">' + globalize.translate('SelectServer') + '</span></a>';
            }

            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSettings" data-itemid="settings" href="#"><span class="material-icons navMenuOptionIcon settings"></span><span class="navMenuOptionText">' + globalize.translate('Settings') + '</span></a>';
            html += '<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnLogout" data-itemid="logout" href="#"><span class="material-icons navMenuOptionIcon exit_to_app"></span><span class="navMenuOptionText">' + globalize.translate('ButtonSignOut') + '</span></a>';
            html += '</div>';
        }

        // add buttons to navigation drawer
        navDrawerScrollContainer.innerHTML = html;

        const btnSelectServer = navDrawerScrollContainer.querySelector('.btnSelectServer');
        if (btnSelectServer) {
            btnSelectServer.addEventListener('click', onSelectServerClick);
        }

        const btnSettings = navDrawerScrollContainer.querySelector('.btnSettings');
        if (btnSettings) {
            btnSettings.addEventListener('click', onSettingsClick);
        }

        const btnLogout = navDrawerScrollContainer.querySelector('.btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', onLogoutClick);
        }
    }

    function refreshDashboardInfoInDrawer(apiClient) {
        currentDrawerType = 'admin';
        loadNavDrawer();

        if (navDrawerScrollContainer.querySelector('.adminDrawerLogo')) {
            updateDashboardMenuSelectedItem();
        } else {
            createDashboardMenu(apiClient);
        }
    }

    function isUrlInCurrentView(url) {
        return window.location.href.toString().toLowerCase().indexOf(url.toLowerCase()) !== -1;
    }

    function updateDashboardMenuSelectedItem() {
        const links = navDrawerScrollContainer.querySelectorAll('.navMenuOption');
        const currentViewId = viewManager.currentView().id;

        for (let i = 0, length = links.length; i < length; i++) {
            let link = links[i];
            let selected = false;
            let pageIds = link.getAttribute('data-pageids');

            if (pageIds) {
                pageIds = pageIds.split('|');
                selected = pageIds.indexOf(currentViewId) != -1;
            }

            let pageUrls = link.getAttribute('data-pageurls');

            if (pageUrls) {
                pageUrls = pageUrls.split('|');
                selected = pageUrls.filter(isUrlInCurrentView).length > 0;
            }

            if (selected) {
                link.classList.add('navMenuOption-selected');
                let title = '';
                link = link.querySelector('.navMenuOptionText') || link;
                title += (link.innerText || link.textContent).trim();
                LibraryMenu.setTitle(title);
            } else {
                link.classList.remove('navMenuOption-selected');
            }
        }
    }

    function createToolsMenuList(pluginItems) {
        const links = [{
            name: globalize.translate('TabServer')
        }, {
            name: globalize.translate('TabDashboard'),
            href: '#!/dashboard.html',
            pageIds: ['dashboardPage'],
            icon: 'dashboard'
        }, {
            name: globalize.translate('General'),
            href: '#!/dashboardgeneral.html',
            pageIds: ['dashboardGeneralPage'],
            icon: 'settings'
        }, {
            name: globalize.translate('HeaderUsers'),
            href: '#!/userprofiles.html',
            pageIds: ['userProfilesPage', 'newUserPage', 'editUserPage', 'userLibraryAccessPage', 'userParentalControlPage', 'userPasswordPage'],
            icon: 'people'
        }, {
            name: globalize.translate('HeaderLibraries'),
            href: '#!/library.html',
            pageIds: ['mediaLibraryPage', 'librarySettingsPage', 'libraryDisplayPage', 'metadataImagesConfigurationPage', 'metadataNfoPage'],
            icon: 'folder'
        }, {
            name: globalize.translate('TitlePlayback'),
            icon: 'play_arrow',
            href: '#!/encodingsettings.html',
            pageIds: ['encodingSettingsPage', 'playbackConfigurationPage', 'streamingSettingsPage']
        }];
        addPluginPagesToMainMenu(links, pluginItems, 'server');
        links.push({
            divider: true,
            name: globalize.translate('HeaderDevices')
        });
        links.push({
            name: globalize.translate('HeaderDevices'),
            href: '#!/devices.html',
            pageIds: ['devicesPage', 'devicePage'],
            icon: 'devices'
        });
        links.push({
            name: globalize.translate('QuickConnect'),
            href: '#!/quickConnect.html',
            pageIds: ['quickConnectPage'],
            icon: 'tap_and_play'
        });
        links.push({
            name: globalize.translate('HeaderActivity'),
            href: '#!/serveractivity.html',
            pageIds: ['serverActivityPage'],
            icon: 'assessment'
        });
        links.push({
            name: globalize.translate('DLNA'),
            href: '#!/dlnasettings.html',
            pageIds: ['dlnaSettingsPage', 'dlnaProfilesPage', 'dlnaProfilePage'],
            icon: 'input'
        });
        links.push({
            divider: true,
            name: globalize.translate('LiveTV')
        });
        links.push({
            name: globalize.translate('LiveTV'),
            href: '#!/livetvstatus.html',
            pageIds: ['liveTvStatusPage', 'liveTvTunerPage'],
            icon: 'live_tv'
        });
        links.push({
            name: globalize.translate('HeaderDVR'),
            href: '#!/livetvsettings.html',
            pageIds: ['liveTvSettingsPage'],
            icon: 'dvr'
        });
        addPluginPagesToMainMenu(links, pluginItems, 'livetv');
        links.push({
            divider: true,
            name: globalize.translate('TabAdvanced')
        });
        links.push({
            name: globalize.translate('TabNetworking'),
            icon: 'cloud',
            href: '#!/networking.html',
            pageIds: ['networkingPage']
        });
        links.push({
            name: globalize.translate('HeaderApiKeys'),
            icon: 'vpn_key',
            href: '#!/apikeys.html',
            pageIds: ['apiKeysPage']
        });
        links.push({
            name: globalize.translate('TabLogs'),
            href: '#!/log.html',
            pageIds: ['logPage'],
            icon: 'bug_report'
        });
        links.push({
            name: globalize.translate('TabNotifications'),
            icon: 'notifications',
            href: '#!/notificationsettings.html',
            pageIds: ['notificationSettingsPage', 'notificationSettingPage']
        });
        links.push({
            name: globalize.translate('TabPlugins'),
            icon: 'shopping_cart',
            href: '#!/installedplugins.html',
            pageIds: ['pluginsPage', 'pluginCatalogPage']
        });
        links.push({
            name: globalize.translate('TabScheduledTasks'),
            href: '#!/scheduledtasks.html',
            pageIds: ['scheduledTasksPage', 'scheduledTaskPage'],
            icon: 'schedule'
        });
        if (hasUnsortedPlugins(pluginItems)) {
            links.push({
                divider: true,
                name: globalize.translate('TabPlugins')
            });
            addPluginPagesToMainMenu(links, pluginItems);
        }
        return links;
    }

    function hasUnsortedPlugins(pluginItems) {
        for (const pluginItem of pluginItems) {
            if (pluginItem.EnableInMainMenu && pluginItem.MenuSection === undefined) {
                return true;
            }
        }
        return false;
    }

    function addPluginPagesToMainMenu(links, pluginItems, section) {
        for (const pluginItem of pluginItems) {
            if (pluginItem.EnableInMainMenu && pluginItem.MenuSection === section) {
                links.push({
                    name: pluginItem.DisplayName,
                    icon: pluginItem.MenuIcon || 'folder',
                    href: Dashboard.getPluginUrl(pluginItem.Name),
                    pageUrls: [Dashboard.getPluginUrl(pluginItem.Name)]
                });
            }
        }
    }

    function getToolsMenuLinks(apiClient) {
        return apiClient.getJSON(apiClient.getUrl('web/configurationpages') + '?pageType=PluginConfiguration&EnableInMainMenu=true').then(createToolsMenuList, function () {
            return createToolsMenuList([]);
        });
    }

    function getToolsLinkHtml(item) {
        let menuHtml = '';
        let pageIds = item.pageIds ? item.pageIds.join('|') : '';
        pageIds = pageIds ? ' data-pageids="' + pageIds + '"' : '';
        let pageUrls = item.pageUrls ? item.pageUrls.join('|') : '';
        pageUrls = pageUrls ? ' data-pageurls="' + pageUrls + '"' : '';
        menuHtml += '<a is="emby-linkbutton" class="navMenuOption" href="' + item.href + '"' + pageIds + pageUrls + '>';

        if (item.icon) {
            menuHtml += '<span class="material-icons navMenuOptionIcon ' + item.icon + '"></span>';
        }

        menuHtml += '<span class="navMenuOptionText">';
        menuHtml += item.name;
        menuHtml += '</span>';
        return menuHtml + '</a>';
    }

    function getToolsMenuHtml(apiClient) {
        return getToolsMenuLinks(apiClient).then(function (items) {
            let item;
            let menuHtml = '';
            menuHtml += '<div class="drawerContent">';

            for (let i = 0; i < items.length; i++) {
                item = items[i];

                if (item.href) {
                    menuHtml += getToolsLinkHtml(item);
                } else if (item.name) {
                    menuHtml += '<h3 class="sidebarHeader">';
                    menuHtml += item.name;
                    menuHtml += '</h3>';
                }
            }

            return menuHtml + '</div>';
        });
    }

    function createDashboardMenu(apiClient) {
        return getToolsMenuHtml(apiClient).then(function (toolsMenuHtml) {
            let html = '';
            html += '<a class="adminDrawerLogo clearLink" is="emby-linkbutton" href="#!/home.html">';
            html += '<img src="assets/img/icon-transparent.png" />';
            html += '</a>';
            html += toolsMenuHtml;
            navDrawerScrollContainer.innerHTML = html;
            updateDashboardMenuSelectedItem();
        });
    }

    function onSidebarLinkClick() {
        const section = this.getElementsByClassName('sectionName')[0];
        const text = section ? section.innerHTML : this.innerHTML;
        LibraryMenu.setTitle(text);
    }

    function getUserViews(apiClient, userId) {
        return apiClient.getUserViews({}, userId).then(function (result) {
            const items = result.Items;
            const list = [];

            for (let i = 0, length = items.length; i < length; i++) {
                const view = items[i];
                list.push(view);

                if (view.CollectionType == 'livetv') {
                    view.ImageTags = {};
                    view.icon = 'live_tv';
                    const guideView = Object.assign({}, view);
                    guideView.Name = globalize.translate('Guide');
                    guideView.ImageTags = {};
                    guideView.icon = 'dvr';
                    guideView.url = '#!/livetv.html?tab=1';
                    list.push(guideView);
                }
            }

            return list;
        });
    }

    function showBySelector(selector, show) {
        const elem = document.querySelector(selector);

        if (elem) {
            if (show) {
                elem.classList.remove('hide');
            } else {
                elem.classList.add('hide');
            }
        }
    }

    function updateLibraryMenu(user) {
        if (!user) {
            showBySelector('.libraryMenuDownloads', false);
            showBySelector('.lnkSyncToOtherDevices', false);
            return void showBySelector('.userMenuOptions', false);
        }

        if (user.Policy.EnableContentDownloading) {
            showBySelector('.lnkSyncToOtherDevices', true);
        } else {
            showBySelector('.lnkSyncToOtherDevices', false);
        }

        if (user.Policy.EnableContentDownloading && appHost.supports('sync')) {
            showBySelector('.libraryMenuDownloads', true);
        } else {
            showBySelector('.libraryMenuDownloads', false);
        }

        const userId = Dashboard.getCurrentUserId();
        const apiClient = getCurrentApiClient();
        const libraryMenuOptions = document.querySelector('.libraryMenuOptions');

        if (libraryMenuOptions) {
            getUserViews(apiClient, userId).then(function (result) {
                const items = result;
                let html = `<h3 class="sidebarHeader">${globalize.translate('HeaderMedia')}</h3>`;
                html += items.map(function (i) {
                    const icon = i.icon || imageHelper.getLibraryIcon(i.CollectionType);
                    const itemId = i.Id;

                    return `<a is="emby-linkbutton" data-itemid="${itemId}" class="lnkMediaFolder navMenuOption" href="${getItemHref(i, i.CollectionType)}">
                                    <span class="material-icons navMenuOptionIcon ${icon}"></span>
                                    <span class="sectionName navMenuOptionText">${i.Name}</span>
                                  </a>`;
                }).join('');
                libraryMenuOptions.innerHTML = html;
                const elem = libraryMenuOptions;
                const sidebarLinks = elem.querySelectorAll('.navMenuOption');

                for (const sidebarLink of sidebarLinks) {
                    sidebarLink.removeEventListener('click', onSidebarLinkClick);
                    sidebarLink.addEventListener('click', onSidebarLinkClick);
                }
            });
        }
    }

    function getTopParentId() {
        return getParameterByName('topParentId') || null;
    }

    function onMainDrawerClick(e) {
        if (dom.parentWithTag(e.target, 'A')) {
            setTimeout(closeMainDrawer, 30);
        }
    }

    function onSelectServerClick() {
        Dashboard.selectServer();
    }

    function onSettingsClick() {
        Dashboard.navigate('mypreferencesmenu.html');
    }

    function onLogoutClick() {
        Dashboard.logout();
    }

    function updateCastIcon() {
        const context = document;
        const info = playbackManager.getPlayerInfo();
        const icon = headerCastButton.querySelector('.material-icons');

        icon.classList.remove('cast_connected', 'cast');

        if (info && !info.isLocalPlayer) {
            icon.classList.add('cast_connected');
            headerCastButton.classList.add('castButton-active');
            context.querySelector('.headerSelectedPlayer').innerHTML = info.deviceName || info.name;
        } else {
            icon.classList.add('cast');
            headerCastButton.classList.remove('castButton-active');
            context.querySelector('.headerSelectedPlayer').innerHTML = '';
        }
    }

    function updateLibraryNavLinks(page) {
        const isLiveTvPage = page.classList.contains('liveTvPage');
        const isChannelsPage = page.classList.contains('channelsPage');
        const isEditorPage = page.classList.contains('metadataEditorPage');
        const isMySyncPage = page.classList.contains('mySyncPage');
        const id = isLiveTvPage || isChannelsPage || isEditorPage || isMySyncPage || page.classList.contains('allLibraryPage') ? '' : getTopParentId() || '';
        const elems = document.getElementsByClassName('lnkMediaFolder');

        for (let i = 0, length = elems.length; i < length; i++) {
            const lnkMediaFolder = elems[i];
            const itemId = lnkMediaFolder.getAttribute('data-itemid');

            if (isChannelsPage && itemId === 'channels') {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else if (isLiveTvPage && itemId === 'livetv') {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else if (isEditorPage && itemId === 'editor') {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else if (isMySyncPage && itemId === 'manageoffline' && window.location.href.toString().indexOf('mode=download') != -1) {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else if (isMySyncPage && itemId === 'syncotherdevices' && window.location.href.toString().indexOf('mode=download') == -1) {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else if (id && itemId == id) {
                lnkMediaFolder.classList.add('navMenuOption-selected');
            } else {
                lnkMediaFolder.classList.remove('navMenuOption-selected');
            }
        }
    }

    function updateMenuForPageType(isDashboardPage, isLibraryPage) {
        const newPageType = isDashboardPage ? 2 : isLibraryPage ? 1 : 3;

        if (currentPageType !== newPageType) {
            currentPageType = newPageType;

            if (isDashboardPage && !layoutManager.mobile) {
                skinHeader.classList.add('headroomDisabled');
            } else {
                skinHeader.classList.remove('headroomDisabled');
            }

            const bodyClassList = document.body.classList;

            if (isLibraryPage) {
                bodyClassList.add('libraryDocument');
                bodyClassList.remove('dashboardDocument');
                bodyClassList.remove('hideMainDrawer');

                if (navDrawerInstance) {
                    navDrawerInstance.setEdgeSwipeEnabled(true);
                }
            } else {
                if (isDashboardPage) {
                    bodyClassList.remove('libraryDocument');
                    bodyClassList.add('dashboardDocument');
                    bodyClassList.remove('hideMainDrawer');

                    if (navDrawerInstance) {
                        navDrawerInstance.setEdgeSwipeEnabled(true);
                    }
                } else {
                    bodyClassList.remove('libraryDocument');
                    bodyClassList.remove('dashboardDocument');
                    bodyClassList.add('hideMainDrawer');

                    if (navDrawerInstance) {
                        navDrawerInstance.setEdgeSwipeEnabled(false);
                    }
                }
            }
        }

        if (requiresUserRefresh) {
            ServerConnections.user(getCurrentApiClient()).then(updateUserInHeader);
        }
    }

    function updateTitle(page) {
        const title = page.getAttribute('data-title');

        if (title) {
            LibraryMenu.setTitle(title);
        } else if (page.classList.contains('standalonePage')) {
            LibraryMenu.setDefaultTitle();
        }
    }

    function updateBackButton(page) {
        if (headerBackButton) {
            if (page.getAttribute('data-backbutton') !== 'false' && appRouter.canGoBack()) {
                headerBackButton.classList.remove('hide');
            } else {
                headerBackButton.classList.add('hide');
            }
        }
    }

    function initHeadRoom(elem) {
        const headroom = new Headroom(elem);
        headroom.init();
    }

    function refreshLibraryDrawer(user) {
        loadNavDrawer();
        currentDrawerType = 'library';

        if (user) {
            Promise.resolve(user);
        } else {
            ServerConnections.user(getCurrentApiClient()).then(function (userResult) {
                refreshLibraryInfoInDrawer(userResult);
                updateLibraryMenu(userResult.localUser);
            });
        }
    }

    function getNavDrawerOptions() {
        let drawerWidth = window.screen.availWidth - 50;
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

        navDrawerElement = document.querySelector('.mainDrawer');
        navDrawerScrollContainer = navDrawerElement.querySelector('.scrollContainer');
        navDrawerScrollContainer.addEventListener('click', onMainDrawerClick);
        return new Promise(function (resolve) {
            import('../libraries/navdrawer/navdrawer').then(({ NavigationDrawer }) => {
                navDrawerInstance = new NavigationDrawer(getNavDrawerOptions());

                if (!layoutManager.tv) {
                    navDrawerElement.classList.remove('hide');
                }

                resolve(navDrawerInstance);
            });
        });
    }

    let navDrawerElement;
    let navDrawerScrollContainer;
    let navDrawerInstance;
    let mainDrawerButton;
    let headerHomeButton;
    let currentDrawerType;
    let pageTitleElement;
    let headerBackButton;
    let headerUserButton;
    let currentUser;
    let headerCastButton;
    let headerSearchButton;
    let headerAudioPlayerButton;
    let headerSyncButton;
    const enableLibraryNavDrawer = layoutManager.desktop;
    const enableLibraryNavDrawerHome = !layoutManager.tv;
    const skinHeader = document.querySelector('.skinHeader');
    let requiresUserRefresh = true;

    function setTabs (type, selectedIndex, builder) {
        import('../components/maintabsmanager').then((mainTabsManager) => {
            if (type) {
                mainTabsManager.setTabs(viewManager.currentView(), selectedIndex, builder, function () {
                    return [];
                });
            } else {
                mainTabsManager.setTabs(null);
            }
        });
    }

    function setDefaultTitle () {
        if (!pageTitleElement) {
            pageTitleElement = document.querySelector('.pageTitle');
        }

        if (pageTitleElement) {
            pageTitleElement.classList.add('pageTitleWithLogo');
            pageTitleElement.classList.add('pageTitleWithDefaultLogo');
            pageTitleElement.style.backgroundImage = null;
            pageTitleElement.innerHTML = '';
        }

        document.title = 'Jellyfin';
    }

    function setTitle (title) {
        if (title == null) {
            return void LibraryMenu.setDefaultTitle();
        }

        if (title === '-') {
            title = '';
        }

        const html = title;

        if (!pageTitleElement) {
            pageTitleElement = document.querySelector('.pageTitle');
        }

        if (pageTitleElement) {
            pageTitleElement.classList.remove('pageTitleWithLogo');
            pageTitleElement.classList.remove('pageTitleWithDefaultLogo');
            pageTitleElement.style.backgroundImage = null;
            pageTitleElement.innerHTML = html || '';
        }

        document.title = title || 'Jellyfin';
    }

    function setTransparentMenu (transparent) {
        if (transparent) {
            skinHeader.classList.add('semiTransparent');
        } else {
            skinHeader.classList.remove('semiTransparent');
        }
    }

    let currentPageType;
    pageClassOn('pagebeforeshow', 'page', function () {
        if (!this.classList.contains('withTabs')) {
            LibraryMenu.setTabs(null);
        }
    });

    pageClassOn('pageshow', 'page', function (e) {
        const page = this;
        const isDashboardPage = page.classList.contains('type-interior');
        const isHomePage = page.classList.contains('homePage');
        const isLibraryPage = !isDashboardPage && page.classList.contains('libraryPage');
        const apiClient = getCurrentApiClient();

        if (isDashboardPage) {
            if (mainDrawerButton) {
                mainDrawerButton.classList.remove('hide');
            }

            refreshDashboardInfoInDrawer(apiClient);
        } else {
            if (mainDrawerButton) {
                if (enableLibraryNavDrawer || (isHomePage && enableLibraryNavDrawerHome)) {
                    mainDrawerButton.classList.remove('hide');
                } else {
                    mainDrawerButton.classList.add('hide');
                }
            }

            if (currentDrawerType !== 'library') {
                refreshLibraryDrawer();
            }
        }

        updateMenuForPageType(isDashboardPage, isLibraryPage);

        // TODO: Seems to do nothing? Check if needed (also in other views).
        if (!e.detail.isRestored) {
            window.scrollTo(0, 0);
        }

        updateTitle(page);
        updateBackButton(page);
        updateLibraryNavLinks(page);
    });

    Events.on(ServerConnections, 'localusersignedin', function (e, user) {
        const currentApiClient = ServerConnections.getApiClient(user.ServerId);

        currentDrawerType = null;
        currentUser = {
            localUser: user
        };

        loadNavDrawer();

        ServerConnections.user(currentApiClient).then(function (userResult) {
            currentUser = userResult;
            updateUserInHeader(userResult);
        });
    });

    Events.on(ServerConnections, 'localusersignedout', function () {
        currentUser = {};
        updateUserInHeader();
    });

    Events.on(playbackManager, 'playerchange', updateCastIcon);

    Events.on(SyncPlay.Manager, 'enabled', onSyncPlayEnabled);
    Events.on(SyncPlay.Manager, 'syncing', onSyncPlaySyncing);

    loadNavDrawer();

    const LibraryMenu = {
        getTopParentId: getTopParentId,
        onHardwareMenuButtonClick: function () {
            toggleMainDrawer();
        },
        setTabs: setTabs,
        setDefaultTitle: setDefaultTitle,
        setTitle: setTitle,
        setTransparentMenu: setTransparentMenu
    };

    window.LibraryMenu = LibraryMenu;
    renderHeader();

export default LibraryMenu;

/* eslint-enable indent */
