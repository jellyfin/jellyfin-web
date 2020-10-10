import appHost from 'apphost';
import appSettings from 'appSettings';
import backdrop from 'backdrop';
import browser from 'browser';
import events from 'events';
import globalize from 'globalize';
import itemHelper from 'itemHelper';
import loading from 'loading';
import page from 'page';
import viewManager from 'viewManager';

class AppRouter {
    allRoutes = [];
    backdropContainer;
    backgroundContainer;
    currentRouteInfo;
    currentViewLoadRequest;
    firstConnectionResult;
    forcedLogoutMsg;
    handleAnchorClick = page.clickHandler;
    isDummyBackToHome;
    msgTimeout;
    popstateOccurred = false;
    resolveOnNextShow;
    /**
     * Pages of "no return" (when "Go back" should behave differently, probably quitting the application).
     */
    startPages = ['home', 'login', 'selectserver'];

    constructor() {
        window.addEventListener('popstate', () => {
            this.popstateOccurred = true;
        });

        document.addEventListener('viewshow', () => {
            const resolve = this.resolveOnNextShow;
            if (resolve) {
                this.resolveOnNextShow = null;
                resolve();
            }
        });

        this.baseRoute = window.location.href.split('?')[0].replace(this.getRequestFile(), '');
        // support hashbang
        this.baseRoute = this.baseRoute.split('#')[0];
        if (this.baseRoute.endsWith('/') && !this.baseRoute.endsWith('://')) {
            this.baseRoute = this.baseRoute.substring(0, this.baseRoute.length - 1);
        }

        this.setBaseRoute();
    }

    /**
     * @private
     */
    setBaseRoute() {
        let baseRoute = window.location.pathname.replace(this.getRequestFile(), '');
        if (baseRoute.lastIndexOf('/') === baseRoute.length - 1) {
            baseRoute = baseRoute.substring(0, baseRoute.length - 1);
        }
        console.debug('setting page base to ' + baseRoute);
        page.base(baseRoute);
    }

    addRoute(path, newRoute) {
        page(path, this.getHandler(newRoute));
        this.allRoutes.push(newRoute);
    }

    showLocalLogin(serverId) {
        Dashboard.navigate('login.html?serverid=' + serverId);
    }

    showVideoOsd() {
        return Dashboard.navigate('video');
    }

    showSelectServer() {
        Dashboard.navigate(AppInfo.isNativeApp ? 'selectserver.html' : 'login.html');
    }

    showWelcome() {
        Dashboard.navigate(AppInfo.isNativeApp ? 'selectserver.html' : 'login.html');
    }

    showSettings() {
        Dashboard.navigate('mypreferencesmenu.html');
    }

    showNowPlaying() {
        this.show('queue');
    }

    beginConnectionWizard() {
        backdrop.clearBackdrop();
        loading.show();
        window.connectionManager.connect({
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then((result) => {
            this.handleConnectionResult(result);
        });
    }

    param(name, url) {
        name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
        const regexS = '[\\?&]' + name + '=([^&#]*)';
        const regex = new RegExp(regexS, 'i');

        const results = regex.exec(url || getWindowLocationSearch());
        if (results == null) {
            return '';
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
    }

    back() {
        page.back();
    }

    show(path, options) {
        if (path.indexOf('/') !== 0 && path.indexOf('://') === -1) {
            path = '/' + path;
        }

        path = path.replace(this.baseUrl(), '');

        if (this.currentRouteInfo && this.currentRouteInfo.path === path) {
            // can't use this with home right now due to the back menu
            if (this.currentRouteInfo.route.type !== 'home') {
                loading.hide();
                return Promise.resolve();
            }
        }

        return new Promise((resolve) => {
            this.resolveOnNextShow = resolve;
            page.show(path, options);
        });
    }

    showDirect(path) {
        return new Promise(function(resolve) {
            this.resolveOnNextShow = resolve;
            page.show(this.baseUrl() + path);
        });
    }

    start(options) {
        loading.show();
        this.initApiClients();

        events.on(appHost, 'beforeexit', this.onBeforeExit);
        events.on(appHost, 'resume', this.onAppResume);

        window.connectionManager.connect({
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then((result) => {
            this.firstConnectionResult = result;
            options = options || {};
            page({
                click: options.click !== false,
                hashbang: options.hashbang !== false
            });
        }).catch().then(() => {
            loading.hide();
        });
    }

    baseUrl() {
        return this.baseRoute;
    }

    canGoBack() {
        const curr = this.current();
        if (!curr) {
            return false;
        }

        if (!document.querySelector('.dialogContainer') && this.startPages.indexOf(curr.type) !== -1) {
            return false;
        }

        return window.history.length > 1;
    }

    current() {
        return this.currentRouteInfo ? this.currentRouteInfo.route : null;
    }

    invokeShortcut(id) {
        if (id.indexOf('library-') === 0) {
            id = id.replace('library-', '');
            id = id.split('_');

            this.showItem(id[0], id[1]);
        } else if (id.indexOf('item-') === 0) {
            id = id.replace('item-', '');
            id = id.split('_');
            this.showItem(id[0], id[1]);
        } else {
            id = id.split('_');
            this.show(this.getRouteUrl(id[0], {
                serverId: id[1]
            }));
        }
    }

    showItem(item, serverId, options) {
        // TODO: Refactor this so it only gets items, not strings.
        if (typeof (item) === 'string') {
            const apiClient = serverId ? window.connectionManager.getApiClient(serverId) : window.connectionManager.currentApiClient();
            apiClient.getItem(apiClient.getCurrentUserId(), item).then((itemObject) => {
                this.showItem(itemObject, options);
            });
        } else {
            if (arguments.length === 2) {
                options = arguments[1];
            }

            const url = this.getRouteUrl(item, options);
            this.show(url, {
                item: item
            });
        }
    }

    setTransparency(level) {
        if (!this.backdropContainer) {
            this.backdropContainer = document.querySelector('.backdropContainer');
        }
        if (!this.backgroundContainer) {
            this.backgroundContainer = document.querySelector('.backgroundContainer');
        }

        if (level === 'full' || level === 2) {
            backdrop.clearBackdrop(true);
            document.documentElement.classList.add('transparentDocument');
            this.backgroundContainer.classList.add('backgroundContainer-transparent');
            this.backdropContainer.classList.add('hide');
        } else if (level === 'backdrop' || level === 1) {
            backdrop.externalBackdrop(true);
            document.documentElement.classList.add('transparentDocument');
            this.backgroundContainer.classList.add('backgroundContainer-transparent');
            this.backdropContainer.classList.add('hide');
        } else {
            backdrop.externalBackdrop(false);
            document.documentElement.classList.remove('transparentDocument');
            this.backgroundContainer.classList.remove('backgroundContainer-transparent');
            this.backdropContainer.classList.remove('hide');
        }
    }

    getRoutes() {
        return this.allRoutes;
    }

    pushState(state, title, url) {
        state.navigate = false;
        window.history.pushState(state, title, url);
    }

    enableNativeHistory() {
        return false;
    }

    handleConnectionResult(result) {
        switch (result.State) {
            case 'SignedIn':
                loading.hide();
                Emby.Page.goHome();
                break;
            case 'ServerSignIn':
                result.ApiClient.getPublicUsers().then((users) => {
                    if (users.length) {
                        this.showLocalLogin(result.Servers[0].Id);
                    } else {
                        this.showLocalLogin(result.Servers[0].Id, true);
                    }
                });
                break;
            case 'ServerSelection':
                this.showSelectServer();
                break;
            case 'ConnectSignIn':
                this.showWelcome();
                break;
            case 'ServerUpdateNeeded':
                import('alert').then(({default: alert}) =>{
                    alert({
                        text: globalize.translate('ServerUpdateNeeded', 'https://github.com/jellyfin/jellyfin'),
                        html: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                    }).then(() => {
                        this.showSelectServer();
                    });
                });
                break;
            default:
                break;
        }
    }

    loadContentUrl(ctx, next, route, request) {
        let url;
        if (route.contentPath && typeof (route.contentPath) === 'function') {
            url = route.contentPath(ctx.querystring);
        } else {
            url = route.contentPath || route.path;
        }

        if (url.includes('configurationpage')) {
            url = ApiClient.getUrl('/web' + url);
        } else if (url.indexOf('://') === -1) {
            // Put a slash at the beginning but make sure to avoid a double slash
            if (url.indexOf('/') !== 0) {
                url = '/' + url;
            }

            url = this.baseUrl() + url;
        }

        if (ctx.querystring && route.enableContentQueryString) {
            url += '?' + ctx.querystring;
        }

        import('text!' + url).then(({default: html}) => {
            this.loadContent(ctx, route, html, request);
        });
    }

    handleRoute(ctx, next, route) {
        this.authenticate(ctx, route, () => {
            this.initRoute(ctx, next, route);
        });
    }

    initRoute(ctx, next, route) {
        const onInitComplete = (controllerFactory) => {
            this.sendRouteToViewManager(ctx, next, route, controllerFactory);
        };

        if (route.controller) {
            import('controllers/' + route.controller).then(onInitComplete);
        } else {
            onInitComplete();
        }
    }

    cancelCurrentLoadRequest() {
        const currentRequest = this.currentViewLoadRequest;
        if (currentRequest) {
            currentRequest.cancel = true;
        }
    }

    sendRouteToViewManager(ctx, next, route, controllerFactory) {
        if (this.isDummyBackToHome && route.type === 'home') {
            this.isDummyBackToHome = false;
            return;
        }

        this.cancelCurrentLoadRequest();
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
                this.loadContentUrl(ctx, next, route, currentRequest);
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
            if (!result || !result.cancelled) {
                onNewViewNeeded();
            }
        });
    }

    onForcedLogoutMessageTimeout() {
        const msg = this.forcedLogoutMsg;
        this.forcedLogoutMsg = null;

        if (msg) {
            import('alert').then((alert) => {
                alert(msg);
            });
        }
    }

    showForcedLogoutMessage(msg) {
        this.forcedLogoutMsg = msg;
        if (this.msgTimeout) {
            clearTimeout(this.msgTimeout);
        }

        this.msgTimeout = setTimeout(this.onForcedLogoutMessageTimeout, 100);
    }

    onRequestFail(e, data) {
        const apiClient = this;

        if (data.status === 403) {
            if (data.errorCode === 'ParentalControl') {
                const isCurrentAllowed = this.currentRouteInfo ? (this.currentRouteInfo.route.anonymous || this.currentRouteInfo.route.startup) : true;

                // Bounce to the login screen, but not if a password entry fails, obviously
                if (!isCurrentAllowed) {
                    this.showForcedLogoutMessage(globalize.translate('AccessRestrictedTryAgainLater'));
                    this.showLocalLogin(apiClient.serverId());
                }
            }
        }
    }

    onBeforeExit() {
        if (browser.web0s) {
            page.restorePreviousState();
        }
    }

    normalizeImageOptions(options) {
        let setQuality;
        if (options.maxWidth || options.width || options.maxHeight || options.height) {
            setQuality = true;
        }

        if (setQuality && !options.quality) {
            options.quality = 90;
        }
    }

    getMaxBandwidth() {
        /* eslint-disable compat/compat */
        if (navigator.connection) {
            let max = navigator.connection.downlinkMax;
            if (max && max > 0 && max < Number.POSITIVE_INFINITY) {
                max /= 8;
                max *= 1000000;
                max *= 0.7;
                return parseInt(max, 10);
            }
        }
        /* eslint-enable compat/compat */

        return null;
    }

    getMaxBandwidthIOS() {
        return 800000;
    }

    onApiClientCreated(e, newApiClient) {
        newApiClient.normalizeImageOptions = this.normalizeImageOptions;

        if (browser.iOS) {
            newApiClient.getMaxBandwidth = this.getMaxBandwidthIOS;
        } else {
            newApiClient.getMaxBandwidth = this.getMaxBandwidth;
        }

        events.off(newApiClient, 'requestfail', this.onRequestFail);
        events.on(newApiClient, 'requestfail', this.onRequestFail);
    }

    initApiClient(apiClient, instance) {
        instance.onApiClientCreated({}, apiClient);
    }

    initApiClients() {
        window.connectionManager.getApiClients().forEach((apiClient) => {
            this.initApiClient(apiClient, this);
        });

        events.on(window.connectionManager, 'apiclientcreated', this.onApiClientCreated);
    }

    onAppResume() {
        const apiClient = window.connectionManager.currentApiClient();

        if (apiClient) {
            apiClient.ensureWebSocket();
        }
    }

    authenticate(ctx, route, callback) {
        const firstResult = this.firstConnectionResult;
        if (firstResult) {
            this.firstConnectionResult = null;

            if (firstResult.State !== 'SignedIn' && !route.anonymous) {
                this.handleConnectionResult(firstResult);
                return;
            }
        }

        const apiClient = window.connectionManager.currentApiClient();
        const pathname = ctx.pathname.toLowerCase();

        console.debug('appRouter - processing path request ' + pathname);

        const isCurrentRouteStartup = this.currentRouteInfo ? this.currentRouteInfo.route.startup : true;
        const shouldExitApp = ctx.isBack && route.isDefaultRoute && isCurrentRouteStartup;

        if (!shouldExitApp && (!apiClient || !apiClient.isLoggedIn()) && !route.anonymous) {
            console.debug('appRouter - route does not allow anonymous access, redirecting to login');
            this.beginConnectionWizard();
            return;
        }

        if (shouldExitApp) {
            if (appHost.supports('exit')) {
                appHost.exit();
                return;
            }
            return;
        }

        if (apiClient && apiClient.isLoggedIn()) {
            console.debug('appRouter - user is authenticated');

            if (route.isDefaultRoute) {
                console.debug('appRouter - loading skin home page');
                Emby.Page.goHome();
                return;
            } else if (route.roles) {
                this.validateRoles(apiClient, route.roles).then(() => {
                    callback();
                }, this.beginConnectionWizard);
                return;
            }
        }

        console.debug('appRouter - proceeding to ' + pathname);
        callback();
    }

    validateRoles(apiClient, roles) {
        return Promise.all(roles.split(',').map((role) => {
            return this.validateRole(apiClient, role);
        }));
    }

    validateRole(apiClient, role) {
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

    loadContent(ctx, route, html, request) {
        html = globalize.translateHtml(html, route.dictionary);
        request.view = html;

        viewManager.loadView(request);

        this.currentRouteInfo = {
            route: route,
            path: ctx.path
        };

        ctx.handled = true;
    }

    getRequestFile() {
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

    getHandler(route) {
        return (ctx, next) => {
            ctx.isBack = this.popstateOccurred;
            this.handleRoute(ctx, next, route);
            this.popstateOccurred = false;
        };
    }

    getWindowLocationSearch() {
        const currentPath = this.currentRouteInfo ? (this.currentRouteInfo.path || '') : '';

        const index = currentPath.indexOf('?');
        let search = '';

        if (index !== -1) {
            search = currentPath.substring(index);
        }

        return search || '';
    }

    showGuide() {
        Dashboard.navigate('livetv.html?tab=1');
    }

    goHome() {
        Dashboard.navigate('home.html');
    }

    showSearch() {
        Dashboard.navigate('search.html');
    }

    showLiveTV() {
        Dashboard.navigate('livetv.html');
    }

    showRecordedTV() {
        Dashboard.navigate('livetv.html?tab=3');
    }

    showFavorites() {
        Dashboard.navigate('home.html?tab=1');
    }

    setTitle(title) {
        LibraryMenu.setTitle(title);
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
            return 'mypreferencesmenu.html';
        }

        if (item === 'wizard') {
            return 'wizardstart.html';
        }

        if (item === 'manageserver') {
            return 'dashboard.html';
        }

        if (item === 'recordedtv') {
            return 'livetv.html?tab=3&serverId=' + options.serverId;
        }

        if (item === 'nextup') {
            return 'list.html?type=nextup&serverId=' + options.serverId;
        }

        if (item === 'list') {
            let url = 'list.html?serverId=' + options.serverId + '&type=' + options.itemTypes;

            if (options.isFavorite) {
                url += '&IsFavorite=true';
            }

            return url;
        }

        if (item === 'livetv') {
            if (options.section === 'programs') {
                return 'livetv.html?tab=0&serverId=' + options.serverId;
            }
            if (options.section === 'guide') {
                return 'livetv.html?tab=1&serverId=' + options.serverId;
            }

            if (options.section === 'movies') {
                return 'list.html?type=Programs&IsMovie=true&serverId=' + options.serverId;
            }

            if (options.section === 'shows') {
                return 'list.html?type=Programs&IsSeries=true&IsMovie=false&IsNews=false&serverId=' + options.serverId;
            }

            if (options.section === 'sports') {
                return 'list.html?type=Programs&IsSports=true&serverId=' + options.serverId;
            }

            if (options.section === 'kids') {
                return 'list.html?type=Programs&IsKids=true&serverId=' + options.serverId;
            }

            if (options.section === 'news') {
                return 'list.html?type=Programs&IsNews=true&serverId=' + options.serverId;
            }

            if (options.section === 'onnow') {
                return 'list.html?type=Programs&IsAiring=true&serverId=' + options.serverId;
            }

            if (options.section === 'dvrschedule') {
                return 'livetv.html?tab=4&serverId=' + options.serverId;
            }

            if (options.section === 'seriesrecording') {
                return 'livetv.html?tab=5&serverId=' + options.serverId;
            }

            return 'livetv.html?serverId=' + options.serverId;
        }

        if (itemType == 'SeriesTimer') {
            return 'details?seriesTimerId=' + id + '&serverId=' + serverId;
        }

        if (item.CollectionType == 'livetv') {
            return 'livetv.html';
        }

        if (item.Type === 'Genre') {
            url = 'list.html?genreId=' + item.Id + '&serverId=' + serverId;

            if (context === 'livetv') {
                url += '&type=Programs';
            }

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'MusicGenre') {
            url = 'list.html?musicGenreId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (item.Type === 'Studio') {
            url = 'list.html?studioId=' + item.Id + '&serverId=' + serverId;

            if (options.parentId) {
                url += '&parentId=' + options.parentId;
            }

            return url;
        }

        if (context !== 'folders' && !itemHelper.isLocalItem(item)) {
            if (item.CollectionType == 'movies') {
                url = 'movies.html?topParentId=' + item.Id;

                if (options && options.section === 'latest') {
                    url += '&tab=1';
                }

                return url;
            }

            if (item.CollectionType == 'tvshows') {
                url = 'tv.html?topParentId=' + item.Id;

                if (options && options.section === 'latest') {
                    url += '&tab=2';
                }

                return url;
            }

            if (item.CollectionType == 'music') {
                return 'music.html?topParentId=' + item.Id;
            }
        }

        const itemTypes = ['Playlist', 'TvChannel', 'Program', 'BoxSet', 'MusicAlbum', 'MusicGenre', 'Person', 'Recording', 'MusicArtist'];

        if (itemTypes.indexOf(itemType) >= 0) {
            return 'details?id=' + id + '&serverId=' + serverId;
        }

        const contextSuffix = context ? '&context=' + context : '';

        if (itemType == 'Series' || itemType == 'Season' || itemType == 'Episode') {
            return 'details?id=' + id + contextSuffix + '&serverId=' + serverId;
        }

        if (item.IsFolder) {
            if (id) {
                return 'list.html?parentId=' + id + '&serverId=' + serverId;
            }

            return '#';
        }

        return 'details?id=' + id + '&serverId=' + serverId;
    }
}

export default new AppRouter();
