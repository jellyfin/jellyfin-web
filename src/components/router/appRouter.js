import { Action, createHashHistory } from 'history';

import { appHost } from '../apphost';
import { clearBackdrop, setBackdropTransparency } from '../backdrop/backdrop';
import globalize from '../../scripts/globalize';
import Events from '../../utils/events.ts';
import itemHelper from '../itemHelper';
import loading from '../loading/loading';
import viewManager from '../viewManager/viewManager';
import ServerConnections from '../ServerConnections';
import alert from '../alert';
import { ConnectionState } from '../../utils/jellyfin-apiclient/ConnectionState.ts';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

export const history = createHashHistory();

/**
 * Page types of "no return" (when "Go back" should behave differently, probably quitting the application).
 */
const START_PAGE_TYPES = ['home', 'login', 'selectserver'];
const START_PAGE_PATHS = ['/home.html', '/login.html', '/selectserver.html'];

class AppRouter {
    allRoutes = new Map();
    currentRouteInfo = { route: {} };
    currentViewLoadRequest;
    firstConnectionResult;
    forcedLogoutMsg;
    msgTimeout;
    promiseShow;
    resolveOnNextShow;

    constructor() {
        document.addEventListener('viewshow', () => this.onViewShow());

        // TODO: Can this baseRoute logic be simplified?
        this.baseRoute = window.location.href.split('?')[0].replace(this.#getRequestFile(), '');
        // support hashbang
        this.baseRoute = this.baseRoute.split('#')[0];
        if (this.baseRoute.endsWith('/') && !this.baseRoute.endsWith('://')) {
            this.baseRoute = this.baseRoute.substring(0, this.baseRoute.length - 1);
        }
    }

    addRoute(path, route) {
        this.allRoutes.set(path, {
            route,
            handler: this.#getHandler(route)
        });
    }

    #beginConnectionWizard() {
        clearBackdrop();
        loading.show();
        ServerConnections.connect().then(result => {
            this.#handleConnectionResult(result);
        });
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
        if (this.currentRouteInfo?.path === path && this.currentRouteInfo.route.type !== 'home') {
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

    #goToRoute({ location, action }) {
        // Strip the leading "!" if present
        const normalizedPath = location.pathname.replace(/^!/, '');

        const route = this.allRoutes.get(normalizedPath);
        if (route) {
            console.debug('[appRouter] "%s" route found', normalizedPath, location, route);
            route.handler({
                // Recreate the default context used by page.js: https://github.com/visionmedia/page.js#context
                path: normalizedPath + location.search,
                pathname: normalizedPath,
                querystring: location.search.replace(/^\?/, ''),
                state: location.state,
                // Custom context variables
                isBack: action === Action.Pop
            });
        } else {
            // The route is not registered here, so it should be handled by react-router
            this.currentRouteInfo = {
                route: {},
                path: normalizedPath + location.search
            };
        }
    }

    start() {
        loading.show();

        ServerConnections.getApiClients().forEach(apiClient => {
            Events.off(apiClient, 'requestfail', this.onRequestFail);
            Events.on(apiClient, 'requestfail', this.onRequestFail);
        });

        Events.on(ServerConnections, 'apiclientcreated', (_e, apiClient) => {
            Events.off(apiClient, 'requestfail', this.onRequestFail);
            Events.on(apiClient, 'requestfail', this.onRequestFail);
        });

        return ServerConnections.connect().then(result => {
            this.firstConnectionResult = result;

            // Handle the initial route
            this.#goToRoute({ location: history.location });

            // Handle route changes
            history.listen(params => {
                this.#goToRoute(params);
            });
        }).catch().then(() => {
            loading.hide();
        });
    }

    baseUrl() {
        return this.baseRoute;
    }

    canGoBack() {
        const { path, route } = this.currentRouteInfo;
        const pathOnly = path?.split('?')[0] ?? '';

        if (!route) {
            return false;
        }

        if (!document.querySelector('.dialogContainer') && (START_PAGE_TYPES.includes(route.type) || START_PAGE_PATHS.includes(pathOnly))) {
            return false;
        }

        return window.history.length > 1;
    }

    showItem(item, serverId, options) {
        // TODO: Refactor this so it only gets items, not strings.
        if (typeof (item) === 'string') {
            const apiClient = serverId ? ServerConnections.getApiClient(serverId) : ServerConnections.currentApiClient();
            apiClient.getItem(apiClient.getCurrentUserId(), item).then((itemObject) => {
                this.showItem(itemObject, options);
            });
        } else {
            if (arguments.length === 2) {
                options = arguments[1];
            }

            const url = this.getRouteUrl(item, options);
            this.show(url, { item });
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

    #handleConnectionResult(result) {
        switch (result.State) {
            case ConnectionState.SignedIn:
                loading.hide();
                this.goHome();
                break;
            case ConnectionState.ServerSignIn:
                this.showLocalLogin(result.ApiClient.serverId());
                break;
            case ConnectionState.ServerSelection:
                this.showSelectServer();
                break;
            case ConnectionState.ServerUpdateNeeded:
                alert({
                    text: globalize.translate('ServerUpdateNeeded', 'https://github.com/jellyfin/jellyfin'),
                    html: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                }).then(() => {
                    this.showSelectServer();
                });
                break;
            default:
                break;
        }
    }

    #loadContentUrl(ctx, _next, route, request) {
        let url;
        if (route.contentPath && typeof (route.contentPath) === 'function') {
            url = route.contentPath(ctx.querystring);
        } else {
            url = route.contentPath || route.path;
        }

        if (ctx.querystring && route.enableContentQueryString) {
            url += '?' + ctx.querystring;
        }

        let promise;
        if (route.serverRequest) {
            const apiClient = ServerConnections.currentApiClient();
            url = apiClient.getUrl(`/web${url}`);
            promise = apiClient.get(url);
        } else {
            promise = import(/* webpackChunkName: "[request]" */ `../../controllers/${url}`);
        }

        promise.then((html) => {
            this.#loadContent(ctx, route, html, request);
        });
    }

    #handleRoute(ctx, next, route) {
        this.#authenticate(ctx, route, () => {
            this.#initRoute(ctx, next, route);
        });
    }

    #initRoute(ctx, next, route) {
        const onInitComplete = (controllerFactory) => {
            this.#sendRouteToViewManager(ctx, next, route, controllerFactory);
        };

        if (route.controller) {
            import(/* webpackChunkName: "[request]" */ '../../controllers/' + route.controller).then(onInitComplete);
        } else {
            onInitComplete();
        }
    }

    #cancelCurrentLoadRequest() {
        const currentRequest = this.currentViewLoadRequest;
        if (currentRequest) {
            currentRequest.cancel = true;
        }
    }

    #sendRouteToViewManager(ctx, next, route, controllerFactory) {
        this.#cancelCurrentLoadRequest();
        const isBackNav = ctx.isBack;

        const currentRequest = {
            url: this.baseUrl() + ctx.path,
            transition: route.transition,
            isBack: isBackNav,
            state: ctx.state,
            type: route.type,
            fullscreen: route.fullscreen,
            controllerFactory: controllerFactory,
            options: {
                supportsThemeMedia: route.supportsThemeMedia || false,
                enableMediaControl: route.enableMediaControl !== false
            },
            autoFocus: route.autoFocus
        };
        this.currentViewLoadRequest = currentRequest;

        const onNewViewNeeded = () => {
            if (typeof route.path === 'string') {
                this.#loadContentUrl(ctx, next, route, currentRequest);
            } else {
                next();
            }
        };

        if (!isBackNav) {
            onNewViewNeeded();
            return;
        }
        viewManager.tryRestoreView(currentRequest, () => {
            this.currentRouteInfo = {
                route: route,
                path: ctx.path
            };
        }).catch((result) => {
            if (!result?.cancelled) {
                onNewViewNeeded();
            }
        });
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
            const isCurrentAllowed = appRouter.currentRouteInfo ? (appRouter.currentRouteInfo.route.anonymous || appRouter.currentRouteInfo.route.startup) : true;

            // Bounce to the login screen, but not if a password entry fails, obviously
            if (!isCurrentAllowed) {
                appRouter.showForcedLogoutMessage(globalize.translate('AccessRestrictedTryAgainLater'));
                appRouter.showLocalLogin(apiClient.serverId());
            }
        }
    }

    #authenticate(ctx, route, callback) {
        const firstResult = this.firstConnectionResult;

        this.firstConnectionResult = null;
        if (firstResult) {
            if (firstResult.State === ConnectionState.ServerSignIn) {
                const url = firstResult.ApiClient.serverAddress() + '/System/Info/Public';
                fetch(url).then(response => {
                    if (!response.ok) return Promise.reject('fetch failed');
                    return response.json();
                }).then(data => {
                    if (data !== null && data.StartupWizardCompleted === false) {
                        ServerConnections.setLocalApiClient(firstResult.ApiClient);
                        this.show('wizardstart.html');
                    } else {
                        this.#handleConnectionResult(firstResult);
                    }
                }).catch(error => {
                    console.error(error);
                });

                return;
            } else if (firstResult.State !== ConnectionState.SignedIn) {
                this.#handleConnectionResult(firstResult);
                return;
            }
        }

        const apiClient = ServerConnections.currentApiClient();
        const pathname = ctx.pathname.toLowerCase();

        console.debug('[appRouter] processing path request: ' + pathname);
        const isCurrentRouteStartup = this.currentRouteInfo ? this.currentRouteInfo.route.startup : true;
        const shouldExitApp = ctx.isBack && route.isDefaultRoute && isCurrentRouteStartup;

        if (!shouldExitApp && (!apiClient?.isLoggedIn()) && !route.anonymous) {
            console.debug('[appRouter] route does not allow anonymous access: redirecting to login');
            this.#beginConnectionWizard();
            return;
        }

        if (shouldExitApp) {
            if (appHost.supports('exit')) {
                appHost.exit();
            }

            return;
        }

        if (apiClient?.isLoggedIn()) {
            console.debug('[appRouter] user is authenticated');

            if (route.roles) {
                this.#validateRoles(apiClient, route.roles).then(() => {
                    callback();
                }, this.#beginConnectionWizard.bind(this));
                return;
            }
        }

        console.debug('[appRouter] proceeding to page: ' + pathname);
        callback();
    }

    #validateRoles(apiClient, roles) {
        return Promise.all(roles.split(',').map((role) => {
            return this.#validateRole(apiClient, role);
        }));
    }

    #validateRole(apiClient, role) {
        if (role === 'admin') {
            return apiClient.getCurrentUser().then((user) => {
                if (user.Policy.IsAdministrator) {
                    return Promise.resolve();
                }
                return Promise.reject();
            });
        }

        // Unknown role
        return Promise.resolve();
    }

    #loadContent(ctx, route, html, request) {
        html = globalize.translateHtml(html, route.dictionary);
        request.view = html;

        viewManager.loadView(request);

        this.currentRouteInfo = {
            route: route,
            path: ctx.path
        };

        ctx.handled = true;
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

    #getHandler(route) {
        return (ctx, next) => {
            const ignore = ctx.path === this.currentRouteInfo.path;
            if (ignore) {
                console.debug('[appRouter] path did not change, ignoring route change');
                // Resolve 'show' promise
                this.onViewShow();
                return;
            }

            this.#handleRoute(ctx, next, route);
        };
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
            return '#/mypreferencesmenu.html';
        }

        if (item === 'wizard') {
            return '#/wizardstart.html';
        }

        if (item === 'manageserver') {
            return '#/dashboard';
        }

        if (item === 'recordedtv') {
            return '#/livetv.html?tab=3&serverId=' + options.serverId;
        }

        if (item === 'nextup') {
            return '#/list.html?type=nextup&serverId=' + options.serverId;
        }

        if (item === 'list') {
            let urlForList = '#/list.html?serverId=' + options.serverId + '&type=' + options.itemTypes;

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
                return '#/livetv.html?tab=0&serverId=' + options.serverId;
            }
            if (options.section === 'guide') {
                return '#/livetv.html?tab=1&serverId=' + options.serverId;
            }

            if (options.section === 'movies') {
                return '#/list.html?type=Programs&IsMovie=true&serverId=' + options.serverId;
            }

            if (options.section === 'shows') {
                return '#/list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + options.serverId;
            }

            if (options.section === 'sports') {
                return '#/list.html?type=Programs&IsSports=true&serverId=' + options.serverId;
            }

            if (options.section === 'kids') {
                return '#/list.html?type=Programs&IsKids=true&serverId=' + options.serverId;
            }

            if (options.section === 'news') {
                return '#/list.html?type=Programs&IsNews=true&serverId=' + options.serverId;
            }

            if (options.section === 'onnow') {
                return '#/list.html?type=Programs&IsAiring=true&serverId=' + options.serverId;
            }

            if (options.section === 'channels') {
                return '#/livetv.html?tab=2&serverId=' + options.serverId;
            }

            if (options.section === 'dvrschedule') {
                return '#/livetv.html?tab=4&serverId=' + options.serverId;
            }

            if (options.section === 'seriesrecording') {
                return '#/livetv.html?tab=5&serverId=' + options.serverId;
            }

            return '#/livetv.html?serverId=' + options.serverId;
        }

        if (itemType == 'SeriesTimer') {
            return '#/details?seriesTimerId=' + id + '&serverId=' + serverId;
        }

        if (item.CollectionType == CollectionType.Livetv) {
            return '#/livetv.html';
        }

        if (item.Type === 'Genre') {
            url = '#/list.html?genreId=' + item.Id + '&serverId=' + serverId;

            if (context === 'livetv') {
                url += '&type=Programs';
            }

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'MusicGenre') {
            url = '#/list.html?musicGenreId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'Studio') {
            url = '#/list.html?studioId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (context !== 'folders' && !itemHelper.isLocalItem(item)) {
            if (item.CollectionType == CollectionType.Movies) {
                url = '#/movies.html?topParentId=' + item.Id;

                if (options && options.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            if (item.CollectionType == CollectionType.Tvshows) {
                url = '#/tv.html?topParentId=' + item.Id;

                if (options && options.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            if (item.CollectionType == CollectionType.Music) {
                url = '#/music.html?topParentId=' + item.Id;

                if (options?.section === 'latest') {
                    url += '&tab=1';
                }

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
                return '#/list.html?parentId=' + id + '&serverId=' + serverId;
            }

            return '#';
        }

        return '#/details?id=' + id + '&serverId=' + serverId;
    }

    showLocalLogin(serverId) {
        return this.show('login.html?serverid=' + serverId);
    }

    showVideoOsd() {
        return this.show('video');
    }

    showSelectServer() {
        return this.show('selectserver.html');
    }

    showSettings() {
        return this.show('mypreferencesmenu.html');
    }

    showNowPlaying() {
        return this.show('queue');
    }

    showGuide() {
        return this.show('livetv.html?tab=1');
    }

    goHome() {
        return this.show('home.html');
    }

    showSearch() {
        return this.show('search.html');
    }

    showLiveTV() {
        return this.show('livetv.html');
    }

    showRecordedTV() {
        return this.show('livetv.html?tab=3');
    }

    showFavorites() {
        return this.show('home.html?tab=1');
    }
}

export const appRouter = new AppRouter();

window.Emby = window.Emby || {};
window.Emby.Page = appRouter;
