import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LayoutMode } from 'constants/layoutMode';
import { getItemQuery } from 'hooks/useItem';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';
import globalize from '../../lib/globalize';
import { simpleHistory } from '../../utils/history';
import { logger } from '../../utils/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import alert from '../alert';
import { setBackdropTransparency } from '../backdrop/backdrop';
import itemHelper from '../itemHelper';
import loading from '../loading/loading';

// TanStack Router for navigation (if available)
let _router: any = null;
export const setRouter = (router: any) => {
    _router = router;
};

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

interface RouteOptions {
    context?: string;
    serverId?: string;
    itemType?: string;
    itemTypes?: string;
    isFavorite?: boolean;
    isAiring?: boolean;
    isMovie?: boolean;
    isSeries?: boolean;
    isSports?: boolean;
    isKids?: boolean;
    isNews?: boolean;
    section?: string;
    parentId?: string;
    tag?: string;
    tagId?: string;
    genreId?: string;
    musicGenreId?: string;
    studioId?: string;
}

class AppRouter {
    forcedLogoutMsg: string | null = null;
    msgTimeout: ReturnType<typeof setTimeout> | null = null;
    promiseShow: Promise<void> | null = null;
    resolveOnNextShow: (() => void) | null = null;
    _history: any = null;
    baseRoute: string;
    lastPath: string = '';

    constructor() {
        document.addEventListener('viewshow', () => this.onViewShow());
        this._history = null;

        // TODO: Can this baseRoute logic be simplified?
        this.baseRoute = window.location.href.split('?')[0].replace(this.#getRequestFile(), '');
        // support hashbang
        this.baseRoute = this.baseRoute.split('#')[0];
        if (this.baseRoute.endsWith('/') && !this.baseRoute.endsWith('://')) {
            this.baseRoute = this.baseRoute.substring(0, this.baseRoute.length - 1);
        }
    }

    _getHistory() {
        if (this._history) {
            return this._history;
        }

        this._history = simpleHistory;
        this.lastPath =
            (simpleHistory.location.pathname || '') + (simpleHistory.location.search || '');
        this.listen();
        return simpleHistory;
    }

    ready() {
        return this.promiseShow || Promise.resolve();
    }

    async back() {
        if (this.promiseShow) await this.promiseShow;

        const history = this._getHistory();
        if (!history) {
            logger.warn('[appRouter] history is not ready', { component: 'AppRouter' });
            return Promise.resolve();
        }

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

    async show(path: string, options?: any) {
        if (this.promiseShow) await this.promiseShow;

        // Use TanStack Router if available
        if (_router) {
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

            await _router.navigate({ to: path });
            return Promise.resolve();
        }

        const history = this._getHistory();
        if (!history) {
            logger.warn('[appRouter] history is not ready', { component: 'AppRouter' });
            loading.hide();
            return Promise.resolve();
        }

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
        if (history.location?.pathname === path && path !== '/home') {
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
        const history = this._history;
        if (!history) {
            return;
        }

        history.listen(({ location }: any) => {
            const normalizedPath = location.pathname.replace(/^!/, '');
            const fullPath = normalizedPath + location.search;

            if (fullPath === this.lastPath) {
                logger.debug('[appRouter] path did not change, resolving promise', {
                    component: 'AppRouter'
                });
                this.onViewShow();
            }

            this.lastPath = fullPath;
        });
    }

    baseUrl() {
        return this.baseRoute;
    }

    canGoBack(path?: string) {
        const history = this._getHistory();
        if (!path) {
            path = history ? history.location.pathname : window.location.pathname;
        }

        if (
            !document.querySelector('.dialogContainer') &&
            path &&
            START_PAGE_PATHS.includes(path)
        ) {
            return false;
        }

        return window.history.length > 1;
    }

    showItem(item: any, serverId?: string, options?: RouteOptions) {
        // TODO: Refactor this so it only gets items, not strings.
        if (typeof item === 'string') {
            const apiClient = serverId
                ? ServerConnections.getApiClient(serverId)
                : ServerConnections.currentApiClient();

            if (!apiClient) {
                logger.error('[AppRouter] Cannot show item without active API client');
                return;
            }

            const api = toApi(apiClient);
            const userId = apiClient.getCurrentUserId();

            queryClient
                .fetchQuery(getItemQuery(api, item, userId))
                .then((itemObject) => {
                    this.showItem(itemObject, serverId, options);
                })
                .catch((err) => {
                    logger.error(
                        '[AppRouter] Failed to fetch item',
                        { component: 'AppRouter' },
                        err
                    );
                });
        } else {
            // handle the case where options is passed as second argument
            if (arguments.length === 2 && typeof serverId === 'object') {
                options = serverId as unknown as RouteOptions;
            }

            // Don't navigate away from queue view when playing items
            if (window.location.hash === '#/queue') {
                return;
            }

            const url = this.getRouteUrl(item, options);
            this.show(url);
        }
    }

    /**
     * Sets the backdrop, background, and document transparency
     * @deprecated use Dashboard.setBackdropTransparency
     */
    setTransparency(level: any) {
        // TODO: Remove this after JMP is updated to not use this function
        logger.warn('Deprecated! Use Dashboard.setBackdropTransparency', {
            component: 'AppRouter'
        });
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

    onForcedLogoutMessageTimeout = () => {
        const msg = this.forcedLogoutMsg;
        this.forcedLogoutMsg = null;

        if (msg) {
            logger.warn(msg, { component: 'AppRouter' });
        }
    };

    showForcedLogoutMessage(msg: string) {
        this.forcedLogoutMsg = msg;
        if (this.msgTimeout) {
            clearTimeout(this.msgTimeout);
        }

        this.msgTimeout = setTimeout(this.onForcedLogoutMessageTimeout, 100);
    }

    onRequestFail(_e: any, data: any) {
        const apiClient = this as any;

        if (data.status === 403 && data.errorCode === 'ParentalControl') {
            const history = this._getHistory();
            const pathname = history ? history.location.pathname : window.location.pathname;
            const isPublicPage = PUBLIC_PATHS.includes(pathname);

            // Bounce to the login screen, but not if a password entry fails, obviously
            if (!isPublicPage) {
                appRouter.showForcedLogoutMessage(
                    globalize.translate('AccessRestrictedTryAgainLater')
                );
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

    getRouteUrl(item: any, options?: RouteOptions) {
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
            return '#/livetv?tab=3&serverId=' + serverId;
        }

        if (item === 'nextup') {
            return '#/list?type=nextup&serverId=' + serverId;
        }

        if (item === 'list') {
            let urlForList = '#/list?serverId=' + serverId + '&type=' + options.itemTypes;

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
                return '#/livetv?tab=0&serverId=' + serverId;
            }
            if (options.section === 'guide') {
                return '#/livetv?tab=1&serverId=' + serverId;
            }

            if (options.section === 'movies') {
                return '#/list?type=Programs&IsMovie=true&serverId=' + serverId;
            }

            if (options.section === 'shows') {
                return (
                    '#/list?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' +
                    serverId
                );
            }

            if (options.section === 'sports') {
                return '#/list?type=Programs&IsSports=true&serverId=' + serverId;
            }

            if (options.section === 'kids') {
                return '#/list?type=Programs&IsKids=true&serverId=' + serverId;
            }

            if (options.section === 'news') {
                return '#/list?type=Programs&IsNews=true&serverId=' + serverId;
            }

            if (options.section === 'onnow') {
                return '#/list?type=Programs&IsAiring=true&serverId=' + serverId;
            }

            if (options.section === 'channels') {
                return '#/livetv?tab=2&serverId=' + serverId;
            }

            if (options.section === 'dvrschedule') {
                return '#/livetv?tab=4&serverId=' + serverId;
            }

            if (options.section === 'seriesrecording') {
                return '#/livetv?tab=5&serverId=' + serverId;
            }

            return '#/livetv?serverId=' + serverId;
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
            url = `#/list?type=tag&tag=${encodeURIComponent(options.tag || '')}&serverId=${serverId}`;

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

            if (
                layoutMode === LayoutMode.Experimental &&
                item.CollectionType == CollectionType.Homevideos
            ) {
                url = '#/homevideos?topParentId=' + item.Id;

                return url;
            }
        }

        const itemTypes = [
            'Playlist',
            'TvChannel',
            'Program',
            'BoxSet',
            'MusicAlbum',
            'MusicGenre',
            'Person',
            'Recording',
            'MusicArtist'
        ];

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

    showLocalLogin(serverId: string) {
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
        return this.show('nowplaying');
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

export const isLyricsPage = () => {
    const history = appRouter._getHistory();
    const pathname = history ? history.location.pathname : window.location.pathname;
    return pathname.toLowerCase() === '/lyrics';
};

declare global {
    interface Window {
        Emby: any;
    }
}

window.Emby = window.Emby || {};
window.Emby.Page = appRouter;
