import escapeHtml from 'escape-html';
import Headroom from 'headroom.js';
// NOTE: Used for jsdoc
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ApiClient } from 'jellyfin-apiclient';

import { AppFeature } from 'constants/appFeature';
import { getUserViewsQuery } from 'hooks/useUserViews';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { EventType } from 'types/eventType';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';

import dom from '../utils/dom';
import layoutManager from '../components/layoutManager';
import inputManager from './inputManager';
import viewManager from '../components/viewManager/viewManager';
import { appRouter } from '../components/router/appRouter';
import { appHost } from '../components/apphost';
import { playbackManager } from '../components/playback/playbackmanager';
import { pluginManager } from '../components/pluginManager';
import groupSelectionMenu from '../plugins/syncPlay/ui/groupSelectionMenu';
import browser from './browser';
import imageHelper from '../utils/image';
import { getMenuLinks } from '../scripts/settings/webSettings';
import Dashboard, { pageClassOn } from '../utils/dashboard';
import { PluginType } from '../types/plugin.ts';
import Events from '../utils/events.ts';
import { getParameterByName } from '../utils/url.ts';
import datetime from '../scripts/datetime';

import '../elements/emby-button/paper-icon-button-light';

import 'material-design-icons-iconfont';
import '../styles/scrollstyles.scss';
import '../styles/flexstyles.scss';

function renderHeader() {
    let html = '';
    html += '<div class="flex align-items-center flex-grow headerTop">';
    html += '<div class="headerLeft">';
    html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><span class="material-icons ' + (browser.safari ? 'chevron_left' : 'arrow_back') + '" aria-hidden="true"></span></button>';
    html += '<button type="button" is="paper-icon-button-light" class="headerButton headerHomeButton hide barsMenuButton headerButtonLeft"><span class="material-icons home" aria-hidden="true"></span></button>';
    html += '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><span class="material-icons menu" aria-hidden="true"></span></button>';
    html += '<h3 class="pageTitle" aria-hidden="true"></h3>';
    html += '</div>';
    html += '<div class="headerRight">';
    html += '<button is="paper-icon-button-light" class="headerSyncButton syncButton headerButton headerButtonRight hide"><span class="material-icons groups" aria-hidden="true"></span></button>';
    html += '<span class="headerSelectedPlayer"></span>';
    html += '<button is="paper-icon-button-light" class="headerAudioPlayerButton audioPlayerButton headerButton headerButtonRight hide"><span class="material-icons music_note" aria-hidden="true"></span></button>';
    html += '<button is="paper-icon-button-light" class="headerCastButton castButton headerButton headerButtonRight hide"><span class="material-icons cast" aria-hidden="true"></span></button>';
    html += '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide"><span class="material-icons search" aria-hidden="true"></span></button>';
    html += '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerSettingsButton hide"><span class="material-icons settings" aria-hidden="true"></span></button>';
    html += '<div class="currentTimeText hide"></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="headerTabs sectionTabs hide">';
    html += '</div>';

    skinHeader.classList.add('skinHeader-withBackground');
    skinHeader.classList.add('skinHeader-blurred');
    skinHeader.innerHTML = html;

    Events.trigger(document, EventType.HEADER_RENDERED);

    headerBackButton = skinHeader.querySelector('.headerBackButton');
    headerHomeButton = skinHeader.querySelector('.headerHomeButton');
    mainDrawerButton = skinHeader.querySelector('.mainDrawerButton');
    headerSettingsButton = skinHeader.querySelector('.headerSettingsButton');
    headerCastButton = skinHeader.querySelector('.headerCastButton');
    headerAudioPlayerButton = skinHeader.querySelector('.headerAudioPlayerButton');
    headerSearchButton = skinHeader.querySelector('.headerSearchButton');
    headerSyncButton = skinHeader.querySelector('.headerSyncButton');
    currentTimeText = skinHeader.querySelector('.currentTimeText');

    retranslateUi();
    lazyLoadViewMenuBarImages();
    bindMenuEvents();
    updateCastIcon();
    updateClock();
}

function getCurrentApiClient() {
    if (currentUser?.localUser) {
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
    if (headerBackButton) {
        headerBackButton.title = globalize.translate('ButtonBack');
    }

    if (headerHomeButton) {
        headerHomeButton.title = globalize.translate('Home');
    }

    if (mainDrawerButton) {
        mainDrawerButton.title = globalize.translate('Menu');
    }

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

    if (headerSettingsButton) {
        headerSettingsButton.title = globalize.translate('Settings');
    }
}

function updateUserInHeader(user) {
    retranslateUi();

    if (user?.name) {
        headerSettingsButton.classList.remove('hide');
    } else {
        headerSettingsButton.classList.add('hide');
    }

    if (user?.localUser) {
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

        if (
        // Button is present
            headerSyncButton
                // SyncPlay plugin is loaded
                && pluginManager.ofType(PluginType.SyncPlay).length > 0
                // SyncPlay enabled for user
                && policy?.SyncPlayAccess !== 'None'
        ) {
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

function updateClock() {
    if (layoutManager.tv) {
        currentTimeText.classList.remove('hide');
        setInterval(function() {
            currentTimeText.innerText = datetime.getDisplayTime(new Date());
        }, 1000);
    } else {
        currentTimeText.classList.add('hide');
    }
}

function showSearch() {
    inputManager.handleCommand('search');
}

function onHeaderSettingsButtonClick() {
    Dashboard.navigate('mypreferencesmenu');
}

function onHeaderHomeButtonClick() {
    Dashboard.navigate('home');
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

    headerSettingsButton.addEventListener('click', onHeaderSettingsButtonClick);
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
    html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder" href="#/home"><span class="material-icons navMenuOptionIcon home" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('Home')}</span></a>`;

    // placeholder for custom menu links
    html += '<div class="customMenuOptions"></div>';

    // libraries are added here
    html += '<div class="libraryMenuOptions"></div>';

    if (user.localUser?.Policy.IsAdministrator) {
        html += '<div class="adminMenuOptions">';
        html += '<h3 class="sidebarHeader">';
        html += globalize.translate('HeaderAdmin');
        html += '</h3>';
        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder lnkManageServer" data-itemid="dashboard" href="#/dashboard"><span class="material-icons navMenuOptionIcon dashboard" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('TabDashboard')}</span></a>`;
        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder editorViewMenu" data-itemid="editor" href="#/metadata"><span class="material-icons navMenuOptionIcon mode_edit" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('MetadataManager')}</span></a>`;
        html += '</div>';
    }

    if (user.localUser) {
        html += '<div class="userMenuOptions">';
        html += '<h3 class="sidebarHeader">';
        html += globalize.translate('HeaderUser');
        html += '</h3>';

        if (appHost.supports(AppFeature.MultiServer)) {
            html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSelectServer" data-itemid="selectserver" href="#"><span class="material-icons navMenuOptionIcon storage" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('SelectServer')}</span></a>`;
        }

        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSettings" data-itemid="settings" href="#"><span class="material-icons navMenuOptionIcon settings" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('Settings')}</span></a>`;
        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnLogout" data-itemid="logout" href="#"><span class="material-icons navMenuOptionIcon exit_to_app" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('ButtonSignOut')}</span></a>`;

        if (appHost.supports(AppFeature.ExitMenu)) {
            html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder exitApp" data-itemid="exitapp" href="#"><span class="material-icons navMenuOptionIcon close" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('ButtonExitApp')}</span></a>`;
        }

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

    const btnExit = navDrawerScrollContainer.querySelector('.exitApp');
    if (btnExit) {
        btnExit.addEventListener('click', onExitAppClick);
    }

    const btnLogout = navDrawerScrollContainer.querySelector('.btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', onLogoutClick);
    }
}

function onSidebarLinkClick() {
    const section = this.getElementsByClassName('sectionName')[0];
    const text = section ? section.innerHTML : this.innerHTML;
    LibraryMenu.setTitle(text);
}

function getUserViews(apiClient, userId) {
    return queryClient
        .fetchQuery(getUserViewsQuery(toApi(apiClient), userId))
        .then(function (result) {
            const items = result.Items;
            const list = [];

            for (let i = 0, length = items.length; i < length; i++) {
                const view = items[i];
                list.push(view);

                if (view.CollectionType == 'livetv') {
                    view.icon = 'live_tv';
                    const guideView = Object.assign({}, view);
                    guideView.Name = globalize.translate('Guide');
                    guideView.ImageTags = {};
                    guideView.icon = 'dvr';
                    guideView.url = '#/livetv?tab=1';
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
        showBySelector('.userMenuOptions', false);
        return;
    }

    const userId = Dashboard.getCurrentUserId();
    const apiClient = getCurrentApiClient();

    const customMenuOptions = document.querySelector('.customMenuOptions');
    if (customMenuOptions) {
        getMenuLinks().then(links => {
            links.forEach(link => {
                const option = document.createElement('a', 'emby-linkbutton');
                option.classList.add('navMenuOption', 'lnkMediaFolder');
                option.rel = 'noopener noreferrer';
                option.target = '_blank';
                option.href = link.url;

                const icon = document.createElement('span');
                icon.className = `material-icons navMenuOptionIcon ${link.icon || 'link'}`;
                icon.setAttribute('aria-hidden', 'true');
                option.appendChild(icon);

                const label = document.createElement('span');
                label.className = 'navMenuOptionText';
                label.textContent = link.name;
                option.appendChild(label);

                customMenuOptions.appendChild(option);
            });
        });
    }

    const libraryMenuOptions = document.querySelector('.libraryMenuOptions');

    if (libraryMenuOptions) {
        getUserViews(apiClient, userId).then(function (result) {
            const items = result;
            let html = `<h3 class="sidebarHeader">${globalize.translate('HeaderMedia')}</h3>`;
            html += items.map(function (i) {
                const icon = i.icon || imageHelper.getLibraryIcon(i.CollectionType);
                const itemId = i.Id;

                return `<a is="emby-linkbutton" data-itemid="${itemId}" class="lnkMediaFolder navMenuOption" href="${getItemHref(i, i.CollectionType)}">
                                    <span class="material-icons navMenuOptionIcon ${icon}" aria-hidden="true"></span>
                                    <span class="sectionName navMenuOptionText">${escapeHtml(i.Name)}</span>
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
    Dashboard.navigate('mypreferencesmenu');
}

function onExitAppClick() {
    appHost.exit();
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
        context.querySelector('.headerSelectedPlayer').innerText = info.deviceName || info.name;
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
    let newPageType = 3;
    if (isDashboardPage) {
        newPageType = 2;
    } else if (isLibraryPage) {
        newPageType = 1;
    }

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
            bodyClassList.remove('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(true);
            }
        } else if (isDashboardPage) {
            bodyClassList.remove('libraryDocument');
            bodyClassList.remove('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(true);
            }
        } else {
            bodyClassList.remove('libraryDocument');
            bodyClassList.add('hideMainDrawer');

            if (navDrawerInstance) {
                navDrawerInstance.setEdgeSwipeEnabled(false);
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
        import('../lib/navdrawer/navdrawer').then(({ default: NavDrawer }) => {
            navDrawerInstance = new NavDrawer(getNavDrawerOptions());

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
let documentTitle = 'Jellyfin';
let pageTitleElement;
let headerBackButton;
let headerSettingsButton;
let currentUser;
let headerCastButton;
let headerSearchButton;
let headerAudioPlayerButton;
let headerSyncButton;
let currentTimeText;
const enableLibraryNavDrawer = layoutManager.desktop;
const enableLibraryNavDrawerHome = !layoutManager.tv;
const skinHeader = document.querySelector('.skinHeader');
let requiresUserRefresh = true;

function setTabs (type, selectedIndex, builder) {
    Events.trigger(document, EventType.SET_TABS, type ? [ type, selectedIndex, builder()] : []);

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

/**
 * Fetch the server name and update the document title.
 * @param {ApiClient} [_apiClient] The current api client.
 */
const fetchServerName = (_apiClient) => {
    _apiClient
        ?.getPublicSystemInfo()
        .then(({ ServerName }) => {
            documentTitle = ServerName || documentTitle;
            document.title = documentTitle;
        })
        .catch(err => {
            console.error('[LibraryMenu] failed to fetch system info', err);
        });
};

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

    document.title = documentTitle;
}

function setTitle (title) {
    if (title == null) {
        LibraryMenu.setDefaultTitle();
        return;
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
        pageTitleElement.innerText = html || '';
    }

    document.title = title || documentTitle;
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

    if (!isDashboardPage) {
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

Events.on(ServerConnections, 'apiclientcreated', (e, newApiClient) => {
    fetchServerName(newApiClient);
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

fetchServerName(getCurrentApiClient());
loadNavDrawer();

const LibraryMenu = {
    getTopParentId,
    onHardwareMenuButtonClick: function () {
        toggleMainDrawer();
    },
    setTabs,
    setDefaultTitle,
    setTitle,
    setTransparentMenu
};

window.LibraryMenu = LibraryMenu;
renderHeader();

export default LibraryMenu;
