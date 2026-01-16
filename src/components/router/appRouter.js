import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import { setBackdropTransparency } from '../backdrop/backdrop';
import globalize from '../../lib/globalize';
import itemHelper from '../itemHelper';
import loading from '../loading/loading';
import alert from '../alert';

import { getItemQuery } from 'hooks/useItem';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';
import { history } from 'RootAppRouter';

/** Pages of "no return" (when "Go back" should behave differently, probably quitting the application). */
const START_PAGE_PATHS = ['/home', '/login', '/selectserver'];

/** Pages that do not require a user to be logged in to view. */
export const PUBLIC_PATHS = [
    '/addserver',
    '/selectserver',
    '/login',
    '/forgotpassword',
    '/forgotpasswordpin',
    '/wizardremoteaccess',
    '/wizardfinish',
    '/wizardlibrary',
    '/wizardsettings',
    '/wizardstart',
    '/wizarduser'
];

class AppRouter {
    forcedLogoutMsg;
    msgTimeout;
    promiseShow;
    resolveOnNextShow;

    constructor() {
        document.addEventListener('viewshow', () => this.onViewShow());

        this.lastPath = history.location.pathname + history.location.search;
        this.listen();

        // TODO: Can this baseRoute logic be simplified?
        this.baseRoute = window.location.href.split('?')[0].replace(this.#getRequestFile(), '');
        // support hashbang
        this.baseRoute = this.baseRoute.split('#')[0];
        if (this.baseRoute.endsWith('/') && !this.baseRoute.endsWith('://')) {
            this.baseRoute = this.baseRoute.substring(0, this.baseRoute.length - 1);
        }
    }

    ready() {
        return this.promiseShow || Promise.resolve();
    }

    async back() {
        if (this.promiseShow) await this.promiseShow;

        this.promiseShow = new Promise((resolve) => {
            const unlisten = history.listen(() => {
                unlisten();
                this.promiseShow = null;
                resolve();
            });
            history.back();
        });

        return this.promiseShow;
    }

    async show(path, options) {
        if (this.promiseShow) await this.promiseShow;

        // ensure the path does not start with '#' since the router adds this
        if (path.startsWith('#')) {
            path = path.substring(1);
        }
        // Support legacy '#!' routes since people may have old bookmarks, etc.
        if (path.startsWith('!')) {
            path = path.substring(1);
        }

        if (path.indexOf('/') !== 0 && path.indexOf('://') === -1) {
            path = '/' + path;
        }

        path = path.replace(this.baseUrl(), '');

        // can't use this with home right now due to the back menu
        if (history.location.pathname === path && path !== '/home') {
            loading.hide();
            return Promise.resolve();
        }

        this.promiseShow = new Promise((resolve) => {
            this.resolveOnNextShow = resolve;
            // Schedule a call to return the promise
            setTimeout(() => history.push(path, options), 0);
        });

        return this.promiseShow;
    }

    listen() {
        history.listen(({ location }) => {
            const normalizedPath = location.pathname.replace(/^!/, '');
            const fullPath = normalizedPath + location.search;

            if (fullPath === this.lastPath) {
                console.debug('[appRouter] path did not change, resolving promise');
                this.onViewShow();
            }

            this.lastPath = fullPath;
        });
    }

    baseUrl() {
        return this.baseRoute;
    }

    canGoBack(path = history.location.pathname) {
        if (
            !document.querySelector('.dialogContainer')
            && START_PAGE_PATHS.includes(path)
        ) {
            return false;
        }

        return window.history.length > 1;
    }

    showItem(item, serverId, options) {
        // TODO: Refactor this so it only gets items, not strings.
        if (typeof item === 'string') {
            const apiClient = serverId ? ServerConnections.getApiClient(serverId) : ServerConnections.currentApiClient();
            const api = toApi(apiClient);
            const userId = apiClient.getCurrentUserId();

            queryClient
                .fetchQuery(getItemQuery(api, item, userId))
                .then(itemObject => {
                    this.showItem(itemObject, options);
                })
                .catch(err => {
                    console.error('[AppRouter] Failed to fetch item', err);
                });
        } else {
            if (arguments.length === 2) {
                options = arguments[1];
            }

            const url = this.getRouteUrl(item, options);
            this.show(url);
        }
    }

    /**
     * Sets the backdrop, background, and document transparency
     * @deprecated use Dashboard.setBackdropTransparency
     */
    setTransparency(level) {
        // TODO: Remove this after JMP is updated to not use this function
        console.warn('Deprecated! Use Dashboard.setBackdropTransparency');
        setBackdropTransparency(level);
    }

    onViewShow() {
        const resolve = this.resolveOnNextShow;
        if (resolve) {
            this.promiseShow = null;
            this.resolveOnNextShow = null;
            resolve();
        }
    }

    onForcedLogoutMessageTimeout() {
        const msg = this.forcedLogoutMsg;
        this.forcedLogoutMsg = null;

        if (msg) {
            alert(msg);
        }
    }

    showForcedLogoutMessage(msg) {
        this.forcedLogoutMsg = msg;
        if (this.msgTimeout) {
            clearTimeout(this.msgTimeout);
        }

        this.msgTimeout = setTimeout(this.onForcedLogoutMessageTimeout, 100);
    }

    onRequestFail(_e, data) {
        const apiClient = this;

        if (data.status === 403 && data.errorCode === 'ParentalControl') {
            const isPublicPage = PUBLIC_PATHS.includes(history.location.pathname);

            // Bounce to the login screen, but not if a password entry fails, obviously
            if (!isPublicPage) {
                appRouter.showForcedLogoutMessage(globalize.translate('AccessRestrictedTryAgainLater'));
                appRouter.showLocalLogin(apiClient.serverId());
            }
        }
    }

    #getRequestFile() {
        let path = window.location.pathname || '';

        const index = path.lastIndexOf('/');
        if (index !== -1) {
            path = path.substring(index);
        } else {
            path = '/' + path;
        }

        if (!path || path === '/') {
            path = '/index.html';
        }

        return path;
    }

    getRouteUrl(item, options) {
        if (!item) {
            throw new Error('item cannot be null');
        }

        if (item.url) {
            return item.url;
        }

        const context = options ? options.context : null;
        const id = item.Id || item.ItemId;

        if (!options) {
            options = {};
        }

        let url;
        // TODO: options will never be false. Replace condition with lodash's isEmpty()
        const itemType = item.Type || (options ? options.itemType : null);
        const serverId = item.ServerId || options.serverId;

        if (item === 'settings') {
            return '#/mypreferencesmenu';
        }

        if (item === 'wizard') {
            return '#/wizardstart';
        }

        if (item === 'manageserver') {
            return '#/dashboard';
        }

        if (item === 'recordedtv') {
            return '#/livetv?tab=3&serverId=' + options.serverId;
        }

        if (item === 'nextup') {
            return '#/list?type=nextup&serverId=' + options.serverId;
        }

        if (item === 'list') {
            let urlForList = '#/list?serverId=' + options.serverId + '&type=' + options.itemTypes;

            if (options.isFavorite) {
                urlForList += '&IsFavorite=true';
            }

            if (options.isAiring) {
                urlForList += '&IsAiring=true';
            }

            if (options.isMovie) {
                urlForList += '&IsMovie=true';
            }

            if (options.isSeries) {
                urlForList += '&IsSeries=true&IsMovie=false&IsNews=false';
            }

            if (options.isSports) {
                urlForList += '&IsSports=true';
            }

            if (options.isKids) {
                urlForList += '&IsKids=true';
            }

            if (options.isNews) {
                urlForList += '&IsNews=true';
            }

            return urlForList;
        }

        if (item === 'livetv') {
            if (options.section === 'programs') {
                return '#/livetv?tab=0&serverId=' + options.serverId;
            }
            if (options.section === 'guide') {
                return '#/livetv?tab=1&serverId=' + options.serverId;
            }

            if (options.section === 'movies') {
                return '#/list?type=Programs&IsMovie=true&serverId=' + options.serverId;
            }

            if (options.section === 'shows') {
                return '#/list?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + options.serverId;
            }

            if (options.section === 'sports') {
                return '#/list?type=Programs&IsSports=true&serverId=' + options.serverId;
            }

            if (options.section === 'kids') {
                return '#/list?type=Programs&IsKids=true&serverId=' + options.serverId;
            }

            if (options.section === 'news') {
                return '#/list?type=Programs&IsNews=true&serverId=' + options.serverId;
            }

            if (options.section === 'onnow') {
                return '#/list?type=Programs&IsAiring=true&serverId=' + options.serverId;
            }

            if (options.section === 'channels') {
                return '#/livetv?tab=2&serverId=' + options.serverId;
            }

            if (options.section === 'dvrschedule') {
                return '#/livetv?tab=4&serverId=' + options.serverId;
            }

            if (options.section === 'seriesrecording') {
                return '#/livetv?tab=5&serverId=' + options.serverId;
            }

            return '#/livetv?serverId=' + options.serverId;
        }

        if (itemType == 'SeriesTimer') {
            return '#/details?seriesTimerId=' + id + '&serverId=' + serverId;
        }

        if (item.CollectionType == CollectionType.Livetv) {
            return `#/livetv?collectionType=${item.CollectionType}`;
        }

        if (item.Type === 'Genre') {
            url = '#/list?genreId=' + item.Id + '&serverId=' + serverId;

            if (context === 'livetv') {
                url += '&type=Programs';
            }

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'MusicGenre') {
            url = '#/list?musicGenreId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'Studio') {
            url = '#/list?studioId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item === 'tag') {
            url = `#/list?type=tag&tag=${encodeURIComponent(options.tag)}&serverId=${serverId}`;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (context !== 'folders' && !itemHelper.isLocalItem(item)) {
            if (item.CollectionType == CollectionType.Movies) {
                url = `#/movies?topParentId=${item.Id}&collectionType=${item.CollectionType}`;

                if (options && options.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            if (item.CollectionType == CollectionType.Tvshows) {
                url = `#/tv?topParentId=${item.Id}&collectionType=${item.CollectionType}`;

                if (options && options.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            if (item.CollectionType == CollectionType.Music) {
                url = `#/music?topParentId=${item.Id}&collectionType=${item.CollectionType}`;

                if (options?.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            const layoutMode = localStorage.getItem('layout');

            if (layoutMode === 'experimental' && item.CollectionType == CollectionType.Homevideos) {
                url = '#/homevideos?topParentId=' + item.Id;

                return url;
            }
        }

        const itemTypes = ['Playlist', 'TvChannel', 'Program', 'BoxSet', 'MusicAlbum', 'MusicGenre', 'Person', 'Recording', 'MusicArtist'];

        if (itemTypes.indexOf(itemType) >= 0) {
            return '#/details?id=' + id + '&serverId=' + serverId;
        }

        const contextSuffix = context ? '&context=' + context : '';

        if (itemType == 'Series' || itemType == 'Season' || itemType == 'Episode') {
            return '#/details?id=' + id + contextSuffix + '&serverId=' + serverId;
        }

        if (item.IsFolder) {
            if (id) {
                return '#/list?parentId=' + id + '&serverId=' + serverId;
            }

            return '#';
        }

        return '#/details?id=' + id + '&serverId=' + serverId;
    }

    showLocalLogin(serverId) {
        return this.show('login?serverid=' + serverId);
    }

    showVideoOsd() {
        return this.show('video');
    }

    showSelectServer() {
        return this.show('selectserver');
    }

    showSettings() {
        return this.show('mypreferencesmenu');
    }

    showNowPlaying() {
        return this.show('queue');
    }

    showGuide() {
        return this.show('livetv?tab=1');
    }

    goHome() {
        return this.show('home');
    }

    showSearch() {
        return this.show('search');
    }

    showLiveTV() {
        return this.show('livetv');
    }

    showRecordedTV() {
        return this.show('livetv?tab=3');
    }

    showFavorites() {
        return this.show('home?tab=1');
    }
}

export const appRouter = new AppRouter();

export const isLyricsPage = () => history.location.pathname.toLowerCase() === '/lyrics';

window.Emby = window.Emby || {};
window.Emby.Page = appRouter;
