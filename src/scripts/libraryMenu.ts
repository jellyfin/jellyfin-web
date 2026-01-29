/**
 * @deprecated This module is deprecated in favor of React components.
 *
 * Migration:
    - Library navigation → React router
    - Headroom.js → CSS scroll-based or Intersection Observer
    - Global menu state → Zustand store
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { AppFeature } from 'constants/appFeature';
import { EventType } from 'constants/eventType';
import { getUserViewsQuery } from 'hooks/useUserViews';
import type { ApiClient } from 'jellyfin-apiclient';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { escapeHtml } from 'utils/html';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { logger } from 'utils/logger';
import { queryClient } from 'utils/query/queryClient';
import { safeAppHost } from '../components/apphost';
import layoutManager from '../components/layoutManager';
import { playbackManager } from '../components/playback/playbackmanager';
import { pluginManager } from '../components/pluginManager';
import { appRouter } from '../components/router/appRouter';
import viewManager from '../components/viewManager/viewManager';
import groupSelectionMenu from '../plugins/syncPlay/ui/groupSelectionMenu';
import datetime from '../scripts/datetime';
import { getMenuLinks } from '../scripts/settings/webSettings';
import { PluginType } from '../types/plugin';
import Dashboard, { pageClassOn } from '../utils/dashboard';
import dom from '../utils/dom';
import Events from '../utils/events';
import imageHelper from '../utils/image';
import { getParameterByName } from '../utils/url';
import browser from './browser';
import inputManager from './inputManager';

import '../elements/emby-button/paper-icon-button-light';

function renderHeader(): void {
    let html = '';
    html += '<div class="flex align-items-center flex-grow headerTop">';
    html += '<div class="headerLeft">';
    html +=
        '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonLeft headerBackButton hide"><span class="material-icons ' +
        (browser.safari ? 'chevron_left' : 'arrow_back') +
        '" aria-hidden="true"></span></button>';
    html +=
        '<button type="button" is="paper-icon-button-light" class="headerButton headerHomeButton hide barsMenuButton headerButtonLeft"><span class="material-icons home" aria-hidden="true"></span></button>';
    html +=
        '<button type="button" is="paper-icon-button-light" class="headerButton mainDrawerButton barsMenuButton headerButtonLeft hide"><span class="material-icons menu" aria-hidden="true"></span></button>';
    html += '<h3 class="pageTitle" aria-hidden="true"></h3>';
    html += '</div>';
    html += '<div class="headerRight">';
    html +=
        '<button is="paper-icon-button-light" class="headerSyncButton syncButton headerButton headerButtonRight hide"><span class="material-icons groups" aria-hidden="true"></span></button>';
    html += '<span class="headerSelectedPlayer"></span>';
    html +=
        '<button is="paper-icon-button-light" class="headerAudioPlayerButton audioPlayerButton headerButton headerButtonRight hide"><span class="material-icons music_note" aria-hidden="true"></span></button>';
    html +=
        '<button is="paper-icon-button-light" class="headerCastButton castButton headerButton headerButtonRight hide"><span class="material-icons cast" aria-hidden="true"></span></button>';
    html +=
        '<button type="button" is="paper-icon-button-light" class="headerButton headerButtonRight headerSearchButton hide"><span class="material-icons search" aria-hidden="true"></span></button>';
    html +=
        '<button is="paper-icon-button-light" class="headerButton headerButtonRight headerUserButton hide"><span class="material-icons person" aria-hidden="true"></span></button>';
    html += '<div class="currentTimeText hide"></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="headerTabs sectionTabs hide">';
    html += '</div>';

    if (skinHeader) {
        skinHeader.classList.add('skinHeader-withBackground');
        skinHeader.classList.add('skinHeader-blurred');
        skinHeader.innerHTML = html;

        Events.trigger(document, EventType.HEADER_RENDERED);

        headerBackButton = skinHeader.querySelector<HTMLElement>('.headerBackButton');
        headerHomeButton = skinHeader.querySelector<HTMLElement>('.headerHomeButton');
        mainDrawerButton = skinHeader.querySelector<HTMLElement>('.mainDrawerButton');
        headerUserButton = skinHeader.querySelector<HTMLElement>('.headerUserButton');
        headerCastButton = skinHeader.querySelector<HTMLElement>('.headerCastButton');
        headerAudioPlayerButton = skinHeader.querySelector<HTMLElement>('.headerAudioPlayerButton');
        headerSearchButton = skinHeader.querySelector<HTMLElement>('.headerSearchButton');
        headerSyncButton = skinHeader.querySelector<HTMLElement>('.headerSyncButton');
        currentTimeText = skinHeader.querySelector<HTMLElement>('.currentTimeText');

        retranslateUi();
        lazyLoadViewMenuBarImages();
        bindMenuEvents();
        updateCastIcon();
        updateClock();
    }
}

function getCurrentApiClient(): ApiClient {
    if (currentUser?.localUser) {
        return ServerConnections.getApiClient(currentUser.localUser.ServerId);
    }

    const client = ServerConnections.currentApiClient();
    if (!client) throw new Error('No ApiClient available');
    return client;
}

function lazyLoadViewMenuBarImages(): void {
    import('../components/images/imageLoader').then((imageLoader) => {
        if (skinHeader) {
            imageLoader.default.lazyChildren(skinHeader);
        }
    });
}

function onBackClick(): void {
    appRouter.back();
}

function retranslateUi(): void {
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

    if (headerUserButton) {
        headerUserButton.title = globalize.translate('Settings');
    }
}

function updateUserInHeader(user?: any): void {
    retranslateUi();

    let hasImage = false;

    if (user?.name) {
        if (user.imageUrl) {
            const url = user.imageUrl;
            updateHeaderUserButton(url);
            hasImage = true;
        }
        if (headerUserButton) {
            headerUserButton.title = user.name;
            headerUserButton.classList.remove('hide');
        }
    } else {
        headerUserButton?.classList.add('hide');
    }

    if (!hasImage) {
        updateHeaderUserButton(null);
    }

    if (user?.localUser) {
        if (headerHomeButton) {
            headerHomeButton.classList.remove('hide');
        }

        if (headerSearchButton) {
            headerSearchButton.classList.remove('hide');
        }

        if (!layoutManager.tv) {
            headerCastButton?.classList.remove('hide');
        }

        const policy = user.Policy ? user.Policy : user.localUser.Policy;

        if (
            // Button is present
            headerSyncButton &&
            // SyncPlay plugin is loaded
            pluginManager.ofType(PluginType.SyncPlay).length > 0 &&
            // SyncPlay enabled for user
            policy?.SyncPlayAccess !== 'None'
        ) {
            headerSyncButton.classList.remove('hide');
        }
    } else {
        headerHomeButton?.classList.add('hide');
        headerCastButton?.classList.add('hide');
        headerSyncButton?.classList.add('hide');

        if (headerSearchButton) {
            headerSearchButton.classList.add('hide');
        }
    }

    requiresUserRefresh = false;
}

function updateHeaderUserButton(src: string | null): void {
    if (!headerUserButton) return;

    if (src) {
        headerUserButton.classList.add('headerUserButtonRound');
        headerUserButton.innerHTML =
            '<div class="headerButton headerButtonRight paper-icon-button-light headerUserButtonRound" style="background-image:url(\"' +
            src +
            '\");"></div>';
    } else {
        headerUserButton.classList.remove('headerUserButtonRound');
        headerUserButton.innerHTML =
            '<span class="material-icons person" aria-hidden="true"></span>';
    }
}

function updateClock(): void {
    if (layoutManager.tv && currentTimeText) {
        currentTimeText.classList.remove('hide');
        setInterval(() => {
            if (currentTimeText) {
                currentTimeText.innerText = datetime.getDisplayTime(new Date());
            }
        }, 1000);
    } else {
        currentTimeText?.classList.add('hide');
    }
}

function showSearch(): void {
    inputManager.handleCommand('search');
}

function onHeaderUserButtonClick(): void {
    Dashboard.navigate('mypreferencesmenu');
}

function onHeaderHomeButtonClick(): void {
    Dashboard.navigate('home');
}

function showAudioPlayer(): Promise<void> {
    return appRouter.showNowPlaying();
}

function bindMenuEvents(): void {
    if (mainDrawerButton) {
        mainDrawerButton.addEventListener('click', toggleMainDrawer);
    }

    if (headerBackButton) {
        headerBackButton.addEventListener('click', onBackClick);
    }

    if (headerSearchButton) {
        headerSearchButton.addEventListener('click', showSearch);
    }

    headerUserButton?.addEventListener('click', onHeaderUserButtonClick);
    headerHomeButton?.addEventListener('click', onHeaderHomeButtonClick);

    if (!layoutManager.tv) {
        headerCastButton?.addEventListener('click', onCastButtonClicked);
    }

    headerAudioPlayerButton?.addEventListener('click', showAudioPlayer);
    headerSyncButton?.addEventListener('click', onSyncButtonClicked);

    Events.on(playbackManager, 'playbackstart', onPlaybackStart);
    Events.on(playbackManager, 'playbackstop', onPlaybackStop);
}

function onPlaybackStart(): void {
    if (playbackManager.isPlayingAudio() && layoutManager.tv) {
        headerAudioPlayerButton?.classList.remove('hide');
    } else {
        headerAudioPlayerButton?.classList.add('hide');
    }
}

function onPlaybackStop(_e: any, stopInfo: any): void {
    if (stopInfo.nextMediaType != 'Audio') {
        headerAudioPlayerButton?.classList.add('hide');
    }
}

function onCastButtonClicked(this: HTMLElement): void {
    const btn = this;

    import('../components/playback/playerSelectionMenu').then((playerSelectionMenu) => {
        playerSelectionMenu.default.show(btn);
    });
}

function onSyncButtonClicked(this: HTMLElement): void {
    const btn = this;
    groupSelectionMenu.show(btn);
}

function getItemHref(item: any, context?: string): string {
    return appRouter.getRouteUrl(item, {
        context: context
    });
}

function toggleMainDrawer(): void {
    if (navDrawerInstance?.isVisible) {
        closeMainDrawer();
    } else {
        openMainDrawer();
    }
}

function openMainDrawer(): void {
    navDrawerInstance?.open();
}

function onMainDrawerOpened(): void {
    if (layoutManager.mobile) {
        document.body.classList.add('bodyWithPopupOpen');
    }
}

function closeMainDrawer(): void {
    navDrawerInstance?.close();
}

function onMainDrawerSelect(): void {
    if (navDrawerInstance?.isVisible) {
        onMainDrawerOpened();
    } else {
        document.body.classList.remove('bodyWithPopupOpen');
    }
}

function refreshLibraryInfoInDrawer(user: any): void {
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

        if (safeAppHost.supports(AppFeature.MultiServer)) {
            html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSelectServer" data-itemid="selectserver" href="#"><span class="material-icons navMenuOptionIcon storage" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('SelectServer')}</span></a>`;
        }

        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnSettings" data-itemid="settings" href="#"><span class="material-icons navMenuOptionIcon settings" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('Settings')}</span></a>`;
        html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder btnLogout" data-itemid="logout" href="#"><span class="material-icons navMenuOptionIcon exit_to_app" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('ButtonSignOut')}</span></a>`;

        if (safeAppHost.supports(AppFeature.ExitMenu)) {
            html += `<a is="emby-linkbutton" class="navMenuOption lnkMediaFolder exitApp" data-itemid="exitapp" href="#"><span class="material-icons navMenuOptionIcon close" aria-hidden="true"></span><span class="navMenuOptionText">${globalize.translate('ButtonExitApp')}</span></a>`;
        }

        html += '</div>';
    }

    // add buttons to navigation drawer
    if (navDrawerScrollContainer) {
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
}

function onSidebarLinkClick(this: HTMLElement): void {
    const section = this.getElementsByClassName('sectionName')[0] as HTMLElement;
    const text = section ? section.innerHTML : this.innerHTML;
    LibraryMenu.setTitle(text);
}

interface ExtendedBaseItemDto extends BaseItemDto {
    icon?: string;
    url?: string;
}

function getUserViews(apiClient: ApiClient, userId: string): Promise<ExtendedBaseItemDto[]> {
    return queryClient.fetchQuery(getUserViewsQuery(toApi(apiClient), userId)).then((result) => {
        const items = result.Items || [];
        const list: ExtendedBaseItemDto[] = [];

        for (let i = 0, length = items.length; i < length; i++) {
            const view = items[i] as ExtendedBaseItemDto;
            list.push(view);

            if (view.CollectionType == 'livetv') {
                view.icon = 'live_tv';
                const guideView = Object.assign({}, view) as ExtendedBaseItemDto;
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

function showBySelector(selector: string, show: boolean): void {
    const elem = document.querySelector<HTMLElement>(selector);

    if (elem) {
        if (show) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }
    }
}

function updateLibraryMenu(user?: any): void {
    if (!user) {
        showBySelector('.userMenuOptions', false);
        return;
    }

    const userId = Dashboard.getCurrentUserId();
    const apiClient = getCurrentApiClient();

    const customMenuOptions = document.querySelector<HTMLElement>('.customMenuOptions');
    if (customMenuOptions) {
        getMenuLinks().then((links) => {
            links.forEach((link: any) => {
                const option = document.createElement('a');
                option.setAttribute('is', 'emby-linkbutton');
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

    const libraryMenuOptions = document.querySelector<HTMLElement>('.libraryMenuOptions');

    if (libraryMenuOptions) {
        getUserViews(apiClient, userId).then((result) => {
            const items = result;
            let html = `<h3 class="sidebarHeader">${globalize.translate('HeaderMedia')}</h3>`;
            html += items
                .map((i) => {
                    const icon = i.icon || imageHelper.getLibraryIcon(i.CollectionType);
                    const itemId = i.Id;

                    return `<a is="emby-linkbutton" data-itemid="${itemId}" class="lnkMediaFolder navMenuOption" href="${getItemHref(i, i.CollectionType)}">
                                    <span class="material-icons navMenuOptionIcon ${icon}" aria-hidden="true"></span>
                                    <span class="sectionName navMenuOptionText">${escapeHtml(i.Name)}</span>
                                  </a>`;
                })
                .join('');
            libraryMenuOptions.innerHTML = html;
            const sidebarLinks = libraryMenuOptions.querySelectorAll('.navMenuOption');

            for (const sidebarLink of sidebarLinks) {
                sidebarLink.removeEventListener('click', onSidebarLinkClick);
                sidebarLink.addEventListener('click', onSidebarLinkClick);
            }
        });
    }
}

function getTopParentId(): string | null {
    return getParameterByName('topParentId') || null;
}

function onMainDrawerClick(e: MouseEvent): void {
    if (dom.parentWithTag(e.target as HTMLElement, 'A')) {
        setTimeout(closeMainDrawer, 30);
    }
}

function onSelectServerClick(): void {
    Dashboard.selectServer();
}

function onSettingsClick(): void {
    Dashboard.navigate('mypreferencesmenu');
}

function onExitAppClick(): void {
    safeAppHost.exit();
}

function onLogoutClick(): void {
    Dashboard.logout();
}

function updateCastIcon(): void {
    const context = document;
    if (!headerCastButton) return;

    const info = playbackManager.getPlayerInfo();
    const icon = headerCastButton.querySelector<HTMLElement>('.material-icons');
    if (!icon) return;

    icon.classList.remove('cast_connected', 'cast');

    const headerSelectedPlayer = context.querySelector<HTMLElement>('.headerSelectedPlayer');

    if (info && !info.isLocalPlayer) {
        icon.classList.add('cast_connected');
        headerCastButton.classList.add('castButton-active');
        if (headerSelectedPlayer) {
            headerSelectedPlayer.innerText = info.deviceName || info.name;
        }
    } else {
        icon.classList.add('cast');
        headerCastButton.classList.remove('castButton-active');
        if (headerSelectedPlayer) {
            headerSelectedPlayer.innerHTML = '';
        }
    }
}

function updateLibraryNavLinks(page: HTMLElement): void {
    const isLiveTvPage = page.classList.contains('liveTvPage');
    const isChannelsPage = page.classList.contains('channelsPage');
    const isEditorPage = page.classList.contains('metadataEditorPage');
    const isMySyncPage = page.classList.contains('mySyncPage');
    const id =
        isLiveTvPage ||
        isChannelsPage ||
        isEditorPage ||
        isMySyncPage ||
        page.classList.contains('allLibraryPage')
            ? ''
            : getTopParentId() || '';
    const elems = document.getElementsByClassName('lnkMediaFolder');

    for (let i = 0, length = elems.length; i < length; i++) {
        const lnkMediaFolder = elems[i] as HTMLElement;
        const itemId = lnkMediaFolder.getAttribute('data-itemid');

        if (isChannelsPage && itemId === 'channels') {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else if (isLiveTvPage && itemId === 'livetv') {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else if (isEditorPage && itemId === 'editor') {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else if (
            isMySyncPage &&
            itemId === 'manageoffline' &&
            window.location.href.toString().indexOf('mode=download') != -1
        ) {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else if (
            isMySyncPage &&
            itemId === 'syncotherdevices' &&
            window.location.href.toString().indexOf('mode=download') == -1
        ) {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else if (id && itemId == id) {
            lnkMediaFolder.classList.add('navMenuOption-selected');
        } else {
            lnkMediaFolder.classList.remove('navMenuOption-selected');
        }
    }
}

function updateMenuForPageType(isDashboardPage: boolean, isLibraryPage: boolean): void {
    let newPageType = 3;
    if (isDashboardPage) {
        newPageType = 2;
    } else if (isLibraryPage) {
        newPageType = 1;
    }

    if (currentPageType !== newPageType) {
        currentPageType = newPageType;

        if (isDashboardPage && !layoutManager.mobile) {
            skinHeader?.classList.add('headroomDisabled');
        } else {
            skinHeader?.classList.remove('headroomDisabled');
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

function updateTitle(page: HTMLElement): void {
    const title = page.getAttribute('data-title');

    if (title) {
        LibraryMenu.setTitle(title);
    } else if (page.classList.contains('standalonePage')) {
        LibraryMenu.setDefaultTitle();
    }
}

function updateBackButton(page: HTMLElement): void {
    if (headerBackButton) {
        if (page.getAttribute('data-backbutton') !== 'false' && appRouter.canGoBack()) {
            headerBackButton.classList.remove('hide');
        } else {
            headerBackButton.classList.add('hide');
        }
    }
}

function refreshLibraryDrawer(user?: any): void {
    loadNavDrawer();
    currentDrawerType = 'library';

    if (user) {
        Promise.resolve(user);
    } else {
        ServerConnections.user(getCurrentApiClient()).then((userResult) => {
            refreshLibraryInfoInDrawer(userResult);
            updateLibraryMenu(userResult.localUser);
        });
    }
}

function getNavDrawerOptions(): any {
    let drawerWidth = window.screen.availWidth - 50;
    drawerWidth = Math.max(drawerWidth, 240);
    drawerWidth = Math.min(drawerWidth, 320);
    return {
        target: navDrawerElement,
        onChange: onMainDrawerSelect,
        width: drawerWidth
    };
}

function loadNavDrawer(): Promise<any> {
    if (navDrawerInstance) {
        return Promise.resolve(navDrawerInstance);
    }

    navDrawerElement = document.querySelector<HTMLElement>('.mainDrawer')!;
    navDrawerScrollContainer = navDrawerElement.querySelector<HTMLElement>('.scrollContainer')!;
    navDrawerScrollContainer.addEventListener('click', onMainDrawerClick as EventListener);
    return new Promise((resolve) => {
        import('../lib/navdrawer/navdrawer').then(({ default: NavDrawer }) => {
            navDrawerInstance = new NavDrawer(getNavDrawerOptions());

            if (!layoutManager.tv) {
                navDrawerElement!.classList.remove('hide');
            }

            resolve(navDrawerInstance);
        });
    });
}

let navDrawerElement: HTMLElement | null;
let navDrawerScrollContainer: HTMLElement | null;
let navDrawerInstance: any;
let mainDrawerButton: HTMLElement | null;
let headerHomeButton: HTMLElement | null;
let currentDrawerType: string | null;
let documentTitle = 'Jellyfin';
let pageTitleElement: HTMLElement | null;
let headerBackButton: HTMLElement | null;
let headerUserButton: HTMLElement | null;
let currentUser: any;
let headerCastButton: HTMLElement | null;
let headerSearchButton: HTMLElement | null;
let headerAudioPlayerButton: HTMLElement | null;
let headerSyncButton: HTMLElement | null;
let currentTimeText: HTMLElement | null;
const enableLibraryNavDrawer = layoutManager.desktop;
const enableLibraryNavDrawerHome = !layoutManager.tv;
const skinHeader = document.querySelector<HTMLElement>('.skinHeader');
let requiresUserRefresh = true;

function setTabs(type: string | null, selectedIndex: number, builder: () => any): void {
    Events.trigger(document, EventType.SET_TABS, type ? [type, selectedIndex, builder()] : []);

    import('../components/maintabsmanager').then((mainTabsManager) => {
        if (type) {
            mainTabsManager.setTabs(viewManager.currentView(), selectedIndex, builder, () => {
                return [];
            });
        } else {
            mainTabsManager.setTabs(null, 0, () => []);
        }
    });
}

/**
 * Fetch the server name and update the document title.
 * @param {ApiClient} [_apiClient] The current api client.
 */
const fetchServerName = (_apiClient?: ApiClient): void => {
    _apiClient
        ?.getPublicSystemInfo()
        .then(({ ServerName }) => {
            documentTitle = ServerName || documentTitle;
            document.title = documentTitle;
        })
        .catch((err) => {
            logger.error('failed to fetch system info', { err, component: 'LibraryMenu' });
        });
};

function setDefaultTitle(): void {
    if (!pageTitleElement) {
        pageTitleElement = document.querySelector('.pageTitle');
    }

    if (pageTitleElement) {
        pageTitleElement.classList.add('pageTitleWithLogo');
        pageTitleElement.classList.add('pageTitleWithDefaultLogo');
        pageTitleElement.style.backgroundImage = '';
        pageTitleElement.innerHTML = '';
    }

    document.title = documentTitle;
}

function setTitle(title: string | null): void {
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
        pageTitleElement.style.backgroundImage = '';
        pageTitleElement.innerText = html || '';
    }

    document.title = title || documentTitle;
}

function setTransparentMenu(transparent: boolean): void {
    if (transparent) {
        skinHeader?.classList.add('semiTransparent');
    } else {
        skinHeader?.classList.remove('semiTransparent');
    }
}

let currentPageType: number;
pageClassOn('pagebeforeshow', 'page', function (this: HTMLElement) {
    if (!this.classList.contains('withTabs')) {
        LibraryMenu.setTabs(null, 0, () => []);
    }
});

pageClassOn('pageshow', 'page', function (this: HTMLElement, e: any) {
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

Events.on(ServerConnections, 'apiclientcreated', (_e: any, newApiClient: ApiClient) => {
    fetchServerName(newApiClient);
});

Events.on(ServerConnections, 'localusersignedin', (_e: any, user: any) => {
    const currentApiClient = ServerConnections.getApiClient(user.ServerId);

    currentDrawerType = null;
    currentUser = {
        localUser: user
    };

    loadNavDrawer();

    ServerConnections.user(currentApiClient).then((userResult) => {
        currentUser = userResult;
        updateUserInHeader(userResult);
    });
});

Events.on(ServerConnections, 'localusersignedout', () => {
    currentUser = {};
    updateUserInHeader();
});

Events.on(playbackManager, 'playerchange', updateCastIcon);

fetchServerName(getCurrentApiClient());
loadNavDrawer();

const LibraryMenu = {
    getTopParentId,
    onHardwareMenuButtonClick: function (): void {
        toggleMainDrawer();
    },
    setTabs,
    setDefaultTitle,
    setTitle,
    setTransparentMenu
};

(window as any).LibraryMenu = LibraryMenu;
renderHeader();

export { LibraryMenu };
export default LibraryMenu;
